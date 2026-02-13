import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';

const VOICE_TEMP_PREFIX = 'kisansetu-voice-';
const DEFAULT_MAX_AUDIO_BYTES = 6 * 1024 * 1024;
const DEFAULT_MAX_AUDIO_SECONDS = 45;
const MAX_SERVER_TTS_CHARS = 1600;
const WHISPER_NATIVE_AUDIO_EXTENSIONS = new Set(['wav', 'ogg', 'mp3', 'flac']);

const SUPPORTED_AUDIO_MIME_TYPES = new Set([
  'audio/webm',
  'audio/webm;codecs=opus',
  'audio/ogg',
  'audio/ogg;codecs=opus',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/aac',
  'video/webm',
  'video/ogg',
  'video/mp4',
]);

const STT_LANGUAGE_MAP: Record<string, string> = {
  'hi-IN': 'hi',
  hi: 'hi',
  'en-IN': 'en',
  en: 'en',
  'mr-IN': 'mr',
  mr: 'mr',
  'bn-IN': 'bn',
  bn: 'bn',
  'ta-IN': 'ta',
  ta: 'ta',
  'te-IN': 'te',
  te: 'te',
  'gu-IN': 'gu',
  gu: 'gu',
  'kn-IN': 'kn',
  kn: 'kn',
  'ml-IN': 'ml',
  ml: 'ml',
  'pa-IN': 'pa',
  pa: 'pa',
  'ur-IN': 'ur',
  ur: 'ur',
  'or-IN': 'or',
  or: 'or',
  'as-IN': 'as',
  as: 'as',
};

const TTS_LANGUAGE_MAP: Record<string, string[]> = {
  'hi-IN': ['hi', 'en'],
  hi: ['hi', 'en'],
  'en-IN': ['en-us', 'en'],
  en: ['en-us', 'en'],
  'mr-IN': ['mr', 'hi', 'en'],
  mr: ['mr', 'hi', 'en'],
  'bn-IN': ['bn', 'hi', 'en'],
  bn: ['bn', 'hi', 'en'],
  'ta-IN': ['ta', 'hi', 'en'],
  ta: ['ta', 'hi', 'en'],
  'te-IN': ['te', 'hi', 'en'],
  te: ['te', 'hi', 'en'],
  'gu-IN': ['gu', 'hi', 'en'],
  gu: ['gu', 'hi', 'en'],
  'kn-IN': ['kn', 'hi', 'en'],
  kn: ['kn', 'hi', 'en'],
  'ml-IN': ['ml', 'hi', 'en'],
  ml: ['ml', 'hi', 'en'],
  'pa-IN': ['pa', 'hi', 'en'],
  pa: ['pa', 'hi', 'en'],
  'ur-IN': ['ur', 'hi', 'en'],
  ur: ['ur', 'hi', 'en'],
  'or-IN': ['or', 'hi', 'en'],
  or: ['or', 'hi', 'en'],
  'as-IN': ['as', 'hi', 'en'],
  as: ['as', 'hi', 'en'],
};

export interface VoiceGuardrails {
  maxAudioBytes: number;
  maxAudioSeconds: number;
  supportedMimeTypes: string[];
}

export interface SttRequestInput {
  audioBuffer?: Buffer;
  mimeType?: string | null;
  language?: string | null;
  durationSeconds?: number | null;
  browserTranscript?: string | null;
}

export interface SttResult {
  success: boolean;
  transcript: string | null;
  confidence: number;
  provider: 'whisper_cpp' | 'browser_fallback';
  languageRequested: string;
  languageUsed: string;
  fallbackApplied: boolean;
  fallbackReason: string | null;
  guardrails: VoiceGuardrails;
  error: string | null;
}

export interface TtsRequestInput {
  text: string;
  language?: string | null;
  slow?: boolean;
}

export interface TtsResult {
  success: boolean;
  provider: 'espeak' | 'browser_speech_fallback';
  languageRequested: string;
  languageUsed: string;
  fallbackApplied: boolean;
  fallbackReason: string | null;
  mimeType: string | null;
  audioBase64: string | null;
  error: string | null;
}

type IndicScript =
  | 'devanagari'
  | 'bengali'
  | 'gurmukhi'
  | 'gujarati'
  | 'odia'
  | 'tamil'
  | 'telugu'
  | 'kannada'
  | 'malayalam';

const INDIC_SCRIPT_BLOCK_START: Record<IndicScript, number> = {
  devanagari: 0x0900,
  bengali: 0x0980,
  gurmukhi: 0x0a00,
  gujarati: 0x0a80,
  odia: 0x0b00,
  tamil: 0x0b80,
  telugu: 0x0c00,
  kannada: 0x0c80,
  malayalam: 0x0d00,
};

const INDIC_LANGUAGE_SCRIPT_MAP: Record<string, IndicScript> = {
  hi: 'devanagari',
  mr: 'devanagari',
  bn: 'bengali',
  as: 'bengali',
  pa: 'gurmukhi',
  gu: 'gujarati',
  or: 'odia',
  ta: 'tamil',
  te: 'telugu',
  kn: 'kannada',
  ml: 'malayalam',
};

const INDIC_SCRIPT_LABELS: Record<IndicScript, string> = {
  devanagari: 'Devanagari',
  bengali: 'Bengali',
  gurmukhi: 'Gurmukhi',
  gujarati: 'Gujarati',
  odia: 'Odia',
  tamil: 'Tamil',
  telugu: 'Telugu',
  kannada: 'Kannada',
  malayalam: 'Malayalam',
};

interface TranscriptScriptNormalizationResult {
  transcript: string;
  applied: boolean;
  reason: string | null;
}

function getVoiceGuardrails(): VoiceGuardrails {
  const maxAudioBytes = Number(process.env.VOICE_MAX_AUDIO_BYTES || DEFAULT_MAX_AUDIO_BYTES);
  const maxAudioSeconds = Number(process.env.VOICE_MAX_AUDIO_SECONDS || DEFAULT_MAX_AUDIO_SECONDS);

  return {
    maxAudioBytes: Number.isFinite(maxAudioBytes) ? maxAudioBytes : DEFAULT_MAX_AUDIO_BYTES,
    maxAudioSeconds: Number.isFinite(maxAudioSeconds) ? maxAudioSeconds : DEFAULT_MAX_AUDIO_SECONDS,
    supportedMimeTypes: [...SUPPORTED_AUDIO_MIME_TYPES],
  };
}

function normalizeLanguage(language: string | null | undefined): string {
  if (!language) return 'hi-IN';
  return language.trim();
}

function normalizeSttLanguage(language: string | null | undefined): string {
  const normalized = normalizeLanguage(language);
  return STT_LANGUAGE_MAP[normalized] || STT_LANGUAGE_MAP[normalized.toLowerCase()] || 'hi';
}

function getTtsVoiceCandidates(language: string | null | undefined): string[] {
  const normalized = normalizeLanguage(language);
  return TTS_LANGUAGE_MAP[normalized] || TTS_LANGUAGE_MAP[normalized.toLowerCase()] || ['hi', 'en'];
}

function chooseTtsFallbackLanguage(language: string | null | undefined): string {
  const candidates = getTtsVoiceCandidates(language);
  return candidates[0] || 'hi';
}

function cleanTranscript(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeMimeType(mimeType: string | null | undefined): string {
  if (!mimeType) return '';

  const normalized = mimeType.trim().toLowerCase();
  if (!normalized) return '';

  const parts = normalized
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return '';

  const baseType = parts[0];
  const codecParam = parts.find((part) => part.startsWith('codecs='));
  return codecParam ? `${baseType};${codecParam}` : baseType;
}

function isSupportedAudioMimeType(mimeType: string): boolean {
  const normalized = normalizeMimeType(mimeType);
  if (!normalized) {
    return false;
  }

  if (SUPPORTED_AUDIO_MIME_TYPES.has(normalized)) {
    return true;
  }

  const baseType = normalized.split(';')[0];
  return SUPPORTED_AUDIO_MIME_TYPES.has(baseType);
}

function chooseAudioExtension(mimeType: string | null | undefined): string {
  const normalized = normalizeMimeType(mimeType);

  if (normalized.includes('ogg')) return 'ogg';
  if (normalized.includes('wav') || normalized.includes('wave')) return 'wav';
  if (normalized.includes('mpeg') || normalized.includes('mp3')) return 'mp3';
  if (normalized.includes('flac')) return 'flac';
  if (normalized.includes('mp4') || normalized.includes('m4a') || normalized.includes('aac')) return 'm4a';
  return 'webm';
}

function summarizeProviderError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Provider execution failed.';
  }

  const sanitized = error.message
    .replace(/\/tmp\/kisansetu-voice-[^\s/]+/g, '<temp-workspace>')
    .replace(/transcript\.txt/gi, 'transcript output')
    .replace(/\s+/g, ' ')
    .trim();

  if (!sanitized) {
    return 'Provider execution failed.';
  }

  return sanitized.slice(0, 240);
}

function baseLanguageCode(language: string): string {
  return language.trim().toLowerCase().split('-')[0];
}

function countScriptCharacters(text: string, script: IndicScript): number {
  const start = INDIC_SCRIPT_BLOCK_START[script];
  const end = start + 0x7f;
  let count = 0;

  for (const char of text) {
    const code = char.codePointAt(0);
    if (typeof code === 'number' && code >= start && code <= end) {
      count += 1;
    }
  }

  return count;
}

function transliterateDevanagariToIndic(text: string, targetScript: IndicScript): string {
  if (targetScript === 'devanagari') {
    return text;
  }

  const offset = INDIC_SCRIPT_BLOCK_START[targetScript] - INDIC_SCRIPT_BLOCK_START.devanagari;
  let output = '';

  for (const char of text) {
    const code = char.codePointAt(0);
    if (typeof code !== 'number') {
      output += char;
      continue;
    }

    // Danda/double-danda are shared punctuation; keep unchanged.
    if (code === 0x0964 || code === 0x0965) {
      output += char;
      continue;
    }

    if (code >= 0x0900 && code <= 0x097f) {
      output += String.fromCodePoint(code + offset);
      continue;
    }

    output += char;
  }

  return output;
}

function normalizeTranscriptScriptForLanguage(
  transcript: string,
  languageRequested: string
): TranscriptScriptNormalizationResult {
  const requestedBase = baseLanguageCode(languageRequested);
  const targetScript = INDIC_LANGUAGE_SCRIPT_MAP[requestedBase];

  if (!targetScript || targetScript === 'devanagari') {
    return {
      transcript,
      applied: false,
      reason: null,
    };
  }

  const devanagariCount = countScriptCharacters(transcript, 'devanagari');
  const targetCount = countScriptCharacters(transcript, targetScript);
  const needsNormalization = devanagariCount >= 3 && devanagariCount > targetCount * 2;

  if (!needsNormalization) {
    return {
      transcript,
      applied: false,
      reason: null,
    };
  }

  const normalizedTranscript = transliterateDevanagariToIndic(transcript, targetScript);
  if (normalizedTranscript === transcript) {
    return {
      transcript,
      applied: false,
      reason: null,
    };
  }

  return {
    transcript: normalizedTranscript,
    applied: true,
    reason: `Transcript display adjusted to ${INDIC_SCRIPT_LABELS[targetScript]} script for selected language '${languageRequested}'.`,
  };
}

function buildSuccessfulSttResult(params: {
  transcript: string;
  confidence: number;
  provider: 'whisper_cpp' | 'browser_fallback';
  languageRequested: string;
  languageUsed: string;
  fallbackApplied: boolean;
  fallbackReason: string | null;
  guardrails: VoiceGuardrails;
}): SttResult {
  const scriptNormalization = normalizeTranscriptScriptForLanguage(
    params.transcript,
    params.languageRequested
  );

  const reasons = [params.fallbackReason, scriptNormalization.reason]
    .map((reason) => (reason ? reason.trim() : ''))
    .filter(Boolean);

  return {
    success: true,
    transcript: scriptNormalization.transcript,
    confidence: params.confidence,
    provider: params.provider,
    languageRequested: params.languageRequested,
    languageUsed: params.languageUsed,
    fallbackApplied: params.fallbackApplied || scriptNormalization.applied,
    fallbackReason: reasons.length ? reasons.join(' ') : null,
    guardrails: params.guardrails,
    error: null,
  };
}

function shouldTranscodeForWhisper(extension: string): boolean {
  return !WHISPER_NATIVE_AUDIO_EXTENSIONS.has(extension);
}

function extractWhisperRuntimeError(output: string): string | null {
  if (!output) {
    return null;
  }

  const errorLines = output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^error:/i.test(line));

  if (!errorLines.length) {
    return null;
  }

  return errorLines.slice(0, 2).join(' ');
}

function runCommand(
  command: string,
  args: string[],
  options?: { cwd?: string }
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options?.cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (error) => {
      reject(error);
    });
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`${command} failed with exit code ${code}: ${stderr || stdout}`));
      }
    });
  });
}

async function withTempWorkspace<T>(handler: (workspace: string) => Promise<T>): Promise<T> {
  const workspace = await fs.mkdtemp(path.join(tmpdir(), VOICE_TEMP_PREFIX));
  try {
    return await handler(workspace);
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
}

function validateSttInput(input: SttRequestInput): { ok: true } | { ok: false; error: string } {
  const guardrails = getVoiceGuardrails();
  const transcript = input.browserTranscript ? cleanTranscript(input.browserTranscript) : '';

  if (!input.audioBuffer && transcript.length === 0) {
    return {
      ok: false,
      error: 'Audio input is required unless browser transcript fallback is provided.',
    };
  }

  if (input.audioBuffer) {
    if (input.audioBuffer.length === 0) {
      return { ok: false, error: 'Audio file is empty.' };
    }

    if (input.audioBuffer.length > guardrails.maxAudioBytes) {
      return {
        ok: false,
        error: `Audio file exceeds max size (${Math.floor(guardrails.maxAudioBytes / 1024 / 1024)}MB).`,
      };
    }

    if (input.mimeType && !isSupportedAudioMimeType(input.mimeType)) {
      return {
        ok: false,
        error: `Unsupported audio type '${input.mimeType}'. Allowed base types: webm, ogg, wav, mp3, mp4, aac.`,
      };
    }
  }

  if (typeof input.durationSeconds === 'number' && input.durationSeconds > guardrails.maxAudioSeconds) {
    return {
      ok: false,
      error: `Audio duration exceeds ${guardrails.maxAudioSeconds}s limit.`,
    };
  }

  return { ok: true };
}

function hasWhisperConfig(): boolean {
  return Boolean(process.env.WHISPER_CPP_BIN && process.env.WHISPER_CPP_MODEL);
}

async function prepareWhisperInputAudio(params: {
  workspace: string;
  sourcePath: string;
  sourceExtension: string;
}): Promise<string> {
  if (!shouldTranscodeForWhisper(params.sourceExtension)) {
    return params.sourcePath;
  }

  const ffmpegBin = process.env.VOICE_FFMPEG_BIN || 'ffmpeg';
  const wavPath = path.join(params.workspace, 'input-audio.wav');

  try {
    await runCommand(ffmpegBin, [
      '-y',
      '-hide_banner',
      '-loglevel',
      'error',
      '-i',
      params.sourcePath,
      '-vn',
      '-sn',
      '-dn',
      '-ac',
      '1',
      '-ar',
      '16000',
      '-f',
      'wav',
      wavPath,
    ]);
  } catch (error) {
    const reason = summarizeProviderError(error);
    throw new Error(
      `Unable to convert '${params.sourceExtension}' audio to WAV for whisper runtime (${reason}). Install ffmpeg or pass browser transcript fallback.`
    );
  }

  return wavPath;
}

async function transcribeWithWhisperCpp(input: {
  audioBuffer: Buffer;
  language: string;
  mimeType?: string | null;
}): Promise<{ transcript: string; confidence: number }> {
  const whisperBin = process.env.WHISPER_CPP_BIN as string;
  const whisperModel = process.env.WHISPER_CPP_MODEL as string;

  return withTempWorkspace(async (workspace) => {
    const extension = chooseAudioExtension(input.mimeType);
    const sourceAudioPath = path.join(workspace, `input-audio.${extension}`);
    const outputPrefix = path.join(workspace, 'transcript');
    const transcriptPath = `${outputPrefix}.txt`;

    await fs.writeFile(sourceAudioPath, input.audioBuffer);
    const whisperAudioPath = await prepareWhisperInputAudio({
      workspace,
      sourcePath: sourceAudioPath,
      sourceExtension: extension,
    });

    const args = [
      '-m',
      whisperModel,
      '-f',
      whisperAudioPath,
      '-l',
      input.language,
      '-otxt',
      '-of',
      outputPrefix,
    ];

    const execution = await runCommand(whisperBin, args);

    let rawTranscript = '';
    try {
      rawTranscript = await fs.readFile(transcriptPath, 'utf-8');
    } catch (error) {
      const whisperError = extractWhisperRuntimeError(execution.stderr || execution.stdout);
      if (whisperError) {
        throw new Error(whisperError);
      }
      throw error;
    }

    const transcript = cleanTranscript(rawTranscript);

    if (!transcript) {
      throw new Error('Whisper transcription returned empty output.');
    }

    return {
      transcript,
      confidence: 0.72,
    };
  });
}

async function runEspeak(text: string, language: string, slow: boolean): Promise<{ audioBase64: string; languageUsed: string }> {
  const ttsBin = process.env.VOICE_TTS_BIN || 'espeak-ng';
  const speed = slow ? '120' : '155';
  const voiceCandidates = getTtsVoiceCandidates(language);

  return withTempWorkspace(async (workspace) => {
    const outputPath = path.join(workspace, 'speech.wav');
    let lastError: Error | null = null;

    for (const voice of voiceCandidates) {
      try {
        const args = ['-v', voice, '-s', speed, '-w', outputPath, text];
        await runCommand(ttsBin, args);
        const audioBuffer = await fs.readFile(outputPath);
        return { audioBase64: audioBuffer.toString('base64'), languageUsed: voice };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown espeak failure');
      }
    }

    // Fallback for systems where only `espeak` exists.
    if (ttsBin === 'espeak-ng') {
      for (const voice of voiceCandidates) {
        try {
          const args = ['-v', voice, '-s', speed, '-w', outputPath, text];
          await runCommand('espeak', args);
          const audioBuffer = await fs.readFile(outputPath);
          return { audioBase64: audioBuffer.toString('base64'), languageUsed: voice };
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown espeak failure');
        }
      }
    }

    throw lastError || new Error('No usable espeak voice found.');
  });
}

export async function transcribeSpeech(input: SttRequestInput): Promise<SttResult> {
  const validation = validateSttInput(input);
  const guardrails = getVoiceGuardrails();
  const languageRequested = normalizeLanguage(input.language);
  const languageUsed = normalizeSttLanguage(input.language);
  const browserTranscript = input.browserTranscript ? cleanTranscript(input.browserTranscript) : '';

  if (!validation.ok) {
    return {
      success: false,
      transcript: null,
      confidence: 0,
      provider: 'browser_fallback',
      languageRequested,
      languageUsed,
      fallbackApplied: false,
      fallbackReason: null,
      guardrails,
      error: validation.error,
    };
  }

  const sttProvider = (process.env.VOICE_STT_PROVIDER || 'auto').toLowerCase();
  const canUseWhisper =
    sttProvider !== 'browser_fallback' &&
    sttProvider !== 'none' &&
    hasWhisperConfig() &&
    Boolean(input.audioBuffer);

  if (canUseWhisper && input.audioBuffer) {
    try {
      const whisperResult = await transcribeWithWhisperCpp({
        audioBuffer: input.audioBuffer,
        language: languageUsed,
        mimeType: input.mimeType,
      });

      return buildSuccessfulSttResult({
        transcript: whisperResult.transcript,
        confidence: whisperResult.confidence,
        provider: 'whisper_cpp',
        languageRequested,
        languageUsed,
        fallbackApplied: false,
        fallbackReason: null,
        guardrails,
      });
    } catch (error) {
      const providerFailure = summarizeProviderError(error);

      if (/unknown language/i.test(providerFailure)) {
        try {
          const autoWhisperResult = await transcribeWithWhisperCpp({
            audioBuffer: input.audioBuffer,
            language: 'auto',
            mimeType: input.mimeType,
          });

          return buildSuccessfulSttResult({
            transcript: autoWhisperResult.transcript,
            confidence: autoWhisperResult.confidence,
            provider: 'whisper_cpp',
            languageRequested,
            languageUsed: 'auto',
            fallbackApplied: true,
            fallbackReason: `Whisper language '${languageUsed}' is unavailable; auto-detect mode was used.`,
            guardrails,
          });
        } catch (autoFallbackError) {
          const autoFailure = summarizeProviderError(autoFallbackError);
          const combinedFailure = `${providerFailure}; auto-detect retry failed (${autoFailure})`;

          if (browserTranscript) {
            return buildSuccessfulSttResult({
              transcript: browserTranscript,
              confidence: 0.65,
              provider: 'browser_fallback',
              languageRequested,
              languageUsed,
              fallbackApplied: true,
              fallbackReason: combinedFailure,
              guardrails,
            });
          }

          return {
            success: false,
            transcript: null,
            confidence: 0,
            provider: 'browser_fallback',
            languageRequested,
            languageUsed,
            fallbackApplied: true,
            fallbackReason: combinedFailure,
            guardrails,
            error: `Speech transcription failed in local Whisper runtime (${combinedFailure}). Retry with clearer audio or enable browser transcript fallback.`,
          };
        }
      }

      if (browserTranscript) {
        return buildSuccessfulSttResult({
          transcript: browserTranscript,
          confidence: 0.65,
          provider: 'browser_fallback',
          languageRequested,
          languageUsed,
          fallbackApplied: true,
          fallbackReason: providerFailure,
          guardrails,
        });
      }

      const whisperConfigured = hasWhisperConfig();
      return {
        success: false,
        transcript: null,
        confidence: 0,
        provider: 'browser_fallback',
        languageRequested,
        languageUsed,
        fallbackApplied: true,
        fallbackReason: providerFailure,
        guardrails,
        error: whisperConfigured
          ? `Speech transcription failed in local Whisper runtime (${providerFailure}). Retry with clearer audio or enable browser transcript fallback.`
          : 'Speech transcription failed. Configure WHISPER_CPP_BIN and WHISPER_CPP_MODEL or provide browser transcript fallback.',
      };
    }
  }

  if (browserTranscript) {
    const whisperConfigured = hasWhisperConfig();
    const fallbackReason = whisperConfigured
      ? input.audioBuffer
        ? 'Configured STT provider was not used in this request.'
        : 'No audio payload provided; used browser transcript fallback.'
      : 'Local Whisper config missing; used browser transcript fallback.';

    return buildSuccessfulSttResult({
      transcript: browserTranscript,
      confidence: 0.62,
      provider: 'browser_fallback',
      languageRequested,
      languageUsed,
      fallbackApplied: true,
      fallbackReason,
      guardrails,
    });
  }

  const whisperConfigured = hasWhisperConfig();
  const sttProviderDisabled = sttProvider === 'browser_fallback' || sttProvider === 'none';

  if (sttProviderDisabled) {
    return {
      success: false,
      transcript: null,
      confidence: 0,
      provider: 'browser_fallback',
      languageRequested,
      languageUsed,
      fallbackApplied: true,
      fallbackReason: `VOICE_STT_PROVIDER=${sttProvider} disables server-side STT.`,
      guardrails,
      error:
        'Server STT is disabled by VOICE_STT_PROVIDER. Provide browser transcript fallback or set VOICE_STT_PROVIDER=auto.',
    };
  }

  return {
    success: false,
    transcript: null,
    confidence: 0,
    provider: 'browser_fallback',
    languageRequested,
    languageUsed,
    fallbackApplied: true,
    fallbackReason: whisperConfigured ? 'Audio buffer was not available for server STT.' : 'Local Whisper config missing.',
    guardrails,
    error: whisperConfigured
      ? 'Server STT requires an audio payload. Pass audio or include browser transcript fallback.'
      : 'Local STT is unavailable. Add WHISPER_CPP_BIN + WHISPER_CPP_MODEL or pass browser transcript fallback.',
  };
}

export async function synthesizeSpeech(input: TtsRequestInput): Promise<TtsResult> {
  const languageRequested = normalizeLanguage(input.language);
  const text = input.text?.trim();

  if (!text) {
    return {
      success: false,
      provider: 'browser_speech_fallback',
      languageRequested,
      languageUsed: chooseTtsFallbackLanguage(languageRequested),
      fallbackApplied: false,
      fallbackReason: null,
      mimeType: null,
      audioBase64: null,
      error: 'Text is required for speech synthesis.',
    };
  }

  if (text.length > MAX_SERVER_TTS_CHARS) {
    return {
      success: true,
      provider: 'browser_speech_fallback',
      languageRequested,
      languageUsed: chooseTtsFallbackLanguage(languageRequested),
      fallbackApplied: true,
      fallbackReason: `Server speech generation limit is ${MAX_SERVER_TTS_CHARS} characters; using browser speech playback for this longer response.`,
      mimeType: null,
      audioBase64: null,
      error: null,
    };
  }

  const ttsProvider = (process.env.VOICE_TTS_PROVIDER || 'auto').toLowerCase();
  const canUseEspeak = ttsProvider !== 'browser_fallback' && ttsProvider !== 'none';

  if (canUseEspeak) {
    try {
      const espeakResult = await runEspeak(text, languageRequested, Boolean(input.slow));
      return {
        success: true,
        provider: 'espeak',
        languageRequested,
        languageUsed: espeakResult.languageUsed,
        fallbackApplied: false,
        fallbackReason: null,
        mimeType: 'audio/wav',
        audioBase64: espeakResult.audioBase64,
        error: null,
      };
    } catch (error) {
      return {
        success: true,
        provider: 'browser_speech_fallback',
        languageRequested,
        languageUsed: chooseTtsFallbackLanguage(languageRequested),
        fallbackApplied: true,
        fallbackReason: error instanceof Error ? error.message : 'eSpeak synthesis failed.',
        mimeType: null,
        audioBase64: null,
        error: null,
      };
    }
  }

  return {
    success: true,
    provider: 'browser_speech_fallback',
    languageRequested,
    languageUsed: chooseTtsFallbackLanguage(languageRequested),
    fallbackApplied: true,
    fallbackReason: 'VOICE_TTS_PROVIDER is configured to browser fallback.',
    mimeType: null,
    audioBase64: null,
    error: null,
  };
}
