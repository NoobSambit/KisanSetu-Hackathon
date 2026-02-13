/**
 * useVoiceInput Hook (Phase 4)
 *
 * React hook for using voice input in components
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  VoiceInputManager,
  VoiceInputConfig,
  VoiceInputResult,
  isSpeechRecognitionSupported,
} from '@/lib/utils/voiceInput';

interface UseVoiceInputReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  error: string | null;
}

export function useVoiceInput(
  config: VoiceInputConfig = {}
): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(() => isSpeechRecognitionSupported());

  const managerRef = useRef<VoiceInputManager | null>(null);

  useEffect(() => {
    if (!isSupported) return;

    // Initialize voice input manager
    const manager = new VoiceInputManager({
      language: config.language || 'en-IN',
      continuous: config.continuous ?? false,
      interimResults: config.interimResults ?? true,
      maxAlternatives: config.maxAlternatives || 1,
    });

    managerRef.current = manager;

    // Setup callbacks
    manager.onResult((result: VoiceInputResult) => {
      if (result.isFinal) {
        setTranscript((prev) => {
          const newText = prev ? `${prev} ${result.transcript}` : result.transcript;
          return newText.trim();
        });
        setInterimTranscript('');
      } else {
        setInterimTranscript(result.transcript);
      }
    });

    manager.onError((err) => {
      setError(err.error);
      setIsListening(false);
    });

    manager.onEnd(() => {
      setIsListening(false);
    });

    // Cleanup on unmount
    return () => {
      manager.destroy();
    };
  }, [isSupported, config.language, config.continuous, config.interimResults, config.maxAlternatives]);

  const startListening = useCallback(() => {
    if (!managerRef.current || !isSupported) {
      setError('Voice input not supported in this browser');
      return;
    }

    setError(null);
    managerRef.current.start();
    setIsListening(true);
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (!managerRef.current) return;

    managerRef.current.stop();
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    error,
  };
}
