
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
  allowedUserIds: string[]; 
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  role: UserRole;
  credits: number; 
  lastActive: string;
  isBlocked: boolean;
  planType: PlanType;
  expiryDate: number; 
  characterLimit: number; 
  bonusDailyLimit?: number; 
  lastResetDate?: string; 
  loginId?: string; 
  password?: string; 
  dailyKeyCount?: number; 
  lastKeyDate?: string; 
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
  audioBase64?: string;
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

export interface AdCampaign {
  id: string;
  isActive: boolean;
  title: string;
  content: string;
  imageUrl?: string;
  buttonText: string;
  buttonLink: string;
  startDate?: string; // Định dạng YYYY-MM-DD
  endDate?: string;   // Định dạng YYYY-MM-DD
  createdAt: number;
}

export interface SystemConfig {
  enableKeyReward: boolean;
  keyRewardAmount: number;
  maxKeysPerDay: number;
}

declare global {
  interface Window {
    lamejs?: any;
  }
}
