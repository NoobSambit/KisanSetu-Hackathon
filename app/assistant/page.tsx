'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import {
  AIQueryResponse,
  AssistantModelProvider,
  ChatMessage,
  VoiceRoundtripApiResponse,
  VoiceSttApiResponse,
  VoiceTtsApiResponse,
} from '@/types';
import { isSpeechRecognitionSupported, VoiceInputManager } from '@/lib/utils/voiceInput';
import AssistantHeader from '@/components/assistant/AssistantHeader';
import WelcomeScreen from '@/components/assistant/WelcomeScreen';
import MessageList from '@/components/assistant/MessageList';
import AssistantInput from '@/components/assistant/AssistantInput';
import VoiceModal from '@/components/assistant/VoiceModal';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

type VoiceState = 'idle' | 'recording' | 'transcribing' | 'review' | 'sending';
type VoiceLanguage =
  | 'hi-IN' | 'en-IN' | 'mr-IN' | 'bn-IN' | 'ta-IN' | 'te-IN'
  | 'gu-IN' | 'kn-IN' | 'ml-IN' | 'pa-IN' | 'ur-IN' | 'or-IN' | 'as-IN';

interface MessageVoiceAudio {
  provider: 'espeak' | 'browser_speech_fallback';
  audioUrl: string | null;
  mimeType: string | null;
  text: string;
  language: string;
  fallbackApplied: boolean;
  fallbackReason: string | null;
}

/* -------------------------------------------------------------------------- */
/*                                   UTILITY                                  */
/* -------------------------------------------------------------------------- */

function createAudioUrlFromBase64(base64: string, mimeType: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
}

function extensionFromMimeType(mimeType: string): string {
  const normalized = mimeType.toLowerCase();
  if (normalized.includes('ogg')) return 'ogg';
  if (normalized.includes('wav') || normalized.includes('wave')) return 'wav';
  if (normalized.includes('mpeg') || normalized.includes('mp3')) return 'mp3';
  if (normalized.includes('mp4') || normalized.includes('aac') || normalized.includes('m4a')) return 'm4a';
  return 'webm';
}

function createSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

export default function AssistantPage() {
  const { user, isAuthenticated } = useAuth();

  // -- State: Chat & Logic --
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponseMeta, setLastResponseMeta] = useState<AIQueryResponse['meta'] | null>(null);
  const [sessionId, setSessionId] = useState(() => createSessionId());
  const [assistantProvider, setAssistantProvider] = useState<AssistantModelProvider>('ollama');

  // -- State: Voice --
  const [showVoicePanel, setShowVoicePanel] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [voiceLanguage, setVoiceLanguage] = useState<VoiceLanguage>('hi-IN');
  const [slowSpeechMode, setSlowSpeechMode] = useState(false);
  const [voiceTranscriptDraft, setVoiceTranscriptDraft] = useState('');
  const [voiceWarnings, setVoiceWarnings] = useState<string[]>([]);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceDurationSeconds, setVoiceDurationSeconds] = useState(0);
  const [messageAudioById, setMessageAudioById] = useState<Record<string, MessageVoiceAudio>>({});
  const [activePlaybackId, setActivePlaybackId] = useState<string | null>(null);

  // -- Refs --
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaChunksRef = useRef<BlobPart[]>([]);
  const recordingStartMsRef = useRef<number>(0);
  const recordedBlobRef = useRef<Blob | null>(null);
  const fallbackTranscriptRef = useRef<string>('');
  const fallbackInterimTranscriptRef = useRef<string>('');
  const fallbackFinalizePromiseRef = useRef<Promise<void> | null>(null);
  const recognitionManagerRef = useRef<VoiceInputManager | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRegistryRef = useRef<Set<string>>(new Set());

  // -- Helpers --
  const appendVoiceWarning = useCallback((message: string) => {
    setVoiceWarnings((prev) => (!message || prev.includes(message) ? prev : [...prev, message]));
  }, []);

  const stopPlayback = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
      audioElementRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setActivePlaybackId(null);
  }, []);

  const cleanupAudioCache = useCallback(() => {
    setMessageAudioById((prev) => {
      Object.values(prev).forEach((item) => {
        if (item.audioUrl) {
          URL.revokeObjectURL(item.audioUrl);
          audioUrlRegistryRef.current.delete(item.audioUrl);
        }
      });
      return {};
    });
  }, []);

  const cacheMessageAudio = useCallback((messageId: string, audio: MessageVoiceAudio) => {
    setMessageAudioById((prev) => {
      const previousAudio = prev[messageId];
      if (previousAudio?.audioUrl) {
        URL.revokeObjectURL(previousAudio.audioUrl);
        audioUrlRegistryRef.current.delete(previousAudio.audioUrl);
      }
      if (audio.audioUrl) audioUrlRegistryRef.current.add(audio.audioUrl);
      return { ...prev, [messageId]: audio };
    });
  }, []);

  const playMessageAudio = useCallback(async (messageId: string, audioPayload: MessageVoiceAudio) => {
    stopPlayback();
    if (audioPayload.audioUrl) {
      const audio = new Audio(audioPayload.audioUrl);
      audioElementRef.current = audio;
      setActivePlaybackId(messageId);
      audio.onended = () => {
        if (audioElementRef.current === audio) {
          audioElementRef.current = null;
          setActivePlaybackId(null);
        }
      };
      audio.onerror = () => {
        if (audioElementRef.current === audio) {
          audioElementRef.current = null;
          setActivePlaybackId(null);
        }
        setVoiceError('Unable to play generated audio.');
      };
      await audio.play();
      return;
    }
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setVoiceError('Browser speech playback is not supported.');
      return;
    }
    const utterance = new SpeechSynthesisUtterance(audioPayload.text);
    utterance.lang = voiceLanguage;
    utterance.rate = slowSpeechMode ? 0.85 : 1;
    utterance.onend = () => setActivePlaybackId(null);
    utterance.onerror = () => {
      setActivePlaybackId(null);
      setVoiceError('Browser speech playback failed.');
    };
    setActivePlaybackId(messageId);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [slowSpeechMode, stopPlayback, voiceLanguage]);

  const resetVoiceDraft = useCallback(() => {
    setVoiceTranscriptDraft('');
    setVoiceDurationSeconds(0);
    setVoiceWarnings([]);
    setVoiceError(null);
    setVoiceState('idle');
    recordedBlobRef.current = null;
    fallbackTranscriptRef.current = '';
    fallbackInterimTranscriptRef.current = '';
    fallbackFinalizePromiseRef.current = null;
  }, []);

  // -- Recognizer Logic --
  const stopFallbackRecognizer = useCallback(() => {
    if (recognitionManagerRef.current) {
      recognitionManagerRef.current.destroy();
      recognitionManagerRef.current = null;
    }
    fallbackInterimTranscriptRef.current = '';
  }, []);

  const finalizeFallbackRecognizer = useCallback(async () => {
    const manager = recognitionManagerRef.current;
    if (!manager) return;
    await new Promise<void>((resolve) => {
      const finish = () => {
        const fallbackTranscript = fallbackInterimTranscriptRef.current.replace(/\s+/g, ' ').trim();
        if (fallbackTranscript) {
          fallbackTranscriptRef.current = `${fallbackTranscriptRef.current} ${fallbackTranscript}`.replace(/\s+/g, ' ').trim();
        }
        manager.destroy();
        if (recognitionManagerRef.current === manager) recognitionManagerRef.current = null;
        fallbackInterimTranscriptRef.current = '';
        resolve();
      };
      try { manager.stop(); } catch { finish(); return; }
      setTimeout(finish, 450);
    });
  }, []);

  const releaseMicStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    mediaRecorderRef.current = null;
  }, []);

  const startFallbackRecognizer = useCallback(() => {
    if (!isSpeechRecognitionSupported()) return;
    try {
      const manager = new VoiceInputManager({ language: voiceLanguage, continuous: true, interimResults: true });
      manager.onResult((result) => {
        const chunk = result.transcript.replace(/\s+/g, ' ').trim();
        if (!chunk) return;
        if (result.isFinal) {
          fallbackTranscriptRef.current = `${fallbackTranscriptRef.current} ${chunk}`.replace(/\s+/g, ' ').trim();
          fallbackInterimTranscriptRef.current = '';
          // Live update draft for immediate feedback
          setVoiceTranscriptDraft(`${fallbackTranscriptRef.current}`.trim());
        } else {
          fallbackInterimTranscriptRef.current = chunk;
          setVoiceTranscriptDraft(`${fallbackTranscriptRef.current} ${chunk}`.trim());
        }
      });
      manager.onError(() => appendVoiceWarning('Browser transcript fallback unavailable.'));
      manager.start();
      recognitionManagerRef.current = manager;
    } catch { }
  }, [appendVoiceWarning, voiceLanguage]);

  const transcribeRecordedAudio = useCallback(async (audioBlob: Blob, durationSeconds: number) => {
    setVoiceState('transcribing');
    setVoiceError(null);
    setVoiceWarnings([]);

    const formData = new FormData();
    const extension = extensionFromMimeType(audioBlob.type);
    formData.append('audio', audioBlob, `voice-input.${extension}`);
    formData.append('language', voiceLanguage);
    formData.append('durationSeconds', String(durationSeconds));
    const browserTranscript = `${fallbackTranscriptRef.current} ${fallbackInterimTranscriptRef.current}`.replace(/\s+/g, ' ').trim();
    if (browserTranscript) formData.append('browserTranscript', browserTranscript);

    try {
      const response = await fetch('/api/voice/stt', { method: 'POST', body: formData });
      const data: VoiceSttApiResponse = await response.json();

      if (!response.ok || !data.success || !data.data?.transcript) {
        // If server STT fails, fallback to browser transcript if available
        if (browserTranscript) {
          setVoiceTranscriptDraft(browserTranscript);
          setInputValue(browserTranscript); // Populate input
          setVoiceState('idle');
          setShowVoicePanel(false);
          return;
        }
        throw new Error(data.error || 'Voice transcription failed.');
      }
      setVoiceTranscriptDraft(data.data.transcript);
      setInputValue(data.data.transcript); // Populate input directly
      setVoiceState('idle');
      setShowVoicePanel(false);
    } catch (err) {
      setVoiceError(err instanceof Error ? err.message : 'Transcription failed.');
      setVoiceState('idle'); // Or stay in error state
    }
  }, [voiceLanguage]);

  const handleRecordingStopped = useCallback(async (mimeType: string) => {
    const durationSeconds = Math.max(1, Math.round((Date.now() - recordingStartMsRef.current) / 1000));
    setVoiceDurationSeconds(durationSeconds);
    const chunks = mediaChunksRef.current;
    releaseMicStream();

    if (!chunks.length) {
      setVoiceState('idle');
      setVoiceError('No audio captured.');
      return;
    }
    const audioBlob = new Blob(chunks, { type: mimeType || 'audio/webm' });
    recordedBlobRef.current = audioBlob;

    try {
      if (fallbackFinalizePromiseRef.current) {
        await fallbackFinalizePromiseRef.current;
        fallbackFinalizePromiseRef.current = null;
      }
      await transcribeRecordedAudio(audioBlob, durationSeconds);
    } catch (err) {
      setVoiceState('idle');
      setVoiceError(err instanceof Error ? err.message : 'Transcription failed.');
    }
  }, [releaseMicStream, transcribeRecordedAudio]);

  const startVoiceRecording = useCallback(async () => {
    if (isLoading || voiceState === 'recording' || voiceState === 'sending') return;
    setVoiceError(null);
    setVoiceWarnings([]);
    setVoiceTranscriptDraft('');
    setVoiceDurationSeconds(0);
    fallbackTranscriptRef.current = '';
    fallbackInterimTranscriptRef.current = '';
    fallbackFinalizePromiseRef.current = null;
    stopFallbackRecognizer();

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setVoiceError('Microphone not supported.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const mimeCandidates = ['audio/ogg;codecs=opus', 'audio/webm;codecs=opus', 'audio/webm'];
      const selectedMime = mimeCandidates.find((c) => MediaRecorder.isTypeSupported(c));
      const recorder = selectedMime ? new MediaRecorder(stream, { mimeType: selectedMime }) : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      mediaChunksRef.current = [];
      recordingStartMsRef.current = Date.now();

      recorder.ondataavailable = (e) => { if (e.data.size > 0) mediaChunksRef.current.push(e.data); };
      recorder.onstop = () => void handleRecordingStopped(recorder.mimeType || selectedMime || 'audio/webm');

      recorder.start(250);
      startFallbackRecognizer();
      setVoiceState('recording');
    } catch {
      releaseMicStream();
      setVoiceState('idle');
      setVoiceError('Microphone permission denied.');
    }
  }, [handleRecordingStopped, isLoading, releaseMicStream, startFallbackRecognizer, stopFallbackRecognizer, voiceState]);

  const stopVoiceRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    setVoiceState('transcribing');
    fallbackFinalizePromiseRef.current = finalizeFallbackRecognizer();
    recorder.stop();
  }, [finalizeFallbackRecognizer]);

  // -- Effects --
  useEffect(() => () => {
    stopFallbackRecognizer();
    releaseMicStream();
    stopPlayback();
    cleanupAudioCache();
    audioUrlRegistryRef.current.forEach((url) => URL.revokeObjectURL(url));
    audioUrlRegistryRef.current.clear();
  }, [cleanupAudioCache, releaseMicStream, stopFallbackRecognizer, stopPlayback]);

  // -- Text Message Handling --
  const handleSendTextMessage = async (providedQuestion?: string) => {
    const question = (providedQuestion ?? inputValue).trim();
    if (!question || isLoading) return;

    setError(null);
    // Optimistic User Message
    const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content: question, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);

    if (!providedQuestion) setInputValue('');

    setIsLoading(true);
    // Placeholder Thinking Message
    setMessages((prev) => [...prev, { id: `loading-${Date.now()}`, role: 'assistant', content: 'Thinking...', timestamp: new Date() }]);

    try {
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          userId: user?.uid || null,
          sessionId: isAuthenticated ? sessionId : undefined,
          provider: assistantProvider,
        }),
      });
      const data: AIQueryResponse = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to get response');

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.answer || 'I apologize, but I could not generate a response.',
        timestamp: new Date(),
      };
      setLastResponseMeta(data.meta || null);
      setMessages((prev) => prev.slice(0, -1).concat(assistantMessage));

      // Auto-generate audio for the response if needed
      // handleGenerateMessageAudio(assistantMessage); 
    } catch (textError) {
      setMessages((prev) => prev.slice(0, -1));
      setError(textError instanceof Error ? textError.message : 'Error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateMessageAudio = async (message: ChatMessage) => {
    if (activePlaybackId === message.id) {
      stopPlayback();
      return;
    }
    const cached = messageAudioById[message.id];
    if (cached) {
      try { await playMessageAudio(message.id, cached); } catch { setVoiceError('Unable to play cached audio.'); }
      return;
    }
    try {
      const response = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message.content, language: voiceLanguage, slow: slowSpeechMode }),
      });
      const data: VoiceTtsApiResponse = await response.json();
      if (!response.ok || !data.success || !data.data) throw new Error(data.error || 'Unable to generate voice response.');

      let generatedAudioUrl: string | null = null;
      if (data.data.audioBase64 && data.data.mimeType) {
        generatedAudioUrl = createAudioUrlFromBase64(data.data.audioBase64, data.data.mimeType);
      }
      const audioPayload: MessageVoiceAudio = {
        provider: data.data.provider,
        audioUrl: generatedAudioUrl,
        mimeType: data.data.mimeType,
        text: data.data.text,
        language: data.data.languageRequested,
        fallbackApplied: data.data.fallbackApplied,
        fallbackReason: data.data.fallbackReason,
      };
      cacheMessageAudio(message.id, audioPayload);
      await playMessageAudio(message.id, audioPayload);
    } catch (ttsError) {
      setVoiceError(ttsError instanceof Error ? ttsError.message : 'Unable to generate voice playback.');
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#052e16] via-[#064e3b] to-[#022c22] font-display text-gray-100 antialiased overflow-hidden h-screen flex flex-col relative w-full">
      <AssistantHeader language={voiceLanguage} setLanguage={(lang: string) => setVoiceLanguage(lang as VoiceLanguage)} />

      {/* Background Animations */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-blob pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-blob animation-delay-2000 pointer-events-none"></div>
      <div className="absolute top-[40%] left-[40%] w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] animate-blob animation-delay-4000 pointer-events-none"></div>

      <main className="flex-1 overflow-hidden relative flex flex-col items-center justify-between z-10 w-full max-w-5xl mx-auto px-4 lg:px-0">
        {messages.length === 0 ? (
          <WelcomeScreen onSuggestionClick={handleSendTextMessage} />
        ) : (
          <MessageList
            messages={messages}
            activeMessageId={activePlaybackId}
            isPlaying={!!activePlaybackId}
            onPlayAudio={handleGenerateMessageAudio}
            onStopAudio={stopPlayback}
          />
        )}

        <AssistantInput
          inputValue={inputValue}
          setInputValue={setInputValue}
          onSend={() => handleSendTextMessage()}
          isLoading={isLoading}
          onMicClick={() => {
            setShowVoicePanel(true);
            startVoiceRecording();
          }}
        />
      </main>

      <VoiceModal
        isOpen={showVoicePanel}
        onClose={() => {
          setShowVoicePanel(false);
          stopVoiceRecording();
          resetVoiceDraft();
        }}
        isListening={voiceState === 'recording'}
        transcript={voiceTranscriptDraft}
        onStop={stopVoiceRecording}
      />
    </div>
  );
}
