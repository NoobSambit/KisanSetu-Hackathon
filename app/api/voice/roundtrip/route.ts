import { NextRequest, NextResponse } from 'next/server';
import { runAssistantQuery } from '@/lib/services/assistantQueryService';
import { synthesizeSpeech, transcribeSpeech } from '@/lib/services/voiceService';
import { VoiceRoundtripApiResponse } from '@/types';

export const runtime = 'nodejs';

function parseOptionalNumber(value: FormDataEntryValue | null): number | undefined {
  if (typeof value !== 'string') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseBoolean(value: FormDataEntryValue | null, fallback: boolean): boolean {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'y'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'n'].includes(normalized)) return false;
  return fallback;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const audioEntry = formData.get('audio');
    const language = typeof formData.get('language') === 'string' ? String(formData.get('language')) : 'hi-IN';
    const ttsLanguage =
      typeof formData.get('ttsLanguage') === 'string' ? String(formData.get('ttsLanguage')) : language;
    const browserTranscript =
      typeof formData.get('browserTranscript') === 'string'
        ? String(formData.get('browserTranscript'))
        : undefined;
    const assistantProvider =
      typeof formData.get('assistantProvider') === 'string'
        ? String(formData.get('assistantProvider'))
        : null;
    const durationSeconds = parseOptionalNumber(formData.get('durationSeconds'));
    const userId = typeof formData.get('userId') === 'string' ? String(formData.get('userId')) : null;
    const sessionId =
      typeof formData.get('sessionId') === 'string'
        ? String(formData.get('sessionId'))
        : `voice-session-${Date.now()}`;
    const slowSpeech = parseBoolean(formData.get('slowSpeech'), false);

    let audioBuffer: Buffer | undefined;
    let mimeType: string | undefined;

    if (audioEntry instanceof File) {
      const buffer = await audioEntry.arrayBuffer();
      audioBuffer = Buffer.from(buffer);
      mimeType = audioEntry.type || undefined;
    }

    const sttResult = await transcribeSpeech({
      audioBuffer,
      mimeType,
      language,
      durationSeconds,
      browserTranscript,
    });

    if (!sttResult.success || !sttResult.transcript) {
      const response: VoiceRoundtripApiResponse = {
        success: false,
        error: sttResult.error || 'Failed to transcribe user speech.',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const assistantResult = await runAssistantQuery({
      question: sttResult.transcript,
      userId,
      sessionId,
      responseLanguageHint: language,
      modelProvider: assistantProvider,
    });

    if (!assistantResult.success || !assistantResult.answer) {
      const response: VoiceRoundtripApiResponse = {
        success: false,
        error: assistantResult.error || 'Assistant response generation failed.',
      };
      return NextResponse.json(response, { status: assistantResult.status || 500 });
    }

    const ttsResult = await synthesizeSpeech({
      text: assistantResult.answer,
      language: ttsLanguage,
      slow: slowSpeech,
    });

    if (!ttsResult.success) {
      const response: VoiceRoundtripApiResponse = {
        success: false,
        error: ttsResult.error || 'Failed to synthesize assistant response.',
      };
      return NextResponse.json(response, { status: 500 });
    }

    const warnings: string[] = [];
    if (sttResult.fallbackApplied && sttResult.fallbackReason) {
      warnings.push(`STT fallback used: ${sttResult.fallbackReason}`);
    }
    if (ttsResult.fallbackApplied && ttsResult.fallbackReason) {
      warnings.push(`TTS fallback used: ${ttsResult.fallbackReason}`);
    }
    if (ttsResult.provider === 'browser_speech_fallback') {
      warnings.push('No server-side speech audio returned; client speech synthesis is required.');
    }

    const response: VoiceRoundtripApiResponse = {
      success: true,
      data: {
        transcript: sttResult.transcript,
        transcriptConfidence: sttResult.confidence,
        sttProvider: sttResult.provider,
        answer: assistantResult.answer,
        answerMeta: assistantResult.meta,
        tts: {
          provider: ttsResult.provider,
          languageRequested: ttsResult.languageRequested,
          languageUsed: ttsResult.languageUsed,
          fallbackApplied: ttsResult.fallbackApplied,
          fallbackReason: ttsResult.fallbackReason,
          mimeType: ttsResult.mimeType,
          audioBase64: ttsResult.audioBase64,
          text: assistantResult.answer,
        },
        warnings,
      },
      error: null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Voice roundtrip route error:', error);
    const response: VoiceRoundtripApiResponse = {
      success: false,
      error: 'Failed to process voice roundtrip request.',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed. Use POST with multipart form-data.',
    },
    { status: 405 }
  );
}
