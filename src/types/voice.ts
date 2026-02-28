export interface VoiceResult {
  finalTranscript: string;
  interimTranscript: string;
  isFinal: boolean;
}

export interface VoiceError {
  error: string;
  message: string;
}

export interface SpeechSettings {
  rate: number;
  pitch: number;
  volume: number;
  language: string;
  autoPlay: boolean;
}

export interface SupportedLanguage {
  code: string;
  name: string;
}
