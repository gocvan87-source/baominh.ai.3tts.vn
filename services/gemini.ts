import { GoogleGenAI, Modality, Type } from "@google/genai";
import { ReadingMode, VoiceEmotion, AdvancedVoiceSettings } from "../types";
import { VIETNAMESE_ABBREVIATIONS } from "../constants";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Exponential backoff với jitter để tránh thundering herd
 */
const exponentialBackoff = async (retryCount: number, baseDelay: number = 1000): Promise<void> => {
  const exponentialDelay = baseDelay * Math.pow(2, retryCount);
  const jitter = Math.random() * 1000; // Random 0-1000ms để tránh synchronized retries
  const totalDelay = Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
  await delay(totalDelay);
};

/**
 * Wrapper với timeout cho API calls
 */
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 30000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout after ' + timeoutMs + 'ms')), timeoutMs)
    )
  ]);
};

/**
 * Kiểm tra API Key có thực sự hoạt động hay không bằng một request tối giản
 */
export const testApiKey = async (apiKey: string): Promise<{ valid: boolean, message: string }> => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    // Thử gọi một lệnh generateContent siêu ngắn để check key
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Ping",
      config: { maxOutputTokens: 1 }
    });
    if (response) return { valid: true, message: "API Key hoạt động tốt." };
    return { valid: false, message: "Không nhận được phản hồi từ AI." };
  } catch (error: any) {
    const info = handleAiError(error);
    return { valid: false, message: info.message };
  }
};

/**
 * Xử lý lỗi Gemini API chi tiết với Retry-After support
 */
export const handleAiError = (error: any): { 
  message: string, 
  isRateLimit: boolean, 
  shouldWait: boolean,
  retryAfter?: number 
} => {
  const rawMessage = error?.message ? String(error.message) : String(error);
  const lowerMessage = rawMessage.toLowerCase();
  
  const isRateLimit = lowerMessage.includes("429") || 
                     lowerMessage.includes("resource exhausted") || 
                     lowerMessage.includes("quota") ||
                     lowerMessage.includes("rate limit");
  const isInvalidKey = lowerMessage.includes("400") || 
                      lowerMessage.includes("401") || 
                      lowerMessage.includes("403") || 
                      lowerMessage.includes("api key") || 
                      lowerMessage.includes("invalid argument") || 
                      lowerMessage.includes("not found");
  const isSafetyBlock = lowerMessage.includes("safety") || lowerMessage.includes("blocked");
  const isTimeout = lowerMessage.includes("timeout");

  // Parse Retry-After từ response headers nếu có
  let retryAfter: number | undefined;
  if (error?.response?.headers?.['retry-after']) {
    retryAfter = parseInt(error.response.headers['retry-after'], 10) * 1000; // Convert to ms
  } else if (isRateLimit) {
    retryAfter = 60000; // Default 60 seconds cho rate limit
  }

  if (isRateLimit) {
    return { 
      message: "❌ Hết hạn mức (429). Vui lòng thử lại sau.", 
      isRateLimit: true, 
      shouldWait: true,
      retryAfter: retryAfter || 60000
    };
  }
  if (isInvalidKey) {
    return { 
      message: "🚫 Key không hợp lệ hoặc đã bị vô hiệu hóa.", 
      isRateLimit: false, 
      shouldWait: false 
    };
  }
  if (isSafetyBlock) {
    return { 
      message: "🛡️ Nội dung bị chặn do chính sách an toàn.", 
      isRateLimit: false, 
      shouldWait: false 
    };
  }
  if (isTimeout) {
    return { 
      message: "⏱️ Request timeout. Vui lòng thử lại.", 
      isRateLimit: false, 
      shouldWait: true,
      retryAfter: 5000
    };
  }
  
  return { 
    message: `❗ Lỗi: ${rawMessage.substring(0, 100)}`, 
    isRateLimit: false, 
    shouldWait: false 
  };
};

/**
 * NGUYÊN TẮC VÀNG: Chuẩn hóa văn bản để đọc chính xác 100%
 * Quy tắc này xử lý triệt để lỗi đọc sai chính tả, ký hiệu và định dạng đặc biệt.
 * 
 * Các tính năng:
 * 1. Chuẩn hóa Unicode (NFC): Khắc phục lỗi hiển thị dấu tiếng Việt
 * 2. Sửa lỗi dấu câu: Tự động thêm khoảng trắng sau dấu câu
 * 3. Đọc đúng Ngày/Tháng: Tự động chuyển 10/10/2023 thành ngày 10 tháng 10 năm 2023
 * 4. Đọc đúng Đơn vị đo lường: Tự động chuyển 5kg, 100km, 500đ thành đọc đúng
 * 5. Mở rộng từ viết tắt: Tự động thay thế các từ viết tắt phổ biến
 * 6. Xử lý ký tự đặc biệt: Chuyển gạch đầu dòng thành dấu phẩy
 */
export const normalizeTextForSpeech = (text: string): string => {
  if (!text) return "";

  // 1. Chuẩn hóa Unicode (NFC) để xử lý lỗi font và dấu tiếng Việt
  // Ví dụ: òa vs oà -> chuẩn hóa về một dạng
  let processed = text.normalize("NFC");
  processed = processed.replace(/[\u200B-\u200D\uFEFF]/g, " ");

  // 2. Xử lý ngày tháng chuyên sâu (PHẢI XỬ LÝ TRƯỚC các ký hiệu toán học)
  // dd/mm/yyyy -> ngày dd tháng mm năm yyyy
  processed = processed.replace(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g, "ngày $1 tháng $2 năm $3");
  // dd/mm -> ngày dd tháng mm
  processed = processed.replace(/\b(\d{1,2})\/(\d{1,2})\b(?![\/\d])/g, "ngày $1 tháng $2");

  // 3. Xử lý ký hiệu toán học và so sánh (Tránh đọc sai ký hiệu)
  // FIX: Sử dụng lookahead thay vì \b vì % không phải word character
  processed = processed.replace(/(\d+)\s*%(?=\s|$|[^\w%])/g, "$1 phần trăm");
  
  // FIX: Sử dụng pattern đơn giản hơn, không dùng lookbehind để tương thích tốt hơn
  // Xử lý dấu + khi có số ở cả hai bên hoặc có khoảng trắng
  processed = processed.replace(/(\d+)\s*\+\s*(\d+)/g, "$1 cộng $2");
  processed = processed.replace(/\s\+\s/g, " cộng ");
  processed = processed.replace(/\s*=\s*/g, " bằng ");
  // FIX: Sửa regex > và < để không match với đơn vị đo lường (ví dụ: 5l không bị match)
  processed = processed.replace(/(\d+)\s*>\s*(\d+)/g, "$1 lớn hơn $2");
  processed = processed.replace(/\s*>\s*/g, " lớn hơn ");
  processed = processed.replace(/(\d+)\s*<\s*(\d+)/g, "$1 nhỏ hơn $2");
  processed = processed.replace(/\s*<\s*/g, " nhỏ hơn ");
  processed = processed.replace(/(\d+)\s*\*\s*(\d+)/g, "$1 nhân $2");
  // Chỉ xử lý phép chia khi không phải ngày tháng (đã xử lý ở trên)
  processed = processed.replace(/(\d+)\s*\/\s*(\d+)(?!\/)/g, "$1 chia $2");

  // 4. Xử lý đơn vị tiền tệ và đo lường (Chỉ khi đứng sau số)
  // FIX: Sử dụng \d+ thay vì \d để match nhiều chữ số (5kg, 100km, 500đ)
  const units: Record<string, string> = {
    "kg": "ki lô gam", "km": "ki lô mét", "cm": "xăng ti mét", "mm": "mi li mét",
    "m2": "mét vuông", "m3": "mét khối", "ml": "mi li lít", "l": "lít", "g": "gam",
    "đ": "đồng", "vnd": "việt nam đồng", "usd": "đô la mỹ", "tr": "triệu", "tỷ": "tỷ"
  };
  
  // Sắp xếp units theo độ dài giảm dần để match đơn vị dài trước (ví dụ: "m2" trước "m")
  const sortedUnits = Object.entries(units).sort((a, b) => b[0].length - a[0].length);
  for (const [unit, reading] of sortedUnits) {
    // Escape các ký tự đặc biệt trong unit
    const escapedUnit = unit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // FIX: Sử dụng \d+ và lookahead chặt chẽ hơn để đảm bảo unit không nằm trong từ khác
    // Chỉ match khi unit là một từ độc lập (có khoảng trắng hoặc ký tự không phải chữ sau unit)
    // Và đảm bảo không match khi unit là phần của từ khác (ví dụ: "l" trong "lớn")
    const regex = new RegExp(`(\\d+)\\s*${escapedUnit}(?=\\s|$|[^\\w\\u00C0-\\u1EF9])`, 'gi');
    processed = processed.replace(regex, `$1 ${reading}`);
  }

  // 5. Mở rộng từ viết tắt (Theo danh sách chuẩn từ constants)
  const sortedAbbrs = Object.keys(VIETNAMESE_ABBREVIATIONS).sort((a, b) => b.length - a.length);
  for (const abbr of sortedAbbrs) {
      const fullText = VIETNAMESE_ABBREVIATIONS[abbr];
      const escapedAbbr = abbr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Nếu có dấu chấm ở cuối (TP.), match nguyên văn, nếu không dùng word boundary
      const regex = abbr.endsWith('.') ? new RegExp(escapedAbbr, 'gi') : new RegExp(`\\b${escapedAbbr}\\b`, 'g');
      processed = processed.replace(regex, fullText + " ");
  }

  // 6. Chuẩn hóa dấu câu để AI ngắt nghỉ đúng (Dấu câu dính liền)
  // Tự động thêm khoảng trắng sau dấu câu nếu thiếu
  processed = processed.replace(/([,.!:;?])(?=[^\s\d])/g, '$1 '); // "chào,bạn" -> "chào, bạn"
  // Xóa khoảng trắng thừa trước dấu câu
  processed = processed.replace(/\s+([,.!:;?])/g, '$1'); // "chào , bạn" -> "chào, bạn"
  
  // 7. Xử lý gạch đầu dòng và phân đoạn (Tránh đọc là "trừ")
  // Chuyển gạch đầu dòng thành dấu phẩy để ngắt nhịp thở tự nhiên hơn
  processed = processed.replace(/(^|\n)\s*-\s+/g, "$1, "); 

  // 8. Dọn dẹp khoảng trắng thừa
  return processed.replace(/\s+/g, ' ').trim();
};

export const generateContentFromDescription = async (prompt: string, modePrompt: string, onLog?: any, apiKey: string = "") => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${modePrompt}\n\n${prompt}\n\nYêu cầu: Viết tiếng Việt chuẩn, tuyệt đối không viết tắt, không dùng tiếng lóng.`,
    });
    return response.text || '';
  } catch (error: any) { throw new Error(handleAiError(error).message); }
};

export const generateAudioSegment = async (
  text: string, 
  config: any, 
  onLog?: any, 
  apiKey: string = "",
  retryCount: number = 0,
  maxRetries: number = 3
): Promise<ArrayBuffer> => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await withTimeout(
      ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: config.voiceName } } },
        },
      }),
      30000 // 30 seconds timeout
    );
    const base64 = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
    if (!base64) throw new Error("TTS Failure");
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  } catch (error: any) {
    const errorInfo = handleAiError(error);
    
    // Retry logic với exponential backoff
    if (retryCount < maxRetries && (errorInfo.isRateLimit || errorInfo.shouldWait)) {
      const waitTime = errorInfo.retryAfter || (1000 * Math.pow(2, retryCount));
      if (onLog) onLog(`Segment error, retrying (${retryCount + 1}/${maxRetries}) after ${Math.round(waitTime/1000)}s...`, 'warning');
      await delay(waitTime);
      return generateAudioSegment(text, config, onLog, apiKey, retryCount + 1, maxRetries);
    }
    
    throw new Error(errorInfo.message);
  }
};

export const generateAudioParallel = async (text: string, config: any, onProgress: any, onLog?: any, apiKey: string = ""): Promise<ArrayBuffer> => {
  // BƯỚC QUAN TRỌNG: Chuẩn hóa văn bản trước khi chia nhỏ
  const normalizedText = normalizeTextForSpeech(text);
  
  const rawChunks = normalizedText.match(/[^.!?\n]+[.!?\n]*|[^.!?\n]+/g) || [normalizedText];
  const combinedChunks: string[] = [];
  let current = "";
  const LIMIT = 600; 

  for (const c of rawChunks) {
    if ((current + c).length < LIMIT) current += c;
    else { if (current) combinedChunks.push(current.trim()); current = c; }
  }
  if (current) combinedChunks.push(current.trim());

  // Adaptive delay: tăng delay nếu gặp rate limit
  let adaptiveDelay = 1200; // Base delay
  const results: ArrayBuffer[] = [];
  
  for (let i = 0; i < combinedChunks.length; i++) {
    if (i > 0) {
      await delay(adaptiveDelay); // Sử dụng adaptive delay
      if (onLog) onLog(`Processing segment ${i + 1}/${combinedChunks.length}...`, 'info');
    }
    
    try {
      const segment = await generateAudioSegment(combinedChunks[i], config, onLog, apiKey);
      results.push(segment);
      
      // Giảm delay nếu response nhanh (thành công)
      adaptiveDelay = Math.max(adaptiveDelay * 0.95, 800); // Min 800ms
      
      onProgress(Math.round(((i + 1) / combinedChunks.length) * 100));
    } catch (error: any) {
      // Tăng delay nếu gặp lỗi rate limit
      const errorInfo = handleAiError(error);
      if (errorInfo.isRateLimit || errorInfo.shouldWait) {
        adaptiveDelay = Math.min(adaptiveDelay * 1.5, 5000); // Max 5 seconds
        if (onLog) onLog(`Rate limit detected, increasing delay to ${Math.round(adaptiveDelay)}ms`, 'warning');
      }
      throw error; // Re-throw để caller xử lý retry với key rotation
    }
  }

  const totalLength = results.reduce((acc, b) => acc + b.byteLength, 0);
  const finalBuffer = new Uint8Array(totalLength);
  let offset = 0;
  for (const res of results) {
    finalBuffer.set(new Uint8Array(res), offset);
    offset += res.byteLength;
  }
  return finalBuffer.buffer;
};

export const pcmToWav = (pcmBuffer: ArrayBuffer, sampleRate: number = 24000): Blob => {
  const length = pcmBuffer.byteLength;
  const buffer = new ArrayBuffer(44 + length);
  const view = new DataView(buffer);
  view.setUint32(0, 0x52494646, false); 
  view.setUint32(4, 36 + length, true); 
  view.setUint32(8, 0x57415645, false);
  view.setUint32(12, 0x666d7420, false); 
  view.setUint32(16, 16, true); 
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true); 
  view.setUint32(24, sampleRate, true); 
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); 
  view.setUint16(34, 16, true); 
  view.setUint32(36, 0x64617461, false);
  view.setUint32(40, length, true); 
  new Uint8Array(buffer, 44).set(new Uint8Array(pcmBuffer));
  return new Blob([buffer], { type: 'audio/wav' });
};

export const pcmToMp3 = (pcmBuffer: ArrayBuffer, sampleRate: number = 24000): Blob => {
  const lamejs = (window as any).lamejs;
  if (!lamejs?.Mp3Encoder) return pcmToWav(pcmBuffer, sampleRate);
  const encoder = new lamejs.Mp3Encoder(1, sampleRate, 128);
  const samples = new Int16Array(pcmBuffer);
  const mp3Data = [];
  for (let i = 0; i < samples.length; i += 1152) {
    const chunk = samples.subarray(i, i + 1152);
    const mp3buf = encoder.encodeBuffer(chunk);
    if (mp3buf.length > 0) mp3Data.push(mp3buf);
  }
  const final = encoder.flush();
  if (final.length > 0) mp3Data.push(final);
  return new Blob(mp3Data, { type: 'audio/mp3' });
};

export const analyzeVoice = async (rawAudioBuffer: ArrayBuffer, onLog?: (m: string, t: 'info' | 'error') => void, apiKey: string = ""): Promise<any> => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const audioBuffer = await audioContext.decodeAudioData(rawAudioBuffer.slice(0));
  const durationToKeep = Math.min(audioBuffer.duration, 20);
  const framesToKeep = Math.floor(durationToKeep * audioBuffer.sampleRate);
  const newBuffer = audioContext.createBuffer(audioBuffer.numberOfChannels, framesToKeep, audioBuffer.sampleRate);
  for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
    newBuffer.getChannelData(i).set(audioBuffer.getChannelData(i).slice(0, framesToKeep));
  }
  const wavBlob = pcmToWav(audioBufferToWav(newBuffer), audioBuffer.sampleRate);
  const reader = new FileReader();
  const base64 = await new Promise<string>((resolve) => {
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(wavBlob);
  });

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: {
        parts: [
          { inlineData: { data: base64, mimeType: 'audio/wav' } },
          { text: `Analyze this audio. Return JSON: gender ("Nam"/"Nữ"), region ("Bắc"/"Trung"/"Nam"), toneSummary (5 words), suggestedName (Vietnamese), description.` }
        ]
      },
      config: { responseMimeType: "application/json" }
    });
    
    let jsonText = response.text || "{}";
    jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    return JSON.parse(jsonText);
  } catch (e: any) {
    throw new Error(handleAiError(e).message);
  }
};

function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const length = buffer.length * numChannels * 2;
  const result = new ArrayBuffer(length);
  const view = new DataView(result);
  const channels = [];
  for (let i = 0; i < numChannels; i++) channels.push(buffer.getChannelData(i));
  let offset = 0;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      let sample = channels[channel][i];
      sample = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }
  return result;
}

export const generateMarketingContent = async (imageBase64: string | null, description: string, onLog?: any, apiKey: string = "") => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const parts: any[] = [];
    if (imageBase64) parts.push({ inlineData: { mimeType: 'image/jpeg', data: imageBase64 } });
    parts.push({ text: `Đóng vai chuyên gia marketing. Dựa trên: "${description}", tạo tiêu đề (dưới 10 từ) và nội dung quảng cáo (30 từ) hấp dẫn. Trả về JSON {title, content}.` });
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: { parts }, config: { responseMimeType: "application/json" } });
    
    let jsonText = response.text || "{}";
    jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    return JSON.parse(jsonText);
  } catch (e: any) { throw new Error(handleAiError(e).message); }
};

export const generateAdImage = async (prompt: string, onLog?: any, apiKey: string = "") => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ text: `High-quality advertising background: ${prompt}. No text.` }],
      config: { imageConfig: { aspectRatio: "1:1" } }
    });
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!part) throw new Error("AI không trả về ảnh.");
    return `data:image/png;base64,${part.inlineData.data}`;
  } catch (e: any) { throw new Error(handleAiError(e).message); }
};
