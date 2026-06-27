// Browser-native Web Speech API for voice input
// Works offline - no external API required

export interface VoiceResult {
  text: string;
  isFinal: boolean;
  confidence: number;
}

export type VoiceCallback = (result: VoiceResult) => void;

const SpeechRecognition = typeof window !== 'undefined'
  ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  : null;

export class VoiceInputManager {
  private recognition: any;
  private isListening = false;
  private transcript = '';
  private onResult: VoiceCallback | null = null;

  constructor(language: string = 'en-IN') {
    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.mapLanguageCode(language);

    this.setupListeners();
  }

  private mapLanguageCode(lang: string): string {
    // Map our language codes to BCP 47 codes
    const mapping: Record<string, string> = {
      en: 'en-US',
      hi: 'hi-IN',
      ta: 'ta-IN',
      te: 'te-IN',
      kn: 'kn-IN',
      ml: 'ml-IN',
      mr: 'mr-IN',
      gu: 'gu-IN',
      bn: 'bn-IN',
      pa: 'pa-IN',
    };
    return mapping[lang] || 'en-US';
  }

  private setupListeners() {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.transcript = '';
    };

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;

        if (event.results[i].isFinal) {
          finalText += transcript + ' ';
        } else {
          interim += transcript;
        }

        if (this.onResult) {
          this.onResult({
            text: (finalText + interim).trim(),
            isFinal: event.results[i].isFinal,
            confidence,
          });
        }
      }

      this.transcript = finalText;
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };
  }

  start(onResult: VoiceCallback) {
    if (!this.recognition) {
      console.warn('Speech Recognition not available');
      return;
    }

    this.onResult = onResult;
    this.isListening = true;
    this.transcript = '';
    this.recognition.start();
  }

  stop(): string {
    if (!this.recognition) return '';
    this.recognition.stop();
    this.isListening = false;
    return this.transcript;
  }

  abort() {
    if (!this.recognition) return;
    this.recognition.abort();
    this.isListening = false;
  }

  getIsListening(): boolean {
    return this.isListening;
  }

  isSupported(): boolean {
    return SpeechRecognition !== null;
  }
}

// Singleton instance
let voiceManager: VoiceInputManager | null = null;

export function getVoiceInputManager(language: string = 'en-IN'): VoiceInputManager {
  if (!voiceManager) {
    voiceManager = new VoiceInputManager(language);
  }
  return voiceManager;
}
