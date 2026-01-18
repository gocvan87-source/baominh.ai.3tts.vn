
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { VIETNAMESE_ABBREVIATIONS } from "../constants";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Xử lý lỗi Gemini API và xác định xem có nên thực hiện xoay Key hay không.
 */
export const handleAiError = (error: any): { message: string, isRateLimit: boolean, shouldWait: boolean } => {
  const rawMessage = error?.message ? String(error.message) : String(error);
  const lowerMessage = rawMessage.toLowerCase();
  
  const isRateLimit = lowerMessage.includes("429") || lowerMessage.includes("resource exhausted") || lowerMessage.includes("quota");
  const isServerBusy = lowerMessage.includes("500") || lowerMessage.includes("503");

  if (isRateLimit) return { message: "RATE_LIMIT", isRateLimit: true, shouldWait: true };
  if (isServerBusy) return { message: "SERVER_BUSY", isRateLimit: false, shouldWait: true };

  return { message: rawMessage, isRateLimit: false, shouldWait: false };
};

/**
 * Chuẩn hóa văn bản: Đảm bảo AI đọc đúng 100% chính tả, xử lý viết tắt và ký hiệu toán học.
 */
const normalizeTextForSpeech = (text: string): string => {
  let processed = text;
  
  // 1. Xử lý các từ viết tắt (Sử dụng ranh giới từ để thay thế chính xác)
  Object.entries(VIETNAMESE_ABBREVIATIONS).forEach(([abbr, fullText]) => {
    const escapedAbbr = abbr.replace(/\./g, '\\.');
    const regex = new RegExp(`(?<!\\w)${escapedAbbr}(?!\\w)`, 'gi');
    processed = processed.replace(regex, fullText);
  });

  // 2. Xử lý ký hiệu toán học/ký tự đặc biệt sang tiếng Việt
  processed = processed.replace(/%/g, " phần trăm");
  processed = processed.replace(/\+/g, " cộng ");
  processed = processed.replace(/\//g, " trên ");
  processed = processed.replace(/\*/g, " nhân ");
  processed = processed.replace(/&/g, " và ");
  processed = processed.replace(/=/g, " bằng ");
  
  // 3. Xử lý các dấu ngắt nghỉ và loại bỏ ký tự rác
  processed = processed.replace(/(\s+-\s+|(?<!\d)-(?!\d))/g, ", ");
  processed = processed.replace(/[#$^*()_+={}[\]|\\<>]/g, ' ');
  
  return processed.replace(/\s+/g, ' ').trim();
};

/**
 * QUY TẮC NGHIÊM NGẶT: Cắt lấy tối đa 20s đầu tiên của giọng mẫu để phân tích.
 */
export const trimAudioTo20Seconds = async (audioArrayBuffer: ArrayBuffer): Promise<{ base64: string, duration: number }> => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const audioBuffer = await audioContext.decodeAudioData(audioArrayBuffer.slice(0));
  
  const durationToKeep = Math.min(audioBuffer.duration, 20); 
  const sampleRate = audioBuffer.sampleRate;
  const framesToKeep = Math.floor(durationToKeep * sampleRate);
  
  const newBuffer = audioContext.createBuffer(audioBuffer.numberOfChannels, framesToKeep, sampleRate);
  for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
    newBuffer.getChannelData(i).set(audioBuffer.getChannelData(i).slice(0, framesToKeep));
  }

  const wavArrayBuffer = audioBufferToWav(newBuffer);
  const wavBlob = pcmToWav(wavArrayBuffer, sampleRate);
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve({ base64, duration: durationToKeep });
    };
    reader.readAsDataURL(wavBlob);
  });
};

function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const length = buffer.length * numChannels * 2;
  const result = new ArrayBuffer(length);
  const view = new DataView(result);
  let offset = 0;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      let sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }
  return result;
}

/**
 * Xử lý văn bản thành giọng nói với cơ chế XOAY KEY TỰ ĐỘNG khi lỗi Quota.
 * Quy tắc: Chia đoạn < 800 ký tự và Độ trễ 3s mỗi đoạn.
 */
export const generateAudioParallel = async (
  text: string,
  config: any,
  onProgress: (percent: number) => void,
  onLog: (m: string, t: 'info' | 'error') => void,
  apiKeys: string[] 
): Promise<ArrayBuffer> => {
  const normalizedText = normalizeTextForSpeech(text);
  
  const rawChunks = normalizedText.match(/[^.!?\n]+[.!?\n]*|[^.!?\n]+/g) || [normalizedText];
  const combinedChunks: string[] = [];
  let current = "";
  const LIMIT = 800; 

  for (const c of rawChunks) {
    if ((current + c).length < LIMIT) current += c;
    else {
      if (current) combinedChunks.push(current.trim());
      current = c;
    }
  }
  if (current) combinedChunks.push(current.trim());

  const total = combinedChunks.length;
  const results: ArrayBuffer[] = [];
  let currentKeyIndex = 0;

  for (let i = 0; i < total; i++) {
    // ĐỘ TRỄ 3S GIỮA CÁC ĐOẠN để tránh lỗi Rate Limit
    if (i > 0) await delay(3000);
    
    let success = false;
    let attempts = 0;

    // Cơ chế xoay Key tự động
    while (!success && attempts < apiKeys.length * 2) {
      const activeKey = apiKeys[currentKeyIndex % apiKeys.length];
      try {
        const ai = new GoogleGenAI({ apiKey: activeKey });
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-native-audio-preview-12-2025",
          contents: [{ parts: [{ text: combinedChunks[i] }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: config.voiceName } },
            },
          },
        });

        const base64 = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
        if (!base64) throw new Error("VOICE_DATA_MISSING");
        
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let j = 0; j < binaryString.length; j++) bytes[j] = binaryString.charCodeAt(j);
        results.push(bytes.buffer);
        
        success = true;
        onProgress(Math.round(((i + 1) / total) * 100));
      } catch (e: any) {
        attempts++;
        const errorInfo = handleAiError(e);
        if (errorInfo.isRateLimit) {
          onLog(`Key #${currentKeyIndex + 1} hết hạn mức, đang xoay Key...`, 'info');
          currentKeyIndex++; 
        } else {
          onLog(`Thử lại đoạn ${i+1}...`, 'info');
          await delay(4000); 
        }
      }
    }
    
    if (!success) throw new Error(`Quá tải hệ thống sau khi thử hết các Key khả dụng.`);
  }

  const finalBuffer = new Uint8Array(results.reduce((acc, b) => acc + b.byteLength, 0));
  let offset = 0;
  for (const res of results) {
    finalBuffer.set(new Uint8Array(res), offset);
    offset += res.byteLength;
  }
  return finalBuffer.buffer;
};

export const generateContentFromDescription = async (desc: string, systemPrompt: string, onLog: any, apiKey: string) => {
  await delay(2000); 
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: desc,
    config: { systemInstruction: systemPrompt }
  });
  return response.text || "";
};

export const analyzeVoice = async (base64Audio: string, onLog?: any, apiKey: string = "") => {
  await delay(3000); 
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Audio, mimeType: 'audio/wav' } },
        { text: "Phân tích giọng nói và trả về JSON: {gender, region, suggestedName, description}" }
      ]
    },
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "{}");
};

export const pcmToWav = (pcmBuffer: ArrayBuffer, sampleRate: number = 24000): Blob => {
  const length = pcmBuffer.byteLength;
  const buffer = new ArrayBuffer(44 + length);
  const view = new DataView(buffer);
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
  };
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length, true);
  new Uint8Array(buffer, 44).set(new Uint8Array(pcmBuffer));
  return new Blob([buffer], { type: 'audio/wav' });
};

export const pcmToMp3 = (pcmBuffer: ArrayBuffer, sampleRate: number = 24000): Blob => {
  if (!(window as any).lamejs) return pcmToWav(pcmBuffer, sampleRate);
  const mp3encoder = new (window as any).lamejs.Mp3Encoder(1, sampleRate, 128);
  const samples = new Int16Array(pcmBuffer);
  const mp3Data = [];
  const sampleBlockSize = 576;
  for (let i = 0; i < samples.length; i += sampleBlockSize) {
    const chunk = samples.subarray(i, i + sampleBlockSize);
    const mp3buf = mp3encoder.encodeBuffer(chunk);
    if (mp3buf.length > 0) mp3Data.push(mp3buf);
  }
  const mp3buf = mp3encoder.flush();
  if (mp3buf.length > 0) mp3Data.push(mp3buf);
  return new Blob(mp3Data, { type: 'audio/mp3' });
};

export const mixWithBackgroundAudio = async (voiceBuffer: ArrayBuffer, bgBuffer: ArrayBuffer, bgVolume: number = 0.2): Promise<ArrayBuffer> => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const [voiceAudio, bgAudio] = await Promise.all([
    audioContext.decodeAudioData(voiceBuffer.slice(0)),
    audioContext.decodeAudioData(bgBuffer.slice(0))
  ]);
  const offlineCtx = new OfflineAudioContext(1, voiceAudio.length, 24000);
  const voiceSource = offlineCtx.createBufferSource();
  voiceSource.buffer = voiceAudio;
  const bgSource = offlineCtx.createBufferSource();
  bgSource.buffer = bgAudio;
  bgSource.loop = true;
  const bgGain = offlineCtx.createGain();
  bgGain.gain.value = bgVolume;
  voiceSource.connect(offlineCtx.destination);
  bgSource.connect(bgGain);
  bgGain.connect(offlineCtx.destination);
  voiceSource.start();
  bgSource.start();
  const mixedBuffer = await offlineCtx.startRendering();
  return audioBufferToWav(mixedBuffer);
};

export const validateApiKey = async (key: string): Promise<boolean> => {
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: 'hi' });
    return true;
  } catch { return false; }
};
