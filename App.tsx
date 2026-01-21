
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  TTSProvider, ReadingMode, VoiceConfig, GenerationState, UserProfile, ClonedVoice, PlanType, ManagedKey, AdCampaign
} from './types';
import { READING_MODES, PRESET_VOICES } from './constants';
import { 
  generateContentFromDescription, generateAudioParallel, pcmToWav, pcmToMp3, analyzeVoice, generateMarketingContent, generateAdImage, testApiKey
} from './services/gemini';
import { 
  Sparkles, Loader2, Download, Settings2, 
  X, Trash2,
  Menu, Edit3, LogOut, Zap,
  ChevronDown, FileText,
  MessageCircle,
  UserCheck, Terminal, Plus, FileUp, LayoutDashboard, 
  ShieldCheck,
  Key, UserPlus, Lock, ClipboardPaste, 
  Users,
  Mic2, CheckCircle2, Upload, Fingerprint,
  ChevronUp, FileDown, Search,
  Database,
  ExternalLink, Gift, CalendarClock, Link,
  Megaphone, ImageIcon, Wand2, ArrowRight,
  Play, Pause, RotateCcw, RotateCw, FastForward,
  Palette,
  Facebook, Twitter, Copy,
  Save, PenTool, Filter, SortAsc, SortDesc,
  LifeBuoy, RefreshCcw, HardDriveDownload, HardDriveUpload,
  Server, ToggleLeft, ToggleRight
} from 'lucide-react';

const AUTHOR_ZALO = "0986.234.983"; 
const ZALO_LINK = `https://zalo.me/${AUTHOR_ZALO.replace(/\./g, '')}`;
const ZALO_QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ZALO_LINK)}`;
const ADMIN_ID = "truong2024.vn";
const ADMIN_PASS = "#Minh@123";
const GUEST_DAILY_LIMIT = 600; 
const WEB_APP_URL = window.location.origin;

const PLAN_LIMITS: Record<string, number> = {
  'GUEST': 600,
  'TRIAL': 600,       
  'MONTHLY': 20000,   
  '3MONTHS': 20000,
  '6MONTHS': 20000,
  'YEARLY': 20000,
  'ADMIN': 99999999
};

const formatTime = (time: number) => {
  if (isNaN(time)) return "00:00";
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const formatDateInput = (timestamp: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
};

/**
 * Public Ad View - Component Landing Page dành cho link chia sẻ /ad/[id]
 */
const PublicAdView: React.FC<{ ad: AdCampaign }> = ({ ad }) => {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 sm:p-8 relative overflow-hidden font-sans">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/30 blur-[150px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-violet-600/30 blur-[150px] rounded-full animate-pulse delay-1000"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      
      <div className="w-full max-w-5xl bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col lg:flex-row relative z-10 animate-in fade-in zoom-in-95 duration-700 hover:shadow-indigo-500/20 transition-shadow">
        <div className="lg:w-1/2 h-[350px] lg:h-auto relative overflow-hidden group">
          {ad.imageUrl ? (
            <img src={ad.imageUrl} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={ad.title} />
          ) : (
            <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
              <Megaphone className="w-24 h-24 text-slate-600/50" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-slate-900/90 via-transparent to-transparent"></div>
          <div className="absolute top-6 left-6 px-4 py-1.5 bg-indigo-600/90 backdrop-blur-md text-white text-[10px] font-black uppercase rounded-full shadow-lg border border-white/10 tracking-widest">Tin nổi bật</div>
        </div>
        
        <div className="lg:w-1/2 p-8 sm:p-14 flex flex-col justify-center text-left space-y-8 bg-gradient-to-b from-white/5 to-transparent">
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight uppercase drop-shadow-xl tracking-tight">{ad.title}</h1>
            <div className="h-1 w-20 bg-indigo-500 rounded-full"></div>
          </div>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-medium font-sans text-justify opacity-90">{ad.content}</p>
          <div className="pt-4">
            <a href={ad.buttonLink} target="_blank" rel="noopener noreferrer" className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-4 px-10 py-5 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-10px_rgba(99,102,241,0.5)] hover:scale-[1.02] transition-all duration-300 overflow-hidden">
              <span className="relative z-10 flex items-center gap-3">{ad.buttonText} <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" /></span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </a>
          </div>
          <div className="pt-10 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-40 hover:opacity-100 transition-opacity">
             <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-400" /><span className="text-[10px] font-black text-white uppercase tracking-widest">Powered by BaoMinh.AI</span></div>
             <a href={WEB_APP_URL} className="text-[10px] font-black text-white uppercase tracking-widest hover:text-indigo-400 transition-colors flex items-center gap-1">Tạo quảng cáo miễn phí <ExternalLink className="w-3 h-3" /></a>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [publicAd, setPublicAd] = useState<AdCampaign | null>(null);
  const [isLoadingPublicAd, setIsLoadingPublicAd] = useState(false);
  const [logs, setLogs] = useState<{timestamp: number, message: string, type: string}[]>([]);
  
  const addLog = (message: string, type: string = 'info') => {
    setLogs(prev => [...prev, { timestamp: Date.now(), message, type }].slice(-100));
  };

  const [notification, setNotification] = useState<{
    open: boolean; title: string; message: string; type: 'error' | 'warning' | 'success' | 'info'; actionLabel?: string; onAction?: () => void;
  } | null>(null);

  const showNotification = (title: string, message: string, type: 'error' | 'warning' | 'success' | 'info' = 'info', actionLabel?: string, onAction?: () => void) => {
    setNotification({ open: true, title, message, type, actionLabel, onAction });
    addLog(`${title}: ${message}`, type === 'success' ? 'info' : type);
  };

  const [activeMode, setActiveMode] = useState<ReadingMode>(ReadingMode.NEWS);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [managedKeys, setManagedKeys] = useState<ManagedKey[]>([]);
  const [clonedVoices, setClonedVoices] = useState<ClonedVoice[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isAIPromptOpen, setIsAIPromptOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // State quản lý Admin Panel
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState<UserProfile | null>(null); 
  const [isContributingKey, setIsContributingKey] = useState(false);
  const [isAdminTab, setIsAdminTab] = useState<'USERS' | 'KEYS' | 'LOGS' | 'ADS' | 'SYSTEM'>('USERS');
  
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const usersPerPage = 8;
  
  // Nâng cấp bộ lọc API Key
  const [keySearchTerm, setKeySearchTerm] = useState('');
  const [keyFilterStatus, setKeyFilterStatus] = useState<'ALL' | 'VALID' | 'INVALID' | 'UNTESTED'>('ALL');
  const [keySort, setKeySort] = useState<'NEWEST' | 'OLDEST'>('NEWEST');
  const [isTestingNewKey, setIsTestingNewKey] = useState(false);
  
  // STATE CẤU HÌNH HỆ THỐNG
  const [useEnvKeyOnly, setUseEnvKeyOnly] = useState(false);

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showVoicePanel, setShowVoicePanel] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [voicePanelTab, setVoicePanelTab] = useState<'PRESET' | 'CLONE'>('PRESET');
  const [cloneFile, setCloneFile] = useState<File | null>(null);
  const [isAnalyzingVoice, setIsAnalyzingVoice] = useState(false);
  const cloneInputRef = useRef<HTMLInputElement>(null);

  // Advertisement states
  const [adCampaigns, setAdCampaigns] = useState<AdCampaign[]>([]);
  const [activeAdCampaign, setActiveAdCampaign] = useState<AdCampaign | null>(null); 
  const [isGeneratingAd, setIsGeneratingAd] = useState(false);
  const [isGeneratingAdImage, setIsGeneratingAdImage] = useState(false);
  const [adImagePreview, setAdImagePreview] = useState<string | null>(null);
  const [adDescription, setAdDescription] = useState('');
  const [imageDescription, setImageDescription] = useState('');
  const [editingAd, setEditingAd] = useState<AdCampaign>({
    id: 'new', isActive: true, title: '', content: '', buttonText: 'Liên hệ ngay', buttonLink: ZALO_LINK, createdAt: 0, startDate: '', endDate: ''
  });
  const [showAdOverlay, setShowAdOverlay] = useState(false);

  // Text File Processing State
  const [isReadingFile, setIsReadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [playerCurrentTime, setPlayerCurrentTime] = useState(0);
  const [playerDuration, setPlayerDuration] = useState(0);
  const [playerIsPlaying, setPlayerIsPlaying] = useState(false);
  const [playerPlaybackRate, setPlayerPlaybackRate] = useState(1.0);
  const [showRateMenu, setShowRateMenu] = useState(false);

  const [description, setDescription] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [progress, setProgress] = useState(0);
  const [loginCreds, setLoginCreds] = useState({ id: '', pass: '' });
  const [loginError, setLoginError] = useState<string | null>(null);
  
  // State cho việc tạo User mới
  const [newUserData, setNewUserData] = useState({ loginId: '', password: '', name: '', email: '', plan: 'TRIAL' as PlanType });
  const [newKeyData, setNewKeyData] = useState({ name: '', key: '', assignedUid: '' });

  // State cho việc sửa giọng Clone
  const [editingVoice, setEditingVoice] = useState<Partial<ClonedVoice> | null>(null);

  const [config, setConfig] = useState<VoiceConfig>({
    provider: TTSProvider.GEMINI, speed: 1.0, pitch: 1.0, emotion: 'NEUTRAL', voiceName: 'Kore',
    useClonedVoice: false, activeClonedVoiceId: '', activePresetId: 'thu-thao-vtv'
  });

  const [state, setState] = useState<GenerationState & { mp3Url: string | null }>({
    isGeneratingText: false, isGeneratingAudio: false, error: null, text: '', audioUrl: null, mp3Url: null, audioBuffer: null
  });

  const syncToDb = async (key: string, data: any) => {
    try { await fetch(`/api/data/${key}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); } catch (e) {}
  };
  const loadFromDb = async (key: string) => {
    try { const res = await fetch(`/api/data/${key}`); if (!res.ok) return null; return await res.json(); } catch (e) { return null; }
  };

  const checkAndResetDailyLimit = (user: UserProfile): UserProfile => {
    const today = new Date().toDateString();
    let updatedUser = { ...user };
    let hasChanged = false;
    if (user.role !== 'ADMIN' && user.expiryDate && Date.now() > user.expiryDate) { if (!user.isBlocked) { updatedUser.isBlocked = true; hasChanged = true; } }
    const lastReset = user.lastResetDate ? new Date(user.lastResetDate).toDateString() : '';
    if (today !== lastReset) {
      const baseLimit = PLAN_LIMITS[user.planType] || 600; 
      const bonusLimit = user.bonusDailyLimit || 0;
      updatedUser.credits = baseLimit + bonusLimit;
      updatedUser.lastResetDate = new Date().toISOString();
      hasChanged = true;
    }
    return hasChanged ? updatedUser : user;
  };

  // LOGIC ĐỊNH TUYẾN
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/ad/')) {
      const adId = path.split('/ad/')[1];
      if (adId) {
        setIsLoadingPublicAd(true);
        loadFromDb('ad_campaigns').then(ads => {
          if (ads && Array.isArray(ads)) {
            const foundAd = ads.find(a => a.id === adId);
            if (foundAd) {
                setPublicAd(foundAd);
                document.title = foundAd.title + " | Bảo Minh AI";
            } else {
                showNotification("Lỗi", "Quảng cáo không tồn tại hoặc đã hết hạn.", "error");
            }
          }
          setIsLoadingPublicAd(false);
        });
      }
    }
  }, []);

  useEffect(() => {
    const initData = async () => {
      if (window.location.pathname.startsWith('/ad/')) return;

      const [dbUsers, dbClones, dbKeys, dbAds, dbSystem] = await Promise.all([
        loadFromDb('users'), loadFromDb('clonedVoices'), loadFromDb('managedKeys'), loadFromDb('ad_campaigns'), loadFromDb('systemConfig')
      ]);
      if (dbUsers) setAllUsers(dbUsers);
      if (dbClones) setClonedVoices(dbClones);
      if (dbKeys) setManagedKeys(dbKeys);
      if (dbSystem && typeof dbSystem.useEnvKeyOnly === 'boolean') setUseEnvKeyOnly(dbSystem.useEnvKeyOnly);
      if (dbAds && Array.isArray(dbAds)) {
         setAdCampaigns(dbAds);
         const todayStr = new Date().toISOString().split('T')[0];
         const validAds = dbAds.filter(ad => {
           const isDateValid = (!ad.startDate || ad.startDate <= todayStr) && (!ad.endDate || ad.endDate >= todayStr);
           return ad.isActive && isDateValid;
         });
         if (validAds.length > 0) setActiveAdCampaign(validAds[Math.floor(Math.random() * validAds.length)]);
      }
      const savedSession = localStorage.getItem('bm_user_session');
      if (savedSession) {
        let sessionUser = JSON.parse(savedSession);
        if (sessionUser.role === 'GUEST') {
           const usage = getGuestUsage();
           setCurrentUser({...sessionUser, credits: Math.max(0, GUEST_DAILY_LIMIT - usage)});
        } else {
           const freshUser = (dbUsers || []).find((u: any) => u.uid === sessionUser.uid);
           if (freshUser) {
              const checked = checkAndResetDailyLimit(freshUser);
              setCurrentUser(checked);
           } else if (sessionUser.loginId === ADMIN_ID) setCurrentUser(sessionUser);
           else setIsAuthModalOpen(true);
        }
      } else setIsAuthModalOpen(true);
    };
    initData();
  }, []);

  useEffect(() => { if (allUsers.length > 0) syncToDb('users', allUsers); }, [allUsers]);
  useEffect(() => { if (clonedVoices.length > 0) syncToDb('clonedVoices', clonedVoices); }, [clonedVoices]);
  useEffect(() => { if (managedKeys.length > 0) syncToDb('managedKeys', managedKeys); }, [managedKeys]);
  useEffect(() => { if (adCampaigns.length > 0) syncToDb('ad_campaigns', adCampaigns); }, [adCampaigns]);
  // Lưu cấu hình hệ thống
  useEffect(() => { syncToDb('systemConfig', { useEnvKeyOnly }); }, [useEnvKeyOnly]);

  useEffect(() => {
    if (activeAdCampaign && !sessionStorage.getItem('bm_ad_seen') && !publicAd) {
        const timer = setTimeout(() => { setShowAdOverlay(true); sessionStorage.setItem('bm_ad_seen', 'true'); }, 2000);
        return () => clearTimeout(timer);
    }
  }, [activeAdCampaign, publicAd]);

  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.playbackRate = config.speed;
        setPlayerPlaybackRate(config.speed);
    }
  }, [state.audioUrl, config.speed]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const updateTime = () => setPlayerCurrentTime(audio.currentTime);
    const updateDuration = () => setPlayerDuration(audio.duration);
    const onEnded = () => setPlayerIsPlaying(false);
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', onEnded);
    };
  }, [state.audioUrl]);

  // NGUYÊN TẮC: Ưu tiên lấy API Key từ Database hoặc Env tùy cấu hình
  const selectBestKey = (excluded: string[] = []) => {
    // 1. Nếu Admin ép buộc dùng Env Key
    if (useEnvKeyOnly) {
        return process.env.API_KEY || "";
    }

    const validKeysInDb = managedKeys.filter(k => k.status !== 'INVALID' && !excluded.includes(k.key));
    
    // 2. Ưu tiên Key riêng của user
    if (currentUser) {
        const privateKeys = validKeysInDb.filter(k => k.allowedUserIds.includes(currentUser.uid));
        if (privateKeys.length > 0) return privateKeys[0].key;
    }
    
    // 3. Ưu tiên Key chung trong DB & Xoay tua (Load Balancing)
    const sharedKeys = validKeysInDb.filter(k => k.allowedUserIds.length === 0);
    if (sharedKeys.length > 0) {
        // Thực hiện xoay tua ngẫu nhiên nếu có >= 2 key để chia tải
        const randomIndex = Math.floor(Math.random() * sharedKeys.length);
        return sharedKeys[randomIndex].key;
    }
    
    // 4. Cuối cùng mới lấy Key mặc định từ Env (nếu nó chưa bị loại trừ)
    const envKey = process.env.API_KEY || "";
    if (envKey && !excluded.includes(envKey)) {
        return envKey;
    }

    return "";
  };

  const handleCreateAudio = async () => {
    if (!currentUser) return setIsAuthModalOpen(true);
    const text = generatedText || description;
    if (!text.trim()) return showNotification("Nội dung trống", "Hãy nhập văn bản.", "warning");
    
    if (currentUser.role !== 'ADMIN' && currentUser.credits < text.length) {
        setIsPricingModalOpen(true);
        return;
    }

    setState(prev => ({ ...prev, isGeneratingAudio: true, audioUrl: null, mp3Url: null }));
    setProgress(0);

    const attempt = async (retries = 3, excluded: string[] = []) => {
      const key = selectBestKey(excluded);
      if (!key) {
          showNotification("Hết Key", "Vui lòng thêm API Key mới.", "error");
          setState(prev => ({...prev, isGeneratingAudio: false}));
          return;
      }
      try {
        const buffer = await generateAudioParallel(text, config, setProgress, addLog, key);
        const wavUrl = URL.createObjectURL(pcmToWav(buffer));
        const mp3Url = URL.createObjectURL(pcmToMp3(buffer));
        setState(prev => ({ ...prev, audioUrl: wavUrl, mp3Url, isGeneratingAudio: false }));
        if (currentUser.role === 'GUEST') updateGuestUsage(text.length);
        else if (currentUser.role !== 'ADMIN') {
            const updated = {...currentUser, credits: currentUser.credits - text.length};
            setCurrentUser(updated);
            setAllUsers(prev => prev.map(u => u.uid === updated.uid ? updated : u));
        }
      } catch (e: any) {
        const err = e.message.toLowerCase();
        const isRateLimit = err.includes("429") || err.includes("quota") || err.includes("hạn mức") || err.includes("resource exhausted");
        // Strict check: Chỉ lỗi auth mới tính là Invalid Key
        const isAuthError = err.includes("api key") || err.includes("403") || err.includes("unauthenticated");

        if (isRateLimit || isAuthError || err.includes("server") || err.includes("fetch")) {
             // Chỉ đánh dấu Invalid nếu chắc chắn là lỗi Auth
             if (isAuthError && !isRateLimit && managedKeys.some(k => k.key === key)) {
                setManagedKeys(prev => prev.map(k => k.key === key ? {...k, status: 'INVALID'} : k));
             }
            
            if (retries > 0) {
                 addLog(isRateLimit ? `Key bị giới hạn (429). Đổi Key khác... (${retries})` : `Gặp lỗi (${e.message}). Đổi Key khác... (${retries})`, 'warning');
                 await attempt(retries - 1, [...excluded, key]);
            } else {
                 setState(prev => ({...prev, isGeneratingAudio: false}));
                 showNotification("Thất bại", "Hệ thống đang bận hoặc hết Key. Vui lòng thử lại sau.", "error");
            }
        } else {
            showNotification("Lỗi", e.message, "error");
            setState(prev => ({...prev, isGeneratingAudio: false}));
        }
      }
    };
    await attempt();
  };

  const togglePlay = () => { if (audioRef.current) { playerIsPlaying ? audioRef.current.pause() : audioRef.current.play(); setPlayerIsPlaying(!playerIsPlaying); } };
  const skipTime = (amount: number) => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.duration, audioRef.current.currentTime + amount)); };
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => { if (audioRef.current) { const time = parseFloat(e.target.value); audioRef.current.currentTime = time; setPlayerCurrentTime(time); } };
  const changePlaybackRate = (rate: number) => { 
      if (audioRef.current) { 
          audioRef.current.playbackRate = rate; 
          setPlayerPlaybackRate(rate); 
          setConfig({...config, speed: rate});
          setShowRateMenu(false); 
      } 
  };

  const getGuestUsage = () => {
      const today = new Date().toDateString();
      const usageData = JSON.parse(localStorage.getItem('bm_guest_usage') || '{}');
      return usageData.date === today ? usageData.count : 0;
  };
  const updateGuestUsage = (chars: number) => {
      const today = new Date().toDateString();
      const newUsage = getGuestUsage() + chars;
      localStorage.setItem('bm_guest_usage', JSON.stringify({ date: today, count: newUsage }));
      if (currentUser?.role === 'GUEST') setCurrentUser({...currentUser, credits: Math.max(0, GUEST_DAILY_LIMIT - newUsage)});
  };

  const handleSmartPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setGeneratedText(prev => prev ? prev + '\n' + text.trim() : text.trim());
    } catch (e) {
      showNotification("Lỗi Clipboard", "Hãy dùng Ctrl+V.", "warning");
    }
  };

  /**
   * Trích xuất tiêu đề & nội dung chính từ văn bản thô của file
   * - Bỏ các dòng meta như "GIỌNG NAM", "GIỌNG NỮ", dòng trống đầu
   * - Tiêu đề: dòng đầu tiên ngắn, thường là câu độc lập
   * - Nội dung: phần còn lại, giữ nguyên để đọc sát bản gốc
   */
  const extractTitleAndBodyFromText = (raw: string): string => {
    const lines = raw.split(/\r?\n/).map(l => l.trim());
    const contentLines: string[] = [];

    for (const line of lines) {
      if (!line) continue;
      const upper = line.toUpperCase();
      // Bỏ các dòng khai báo giọng đọc hoặc meta đầu file
      if (upper.startsWith("GIỌNG ") || upper.startsWith("GIONG ") || upper.startsWith("VOICE ")) continue;
      // Bỏ các dòng scan tool
      if (upper.includes("SCANNED WITH") || upper.includes("Camscanner".toUpperCase())) continue;
      contentLines.push(line);
    }

    if (contentLines.length === 0) return raw.trim();

    // TRƯỜNG HỢP VĂN BẢN HÀNH CHÍNH CÓ "THÔNG BÁO"
    const thongBaoIndex = contentLines.findIndex(l => l.toUpperCase().includes("THÔNG BÁO"));
    if (thongBaoIndex !== -1) {
      const titleLine = "THÔNG BÁO";
      const subtitleLine = (contentLines[thongBaoIndex + 1] || "").trim();

      // Phần thân: từ sau subtitle đến trước "Nơi nhận"
      const bodySource = contentLines.slice(thongBaoIndex + 2);
      const bodyLines: string[] = [];
      for (const l of bodySource) {
        const upper = l.toUpperCase();
        if (upper.startsWith("NƠI NHẬN") || upper.startsWith("NOI NHAN")) break;
        if (upper.includes("SCANNED WITH") || upper.includes("CAMSCANNER")) break;
        bodyLines.push(l);
      }

      const cleanTitle = subtitleLine ? `${titleLine}\n${subtitleLine}` : titleLine;
      const body = bodyLines.join("\n").trim();
      if (!body) return cleanTitle;
      return `${cleanTitle}\n\n${body}`;
    }

    // Mặc định: Dòng đầu tiên là tiêu đề, phần còn lại là nội dung
    const title = contentLines[0];
    const body = contentLines.slice(1).join("\n").trim();

    if (!body) return title;
    return `${title}\n\n${body}`;
  };

  // Logic đọc file thông minh
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsReadingFile(true);
    try {
      let text = "";
      const fileType = file.name.split('.').pop()?.toLowerCase();

      if (fileType === 'txt') {
         text = await file.text();
      } else if (fileType === 'pdf') {
         if (window.pdfjsLib) {
           window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
           const arrayBuffer = await file.arrayBuffer();
           const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
           for (let i = 1; i <= pdf.numPages; i++) {
             const page = await pdf.getPage(i);
             const content = await page.getTextContent();
             text += content.items.map((item: any) => item.str).join(' ') + '\n\n';
           }
           // Nếu sau khi đọc mà vẫn không có text, nhiều khả năng PDF là dạng scan/hình ảnh
           if (!text.trim()) {
             const Tesseract = (window as any).Tesseract;
             if (!Tesseract) {
               throw new Error("PDF là file scan/hình ảnh và không chứa lớp văn bản. Vui lòng bật OCR (Tesseract.js) hoặc dùng file .docx/.txt được gõ sẵn.");
             }

             // Fallback: dùng OCR để đọc tối đa 3 trang đầu tiên cho nhẹ
             showNotification("Đang xử lý OCR", "PDF là file scan, hệ thống sẽ nhận dạng chữ từ hình ảnh...", "info");
             let ocrText = "";
             const maxOcrPages = Math.min(pdf.numPages, 3);
             for (let i = 1; i <= maxOcrPages; i++) {
               const page = await pdf.getPage(i);
               const viewport = page.getViewport({ scale: 2 });
               const canvas = document.createElement('canvas');
               const context = canvas.getContext('2d');
               if (!context) continue;
               canvas.width = viewport.width;
               canvas.height = viewport.height;
               await page.render({ canvasContext: context, viewport }).promise;
               const dataUrl = canvas.toDataURL('image/png');
               const result = await Tesseract.recognize(dataUrl, 'vie', {});
               ocrText += (result?.data?.text || "") + "\n\n";
             }

             if (!ocrText.trim()) {
               throw new Error("Không thể nhận dạng chữ từ PDF scan. Vui lòng dùng file .docx hoặc .txt được gõ sẵn.");
             }
             text = ocrText;
           }
         } else {
             throw new Error("Thư viện PDF chưa tải xong. Vui lòng thử lại.");
         }
      } else if (fileType === 'docx') {
         if (window.mammoth) {
            const arrayBuffer = await file.arrayBuffer();
            const result = await window.mammoth.extractRawText({ arrayBuffer });
            text = result.value;
         } else {
            throw new Error("Thư viện Word chưa tải xong. Vui lòng thử lại.");
         }
      } else if (fileType === 'jpg' || fileType === 'jpeg' || fileType === 'png' || fileType === 'webp') {
         // Ảnh chứa văn bản -> dùng OCR (Tesseract.js) nếu có
         const Tesseract = (window as any).Tesseract;
         if (!Tesseract) {
           throw new Error("Ảnh chứa văn bản (JPG/PNG), vui lòng bật OCR (Tesseract.js) để nhận dạng chữ, hoặc chuyển thành file .docx/.txt.");
         }
         showNotification("Đang xử lý OCR", "Hệ thống đang nhận dạng chữ từ ảnh, vui lòng chờ...", "info");
         const dataUrl = await new Promise<string>((resolve, reject) => {
           const reader = new FileReader();
           reader.onload = () => resolve(reader.result as string);
           reader.onerror = () => reject(new Error("Không thể đọc dữ liệu ảnh."));
           reader.readAsDataURL(file);
         });
         const result = await Tesseract.recognize(dataUrl, 'vie', {});
         text = (result?.data?.text || "");
      } else if (fileType === 'doc') {
         // Không thể đọc trực tiếp .doc trong trình duyệt, hướng dẫn người dùng chuyển sang .docx
         throw new Error("File .doc (Word cũ) chưa được hỗ trợ. Vui lòng lưu lại thành .docx rồi tải lên.");
      } else {
          throw new Error("Chỉ hỗ trợ file .txt, .pdf, .docx");
      }

      if (text.trim()) {
         const cleaned = extractTitleAndBodyFromText(text);
         setGeneratedText(prev => prev + (prev ? '\n\n' : '') + cleaned);
         showNotification("Thành công", `Đã trích xuất văn bản từ ${file.name}`, "success");
      } else {
         showNotification("Lỗi", "File trống hoặc không đọc được nội dung text.", "error");
      }
    } catch (err: any) {
      showNotification("Lỗi đọc file", err.message || "Không thể đọc file", "error");
    } finally {
      setIsReadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLogin = () => {
    setLoginError(null);
    const id = loginCreds.id.trim().toLowerCase();
    if (id === ADMIN_ID.toLowerCase() && loginCreds.pass === ADMIN_PASS) {
      const admin: UserProfile = { uid: 'admin-root', displayName: 'Administrator', email: 'admin@baominh.ai', photoURL: 'https://ui-avatars.com/api/?name=Admin', role: 'ADMIN', credits: 999999, lastActive: new Date().toISOString(), isBlocked: false, planType: 'YEARLY', expiryDate: Date.now() + 10 * 365 * 86400000, characterLimit: 999999, loginId: ADMIN_ID, password: ADMIN_PASS };
      setCurrentUser(admin); localStorage.setItem('bm_user_session', JSON.stringify(admin)); setIsAuthModalOpen(false); return;
    }
    const user = allUsers.find(u => u.loginId?.toLowerCase() === id && u.password === loginCreds.pass);
    if (user) {
      if (user.isBlocked) return setLoginError("Tài khoản đã bị khóa.");
      const checked = checkAndResetDailyLimit(user);
      setCurrentUser(checked); localStorage.setItem('bm_user_session', JSON.stringify(checked));
      setIsAuthModalOpen(false);
    } else setLoginError("Sai tài khoản hoặc mật khẩu.");
  };

  const handleUpdateUserPlan = (user: UserProfile) => {
     setAllUsers(prev => prev.map(u => u.uid === user.uid ? user : u));
     setIsEditingUser(null);
     showNotification("Thành công", "Đã cập nhật thông tin.", "success");
  };

  // NGUYÊN TẮC: Tự động kiểm tra Key khi nhập
  const handleAddKey = async () => {
    if (!newKeyData.key) return;
    const cleanKey = newKeyData.key.trim();
    if (managedKeys.some(k => k.key === cleanKey)) return showNotification("Lỗi", "Key đã tồn tại.", "warning");
    
    setIsTestingNewKey(true);
    const test = await testApiKey(cleanKey);
    setIsTestingNewKey(false);
    
    if (!test.valid) {
        showNotification("Key không hoạt động", test.message, "error");
        return;
    }

    const newKey: ManagedKey = { 
        id: `key-${Date.now()}`, 
        name: newKeyData.name || 'API Key ' + (managedKeys.length + 1), 
        key: cleanKey, 
        status: 'VALID', 
        usageCount: 0, 
        isTrialKey: false, 
        allowedUserIds: [] 
    };
    setManagedKeys(prev => [newKey, ...prev]);
    setNewKeyData({ name: '', key: '', assignedUid: '' });
    showNotification("Thành công", "API Key hợp lệ và đã được lưu.", "success");
  };

  // SỬA LỖI: Tạo tài khoản Admin mới với Form Submit
  const handleCreateUser = (e?: React.FormEvent) => {
     if (e) e.preventDefault();
     if (!newUserData.loginId || !newUserData.password) {
         showNotification("Thiếu thông tin", "Vui lòng nhập Tên đăng nhập và Mật khẩu", "warning");
         return;
     }
     const newUser: UserProfile = {
        uid: `u-${Date.now()}`,
        displayName: newUserData.loginId,
        email: '',
        photoURL: `https://ui-avatars.com/api/?name=${newUserData.loginId}&background=random`,
        role: 'USER',
        credits: PLAN_LIMITS[newUserData.plan] || 600,
        characterLimit: PLAN_LIMITS[newUserData.plan] || 600,
        bonusDailyLimit: 0,
        lastActive: new Date().toISOString(),
        isBlocked: false,
        planType: newUserData.plan,
        expiryDate: Date.now() + (newUserData.plan === 'YEARLY' ? 365 : 30) * 86400000,
        loginId: newUserData.loginId,
        password: newUserData.password
     };
     setAllUsers(prev => [newUser, ...prev]);
     setIsAddingUser(false);
     setNewUserData({ loginId: '', password: '', name: '', email: '', plan: 'TRIAL' });
     showNotification("Thành công", `Đã tạo tài khoản ${newUser.loginId}`, "success");
  };

  // Lưu giọng Clone (Thêm mới hoặc Cập nhật)
  const handleSaveVoice = () => {
    if (!editingVoice || !editingVoice.name) return;
    
    const voiceToSave: ClonedVoice = {
        id: editingVoice.id || `clone-${Date.now()}`,
        name: editingVoice.name,
        gender: editingVoice.gender || 'Nữ',
        region: editingVoice.region || 'Bắc',
        description: editingVoice.description || 'Chỉnh sửa thủ công',
        toneSummary: editingVoice.toneSummary || 'Tùy chỉnh',
        createdAt: editingVoice.createdAt || Date.now()
    };

    if (editingVoice.id) {
        // Cập nhật
        setClonedVoices(prev => prev.map(v => v.id === voiceToSave.id ? voiceToSave : v));
        showNotification("Thành công", "Đã cập nhật thông tin giọng đọc.", "success");
    } else {
        // Thêm mới
        setClonedVoices(prev => [voiceToSave, ...prev]);
        showNotification("Thành công", "Đã lưu giọng đọc mới.", "success");
    }
    setEditingVoice(null);
  };

  const handleGenerateAdContent = async () => {
    if (!adDescription.trim()) return;
    setIsGeneratingAd(true);
    
    const attempt = async (retries = 3, excluded: string[] = []) => {
        const key = selectBestKey(excluded);
        if (!key) {
           showNotification("Hết Key", "Vui lòng thêm API Key mới.", "error");
           setIsGeneratingAd(false);
           return;
        }
        try {
           const result = await generateMarketingContent(null, adDescription, addLog, key);
           setEditingAd(prev => ({ ...prev, title: result.title, content: result.content }));
           showNotification("AI Hoàn tất", "Đã tạo tiêu đề và khẩu hiệu kêu gọi.", "success");
           setIsGeneratingAd(false);
        } catch (e: any) {
           const err = e.message.toLowerCase();
           const isRateLimit = err.includes("429") || err.includes("quota") || err.includes("hạn mức");
           // Only mark as invalid if explicitly auth error
           const isAuthError = err.includes("api key") || err.includes("403") || err.includes("unauthenticated");

           if (isRateLimit || isAuthError || err.includes("server") || err.includes("fetch")) {
                if (isAuthError && !isRateLimit && managedKeys.some(k => k.key === key)) {
                    setManagedKeys(prev => prev.map(k => k.key === key ? {...k, status: 'INVALID'} : k));
                }
                if (retries > 0) {
                    addLog(`Gặp lỗi (${e.message}). Đổi Key khác... (${retries})`, 'warning');
                    await attempt(retries - 1, [...excluded, key]);
                } else {
                    showNotification("Thất bại", "Không thể tạo nội dung lúc này. Vui lòng thử lại sau.", "error");
                    setIsGeneratingAd(false);
                }
           } else {
                showNotification("Lỗi AI", e.message, "error");
                setIsGeneratingAd(false);
           }
        }
    };
    await attempt();
  };

  const handleGenerateAdImageAI = async () => {
    if (!imageDescription.trim()) return;
    setIsGeneratingAdImage(true);
    
    const attempt = async (retries = 3, excluded: string[] = [], isRateLimitRetry = false, isOverloadRetry = false) => {
        const key = selectBestKey(excluded);
        if (!key) {
            showNotification("Hết Key", "Vui lòng thêm API Key mới.", "error");
            setIsGeneratingAdImage(false);
            return;
        }
        
        // Exponential backoff: delay tăng dần theo số lần retry
        if (isRateLimitRetry || isOverloadRetry) {
            // Với overload: delay lớn hơn (3s, 6s, 12s)
            // Với rate limit: delay nhỏ hơn (2s, 4s, 8s)
            const baseDelay = isOverloadRetry ? 3000 : 2000;
            const delayMs = baseDelay * Math.pow(2, 3 - retries); // Exponential backoff
            addLog(`Đợi ${delayMs / 1000}s trước khi thử lại${isOverloadRetry ? ' (Server quá tải)' : ' (Rate limit)'}...`, 'info');
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        
        try {
            const imageUrl = await generateAdImage(imageDescription, addLog, key);
            setAdImagePreview(imageUrl);
            showNotification("AI Hoàn tất", "Đã vẽ ảnh nền quảng cáo.", "success");
            setIsGeneratingAdImage(false);
        } catch (e: any) {
            const err = e.message.toLowerCase();
            // Phát hiện rate limit và quota exhausted
            const isRateLimit = err.includes("429") || 
                               err.includes("quota") || 
                               err.includes("hạn mức") || 
                               err.includes("resource exhausted") ||
                               err.includes("quota exhausted") ||
                               err.includes("rate limit");
            
            // Phát hiện overload
            const isOverload = err.includes("503") ||
                              err.includes("overload") ||
                              err.includes("over capacity") ||
                              err.includes("server quá tải") ||
                              err.includes("service unavailable");
            
            // Strict check: Only auth errors invalidate key
            const isAuthError = err.includes("api key") || 
                               err.includes("403") || 
                               err.includes("unauthenticated") || 
                               err.includes("401");

            // Handle errors that justify retrying with another key
            if (isRateLimit || isOverload || isAuthError || err.includes("not found") || err.includes("500")) {
                // Only invalidate key in DB if strictly an Auth Error and NOT a rate limit/overload
                if (isAuthError && !isRateLimit && !isOverload && managedKeys.some(k => k.key === key)) {
                    setManagedKeys(prev => prev.map(k => k.key === key ? {...k, status: 'INVALID'} : k));
                }
                
                // Với rate limit/overload: không loại key ngay, có thể thử lại sau
                // Với auth error: loại key khỏi pool
                const shouldExcludeKey = isAuthError || (!isRateLimit && !isOverload);
                
                if (retries > 0) {
                    if (isRateLimit || isOverload) {
                        addLog(`Gặp lỗi (${e.message}). Đổi Key khác... (${retries})`, 'warning');
                        // Với rate limit/overload, thử key khác nhưng không loại key hiện tại (có thể dùng lại sau)
                        await attempt(retries - 1, shouldExcludeKey ? [...excluded, key] : excluded, isRateLimit, isOverload);
                    } else {
                        addLog(`Gặp lỗi (${e.message}). Đổi Key khác... (${retries})`, 'warning');
                        await attempt(retries - 1, shouldExcludeKey ? [...excluded, key] : excluded, false, false);
                    }
                } else {
                    const errorMsg = isOverload 
                        ? "Server đang quá tải. Vui lòng thử lại sau vài phút."
                        : isRateLimit
                        ? "Đã hết quota/rate limit. Vui lòng thử lại sau hoặc thêm API Key mới."
                        : "Không thể tạo ảnh lúc này. Vui lòng thử lại sau.";
                    showNotification("Thất bại", errorMsg, "error");
                    setIsGeneratingAdImage(false);
                }
            } else {
                showNotification("Lỗi AI", e.message, "error");
                setIsGeneratingAdImage(false);
            }
        }
    };
    await attempt();
  };

  const saveAdCampaign = () => {
    const campaign: AdCampaign = { ...editingAd, id: editingAd.id === 'new' ? `ad-${Date.now()}` : editingAd.id, createdAt: editingAd.id === 'new' ? Date.now() : editingAd.createdAt, imageUrl: adImagePreview || undefined };
    if (editingAd.id === 'new') setAdCampaigns([...adCampaigns, campaign]);
    else setAdCampaigns(adCampaigns.map(ad => ad.id === campaign.id ? campaign : ad));
    setEditingAd({ id: 'new', isActive: true, title: '', content: '', buttonText: 'Liên hệ ngay', buttonLink: ZALO_LINK, createdAt: 0, startDate: '', endDate: '' });
    setAdImagePreview(null);
    setAdDescription('');
    setImageDescription('');
    showNotification("Thành công", "Đã lưu chiến dịch quảng cáo.", "success");
  };

  const shareAd = (ad: AdCampaign, platform: 'facebook' | 'twitter' | 'copy') => {
    const adUrl = `${WEB_APP_URL}/ad/${ad.id}`;
    const text = encodeURIComponent(`${ad.title}\n\n${ad.content}`);
    
    if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(adUrl)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(adUrl)}&text=${text}`, '_blank');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(adUrl);
      showNotification("Đã sao chép", "Link chia sẻ quảng cáo đã được lưu vào bộ nhớ tạm.", "success");
    }
    addLog(`Đã chia sẻ quảng cáo ${ad.title} qua ${platform}`, "info");
  };

  const downloadLogs = () => {
    const content = logs.map(l => `[${new Date(l.timestamp).toLocaleString()}] [${l.type.toUpperCase()}] ${l.message}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `logs-${Date.now()}.txt`; a.click();
  };

  // Logic xử lý Clone Voice tối ưu
  const handleCloneVoice = async () => {
     if (!cloneFile) return showNotification("Chưa chọn file", "Vui lòng upload file ghi âm.", "warning");
     if (!currentUser) return setIsAuthModalOpen(true);
     
     setIsAnalyzingVoice(true);
     
     const attempt = async (retries = 3, excluded: string[] = []) => {
        const key = selectBestKey(excluded);
        if (!key) {
            showNotification("Hết Key", "Vui lòng thêm API Key mới.", "error");
            setIsAnalyzingVoice(false);
            return;
        }

        try {
            const arrayBuffer = await cloneFile.arrayBuffer();
            const analysis = await analyzeVoice(arrayBuffer, addLog, key);
            
            const newVoice: ClonedVoice = {
                id: `clone-${Date.now()}`,
                name: analysis.suggestedName || `Giọng Clone ${clonedVoices.length + 1}`,
                gender: analysis.gender || 'Nữ',
                region: analysis.region || 'Bắc',
                description: analysis.description || "Được phân tích bởi AI",
                toneSummary: analysis.toneSummary || "Tự nhiên, rõ ràng",
                createdAt: Date.now(),
            };

            setClonedVoices(prev => [newVoice, ...prev]);
            setCloneFile(null);
            showNotification("Thành công", `Đã tạo giọng: ${newVoice.name}.`, "success");
            
            // Tự động chọn giọng vừa Clone để dùng ngay
            setConfig(prev => ({
                ...prev,
                useClonedVoice: true,
                activeClonedVoiceId: newVoice.id,
                voiceName: newVoice.gender === 'Nam' ? 'Fenrir' : 'Kore'
            }));
            
            setIsAnalyzingVoice(false);
        } catch (e: any) {
            const err = e.message.toLowerCase();
            const isRateLimit = err.includes("429") || err.includes("quota") || err.includes("hạn mức");
            // Strict check
            const isAuthError = err.includes("api key") || err.includes("403") || err.includes("unauthenticated");

            if (isRateLimit || isAuthError || err.includes("server")) {
                if (isAuthError && !isRateLimit && managedKeys.some(k => k.key === key)) {
                    setManagedKeys(prev => prev.map(k => k.key === key ? {...k, status: 'INVALID'} : k));
                }
                if (retries > 0) {
                    addLog(`Key lỗi/hết hạn. Thử lại (${retries})...`, 'warning');
                    await attempt(retries - 1, [...excluded, key]);
                } else {
                    showNotification("Thất bại", "Hết lượt thử lại. Vui lòng kiểm tra Key.", "error");
                    setIsAnalyzingVoice(false);
                }
            } else {
                showNotification("Lỗi Clone", e.message, "error");
                setIsAnalyzingVoice(false);
            }
        }
     };
     await attempt();
  };

  const activePreset = useMemo(() => PRESET_VOICES.find(p => p.id === config.activePresetId), [config.activePresetId]);
  const activeClone = useMemo(() => clonedVoices.find(v => v.id === config.activeClonedVoiceId), [config.activeClonedVoiceId, clonedVoices]);

  const filteredUsers = useMemo(() => allUsers.filter(u => u.displayName.toLowerCase().includes(userSearchTerm.toLowerCase())), [allUsers, userSearchTerm]);
  const paginatedUsers = filteredUsers.slice((userCurrentPage - 1) * usersPerPage, userCurrentPage * usersPerPage);
  
  // LOGIC FILTER API KEY MỚI
  const filteredKeys = useMemo(() => {
    let result = managedKeys.filter(k => 
      k.name.toLowerCase().includes(keySearchTerm.toLowerCase()) || 
      k.key.includes(keySearchTerm)
    );

    if (keyFilterStatus !== 'ALL') {
      result = result.filter(k => k.status === keyFilterStatus);
    }

    return result.sort((a, b) => {
      // Giả sử ID có dạng key-timestamp, dùng timestamp để sort
      const timeA = parseInt(a.id.split('-')[1] || '0');
      const timeB = parseInt(b.id.split('-')[1] || '0');
      return keySort === 'NEWEST' ? timeB - timeA : timeA - timeB;
    });
  }, [managedKeys, keySearchTerm, keyFilterStatus, keySort]);

  // NGUYÊN TẮC: Cơ chế Tự phục hồi & Cảnh báo
  const handleExportSystemData = () => {
      const data = {
          allUsers, managedKeys, adCampaigns, clonedVoices, systemConfig: { useEnvKeyOnly }, exportedAt: Date.now()
      };
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `baominh-system-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      showNotification("Thành công", "Đã xuất dữ liệu sao lưu hệ thống.", "success");
  };

  const handleImportSystemData = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const data = JSON.parse(event.target?.result as string);
              if (data.allUsers) setAllUsers(data.allUsers);
              if (data.managedKeys) setManagedKeys(data.managedKeys);
              if (data.adCampaigns) setAdCampaigns(data.adCampaigns);
              if (data.clonedVoices) setClonedVoices(data.clonedVoices);
              if (data.systemConfig) setUseEnvKeyOnly(data.systemConfig.useEnvKeyOnly);
              showNotification("Khôi phục thành công", "Hệ thống đã được tự động phục hồi về trạng thái sao lưu.", "success");
          } catch (err) {
              showNotification("Lỗi khôi phục", "File sao lưu không hợp lệ.", "error");
          }
      };
      reader.readAsText(file);
  };

  if (publicAd) return <PublicAdView ad={publicAd} />;
  if (isLoadingPublicAd) return <div className="h-screen bg-[#0f172a] flex items-center justify-center"><Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /></div>;

  return (
    <div className="h-screen flex flex-col bg-[#F8FAFC] overflow-hidden font-sans relative">
      <header className="h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm z-[60] shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => setShowSidebar(true)} className="md:hidden p-2 hover:bg-slate-50 rounded-xl"><Menu className="w-5 h-5"/></button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Sparkles className="w-6 h-6"/></div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black italic bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent leading-none">BaoMinh AI</h1>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">Studio Pro v2.9</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {currentUser ? (
            <div className="relative">
              <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-3 p-1.5 pr-4 bg-slate-50 border rounded-full hover:shadow-md transition-all">
                <img src={currentUser.photoURL} className="w-8 h-8 rounded-full border shadow-sm"/>
                <div className="text-left hidden sm:block">
                  <p className="text-[11px] font-black text-slate-800 uppercase leading-none">{currentUser.displayName}</p>
                  <p className="text-[10px] font-bold text-indigo-600 mt-0.5">{currentUser.credits.toLocaleString()} KT</p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400"/>
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border p-2 z-[70] animate-in fade-in">
                  <div className="p-3 bg-slate-50 rounded-xl mb-1 flex items-center justify-between"><span className="text-[10px] font-black text-slate-500 uppercase">Gói: {currentUser.planType}</span><Zap className="w-3 h-3 text-amber-500"/></div>
                  {currentUser.role === 'ADMIN' && <button onClick={() => { setActiveMode(ReadingMode.ADMIN_PANEL); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold text-slate-600 hover:bg-indigo-50 rounded-xl"><LayoutDashboard className="w-4 h-4"/> Admin Panel</button>}
                  <button onClick={() => { setCurrentUser(null); localStorage.removeItem('bm_user_session'); setIsAuthModalOpen(true); }} className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold text-red-500 hover:bg-red-50 rounded-xl mt-1"><LogOut className="w-4 h-4"/> Đăng xuất</button>
                </div>
              )}
            </div>
          ) : <button onClick={() => setIsAuthModalOpen(true)} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[11px] font-black uppercase shadow-lg">Đăng nhập</button>}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <aside className={`fixed inset-y-0 left-0 w-72 bg-white border-r z-50 transition-all transform ${showSidebar ? 'translate-x-0' : '-translate-x-full'} md:static md:translate-x-0 flex flex-col p-4`}>
          <div className="flex-1 space-y-1.5 overflow-y-auto scrollbar-hide">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 py-2">Chế độ đọc</div>
            {READING_MODES.map(mode => (
              <button key={mode.id} onClick={() => { setActiveMode(mode.id); setShowSidebar(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[11px] font-bold transition-all ${activeMode === mode.id && activeMode !== ReadingMode.ADMIN_PANEL ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                {mode.icon} {mode.label}
              </button>
            ))}
          </div>
          {currentUser?.role === 'ADMIN' && (
            <div className="pt-4 border-t mt-4">
              <button onClick={() => { setActiveMode(ReadingMode.ADMIN_PANEL); setShowSidebar(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[11px] font-bold transition-all ${activeMode === ReadingMode.ADMIN_PANEL ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-50'}`}>
                <ShieldCheck className="w-5 h-5 text-amber-500"/> System Admin
              </button>
            </div>
          )}
        </aside>

        <main className="flex-1 flex flex-col h-full bg-[#F5F7FA] overflow-hidden">
          {activeMode === ReadingMode.ADMIN_PANEL && currentUser?.role === 'ADMIN' ? (
            <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white rounded-2xl shadow-xl flex items-center justify-center border-b-4 border-indigo-600">
                    <Database className="w-7 h-7 text-indigo-600"/>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-800">Admin Dashboard</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quản lý Hệ thống & Quảng cáo</p>
                  </div>
                </div>
                <div className="flex bg-white p-1 rounded-2xl shadow-sm border overflow-x-auto scrollbar-hide">
                  {(['USERS', 'KEYS', 'ADS', 'SYSTEM', 'LOGS'] as const).map(tab => (
                    <button key={tab} onClick={() => setIsAdminTab(tab)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${isAdminTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
                      {tab === 'ADS' ? 'QUẢNG CÁO' : tab === 'SYSTEM' ? 'HỆ THỐNG' : tab === 'USERS' ? 'THÀNH VIÊN' : tab}
                    </button>
                  ))}
                </div>
              </div>

              {isAdminTab === 'USERS' && (
                <div className="bg-white rounded-[2.5rem] border shadow-xl overflow-hidden animate-in slide-in-from-bottom-4">
                  <div className="p-8 border-b flex flex-wrap gap-6 justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-6"><h3 className="text-lg font-black text-slate-800 uppercase flex items-center gap-3 shrink-0"><Users className="w-5 h-5 text-indigo-600"/> Thành viên ({allUsers.length})</h3><div className="relative w-72"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/><input value={userSearchTerm} onChange={e => { setUserSearchTerm(e.target.value); setUserCurrentPage(1); }} placeholder="Tìm tên..." className="w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-xs font-bold outline-none focus:border-indigo-500 shadow-sm" /></div></div>
                    <button onClick={() => setIsAddingUser(true)} className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase shadow-lg hover:scale-105 transition-all"><UserPlus className="w-5 h-5"/> Cấp tài khoản</button>
                  </div>
                  <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left">
                      <thead className="bg-white text-[10px] font-black uppercase text-slate-400 border-b"><tr><th className="px-10 py-6">Người dùng</th><th className="px-10 py-6">Gói / Hạn mức</th><th className="px-10 py-6 text-right">Thao tác</th></tr></thead>
                      <tbody className="divide-y">{paginatedUsers.map(u => (<tr key={u.uid} className={`hover:bg-slate-50/30 transition-all ${u.isBlocked ? 'bg-red-50/50' : ''}`}><td className="px-10 py-6"><div className="flex items-center gap-4"><img src={u.photoURL} className="w-10 h-10 rounded-xl"/><div className="text-left"><p className="text-sm font-black text-slate-800">{u.displayName}</p><p className="text-[10px] font-mono text-slate-400">{u.loginId}</p></div></div></td><td className="px-10 py-6"><div className="flex flex-col gap-1"><span className="text-[11px] font-black text-indigo-600 uppercase">{u.planType}</span><span className="text-[10px] font-bold text-slate-500">{u.credits.toLocaleString()} KT còn lại</span></div></td><td className="px-10 py-6 text-right"><div className="flex justify-end gap-2"><button onClick={() => setIsEditingUser(u)} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Gia hạn / Sửa hạn mức"><Edit3 className="w-5 h-5"/></button><button onClick={() => { if (window.confirm(`Bạn có chắc chắn muốn xóa thành viên ${u.displayName}?`)) { setAllUsers(allUsers.filter(x => x.uid !== u.uid)); showNotification("Đã xóa", `Đã xóa thành viên ${u.displayName}`, "success"); } }} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-5 h-5"/></button></div></td></tr>))}</tbody>
                    </table>
                  </div>
                </div>
              )}

              {isAdminTab === 'KEYS' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4">
                  {/* System Configuration Toggle */}
                  <div className="bg-slate-900 rounded-[2rem] p-6 shadow-xl border border-slate-800 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-indigo-400"><Server className="w-6 h-6"/></div>
                        <div>
                           <h4 className="text-white font-black uppercase text-sm">Nguồn API Key</h4>
                           <p className="text-slate-400 text-xs">Cấu hình ưu tiên sử dụng Key từ Database hay Biến môi trường.</p>
                        </div>
                     </div>
                     <button onClick={() => setUseEnvKeyOnly(!useEnvKeyOnly)} className={`flex items-center gap-3 px-6 py-3 rounded-xl text-xs font-black uppercase transition-all border ${useEnvKeyOnly ? 'bg-amber-500 border-amber-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                        {useEnvKeyOnly ? <ToggleRight className="w-6 h-6"/> : <ToggleLeft className="w-6 h-6"/>}
                        {useEnvKeyOnly ? 'Chỉ dùng Env Key' : 'Ưu tiên Database (Auto Rotation)'}
                     </button>
                  </div>

                  <div className="bg-white rounded-[2.5rem] border p-8 shadow-xl space-y-6">
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                        <h3 className="text-lg font-black uppercase text-slate-800 flex items-center gap-2"><Key className="w-5 h-5 text-indigo-600"/> Quản lý API Keys ({filteredKeys.length})</h3>
                        <div className="flex gap-3">
                           <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border">
                              <Filter className="w-4 h-4 text-slate-400"/>
                              <select value={keyFilterStatus} onChange={e => setKeyFilterStatus(e.target.value as any)} className="bg-transparent text-[11px] font-bold uppercase text-slate-600 outline-none">
                                <option value="ALL">Tất cả</option>
                                <option value="VALID">Hoạt động (Valid)</option>
                                <option value="INVALID">Lỗi (Invalid)</option>
                                <option value="UNTESTED">Chưa test</option>
                              </select>
                           </div>
                        </div>
                    </div>
                    <div className="flex gap-6 items-end">
                      <div className="flex-1 space-y-2"><p className="text-[10px] font-black text-slate-400 uppercase">Tên gợi nhớ</p><input value={newKeyData.name} onChange={e => setNewKeyData({...newKeyData, name: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold text-sm" placeholder="Key Google 1"/></div>
                      <div className="flex-[2] space-y-2"><p className="text-[10px] font-black text-slate-400 uppercase">Gemini API Key</p><input value={newKeyData.key} onChange={e => setNewKeyData({...newKeyData, key: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold text-sm" placeholder="AIza..."/></div>
                      <button onClick={handleAddKey} disabled={isTestingNewKey} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase shadow-lg flex items-center gap-2 disabled:opacity-50">
                        {isTestingNewKey ? <Loader2 className="w-5 h-5 animate-spin"/> : <Plus className="w-5 h-5"/>} Thêm & Kiểm tra
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredKeys.map(k => (
                      <div key={k.id} className={`bg-white p-6 rounded-[2rem] border shadow-lg group ${useEnvKeyOnly ? 'opacity-50 grayscale' : ''}`}>
                        <div className="flex justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${k.status === 'VALID' ? 'bg-emerald-50 text-emerald-600' : k.status === 'INVALID' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-400'}`}><Key className="w-5 h-5"/></div>
                            <div><p className="text-sm font-black text-slate-800">{k.name}</p><p className="text-[8px] font-black uppercase text-slate-400">{k.status}</p></div>
                          </div>
                          <button onClick={() => setManagedKeys(managedKeys.filter(x => x.id !== k.id))} className="text-slate-300 hover:text-red-500 p-2"><Trash2 className="w-4 h-4"/></button>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl font-mono text-[10px] text-slate-500 break-all mb-4 border">***{String(k.key).slice(-12)}</div>
                      </div>
                    ))}
                    {filteredKeys.length === 0 && <div className="col-span-full py-10 text-center text-slate-400 text-xs font-bold uppercase border-2 border-dashed rounded-[2rem]">Không tìm thấy API Key nào phù hợp</div>}
                  </div>
                </div>
              )}

              {isAdminTab === 'SYSTEM' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4">
                    <div className="bg-white rounded-[2.5rem] border p-10 shadow-xl space-y-8">
                        <div className="flex items-center gap-4 border-b pb-6">
                            <div className="w-16 h-16 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl"><ShieldCheck className="w-8 h-8"/></div>
                            <div><h3 className="text-2xl font-black text-slate-800">Cấu hình Hệ thống & Phục hồi</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đảm bảo an toàn dữ liệu và tính toàn vẹn</p></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <h4 className="text-sm font-black uppercase text-slate-800 flex items-center gap-2"><LifeBuoy className="w-5 h-5 text-indigo-600"/> Tình trạng hệ thống</h4>
                                <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-[2rem] space-y-3">
                                    <div className="flex items-center justify-between text-emerald-600 text-xs font-black uppercase"><span>Neon Database</span> <div className="flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div> Kết nối tốt</div></div>
                                    <div className="flex items-center justify-between text-emerald-600 text-xs font-black uppercase"><span>Gemini API Node</span> <div className="flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div> Hoạt động</div></div>
                                    <div className="flex items-center justify-between text-emerald-600 text-xs font-black uppercase"><span>Data Integrity</span> <div className="flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div> Ổn định</div></div>
                                </div>
                                <button onClick={() => window.location.reload()} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl text-[11px] font-black uppercase flex items-center justify-center gap-3 hover:bg-indigo-600 hover:text-white transition-all"><RefreshCcw className="w-4 h-4"/> Làm mới toàn bộ session</button>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-black uppercase text-slate-800 flex items-center gap-2"><Database className="w-5 h-5 text-indigo-600"/> Sao lưu & Khôi phục</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={handleExportSystemData} className="flex flex-col items-center justify-center gap-3 p-8 bg-white border-2 border-indigo-100 hover:bg-indigo-50 rounded-[2rem] transition-all group">
                                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><HardDriveDownload className="w-6 h-6"/></div>
                                        <span className="text-[10px] font-black uppercase text-slate-600">Xuất Backup</span>
                                    </button>
                                    <label className="flex flex-col items-center justify-center gap-3 p-8 bg-white border-2 border-amber-100 hover:bg-amber-50 rounded-[2rem] transition-all group cursor-pointer">
                                        <input type="file" accept=".json" onChange={handleImportSystemData} className="hidden"/>
                                        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><HardDriveUpload className="w-6 h-6"/></div>
                                        <span className="text-[10px] font-black uppercase text-slate-600">Nhập Backup</span>
                                    </label>
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium italic text-center">* Dữ liệu bao gồm: Thành viên, API Keys, Giọng Clone, Quảng cáo và Cấu hình hệ thống.</p>
                            </div>
                        </div>
                    </div>
                </div>
              )}

              {isAdminTab === 'ADS' && (
                <div className="flex flex-col xl:flex-row gap-8 animate-in slide-in-from-bottom-4">
                  {/* Sidebar Danh sách Ads */}
                  <div className="xl:w-1/4 space-y-6">
                    <div className="flex items-center justify-between"><h3 className="text-lg font-black uppercase text-slate-800 flex items-center gap-3"><Megaphone className="w-5 h-5 text-indigo-600"/> Chiến dịch</h3><button onClick={() => { setEditingAd({ id: 'new', isActive: true, title: '', content: '', buttonText: 'Liên hệ ngay', buttonLink: ZALO_LINK, createdAt: 0, startDate: '', endDate: '' }); setAdImagePreview(null); }} className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg"><Plus className="w-5 h-5"/></button></div>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-hide">
                      {adCampaigns.map(ad => (
                        <div key={ad.id} onClick={() => { setEditingAd(ad); setAdImagePreview(ad.imageUrl || null); }} className={`p-6 rounded-[2rem] border cursor-pointer transition-all ${editingAd.id === ad.id ? 'bg-indigo-600 text-white shadow-xl scale-[1.02]' : 'bg-white hover:bg-slate-50'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-black uppercase text-sm truncate pr-2">{ad.title || "Chưa đặt tên"}</h4>
                            <div className="flex gap-1">
                               <button onClick={(e) => { e.stopPropagation(); shareAd(ad, 'copy'); }} className={`p-1.5 rounded-lg ${editingAd.id === ad.id ? 'bg-white/20' : 'bg-slate-100'} hover:scale-110 transition-transform`} title="Copy Link"><Copy className="w-3.5 h-3.5"/></button>
                               <button onClick={(e) => { e.stopPropagation(); setAdCampaigns(prev => prev.filter(a => a.id !== ad.id)); }} className={`p-1.5 rounded-lg ${editingAd.id === ad.id ? 'bg-white/20' : 'bg-red-50 text-red-400'}`}><Trash2 className="w-3.5 h-3.5"/></button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mb-1"><span className={`w-2 h-2 rounded-full ${ad.isActive ? 'bg-emerald-400' : 'bg-slate-300'}`}></span><span className={`text-[10px] font-bold uppercase ${editingAd.id === ad.id ? 'text-white/70' : 'text-slate-400'}`}>{ad.isActive ? 'Đang chạy' : 'Tạm dừng'}</span></div>
                        </div>
                      ))}
                      {adCampaigns.length === 0 && <div className="p-10 text-center border-2 border-dashed rounded-[2rem] text-slate-400 text-xs font-bold uppercase">Chưa có quảng cáo nào</div>}
                    </div>
                  </div>

                  {/* Editor chính */}
                  <div className="xl:w-2/4 space-y-6">
                    <div className="bg-white rounded-[2.5rem] border shadow-xl p-8 space-y-6">
                      <div className="flex justify-between items-center"><h3 className="text-lg font-black uppercase text-slate-800">Trình soạn thảo Ads AI</h3><div className="flex gap-2"><button onClick={() => setEditingAd({...editingAd, isActive: !editingAd.isActive})} className={`px-5 py-2 rounded-xl font-black text-[10px] uppercase transition-all ${editingAd.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{editingAd.isActive ? 'Active' : 'Inactive'}</button><button onClick={saveAdCampaign} className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-[11px] font-black uppercase shadow-lg">Lưu ngay</button></div></div>
                      
                      <div className="space-y-5">
                        <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
                           <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase"><Sparkles className="w-3 h-3"/> Viết nội dung AI</div>
                           <div className="flex gap-2"><textarea value={adDescription} onChange={e => setAdDescription(e.target.value)} className="flex-1 p-3 bg-white border rounded-xl text-xs resize-none h-16 outline-none" placeholder="Mô tả sản phẩm/dịch vụ..."/><button onClick={handleGenerateAdContent} disabled={isGeneratingAd || !adDescription.trim()} className="w-24 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase flex flex-col items-center justify-center gap-1 disabled:opacity-50">{isGeneratingAd ? <Loader2 className="w-4 h-4 animate-spin"/> : <Wand2 className="w-4 h-4"/>} <span>Viết AI</span></button></div>
                        </div>

                        <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-3">
                           <div className="flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase"><Palette className="w-3 h-3"/> Vẽ ảnh nền AI</div>
                           <div className="flex gap-2"><input value={imageDescription} onChange={e => setImageDescription(e.target.value)} className="flex-1 p-3 bg-white border rounded-xl text-xs outline-none" placeholder="Mô tả hình ảnh..."/><button onClick={handleGenerateAdImageAI} disabled={isGeneratingAdImage || !imageDescription.trim()} className="w-24 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase flex flex-col items-center justify-center gap-1 disabled:opacity-50">{isGeneratingAdImage ? <Loader2 className="w-4 h-4 animate-spin"/> : <ImageIcon className="w-4 h-4"/>} <span>Vẽ AI</span></button></div>
                        </div>

                        <div className="space-y-4">
                           <input value={editingAd.title} onChange={e => setEditingAd({...editingAd, title: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold text-sm outline-none" placeholder="Tiêu đề chính"/>
                           <textarea value={editingAd.content} onChange={e => setEditingAd({...editingAd, content: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl font-medium text-sm outline-none h-24" placeholder="Nội dung chi tiết..."/>
                           <div className="grid grid-cols-2 gap-4">
                              <input value={editingAd.buttonText} onChange={e => setEditingAd({...editingAd, buttonText: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-xs" placeholder="Text nút"/>
                              <input value={editingAd.buttonLink} onChange={e => setEditingAd({...editingAd, buttonLink: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-xs" placeholder="Link (URL)"/>
                           </div>
                        </div>
                        
                        {/* Share Actions Area */}
                        {editingAd.id !== 'new' && (
                          <div className="pt-6 border-t space-y-3">
                             <p className="text-[10px] font-black uppercase text-slate-400 text-center tracking-widest">Chia sẻ chiến dịch đã chọn</p>
                             <div className="flex gap-3">
                                <button onClick={() => shareAd(editingAd, 'facebook')} className="flex-1 py-3 bg-[#1877F2] text-white rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/20"><Facebook className="w-4 h-4" /> Facebook</button>
                                <button onClick={() => shareAd(editingAd, 'twitter')} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-slate-500/20"><Twitter className="w-4 h-4" /> Twitter (X)</button>
                                <button onClick={() => shareAd(editingAd, 'copy')} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"><Copy className="w-4 h-4" /> Link Web</button>
                             </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Preview trực quan */}
                  <div className="xl:w-1/4 flex flex-col items-center">
                    <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-4">Xem trước hiển thị</p>
                    <div className="w-[300px] h-[550px] bg-slate-900 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl relative overflow-hidden flex flex-col justify-center p-6">
                       <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10"></div>
                       {adImagePreview ? <img src={adImagePreview} className="absolute inset-0 w-full h-full object-cover" alt="Preview"/> : <div className="absolute inset-0 bg-slate-800 flex items-center justify-center"><Megaphone className="w-12 h-12 text-slate-700"/></div>}
                       
                       <div className="relative z-20 mt-auto pb-10 space-y-4">
                          <span className="px-3 py-1 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-lg shadow-lg">Quảng cáo</span>
                          <h4 className="text-2xl font-black text-white uppercase leading-none drop-shadow-lg">{editingAd.title || "Tiêu đề mẫu"}</h4>
                          <p className="text-sm text-slate-200 font-medium leading-relaxed drop-shadow-md line-clamp-4">{editingAd.content || "Nội dung quảng cáo..."}</p>
                          <button className="w-full py-4 bg-white text-slate-900 rounded-2xl text-[11px] font-black uppercase shadow-xl flex items-center justify-center gap-2">
                             {editingAd.buttonText || "Liên hệ ngay"} <ArrowRight className="w-4 h-4"/>
                          </button>
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {isAdminTab === 'LOGS' && (
                <div className="bg-white rounded-[2rem] border shadow-xl overflow-hidden"><div className="p-6 border-b flex justify-between items-center bg-slate-900 text-white"><div className="flex items-center gap-3"><Terminal className="w-5 h-5 text-indigo-400"/> <span className="text-xs font-black uppercase">Nhật ký hệ thống</span></div><button onClick={downloadLogs} className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-xl text-[10px] font-black uppercase hover:bg-slate-700 transition-all"><FileDown className="w-4 h-4"/> Tải về</button></div><div className="p-6 h-[500px] overflow-y-auto font-mono text-[11px] space-y-2 scrollbar-hide bg-slate-50">{logs.slice().reverse().map((log, i) => (<div key={i} className={`p-3 rounded-xl border flex gap-4 ${log.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-white border-slate-100 text-slate-600'}`}><span className="text-slate-400 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span><span className="font-bold uppercase w-12 shrink-0">{log.type}</span><span className="flex-1">{log.message}</span></div>))}</div></div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full animate-in fade-in">
              <div className="shrink-0 bg-white border-b px-6 py-3.5 flex items-center justify-between shadow-sm z-30">
                <button onClick={() => setShowVoicePanel(true)} className="flex items-center gap-4 px-4 py-2.5 bg-slate-50 rounded-2xl hover:bg-indigo-50 transition-all border">
                  <div className="w-10 h-10 bg-white border rounded-xl flex items-center justify-center text-indigo-600"><Mic2 className="w-5 h-5"/></div>
                  <div className="text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Giọng đang chọn</p>
                    <p className="text-sm font-black text-slate-800">{config.useClonedVoice ? (activeClone?.name || 'Giọng Clone') : (activePreset?.label || 'Mặc định')}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-300 ml-2"/>
                </button>
                <div className="flex items-center gap-3">
                  <button onClick={() => setShowAdvancedSettings(!showAdvancedSettings)} className={`p-3 rounded-2xl transition-all ${showAdvancedSettings ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}><Settings2 className="w-6 h-6"/></button>
                  <button onClick={handleCreateAudio} disabled={state.isGeneratingAudio || !generatedText.trim()} className="flex items-center gap-3 px-8 py-3 bg-indigo-600 text-white rounded-2xl text-[12px] font-black uppercase shadow-xl hover:bg-indigo-700 disabled:opacity-50 transition-all">
                    {state.isGeneratingAudio ? <Loader2 className="w-5 h-5 animate-spin"/> : <Zap className="w-5 h-5"/>} <span>Chuyển đổi</span>
                  </button>
                </div>
              </div>
              {showAdvancedSettings && (
                <div className="bg-white border-b px-8 py-6 shadow-inner flex flex-wrap gap-8 animate-in slide-in-from-top-4">
                   <div className="flex-1 min-w-[200px] space-y-4"><div className="flex justify-between text-[11px] font-black text-slate-500 uppercase"><span>Tốc độ</span><span className="text-indigo-600">{config.speed}x</span></div><input type="range" min="0.5" max="2.0" step="0.1" value={config.speed} onChange={e => setConfig({...config, speed: parseFloat(e.target.value)})} className="w-full h-2 accent-indigo-600 cursor-pointer"/></div>
                   <div className="flex-1 min-w-[200px] space-y-4"><div className="flex justify-between text-[11px] font-black text-slate-500 uppercase"><span>Cao độ</span><span className="text-indigo-600">{config.pitch}</span></div><input type="range" min="0.5" max="1.5" step="0.1" value={config.pitch} onChange={e => setConfig({...config, pitch: parseFloat(e.target.value)})} className="w-full h-2 accent-indigo-600 cursor-pointer"/></div>
                </div>
              )}
              <div className="flex-1 flex flex-col p-6 gap-6 overflow-hidden">
                <div className={`bg-white rounded-[2rem] border shadow-sm transition-all overflow-hidden flex flex-col shrink-0 ${isAIPromptOpen ? 'max-h-[500px]' : 'max-h-[56px]'}`}>
                   <button onClick={() => setIsAIPromptOpen(!isAIPromptOpen)} className="flex items-center justify-between w-full p-4 px-6 hover:bg-slate-50">
                      <div className="flex items-center gap-3"><Sparkles className="w-5 h-5 text-indigo-600 animate-pulse"/><span className="text-xs font-black text-slate-700 uppercase tracking-widest">Soạn thảo bằng AI Gemini</span></div>
                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-all ${isAIPromptOpen ? 'rotate-180' : ''}`}/>
                   </button>
                   <div className="p-6 pt-0 space-y-4">
                      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Nhập mô tả bài viết..." className="w-full h-28 p-5 bg-slate-50 rounded-2xl text-sm outline-none resize-none border-2 focus:border-indigo-200 transition-all"/>
                      <div className="flex justify-end"><button onClick={async () => { if (!description.trim()) return; setState(prev => ({...prev, isGeneratingText: true})); try { const text = await generateContentFromDescription(description, READING_MODES.find(m => m.id === activeMode)?.prompt || "", addLog, selectBestKey()); setGeneratedText(text); setIsAIPromptOpen(false); } catch (e) {} finally { setState(prev => ({...prev, isGeneratingText: false})); } }} disabled={state.isGeneratingText} className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase flex items-center gap-3 shadow-xl">{state.isGeneratingText ? <Loader2 className="animate-spin w-4 h-4"/> : <Zap className="w-4 h-4"/>} <span>Viết ngay</span></button></div>
                   </div>
                </div>
                <div className="flex-1 bg-white rounded-[2.5rem] border shadow-2xl flex flex-col overflow-hidden relative">
                   <div className="px-8 py-5 border-b flex items-center justify-between bg-slate-50/50">
                      <div className="flex items-center gap-4"><div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600"><FileText className="w-5 h-5"/></div><span className="text-[11px] font-black uppercase text-slate-800 tracking-wider">Văn bản ({generatedText.length.toLocaleString()} ký tự)</span></div>
                      <div className="flex gap-2">
                         <button onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-500 hover:text-indigo-600 rounded-xl border shadow-sm relative group" title="Nhập từ file (PDF, TXT, DOCX)">
                           {isReadingFile ? <Loader2 className="w-5 h-5 animate-spin"/> : <FileUp className="w-5 h-5"/>}
                           <input type="file" ref={fileInputRef} className="hidden" accept=".txt,.pdf,.docx" onChange={handleFileSelect} />
                         </button>
                         <button onClick={handleSmartPaste} className="p-3 text-slate-500 hover:text-indigo-600 rounded-xl border shadow-sm"><ClipboardPaste className="w-5 h-5"/></button>
                         <button onClick={() => setGeneratedText('')} className="p-3 text-slate-500 hover:text-red-500 rounded-xl border shadow-sm"><Trash2 className="w-5 h-5"/></button>
                      </div>
                   </div>
                   <textarea value={generatedText} onChange={e => setGeneratedText(e.target.value)} className="flex-1 w-full p-10 outline-none resize-none font-medium text-slate-700 leading-relaxed text-xl scrollbar-hide" placeholder="Chào mừng bạn đến với Bảo Minh AI Studio!"/>
                   {state.isGeneratingAudio && (
                     <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-40 flex items-center justify-center flex-col animate-in fade-in">
                        <div className="w-96 space-y-6 text-center">
                           <div className="relative w-28 h-28 mx-auto"><div className="absolute inset-0 border-8 border-slate-100 rounded-[2.5rem] rotate-45"></div><div className="absolute inset-0 border-8 border-indigo-600 rounded-[2.5rem] rotate-45 border-t-transparent animate-spin"></div><div className="absolute inset-0 flex items-center justify-center font-black text-indigo-600 text-xl">{progress}%</div></div>
                           <p className="text-xl font-black text-slate-800 uppercase tracking-widest animate-pulse">Đang thu âm...</p>
                        </div>
                     </div>
                   )}
                </div>
                {state.audioUrl && (
                  <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl flex flex-col gap-6 animate-in slide-in-from-bottom-8">
                    <audio ref={audioRef} src={state.audioUrl} hidden />
                    <div className="space-y-3"><div className="flex justify-between text-[10px] font-black uppercase text-slate-500"><span>{formatTime(playerCurrentTime)}</span><span>{formatTime(playerDuration)}</span></div><div className="relative group"><input type="range" min="0" max={playerDuration || 0} step="0.01" value={playerCurrentTime} onChange={handleSeek} className="w-full h-2 bg-slate-800 rounded-full accent-indigo-600 cursor-pointer appearance-none"/><div className="absolute top-0 left-0 h-2 bg-indigo-600 rounded-full pointer-events-none" style={{width: `${(playerCurrentTime/(playerDuration||1))*100}%`}}></div></div></div>
                    <div className="flex flex-wrap items-center justify-between gap-6">
                      <div className="flex items-center gap-4"><button onClick={() => skipTime(-15)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all active:scale-95"><RotateCcw className="w-5 h-5"/></button><button onClick={togglePlay} className="w-16 h-16 bg-indigo-600 hover:bg-indigo-500 rounded-[1.8rem] flex items-center justify-center shadow-xl active:scale-90 transition-all">{playerIsPlaying ? <Pause className="w-7 h-7 fill-white"/> : <Play className="w-7 h-7 fill-white translate-x-0.5"/>}</button><button onClick={() => skipTime(15)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all active:scale-95"><RotateCw className="w-5 h-5"/></button></div>
                      <div className="flex items-center gap-4">
                        <div className="relative"><button onClick={() => setShowRateMenu(!showRateMenu)} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-[11px] font-black uppercase flex items-center gap-2 border border-white/5"><FastForward className="w-4 h-4 text-indigo-400"/> {playerPlaybackRate}x</button>{showRateMenu && (<div className="absolute bottom-full mb-3 left-0 w-32 bg-slate-800 rounded-2xl shadow-2xl border border-white/10 p-2 z-[100] animate-in fade-in">{[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(rate => (<button key={rate} onClick={() => changePlaybackRate(rate)} className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-black ${playerPlaybackRate === rate ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>{rate}x</button>))}</div>)}</div>
                        <div className="h-10 w-px bg-white/10 hidden sm:block"></div>
                        <div className="flex items-center gap-2"><a href={state.audioUrl} download="baominh.wav" className="px-5 py-3 bg-indigo-600 hover:bg-indigo-50 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg"><Download className="w-4 h-4"/> WAV</a><a href={state.mp3Url || '#'} download="baominh.mp3" className="px-5 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 border border-white/5"><Download className="w-4 h-4"/> MP3</a><button onClick={() => { if(audioRef.current) audioRef.current.pause(); setState(prev => ({...prev, audioUrl: null})); }} className="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all"><X className="w-5 h-5"/></button></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <footer className="h-14 bg-slate-900 text-white flex items-center px-8 z-[120] border-t border-white/5"><div className="flex items-center gap-5 flex-1 overflow-hidden"><Terminal className="w-5 h-5 text-indigo-400 shrink-0"/><p className="text-[11px] font-black uppercase tracking-widest truncate text-slate-500">{logs.length > 0 ? `[${new Date(logs[logs.length-1].timestamp).toLocaleTimeString()}] ${logs[logs.length-1].message}` : "Hệ thống sẵn sàng..."}</p></div><span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Studio Pro v2.9</span></footer>
      
      <div className="fixed bottom-16 right-10 z-[100] flex flex-col items-end gap-5">{isChatOpen && (<div className="w-80 bg-white rounded-[2.5rem] shadow-2xl border-4 border-white flex flex-col overflow-hidden animate-in slide-in-from-bottom-10"><div className="p-6 bg-indigo-600 text-white flex justify-between items-center font-black uppercase text-[10px]">Hỗ trợ kỹ thuật <button onClick={() => setIsChatOpen(false)}><X className="w-5 h-5"/></button></div><div className="p-8 text-center bg-slate-50"><img src={ZALO_QR_URL} className="w-40 h-40 mx-auto rounded-3xl p-2 bg-white shadow-lg mb-6"/><a href={ZALO_LINK} target="_blank" className="block w-full py-4 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase shadow-lg">Mở Zalo nhắn tin</a></div></div>)}<button onClick={() => setIsChatOpen(!isChatOpen)} className="w-20 h-20 bg-amber-500 text-white rounded-[2rem] shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all border-4 border-white"><MessageCircle className="w-10 h-10"/></button></div>

      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-3xl animate-in fade-in">
           <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-12 text-center shadow-2xl border-8 border-white/10">
              <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white mx-auto mb-8 shadow-xl rotate-12"><Sparkles className="w-12 h-12 -rotate-12"/></div>
              <h2 className="text-4xl font-black mb-2 text-slate-800 italic">Bảo Minh AI</h2>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Professional Voice Studio</p>
              {loginError && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100">{loginError}</div>}
              <div className="space-y-5">
                  <input value={loginCreds.id} onChange={e => setLoginCreds({...loginCreds, id: e.target.value})} className="w-full p-6 bg-slate-50 border-2 rounded-[1.8rem] font-bold text-sm outline-none focus:border-indigo-500" placeholder="Tên đăng nhập"/>
                  <input type="password" value={loginCreds.pass} onKeyDown={e => e.key === 'Enter' && handleLogin()} onChange={e => setLoginCreds({...loginCreds, pass: e.target.value})} className="w-full p-6 bg-slate-50 border-2 rounded-[1.8rem] font-bold text-sm outline-none focus:border-indigo-500" placeholder="Mật khẩu"/>
                  <button onClick={handleLogin} className="w-full py-6 bg-indigo-600 text-white rounded-[1.8rem] font-black uppercase shadow-xl hover:bg-indigo-700">Đăng nhập</button>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-8">
                <button onClick={() => { const guest: UserProfile = { uid: `guest-${Date.now()}`, displayName: 'Khách', email: '', photoURL: `https://ui-avatars.com/api/?name=Guest&background=e2e8f0`, role: 'GUEST', credits: GUEST_DAILY_LIMIT, lastActive: new Date().toISOString(), isBlocked: false, planType: 'TRIAL', expiryDate: Date.now() + 86400000, characterLimit: GUEST_DAILY_LIMIT }; setCurrentUser(guest); localStorage.setItem('bm_user_session', JSON.stringify(guest)); setIsAuthModalOpen(false); }} className="py-4 bg-white border-2 border-indigo-100 text-indigo-600 rounded-[1.5rem] font-black text-[10px] uppercase">Dùng thử 600 KT</button>
                <button onClick={() => setIsContributingKey(true)} className="py-4 bg-emerald-50 border-2 border-emerald-100 text-emerald-600 rounded-[1.5rem] font-black text-[10px] uppercase">Tặng API Key</button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL SỬA THÔNG TIN NGƯỜI DÙNG (Admin) */}
      {isEditingUser && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-[3rem] p-10 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black uppercase text-slate-800">Chỉnh sửa thành viên</h3>
              <button onClick={() => setIsEditingUser(null)}><X className="w-6 h-6"/></button>
            </div>
            <div className="space-y-6">
              <div>
                <p className="text-xs font-black uppercase text-slate-400 mb-2">Tên hiển thị</p>
                <input value={isEditingUser.displayName} onChange={e => setIsEditingUser({...isEditingUser, displayName: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none"/>
              </div>
              <div>
                <p className="text-xs font-black uppercase text-slate-400 mb-2">Gói cước & Trạng thái</p>
                <div className="flex gap-4">
                  <select value={isEditingUser.planType} onChange={e => setIsEditingUser({...isEditingUser, planType: e.target.value as PlanType})} className="flex-1 p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none">
                    <option value="TRIAL">Trial</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                  <button onClick={() => setIsEditingUser({...isEditingUser, isBlocked: !isEditingUser.isBlocked})} className={`px-6 rounded-2xl font-black text-xs uppercase ${isEditingUser.isBlocked ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {isEditingUser.isBlocked ? 'Đang khóa' : 'Hoạt động'}
                  </button>
                </div>
              </div>
              
              {/* PHẦN GIA HẠN */}
              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                <p className="text-xs font-black uppercase text-indigo-500 mb-3 flex items-center gap-2"><CalendarClock className="w-4 h-4"/> Gia hạn ngày sử dụng</p>
                <div className="flex flex-col gap-3">
                  <input 
                    type="date" 
                    value={formatDateInput(isEditingUser.expiryDate)} 
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      if (!isNaN(date.getTime())) {
                        setIsEditingUser({...isEditingUser, expiryDate: date.getTime(), isBlocked: false});
                      }
                    }}
                    className="w-full p-4 bg-white rounded-2xl font-bold text-slate-800 text-sm outline-none border border-indigo-100"
                  />
                </div>
              </div>

              {/* PHẦN SỬA HẠN MỨC */}
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                <p className="text-xs font-black uppercase text-amber-600 mb-3 flex items-center gap-2"><Zap className="w-4 h-4"/> Điều chỉnh hạn mức</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500">Số dư hiện tại</span>
                    <input type="number" value={isEditingUser.credits} onChange={e => setIsEditingUser({...isEditingUser, credits: Number(e.target.value)})} className="w-full p-4 bg-white rounded-2xl font-bold text-sm outline-none border border-amber-100"/>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500">Bonus hàng ngày</span>
                    <input type="number" value={isEditingUser.bonusDailyLimit || 0} onChange={e => setIsEditingUser({...isEditingUser, bonusDailyLimit: Number(e.target.value)})} className="w-full p-4 bg-white rounded-2xl font-bold text-sm outline-none border border-amber-100"/>
                  </div>
                </div>
              </div>

              <button onClick={() => handleUpdateUserPlan(isEditingUser)} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase shadow-xl hover:bg-indigo-600 transition-all">Lưu thay đổi</button>
            </div>
          </div>
        </div>
      )}

      {isAddingUser && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-[3rem] p-12 shadow-2xl">
            <div className="flex justify-between mb-10 text-2xl font-black uppercase">Cấp tài khoản <button type="button" onClick={() => setIsAddingUser(false)}><X className="w-8 h-8"/></button></div>
            <form onSubmit={handleCreateUser} className="space-y-6">
              <input value={newUserData.loginId} onChange={e => setNewUserData({...newUserData, loginId: e.target.value})} className="w-full p-5 bg-slate-50 rounded-2xl border-2 font-black outline-none focus:border-indigo-500" placeholder="Tên đăng nhập" autoFocus />
              <input type="password" value={newUserData.password} onChange={e => setNewUserData({...newUserData, password: e.target.value})} className="w-full p-5 bg-slate-50 rounded-2xl border-2 font-black outline-none focus:border-indigo-500" placeholder="Mật khẩu"/>
              <select value={newUserData.plan} onChange={e => setNewUserData({...newUserData, plan: e.target.value as PlanType})} className="w-full p-5 bg-slate-50 rounded-2xl border-2 font-black outline-none focus:border-indigo-500">
                <option value="TRIAL">Dùng thử</option>
                <option value="MONTHLY">1 Tháng</option>
                <option value="YEARLY">1 Năm</option>
              </select>
              <button type="submit" className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase shadow-xl hover:bg-indigo-700 transition-all">Kích hoạt</button>
            </form>
          </div>
        </div>
      )}

      {isContributingKey && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-xl animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-[3rem] p-12 shadow-2xl relative">
            <button
              onClick={() => setIsContributingKey(false)}
              className="absolute top-8 right-8 text-slate-300 hover:text-red-500"
            >
              <X className="w-8 h-8" />
            </button>

            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <Gift className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 uppercase">Đóng góp API Key</h3>
            </div>

            <div className="space-y-6 text-left">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-xs leading-relaxed text-slate-700">
                <p className="font-black uppercase text-emerald-700 mb-2">Cách tạo Google Gemini API Key</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>
                    Mở trang{" "}
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 underline font-semibold"
                    >
                      Google AI Studio - API Key
                    </a>
                    .
                  </li>
                  <li>Đăng nhập tài khoản Google của bạn (nên dùng tài khoản chính, đã xác minh).</li>
                  <li>Nếu được hỏi, đồng ý điều khoản sử dụng và bật Gemini API.</li>
                  <li>Bấm nút <span className="font-semibold">Create API key</span> → chọn dự án mặc định.</li>
                  <li>Sao chép chuỗi key bắt đầu bằng <span className="font-mono text-[11px]">AIza...</span> và dán vào ô bên dưới.</li>
                </ol>
                <p className="mt-3 text-[11px] text-slate-500">
                  Lưu ý: Key của bạn chỉ được dùng cho hệ thống Bảo Minh AI, không chia sẻ công khai để tránh bị lạm dụng.
                </p>
              </div>

              <input
                value={newKeyData.key}
                onChange={e => setNewKeyData({ ...newKeyData, key: e.target.value })}
                className="w-full p-5 bg-slate-50 border-2 rounded-2xl font-bold text-sm outline-none"
                placeholder="Dán API Key dạng AIzaSy..."
              />

              <button
                onClick={async () => {
                  if (!newKeyData.key) return;
                  setIsTestingNewKey(true);
                  const test = await testApiKey(newKeyData.key.trim());
                  setIsTestingNewKey(false);
                  if (!test.valid) return showNotification("Lỗi", test.message, "error");
                  const newKey: ManagedKey = {
                    id: `key-${Date.now()}`,
                    name: 'Key Tặng',
                    key: newKeyData.key.trim(),
                    status: 'VALID',
                    usageCount: 0,
                    isTrialKey: false,
                    allowedUserIds: []
                  };
                  setManagedKeys([newKey, ...managedKeys]);
                  setIsContributingKey(false);
                  showNotification("Cảm ơn!", "Key của bạn đã được kiểm tra và chấp nhận.", "success");
                }}
                disabled={isTestingNewKey}
                className="w-full py-6 bg-emerald-600 text-white rounded-2xl font-black uppercase shadow-xl transition-all hover:bg-emerald-700 disabled:opacity-50"
              >
                {isTestingNewKey ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "Xác nhận tặng"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingVoice && (<div className="fixed inset-0 z-[160] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in"><div className="bg-white w-full max-w-xl rounded-[3rem] p-10 shadow-2xl"><div className="flex justify-between items-center mb-8"><h3 className="text-xl font-black uppercase text-slate-800">{editingVoice.id ? 'Sửa giọng Clone' : 'Thêm giọng thủ công'}</h3><button onClick={() => setEditingVoice(null)}><X className="w-6 h-6"/></button></div><div className="space-y-6"><div><p className="text-xs font-black uppercase text-slate-400 mb-2">Tên gợi nhớ</p><input value={editingVoice.name || ''} onChange={e => setEditingVoice({...editingVoice, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none" placeholder="Ví dụ: Giọng MC VTV1"/></div><div className="flex gap-4"> <div className="flex-1"><p className="text-xs font-black uppercase text-slate-400 mb-2">Giới tính</p><select value={editingVoice.gender || 'Nữ'} onChange={e => setEditingVoice({...editingVoice, gender: e.target.value as 'Nam'|'Nữ'})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none"><option value="Nam">Nam</option><option value="Nữ">Nữ</option></select></div><div className="flex-1"><p className="text-xs font-black uppercase text-slate-400 mb-2">Vùng miền</p><select value={editingVoice.region || 'Bắc'} onChange={e => setEditingVoice({...editingVoice, region: e.target.value as any})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none"><option value="Bắc">Bắc</option><option value="Trung">Trung</option><option value="Nam">Nam</option></select></div></div><div><p className="text-xs font-black uppercase text-slate-400 mb-2">Mô tả (Tone giọng)</p><input value={editingVoice.description || ''} onChange={e => setEditingVoice({...editingVoice, description: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none" placeholder="Trầm, ấm, truyền cảm..."/></div><button onClick={handleSaveVoice} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"><Save className="w-5 h-5"/> Lưu giọng đọc</button></div></div></div>)}

      {showVoicePanel && (
        <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center p-0 md:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-6xl md:rounded-[3rem] rounded-t-[3rem] p-10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between mb-8 shrink-0">
              <h3 className="text-3xl font-black text-slate-800">Thư viện giọng đọc</h3>
              <button onClick={() => setShowVoicePanel(false)} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-red-500 transition-all shadow-inner"><X className="w-6 h-6"/></button>
            </div>
            <div className="flex gap-4 mb-8 shrink-0">
              <button onClick={() => setVoicePanelTab('PRESET')} className={`px-8 py-4 rounded-2xl text-[11px] font-black uppercase ${voicePanelTab === 'PRESET' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>Có sẵn</button>
              <button onClick={() => setVoicePanelTab('CLONE')} className={`px-8 py-4 rounded-2xl text-[11px] font-black uppercase ${voicePanelTab === 'CLONE' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Clone giọng AI</button>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hide pb-10">
              {voicePanelTab === 'PRESET' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {PRESET_VOICES.map(voice => (
                    <div key={voice.id} onClick={() => { setConfig({...config, activePresetId: voice.id, voiceName: voice.baseVoice, useClonedVoice: false}); setShowVoicePanel(false); }} className={`group p-8 rounded-[2.5rem] border-4 transition-all cursor-pointer ${config.activePresetId === voice.id && !config.useClonedVoice ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xl' : 'bg-white border-slate-50 hover:border-indigo-200'}`}>
                      <p className="text-[15px] font-black mb-1">{voice.label}</p>
                      <span className="text-[9px] font-black uppercase opacity-60">{voice.gender} • {voice.tags[0]}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="lg:w-1/3 space-y-4">
                    <div className={`border-4 border-dashed rounded-[2.5rem] h-64 flex flex-col items-center justify-center p-6 text-center transition-all ${cloneFile ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50'}`} onClick={() => cloneInputRef.current?.click()}>
                      <input type="file" ref={cloneInputRef} accept="audio/*" className="hidden" onChange={e => e.target.files && setCloneFile(e.target.files[0])}/>
                      {cloneFile ? (
                        <>
                          <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-2"/>
                          <p className="text-sm font-black text-slate-800">{cloneFile.name}</p>
                          <p className="text-xs text-slate-400 mt-1">Đã sẵn sàng phân tích</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-12 h-12 text-slate-300 mb-2"/>
                          <p className="text-sm font-black text-slate-400">Chọn file ghi âm giọng mẫu</p>
                          <p className="text-[10px] text-slate-300 mt-1">MP3, WAV, M4A (Max 10MB)</p>
                        </>
                      )}
                    </div>
                    <button onClick={handleCloneVoice} disabled={!cloneFile || isAnalyzingVoice} className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase shadow-xl flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 transition-all">
                      {isAnalyzingVoice ? <Loader2 className="w-5 h-5 animate-spin"/> : <Sparkles className="w-5 h-5"/>} <span>Phân tích & Clone</span>
                    </button>
                    <button onClick={() => setEditingVoice({})} className="w-full py-4 bg-slate-50 text-slate-500 rounded-2xl text-[11px] font-black uppercase shadow-sm hover:text-indigo-600 hover:bg-white border border-transparent hover:border-indigo-100 transition-all flex items-center justify-center gap-2 mt-4">
                      <Plus className="w-5 h-5"/> <span>Thêm thủ công</span>
                    </button>
                  </div>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto scrollbar-hide">
                    {clonedVoices.length > 0 ? clonedVoices.map(voice => (
                      <div key={voice.id} onClick={() => { setConfig({...config, useClonedVoice: true, activeClonedVoiceId: voice.id, voiceName: voice.gender === 'Nam' ? 'Fenrir' : 'Kore'}); setShowVoicePanel(false); }} className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all ${config.useClonedVoice && config.activeClonedVoiceId === voice.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 'bg-white border-slate-100 hover:border-indigo-300'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${voice.gender === 'Nam' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}><Fingerprint className="w-5 h-5"/></div>
                            <div><p className="text-sm font-black">{voice.name}</p><p className="text-[9px] uppercase opacity-70">{voice.gender} • {voice.region}</p></div>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={(e) => { e.stopPropagation(); setEditingVoice(voice); }} className="text-slate-300 hover:text-indigo-500 p-2 hover:bg-indigo-50 rounded-lg transition-all"><PenTool className="w-4 h-4"/></button>
                            <button onClick={(e) => { e.stopPropagation(); setClonedVoices(prev => prev.filter(v => v.id !== voice.id)); }} className="text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        </div>
                        <p className="text-[10px] opacity-60 line-clamp-2">{voice.description}</p>
                      </div>
                    )) : (
                      <div className="col-span-full flex flex-col items-center justify-center text-slate-400 py-10">
                        <Fingerprint className="w-12 h-12 mb-2 opacity-20"/>
                        <p className="text-xs font-bold uppercase">Chưa có giọng Clone nào</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
