/**
 * AI Assistant Page (Premium UI Revamp)
 *
 * - Aesthetic: Modern, clean, "iMessage/ChatGPT" style.
 * - Interaction: Smooth animations, glassmorphism, responsive.
 * - Features: Voice interaction with visual feedback, rich message bubbles.
 */
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
import {
  Bot,
  Mic,
  Send,
  X,
  StopCircle,
  Play,
  Square,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Command,
  ChevronDown,
  Volume2,
  MoreHorizontal
} from 'lucide-react';

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
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

const VOICE_PRESET_QUERIES = [
  'Aaj ka weather aur irrigation advice?',
  'Tomato mandi prices kya hain?',
  'Leaf disease early signs?',
  'Best schemes for my farm?',
];

const VOICE_LANGUAGE_OPTIONS: Array<{ value: VoiceLanguage; label: string }> = [
  { value: 'hi-IN', label: 'Hindi' },
  { value: 'en-IN', label: 'English' },
  { value: 'mr-IN', label: 'Marathi' },
  { value: 'bn-IN', label: 'Bengali' },
  { value: 'ta-IN', label: 'Tamil' },
  { value: 'te-IN', label: 'Telugu' },
  { value: 'gu-IN', label: 'Gujarati' },
  { value: 'kn-IN', label: 'Kannada' },
  { value: 'ml-IN', label: 'Malayalam' },
  { value: 'pa-IN', label: 'Punjabi' },
  { value: 'ur-IN', label: 'Urdu' },
  { value: 'or-IN', label: 'Odia' },
  { value: 'as-IN', label: 'Assamese' },
];

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
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

  // -- Recognizer Logic (simplified for brevity, keeping core) --
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
      // Short timeout to allow final events
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
        } else {
          fallbackInterimTranscriptRef.current = chunk;
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

    const response = await fetch('/api/voice/stt', { method: 'POST', body: formData });
    const data: VoiceSttApiResponse = await response.json();

    if (!response.ok || !data.success || !data.data?.transcript) {
      throw new Error(data.error || 'Voice transcription failed.');
    }
    setVoiceTranscriptDraft(data.data.transcript);
    setVoiceState('review');
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
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { inputRef.current?.focus(); }, []);
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
    const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content: question, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    if (!providedQuestion) setInputValue('');

    setIsLoading(true);
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
    } catch (textError) {
      setMessages((prev) => prev.slice(0, -1));
      setError(textError instanceof Error ? textError.message : 'Error occurred');
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // -- Roundtrip --
  const handleSendVoiceRoundtrip = async () => {
    const transcript = voiceTranscriptDraft.trim();
    if (!transcript || isLoading) return;

    setVoiceState('sending');
    setVoiceError(null);
    setError(null);

    const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content: transcript, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setMessages((prev) => [...prev, { id: `loading-${Date.now()}`, role: 'assistant', content: 'Thinking...', timestamp: new Date() }]);
    setIsLoading(true);

    try {
      const formData = new FormData();
      if (recordedBlobRef.current) {
        formData.append('audio', recordedBlobRef.current, `voice-roundtrip.${extensionFromMimeType(recordedBlobRef.current.type)}`);
      }
      formData.append('browserTranscript', transcript);
      formData.append('language', voiceLanguage);
      formData.append('ttsLanguage', voiceLanguage);
      formData.append('assistantProvider', assistantProvider);
      formData.append('durationSeconds', String(Math.max(1, voiceDurationSeconds)));
      formData.append('slowSpeech', slowSpeechMode ? 'true' : 'false');
      if (isAuthenticated && user?.uid) formData.append('userId', user.uid);
      formData.append('sessionId', sessionId);

      const response = await fetch('/api/voice/roundtrip', { method: 'POST', body: formData });
      const data: VoiceRoundtripApiResponse = await response.json();

      if (!response.ok || !data.success || !data.data) throw new Error(data.error || 'Voice roundtrip failed.');

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.data.answer,
        timestamp: new Date(),
      };

      setLastResponseMeta(data.data.answerMeta || null);
      setMessages((prev) => prev.slice(0, -1).concat(assistantMessage));
      setVoiceWarnings(data.data.warnings || []);

      let generatedAudioUrl: string | null = null;
      if (data.data.tts.audioBase64 && data.data.tts.mimeType) {
        generatedAudioUrl = createAudioUrlFromBase64(data.data.tts.audioBase64, data.data.tts.mimeType);
      }

      const audioPayload: MessageVoiceAudio = {
        provider: data.data.tts.provider,
        audioUrl: generatedAudioUrl,
        mimeType: data.data.tts.mimeType,
        text: data.data.tts.text,
        language: data.data.tts.languageRequested,
        fallbackApplied: data.data.tts.fallbackApplied,
        fallbackReason: data.data.tts.fallbackReason,
      };

      cacheMessageAudio(assistantMessage.id, audioPayload);
      await playMessageAudio(assistantMessage.id, audioPayload);

      resetVoiceDraft();
      setShowVoicePanel(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (roundtripError) {
      setMessages((prev) => prev.slice(0, -1));
      const message = roundtripError instanceof Error ? roundtripError.message : 'Voice interaction failed.';
      setVoiceError(message);
      setError(message);
      setVoiceState('review');
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
    // ... Simplified fetching logic would go here, omitting for brevity in this "UI focus" update ...
    // For now, let's assume if it's not cached, we can't play (or rely on existing implementation logic if we need robust TTS)
    // Actually, I should probably keep the implementation.
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

  /* -------------------------------------------------------------------------- */
  /*                               RENDER METHODS                               */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="relative flex flex-col h-[100dvh] bg-neutral-50 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-200/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary-100/40 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3" />
      </div>

      {/* -- Header Spacing (for Desktop Nav) -- */}
      <div className="shrink-0 h-[72px] lg:h-[88px]" />

      {/* -- Chat Area -- */}
      <div className="flex-1 w-full max-w-4xl mx-auto overflow-y-auto px-4 pb-32 pt-4 space-y-6 z-10 no-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-8 animate-fade-in opacity-0 fill-mode-forwards" style={{ animationDelay: '0.1s' }}>
            <div className="relative">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center animate-bounce-slow">
                <Sparkles className="w-10 h-10 text-primary-500 fill-primary-100" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-white">
                AI
              </div>
            </div>

            <div className="space-y-2 max-w-sm">
              <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">
                Namaste {user?.name?.split(' ')[0] || 'Farmer'}!
              </h2>
              <p className="text-neutral-500 leading-relaxed">
                I can help with <span className="text-primary-600 font-semibold">weather</span>, <span className="text-primary-600 font-semibold">crop prices</span>, and <span className="text-primary-600 font-semibold">schemes</span>.
              </p>
            </div>

            {/* Language Selector */}
            <div className="relative group">
              <select
                value={voiceLanguage}
                onChange={(e) => setVoiceLanguage(e.target.value as VoiceLanguage)}
                className="appearance-none bg-white border border-neutral-200 text-neutral-700 py-2.5 pl-4 pr-10 rounded-full text-sm font-medium shadow-sm hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 transition-all cursor-pointer"
              >
                {VOICE_LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              {VOICE_PRESET_QUERIES.map((query, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendTextMessage(query)}
                  className="text-left p-4 bg-white/60 backdrop-blur-sm border border-white/50 hover:bg-white hover:shadow-md hover:border-primary-200 rounded-2xl transition-all duration-300 group"
                >
                  <span className="text-sm font-medium text-neutral-700 group-hover:text-primary-700 transition-colors block">
                    {query}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isUser = message.role === 'user';
            return (
              <div
                key={message.id}
                className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up opacity-0 fill-mode-forwards`}
              >
                <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>

                  {/* Message Bubble */}
                  <div className={`
                      relative px-5 py-3.5 text-[15px] leading-relaxed shadow-sm
                      ${isUser
                      ? 'bg-primary-600 text-white rounded-2xl rounded-tr-sm'
                      : 'bg-white text-neutral-800 rounded-2xl rounded-tl-sm border border-neutral-200/60'
                    }
                    `}>
                    {message.content === 'Thinking...' ? (
                      <div className="flex items-end gap-1 h-5">
                        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"></span>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>

                  {/* Meta / Actions */}
                  <div className="mt-1.5 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity px-1">
                    {!isUser && message.content !== 'Thinking...' && (
                      <button
                        onClick={() => handleGenerateMessageAudio(message)}
                        className={`
                            p-1.5 rounded-full transition-colors
                            ${activePlaybackId === message.id
                            ? 'bg-primary-100 text-primary-600'
                            : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100'
                          }
                          `}
                      >
                        {activePlaybackId === message.id ? (
                          <StopCircle className="w-4 h-4" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    <span className="text-[10px] text-neutral-400 font-medium">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* -- Voice Panel Overlay -- */}
      {showVoicePanel && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/20 backdrop-blur-sm transition-all duration-300">
          <div className="w-full sm:max-w-md bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${voiceState === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-primary-500'}`} />
                <span className="font-bold text-neutral-800">
                  {voiceState === 'recording' ? 'Listening...' :
                    voiceState === 'transcribing' ? 'Processing...' :
                      voiceState === 'review' ? 'Review' : 'Voice Mode'}
                </span>
              </div>
              <button
                onClick={() => { setShowVoicePanel(false); resetVoiceDraft(); }}
                className="p-2 -mr-2 text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-neutral-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col items-center">
              {voiceState === 'recording' && (
                <div className="my-8 relative">
                  <div className="absolute inset-0 bg-primary-100 rounded-full animate-ping opacity-75" />
                  <div className="relative w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-xl shadow-primary-500/30">
                    <Mic className="w-10 h-10 text-white" />
                  </div>
                  <div className="mt-8 text-center text-sm font-medium text-neutral-500">
                    {voiceDurationSeconds}s
                  </div>
                </div>
              )}

              {voiceState === 'review' && (
                <div className="w-full space-y-4">
                  <div className="w-full p-4 bg-neutral-50 rounded-xl border border-neutral-100 min-h-[120px]">
                    <textarea
                      value={voiceTranscriptDraft}
                      onChange={(e) => setVoiceTranscriptDraft(e.target.value)}
                      className="w-full h-full bg-transparent border-none p-0 focus:ring-0 text-neutral-800 placeholder:text-neutral-400 resize-none text-lg"
                      placeholder="Speak now..."
                    />
                  </div>
                  {voiceError && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                      <AlertCircle className="w-4 h-4" />
                      {voiceError}
                    </div>
                  )}
                </div>
              )}

              {/* Controls */}
              <div className="w-full mt-6 grid grid-cols-2 gap-3">
                {voiceState === 'recording' ? (
                  <button
                    onClick={stopVoiceRecording}
                    className="col-span-2 w-full py-4 bg-neutral-900 text-white font-bold rounded-xl hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <StopCircle className="w-5 h-5" />
                    Stop Recording
                  </button>
                ) : (
                  <>
                    <button
                      onClick={startVoiceRecording}
                      className="py-3 px-4 bg-white border border-neutral-200 text-neutral-700 font-bold rounded-xl hover:bg-neutral-50 hover:border-neutral-300 transition-all"
                    >
                      Retry
                    </button>
                    <button
                      onClick={handleSendVoiceRoundtrip}
                      disabled={!voiceTranscriptDraft}
                      className="py-3 px-4 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-600/20 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                    >
                      Send <Send className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -- Input Bar -- */}
      {/* Fixed bottom, above mobile nav */}
      <div className="fixed bottom-0 lg:bottom-0 left-0 w-full z-40 px-4 pb-[calc(80px+env(safe-area-inset-bottom))] lg:pb-6 pointer-events-none">
        <div className="max-w-4xl mx-auto pointer-events-auto">
          <div className="relative group bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl shadow-neutral-900/10 rounded-[28px] p-2 flex items-end gap-2 transition-all duration-300 focus-within:bg-white focus-within:shadow-primary-900/5 focus-within:ring-1 focus-within:ring-primary-100">
            <button
              onClick={() => { setShowVoicePanel(true); startVoiceRecording(); }}
              className="shrink-0 w-11 h-11 bg-neutral-50 hover:bg-neutral-100 text-neutral-600 rounded-full flex items-center justify-center transition-colors border border-neutral-200/50"
            >
              <Mic className="w-5 h-5" />
            </button>

            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendTextMessage();
                }
              }}
              placeholder="Ask anything about farming..."
              className="flex-1 max-h-[120px] min-h-[44px] py-2.5 px-2 bg-transparent border-none focus:ring-0 text-neutral-800 placeholder:text-neutral-400 placeholder:font-medium resize-none text-[16px] leading-relaxed"
              rows={1}
            />

            <button
              onClick={() => handleSendTextMessage()}
              disabled={!inputValue.trim() || isLoading}
              className={`
                 shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300
                 ${inputValue.trim()
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20 hover:bg-primary-700 hover:scale-105 active:scale-95'
                  : 'bg-neutral-100 text-neutral-300 cursor-not-allowed'
                }
               `}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
