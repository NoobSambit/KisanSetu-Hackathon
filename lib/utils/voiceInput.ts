/**
 * Voice Input Utility (Phase 4)
 *
 * Safe abstraction layer for browser Speech Recognition API
 * Handles voice recording and speech-to-text conversion
 */

export interface VoiceInputConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export interface VoiceInputResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface VoiceInputError {
  error: string;
  code?: string;
}

/**
 * Check if browser supports Speech Recognition
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;

  return !!(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );
}

/**
 * Voice Input Manager Class
 */
export class VoiceInputManager {
  private recognition: any = null;
  private isListening: boolean = false;
  private onResultCallback?: (result: VoiceInputResult) => void;
  private onErrorCallback?: (error: VoiceInputError) => void;
  private onEndCallback?: () => void;

  constructor(config: VoiceInputConfig = {}) {
    if (!isSpeechRecognitionSupported()) {
      console.warn('Speech Recognition not supported in this browser');
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    this.recognition = new SpeechRecognition();
    this.recognition.lang = config.language || 'en-IN'; // Default to Indian English
    this.recognition.continuous = config.continuous ?? false;
    this.recognition.interimResults = config.interimResults ?? true;
    this.recognition.maxAlternatives = config.maxAlternatives || 1;

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.recognition) return;

    this.recognition.onresult = (event: any) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      const transcript = lastResult[0].transcript;
      const confidence = lastResult[0].confidence;
      const isFinal = lastResult.isFinal;

      if (this.onResultCallback) {
        this.onResultCallback({
          transcript,
          confidence,
          isFinal,
        });
      }
    };

    this.recognition.onerror = (event: any) => {
      const errorMessages: Record<string, string> = {
        'no-speech': 'No speech detected. Please try again.',
        'audio-capture': 'No microphone was found. Please check your device.',
        'not-allowed': 'Microphone permission denied. Please allow microphone access.',
        'network': 'Network error occurred. Please check your connection.',
        'aborted': 'Speech recognition was aborted.',
        'language-not-supported': 'Language not supported.',
      };

      const error = errorMessages[event.error] || 'An unknown error occurred';

      if (this.onErrorCallback) {
        this.onErrorCallback({
          error,
          code: event.error,
        });
      }

      this.isListening = false;
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onEndCallback) {
        this.onEndCallback();
      }
    };

    this.recognition.onstart = () => {
      this.isListening = true;
    };
  }

  /**
   * Start listening for voice input
   */
  public start(): void {
    if (!this.recognition) {
      if (this.onErrorCallback) {
        this.onErrorCallback({
          error: 'Speech Recognition not supported in this browser',
        });
      }
      return;
    }

    if (this.isListening) {
      console.warn('Already listening');
      return;
    }

    try {
      this.recognition.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback({
          error: 'Failed to start speech recognition',
        });
      }
    }
  }

  /**
   * Stop listening
   */
  public stop(): void {
    if (!this.recognition || !this.isListening) return;

    try {
      this.recognition.stop();
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  }

  /**
   * Abort listening immediately
   */
  public abort(): void {
    if (!this.recognition || !this.isListening) return;

    try {
      this.recognition.abort();
    } catch (error) {
      console.error('Error aborting speech recognition:', error);
    }
  }

  /**
   * Check if currently listening
   */
  public getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Set result callback
   */
  public onResult(callback: (result: VoiceInputResult) => void): void {
    this.onResultCallback = callback;
  }

  /**
   * Set error callback
   */
  public onError(callback: (error: VoiceInputError) => void): void {
    this.onErrorCallback = callback;
  }

  /**
   * Set end callback
   */
  public onEnd(callback: () => void): void {
    this.onEndCallback = callback;
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.abort();
    this.recognition = null;
    this.onResultCallback = undefined;
    this.onErrorCallback = undefined;
    this.onEndCallback = undefined;
  }
}

/**
 * Simple hook-style function for quick voice input
 */
export async function captureVoiceInput(
  config: VoiceInputConfig = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const manager = new VoiceInputManager(config);

    let finalTranscript = '';

    manager.onResult((result) => {
      if (result.isFinal) {
        finalTranscript = result.transcript;
      }
    });

    manager.onEnd(() => {
      manager.destroy();
      if (finalTranscript) {
        resolve(finalTranscript);
      } else {
        reject(new Error('No speech detected'));
      }
    });

    manager.onError((error) => {
      manager.destroy();
      reject(new Error(error.error));
    });

    manager.start();

    // Auto-stop after 10 seconds
    setTimeout(() => {
      if (manager.getIsListening()) {
        manager.stop();
      }
    }, 10000);
  });
}
