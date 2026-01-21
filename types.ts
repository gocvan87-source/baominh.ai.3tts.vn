
export enum TTSProvider {
  GEMINI = 'GEMINI'
}

export enum ReadingMode {
  STORY = 'STORY',
  POETRY = 'POETRY',
  PROSE = 'PROSE',
  CONDOLENCE = 'CONDOLENCE',
  WEDDING = 'WEDDING',
  SPEECH = 'SPEECH',
  MOVIE_REVIEW = 'MOVIE_REVIEW',
  ADVERTISEMENT = 'ADVERTISEMENT',
  NEWS = 'NEWS',
  ADMIN_PANEL = 'ADMIN_PANEL'
}

export type UserRole = 'USER' | 'ADMIN' | 'TRIAL' | 'GUEST';
export type PlanType = 'MONTHLY' | '3MONTHS' | '6MONTHS' | 'YEARLY' | 'TRIAL' | 'NONE';

export interface ManagedKey {
  id: string;
  name: string;
  key: string;
  status: 'VALID' | 'INVALID' | 'UNTESTED';
  lastTested?: number;
  errorMessage?: string;
  usageCount: number;
  isTrialKey: boolean; 
  allowedUserIds: string[]; // Danh sách UID được phép dùng Key này. Trống = Dùng chung.
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  role: UserRole;
  credits: number; // Ký tự còn lại trong ngày
  lastActive: string;
  isBlocked: boolean;
  planType: PlanType;
  expiryDate: number; 
  characterLimit: number; // Giới hạn cơ bản theo gói
  bonusDailyLimit?: number; // Giới hạn cộng thêm vĩnh viễn do đóng góp Key
  lastResetDate?: string; // Ngày reset credits gần nhất
  loginId?: string; // Tên đăng nhập do admin cấp
  password?: string; // Mật khẩu do admin cấp
  dailyKeyCount?: number; // Số key đã đóng góp trong ngày
  lastKeyDate?: string; // Ngày đóng góp key gần nhất
  expiryNotifyLevel?: number; // Mức độ thông báo hết hạn: 0 (chưa), 1 (3 ngày), 2 (2 ngày), 3 (1 ngày)
}

// Added AdCampaign interface to fix module export error
export interface AdCampaign {
  id: string;
  isActive: boolean;
  title: string;
  content: string;
  buttonText: string;
  buttonLink: string;
  createdAt: number;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  imageUrl?: string;
}

export type VoiceEmotion = 'NEUTRAL' | 'HAPPY' | 'SAD' | 'ANGRY' | 'SERIOUS' | 'EMOTIONAL' | 'WHISPER';

export interface ClonedVoice {
  id: string;
  name: string;
  gender: 'Nam' | 'Nữ';
  region: 'Bắc' | 'Trung' | 'Nam' | 'Khác';
  description: string;
  toneSummary: string;
  createdAt: number;
  audioBase64?: string; // Sample audio for preview/reference
  mimeType?: string;
}

export interface VoicePreset {
  id: string;
  label: string;
  gender: 'Nam' | 'Nữ';
  baseVoice: string;
  description: string;
  tags: string[];
}

export interface AdvancedVoiceSettings {
  breathiness: number;
  stability: number;
  clarity: number;
  naturalBreaks: boolean;
}

export interface VoiceConfig {
  provider: TTSProvider;
  voiceName: string;
  speed: number;
  pitch: number;
  emotion: VoiceEmotion;
  useClonedVoice?: boolean;
  activeClonedVoiceId?: string;
  activePresetId?: string;
  advanced?: AdvancedVoiceSettings;
  customApiKeys?: string[];
}

export interface GenerationState {
  isGeneratingText: boolean;
  isGeneratingAudio: boolean;
  error: string | null;
  text: string;
  audioUrl: string | null;
  audioBuffer: ArrayBuffer | null;
}

declare global {
  interface Window {
    lamejs?: any;
    pdfjsLib?: any;
    mammoth?: any;
  }
}
