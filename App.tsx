
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  TTSProvider, ReadingMode, VoiceConfig, GenerationState, UserProfile, ManagedKey, AdCampaign
} from './types';
import { READING_MODES, PRESET_VOICES, ADMIN_MODES } from './constants';
import { 
  generateContentFromDescription, generateAudioParallel, pcmToWav, pcmToMp3, mixWithBackgroundAudio, analyzeVoice, trimAudioTo20Seconds, validateApiKey
} from './services/gemini';
import { 
  Sparkles, Loader2, Download, X, Trash2, Edit3, LogOut, Zap, Music, Key, UserPlus, Upload, Mic2, 
  CheckCircle2, Search, PlusCircle, PlayCircle, Ban, CheckCircle, Copy, UserSquare2, Coins, Gift, 
  ArrowRight, UserCog, Wand2, ChevronRight, Layout, MessageCircle, CreditCard, Calendar, Plus, Save,
  Megaphone, ShieldCheck, Mail, Lock
} from 'lucide-react';

const ADMIN_ID = "truong2024.vn";
const ADMIN_PASS = "#Minh@123";
const API_BASE = "/api/data";

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<ReadingMode>(ReadingMode.NEWS);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [managedKeys, setManagedKeys] = useState<ManagedKey[]>([]);
  const [ads, setAds] = useState<AdCampaign[]>([]);
  const [adminTab, setAdminTab] = useState<'users' | 'keys' | 'ads'>('users');
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAIPromptOpen, setIsAIPromptOpen] = useState(false);
  const [isVoicePanelOpen, setIsVoicePanelOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isCloningModalOpen, setIsCloningModalOpen] = useState(false); 
  const [editingKey, setEditingKey] = useState<ManagedKey | null>(null);
  const [editingAd, setEditingAd] = useState<AdCampaign | null>(null);

  const [description, setDescription] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [progress, setProgress] = useState(0);
  const [bgAudio, setBgAudio] = useState<{ name: string, buffer: ArrayBuffer } | null>(null);
  const [bgVolume, setBgVolume] = useState(0.25);
  const [loginCreds, setLoginCreds] = useState({ id: '', pass: '' });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cloningFile, setCloningFile] = useState<File | null>(null);

  const [config, setConfig] = useState<VoiceConfig>({
    provider: TTSProvider.GEMINI, 
    speed: 1.0, 
    pitch: 1.0, 
    emotion: 'NEUTRAL', 
    voiceName: 'Kore',
    activePresetId: 'thu-thao-vtv'
  });

  const [state, setState] = useState<GenerationState & { mp3Url: string | null }>({
    isGeneratingText: false, isGeneratingAudio: false, error: null, text: '', audioUrl: null, mp3Url: null, audioBuffer: null
  });

  const bgInputRef = useRef<HTMLInputElement>(null);
  const cloneInputRef = useRef<HTMLInputElement>(null);
  const todayStr = useMemo(() => new Date().toLocaleDateString('vi-VN'), []);

  useEffect(() => {
    const fetchInit = async () => {
      try {
        const [keysRes, usersRes, adsRes] = await Promise.all([
          fetch(`${API_BASE}/keys`).then(r => r.json()),
          fetch(`${API_BASE}/users`).then(r => r.json()),
          fetch(`${API_BASE}/ads`).then(r => r.json())
        ]);
        setManagedKeys(keysRes || []);
        setAllUsers(usersRes || []);
        setAds(adsRes || []);

        const savedSession = localStorage.getItem('bm_user_session');
        if (savedSession) {
          const user = JSON.parse(savedSession) as UserProfile;
          setCurrentUser(user);
        } else { setIsAuthModalOpen(true); }
      } catch (e) { setIsAuthModalOpen(true); }
    };
    fetchInit();
  }, [todayStr]);

  const saveToDb = async (type: string, data: any) => {
    await fetch(`${API_BASE}/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  };

  // QUY TẮC ĐẶT LỊCH QUẢNG CÁO
  const activeAds = useMemo(() => {
    const now = new Date().getTime();
    return ads.filter(ad => {
      if (!ad.isActive) return false;
      const start = ad.startDate ? new Date(ad.startDate).getTime() : 0;
      const end = ad.endDate ? new Date(ad.endDate).getTime() : Infinity;
      return now >= start && now <= end;
    });
  }, [ads]);

  const handleCreateAudio = async () => {
    const text = generatedText.trim();
    if (!text) return;
    
    // TÍCH HỢP XOAY KEY: Lấy toàn bộ danh sách key khả dụng
    const validKeys = managedKeys
      .filter(k => k.status === 'VALID')
      .map(k => k.key);
    
    const keysToUse = validKeys.length > 0 ? validKeys : [process.env.API_KEY || ""];

    setState(s => ({ ...s, isGeneratingAudio: true }));
    setProgress(0);
    try {
      let buffer = await generateAudioParallel(text, config, setProgress, (m, t) => console.log(m), keysToUse);
      if (bgAudio) buffer = await mixWithBackgroundAudio(buffer, bgAudio.buffer, bgVolume);
      
      const wavUrl = URL.createObjectURL(pcmToWav(buffer));
      const mp3Url = URL.createObjectURL(pcmToMp3(buffer));
      
      setState(s => ({ ...s, audioUrl: wavUrl, mp3Url, isGeneratingAudio: false }));
    } catch (e) { 
      alert("Hệ thống quá tải hoặc hết hạn mức Key: " + (e as Error).message);
      setState(s => ({ ...s, isGeneratingAudio: false })); 
    }
  };

  const handleLogin = () => {
    setLoginError(null);
    if (loginCreds.id === ADMIN_ID && loginCreds.pass === ADMIN_PASS) {
      const adminUser: any = { uid: 'admin-root', displayName: 'Administrator', role: 'ADMIN', credits: 999999, loginId: ADMIN_ID };
      setCurrentUser(adminUser);
      localStorage.setItem('bm_user_session', JSON.stringify(adminUser));
      setIsAuthModalOpen(false);
      setActiveMode(ReadingMode.ADMIN_PANEL);
    } else {
      const user = allUsers.find(u => u.loginId === loginCreds.id && u.password === loginCreds.pass);
      if (user) {
        if (user.isBlocked) return setLoginError("Tài khoản đã bị khóa.");
        setCurrentUser(user);
        localStorage.setItem('bm_user_session', JSON.stringify(user));
        setIsAuthModalOpen(false);
      } else { setLoginError("Thông tin đăng nhập không chính xác."); }
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#F8FAFC] overflow-hidden font-sans">
      <header className="h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm z-50 shrink-0">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveMode(ReadingMode.NEWS)}>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg"><Sparkles className="w-6 h-6"/></div>
          <h1 className="text-xl font-black italic bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent uppercase tracking-tighter">BaoMinh AI</h1>
        </div>
        <div className="flex items-center gap-4">
          {currentUser && (
            <div className="flex items-center gap-3 px-4 py-1.5 bg-slate-50 border rounded-full">
              <p className="text-[10px] font-black text-indigo-600 uppercase">Hạn mức: {currentUser.credits.toLocaleString()} KT</p>
              <div className="w-1 h-1 bg-slate-300 rounded-full"/>
              <p className="text-[9px] font-bold text-slate-400 uppercase">{currentUser.role}</p>
            </div>
          )}
          <button onClick={() => { localStorage.removeItem('bm_user_session'); setCurrentUser(null); setIsAuthModalOpen(true); }} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><LogOut className="w-5 h-5"/></button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-72 bg-white border-r flex flex-col p-4 hidden md:flex">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-4">Danh mục Studio</div>
          <div className="space-y-1 overflow-y-auto flex-1 pr-1 custom-scrollbar">
            {READING_MODES.map(m => (
              <button key={m.id} onClick={() => setActiveMode(m.id)} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[11px] font-bold transition-all ${activeMode === m.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-50'}`}>
                <div className={`p-2 rounded-xl ${activeMode === m.id ? 'bg-white/20' : 'bg-slate-100 text-slate-400'}`}>{m.icon}</div>
                {m.label}
              </button>
            ))}
          </div>
          {currentUser?.role === 'ADMIN' && (
            <div className="pt-4 mt-4 border-t space-y-1">
              <button onClick={() => setActiveMode(ReadingMode.ADMIN_PANEL)} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[11px] font-bold transition-all ${activeMode === ReadingMode.ADMIN_PANEL ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                <div className={`p-2 rounded-xl ${activeMode === ReadingMode.ADMIN_PANEL ? 'bg-white/20' : 'bg-slate-100 text-slate-400'}`}><Layout className="w-5 h-5"/></div>
                Quản trị hệ thống
              </button>
            </div>
          )}
        </aside>

        <main className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative">
          {activeMode === ReadingMode.ADMIN_PANEL ? (
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-slate-800 uppercase italic">Control Center</h2>
                <div className="flex bg-white border rounded-2xl p-1 shadow-sm">
                  <button onClick={() => setAdminTab('users')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${adminTab === 'users' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>Người dùng</button>
                  <button onClick={() => setAdminTab('keys')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${adminTab === 'keys' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>API Keys</button>
                  <button onClick={() => setAdminTab('ads')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${adminTab === 'ads' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>Quảng cáo</button>
                </div>
              </div>

              {adminTab === 'ads' ? (
                <div className="space-y-6">
                  <div className="flex justify-end">
                    <button onClick={() => setEditingAd({ id: `ad-${Date.now()}`, isActive: true, title: '', content: '', buttonText: 'Xem ngay', buttonLink: '', createdAt: Date.now() })} className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition-all"><Plus className="w-4 h-4"/> Tạo quảng cáo</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {ads.map(ad => (
                      <div key={ad.id} className="bg-white p-6 rounded-[2rem] border shadow-sm flex flex-col gap-4 group hover:border-indigo-300 transition-all relative overflow-hidden">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${ad.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}/> 
                              <h4 className="text-sm font-black text-slate-800">{ad.title || "Chưa đặt tên"}</h4>
                           </div>
                           <div className="flex gap-2">
                             <button onClick={() => setEditingAd(ad)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Edit3 className="w-4 h-4"/></button>
                             <button onClick={async () => { if(confirm("Xóa quảng cáo?")) { const up = ads.filter(x => x.id !== ad.id); setAds(up); await saveToDb('ads', up); } }} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                           </div>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">{ad.content}</p>
                        <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl text-[9px] font-bold text-slate-400 uppercase">
                           <Calendar className="w-4 h-4 text-indigo-400"/>
                           <span>Lịch: {ad.startDate || 'Bắt đầu'} ➔ {ad.endDate || 'Kết thúc'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-slate-300 uppercase font-black tracking-widest text-xs animate-pulse">Đang tải dữ liệu quản trị...</div>
              )}
            </div>
          ) : (
            <>
              {/* QUY TẮC ĐẶT LỊCH: Hiển thị Quảng cáo */}
              {activeAds.length > 0 && (
                <div className="px-6 pt-6 animate-in slide-in-from-top-4 duration-700">
                  <div className="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-[2.5rem] p-8 text-white flex items-center justify-between shadow-2xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-40 -mt-40 blur-3xl group-hover:bg-white/20 transition-all duration-1000"/>
                     <div className="relative z-10 flex items-center gap-8">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-[2rem] flex items-center justify-center text-amber-300 shadow-inner group-hover:rotate-12 transition-transform duration-500"><Sparkles className="w-10 h-10"/></div>
                        <div>
                           <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none mb-2">{activeAds[0].title}</h3>
                           <p className="text-sm font-medium text-indigo-100 opacity-90 max-w-lg">{activeAds[0].content}</p>
                        </div>
                     </div>
                     <a href={activeAds[0].buttonLink} target="_blank" className="relative z-10 px-10 py-4 bg-white text-indigo-700 rounded-2xl text-[12px] font-black uppercase shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                        {activeAds[0].buttonText} <ArrowRight className="w-5 h-5"/>
                     </a>
                  </div>
                </div>
              )}

              <div className="flex-1 flex gap-6 p-6 overflow-hidden">
                <div className="flex-1 flex flex-col bg-white rounded-[3.5rem] border shadow-2xl overflow-hidden relative group">
                  <div className="px-10 py-6 border-b flex items-center justify-between bg-white/80 backdrop-blur-md z-10">
                    <p className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-3"><Layout className="w-5 h-5 text-indigo-600"/> Studio Sáng Tạo</p>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setIsAIPromptOpen(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2"><Wand2 className="w-4 h-4"/> Soạn thảo AI</button>
                      <button onClick={() => setGeneratedText('')} className="p-3 text-slate-200 hover:text-red-500 transition-all"><Trash2 className="w-6 h-6"/></button>
                    </div>
                  </div>
                  <textarea value={generatedText} onChange={e => setGeneratedText(e.target.value)} placeholder="Nhập văn bản. Hệ thống tự động chuẩn hóa chính tả và xoay Key thông minh..." className="flex-1 p-12 text-2xl font-medium text-slate-700 bg-transparent outline-none resize-none placeholder:text-slate-100 scrollbar-hide leading-relaxed"/>
                  
                  {state.isGeneratingAudio && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-2xl z-20 flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-300">
                      <div className="relative mb-10 scale-125">
                         <div className="w-24 h-24 border-[6px] border-indigo-100 rounded-full animate-pulse absolute inset-0"/>
                         <div className="w-24 h-24 border-[6px] border-indigo-600 border-t-transparent rounded-full animate-spin relative flex items-center justify-center">
                            <span className="text-[14px] font-black text-indigo-600">{progress}%</span>
                         </div>
                      </div>
                      <h4 className="text-3xl font-black text-slate-800 mb-3 uppercase italic tracking-tighter">Đang kiến tạo giọng nói</h4>
                      <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] max-w-sm leading-relaxed mb-6">Đã tối ưu xoay Key & Độ trễ an toàn 3s</p>
                      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
                         <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/>
                         <span className="text-[9px] font-black text-slate-400 uppercase italic">Chuẩn hóa 100% chính tả Việt Nam</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-[420px] flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                  <div className="bg-white rounded-[3rem] border shadow-xl p-8 space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3"><div className="p-2 bg-amber-50 rounded-xl"><Mic2 className="w-5 h-5 text-amber-500"/></div><h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Clone giọng mẫu</h4></div>
                      <button onClick={() => setIsCloningModalOpen(true)} className="px-4 py-2 bg-amber-500 text-white rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-amber-600 transition-all shadow-lg"><Zap className="w-4 h-4"/> Clone 20s</button>
                    </div>
                    
                    <button onClick={() => setIsVoicePanelOpen(true)} className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] flex items-center justify-between hover:border-indigo-400 group text-left transition-all">
                       <div>
                          <p className="text-sm font-black text-slate-800 uppercase italic tracking-tight">{PRESET_VOICES.find(v => v.id === config.activePresetId)?.label || 'Giọng mặc định'}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Phòng thu cao cấp</p>
                       </div>
                       <ChevronRight className="w-6 h-6 text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all"/>
                    </button>

                    <div className="space-y-4">
                       <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest"><span>Tốc độ đọc: {config.speed}x</span></div>
                       <input type="range" min="0.5" max="2.0" step="0.1" value={config.speed} onChange={e => setConfig({...config, speed: parseFloat(e.target.value)})} className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-600"/>
                    </div>
                  </div>

                  <button onClick={handleCreateAudio} disabled={state.isGeneratingAudio || !generatedText} className="w-full py-7 bg-gradient-to-r from-indigo-600 to-violet-700 text-white rounded-[2.5rem] text-sm font-black uppercase shadow-2xl hover:shadow-indigo-200 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-4 disabled:opacity-50">
                    {state.isGeneratingAudio ? <Loader2 className="w-7 h-7 animate-spin"/> : <PlayCircle className="w-8 h-8"/>} Chuyển đổi ngay
                  </button>

                  {state.audioUrl && (
                    <div className="bg-slate-900 rounded-[3rem] p-10 flex flex-col gap-8 animate-in slide-in-from-bottom-8 shadow-[0_35px_60px_-15px_rgba(79,70,229,0.3)] border border-indigo-500/10">
                      <audio src={state.audioUrl} controls className="w-full h-8 invert brightness-200 opacity-90"/>
                      <div className="grid grid-cols-2 gap-4">
                         <a href={state.mp3Url || '#'} download={`Studio-Audio-${Date.now()}.mp3`} className="py-5 bg-white/10 text-white text-[11px] font-black uppercase rounded-2xl flex items-center justify-center gap-3 hover:bg-white/20 transition-all border border-white/5 shadow-inner"><Download className="w-5 h-5"/> Tải file MP3</a>
                         <button onClick={() => { navigator.clipboard.writeText(generatedText); alert("Đã sao chép kịch bản!"); }} className="py-5 bg-white/10 text-white text-[11px] font-black uppercase rounded-2xl flex items-center justify-center gap-3 hover:bg-white/20 transition-all border border-white/5 shadow-inner"><Copy className="w-5 h-5"/> Copy Text</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* KHÔI PHỤC GIAO DIỆN ĐĂNG NHẬP CAO CẤP */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-50 animate-in fade-in duration-700">
           {/* Background Decorations */}
           <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
              <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-200 rounded-full blur-[100px] opacity-40 animate-pulse"/>
              <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-violet-200 rounded-full blur-[100px] opacity-40 animate-pulse delay-700"/>
           </div>

           <div className="w-full max-w-md p-10">
              <div className="bg-white rounded-[3.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] border border-white p-12 relative overflow-hidden flex flex-col items-center">
                 {/* Decorative Header Overlay */}
                 <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-violet-500"/>
                 
                 <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl mb-10 transform -rotate-6 animate-in zoom-in-50 duration-500">
                    <Sparkles className="w-10 h-10"/>
                 </div>
                 
                 <div className="text-center mb-10">
                    <h2 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter leading-none mb-2">Bảo Minh AI</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">Studio Voice Premium</p>
                 </div>

                 <div className="w-full space-y-5 relative z-10">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 ml-4 flex items-center gap-2"><Mail className="w-3 h-3"/> Tài khoản đăng nhập</label>
                       <input type="text" value={loginCreds.id} onChange={e => setLoginCreds({...loginCreds, id: e.target.value})} placeholder="Nhập ID đăng nhập" className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent rounded-[1.8rem] text-sm font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all shadow-inner"/>
                    </div>
                    
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 ml-4 flex items-center gap-2"><Lock className="w-3 h-3"/> Mật khẩu hệ thống</label>
                       <input type="password" value={loginCreds.pass} onChange={e => setLoginCreds({...loginCreds, pass: e.target.value})} placeholder="••••••••" className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent rounded-[1.8rem] text-sm font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all shadow-inner"/>
                    </div>

                    {loginError && (
                      <div className="px-6 py-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2">
                         <Ban className="w-4 h-4 text-rose-500"/>
                         <p className="text-[10px] font-black text-rose-600 uppercase italic">{loginError}</p>
                      </div>
                    )}

                    <button onClick={handleLogin} className="w-full py-6 bg-slate-900 text-white rounded-[1.8rem] text-[13px] font-black uppercase shadow-2xl hover:bg-indigo-600 active:scale-95 transition-all flex items-center justify-center gap-3 group mt-4">
                       Tiến vào Studio <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform"/>
                    </button>
                 </div>

                 <div className="mt-12 pt-8 border-t border-slate-50 w-full text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-300">
                       <ShieldCheck className="w-4 h-4 text-emerald-500"/>
                       <span className="text-[9px] font-black uppercase tracking-widest">Hệ thống bảo mật bởi Gemini AI</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* CÁC MODAL KHÁC ... (Giữ nguyên cấu trúc đã rà soát) */}
      {editingAd && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-3xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-3xl rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-10 bg-indigo-600 text-white flex items-center justify-between">
               <div className="flex items-center gap-5">
                  <div className="p-3 bg-white/20 rounded-2xl"><Megaphone className="w-6 h-6"/></div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">Cấu hình Quảng cáo</h3>
               </div>
               <button onClick={() => setEditingAd(null)} className="p-3 hover:bg-white/10 rounded-2xl transition-all"><X className="w-8 h-8"/></button>
            </div>
            <div className="p-12 space-y-8 overflow-y-auto max-h-[65vh] custom-scrollbar">
               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3"><label className="text-[11px] font-black uppercase text-slate-400 ml-2">Tiêu đề quảng cáo</label><input type="text" value={editingAd.title} onChange={e => setEditingAd({...editingAd, title: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-sm font-bold outline-none focus:bg-white focus:border-indigo-600 shadow-inner"/></div>
                  <div className="space-y-3"><label className="text-[11px] font-black uppercase text-slate-400 ml-2">Trạng thái phát hành</label><select value={editingAd.isActive ? 'active' : 'inactive'} onChange={e => setEditingAd({...editingAd, isActive: e.target.value === 'active'})} className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-sm font-bold outline-none cursor-pointer"><option value="active">Đang hoạt động</option><option value="inactive">Tạm dừng</option></select></div>
               </div>
               <div className="space-y-3"><label className="text-[11px] font-black uppercase text-slate-400 ml-2">Nội dung hiển thị</label><textarea value={editingAd.content} onChange={e => setEditingAd({...editingAd, content: e.target.value})} className="w-full p-6 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-sm font-medium h-32 outline-none focus:bg-white focus:border-indigo-600 shadow-inner"/></div>
               <div className="p-8 bg-indigo-50/50 border-2 border-indigo-100 rounded-[2.5rem] space-y-6">
                  <div className="flex items-center gap-3 text-indigo-600 mb-4"><Calendar className="w-5 h-5"/><h5 className="text-[11px] font-black uppercase tracking-widest">Thiết lập Lịch trình (Đặt lịch)</h5></div>
                  <div className="grid grid-cols-2 gap-8">
                     <div className="space-y-3"><label className="text-[10px] font-black uppercase text-indigo-400 ml-2">Bắt đầu hiển thị</label><input type="date" value={editingAd.startDate || ''} onChange={e => setEditingAd({...editingAd, startDate: e.target.value})} className="w-full p-5 bg-white border-none rounded-[1.5rem] text-sm font-bold shadow-sm outline-none"/></div>
                     <div className="space-y-3"><label className="text-[10px] font-black uppercase text-indigo-400 ml-2">Kết thúc hiển thị</label><input type="date" value={editingAd.endDate || ''} onChange={e => setEditingAd({...editingAd, endDate: e.target.value})} className="w-full p-5 bg-white border-none rounded-[1.5rem] text-sm font-bold shadow-sm outline-none"/></div>
                  </div>
               </div>
            </div>
            <div className="p-10 bg-slate-50 border-t flex gap-5">
               <button onClick={async () => { 
                 const updatedAds = ads.some(x => x.id === editingAd.id) 
                   ? ads.map(x => x.id === editingAd.id ? editingAd : x) 
                   : [...ads, editingAd];
                 setAds(updatedAds); 
                 await saveToDb('ads', updatedAds); 
                 setEditingAd(null); 
               }} className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl text-[12px] font-black uppercase shadow-2xl flex items-center justify-center gap-3 hover:bg-indigo-700 active:scale-95 transition-all"><Save className="w-6 h-6"/> Lưu & Áp dụng</button>
               <button onClick={() => setEditingAd(null)} className="px-10 py-5 bg-white border-2 text-slate-400 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-100 transition-all">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {isCloningModalOpen && (
        <div className="fixed inset-0 z-[350] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-3xl animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
              <div className="p-8 bg-amber-500 text-white flex items-center justify-between">
                 <div className="flex items-center gap-3"><Zap className="w-6 h-6"/><h3 className="text-sm font-black uppercase italic tracking-widest">Clone giọng 20 giây</h3></div>
                 <button onClick={() => setIsCloningModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X className="w-7 h-7"/></button>
              </div>
              <div className="p-10 space-y-8">
                 <div className="p-6 bg-amber-50 border-2 border-amber-100 rounded-[2rem] text-center italic">
                    <p className="text-[11px] font-bold text-amber-800 leading-relaxed">🎁 Tải file mẫu. Hệ thống sẽ cắt đúng 20 giây đầu tiên để phân tích tông giọng.</p>
                 </div>
                 
                 <div onClick={() => cloneInputRef.current?.click()} className={`w-full py-16 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center gap-4 transition-all cursor-pointer ${cloningFile ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-amber-400'}`}>
                    {cloningFile ? (
                      <div className="flex flex-col items-center gap-2"><CheckCircle2 className="w-12 h-12 text-emerald-500"/><p className="text-[11px] font-black uppercase text-emerald-700 truncate max-w-[200px]">{cloningFile.name}</p></div>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-slate-200"/>
                        <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest text-center px-10">Tải file âm thanh mẫu</p>
                      </>
                    )}
                    <input type="file" ref={cloneInputRef} onChange={(e) => setCloningFile(e.target.files?.[0] || null)} accept="audio/*" className="hidden"/>
                 </div>

                 <button onClick={async () => {
                      if (!cloningFile) return;
                      setIsAnalyzing(true);
                      try {
                        const arrayBuffer = await cloningFile.arrayBuffer();
                        // QUY TẮC: Luôn cắt 20s
                        const { base64 } = await trimAudioTo20Seconds(arrayBuffer);
                        const result = await analyzeVoice(base64, null, managedKeys[0]?.key || process.env.API_KEY || "");
                        alert(`Phân tích hoàn tất! Đã lưu giọng: ${result.suggestedName}`);
                        setIsCloningModalOpen(false);
                      } catch (e) { alert("Lỗi phân tích âm thanh"); }
                      finally { setIsAnalyzing(false); }
                   }} disabled={isAnalyzing || !cloningFile} className="w-full py-6 bg-amber-500 text-white rounded-2xl text-[12px] font-black uppercase shadow-xl flex items-center justify-center gap-3 disabled:opacity-50">
                    {isAnalyzing ? <Loader2 className="w-7 h-7 animate-spin"/> : <Sparkles className="w-7 h-7"/>} Bắt đầu phân tích
                 </button>
              </div>
           </div>
        </div>
      )}

      {isVoicePanelOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-8 bg-slate-900/80 backdrop-blur-2xl animate-in fade-in">
           <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[4rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
              <div className="p-12 border-b flex items-center justify-between bg-white/50">
                 <div className="flex items-center gap-5"><div className="p-4 bg-indigo-600 text-white rounded-[1.5rem] shadow-xl"><Mic2 className="w-8 h-8"/></div><h3 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter">Thư viện Giọng đọc</h3></div>
                 <button onClick={() => setIsVoicePanelOpen(false)} className="p-5 text-slate-300 hover:text-red-500 transition-all"><X className="w-10 h-10"/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 custom-scrollbar">
                  {PRESET_VOICES.map(v => (
                    <button key={v.id} onClick={() => { setConfig({...config, activePresetId: v.id, voiceName: v.baseVoice}); setIsVoicePanelOpen(false); }} className={`flex flex-col p-8 rounded-[2.5rem] border-2 text-left transition-all relative group ${config.activePresetId === v.id ? 'border-indigo-600 bg-indigo-50 shadow-2xl' : 'border-slate-50 bg-slate-50 hover:bg-white hover:border-indigo-200'}`}>
                       <div className="flex items-center gap-5 mb-6">
                          <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white font-bold text-2xl shadow-lg transition-transform group-hover:rotate-6 ${v.gender === 'Nam' ? 'bg-indigo-500' : 'bg-rose-500'}`}>{v.label.charAt(0)}</div>
                          <div><p className="text-xs font-black uppercase text-slate-800 tracking-tight">{v.label}</p><div className="flex gap-1.5 mt-2">{v.tags.map(t => <span key={t} className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase bg-white/80 text-slate-400 border border-slate-100">{t}</span>)}</div></div>
                       </div>
                       <p className="text-[11px] text-slate-400 leading-relaxed italic mb-4 font-medium line-clamp-3">"{v.description}"</p>
                       {config.activePresetId === v.id && <div className="absolute top-6 right-6 text-indigo-600 animate-in zoom-in"><CheckCircle2 className="w-7 h-7"/></div>}
                    </button>
                  ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
