import { NextRequest, NextResponse } from 'next/server';
import { transcribeSpeech } from '@/lib/services/voiceService';
import { VoiceSttApiResponse } from '@/types';

export const runtime = 'nodejs';

function parseOptionalNumber(value: FormDataEntryValue | null): number | undefined {
  if (typeof value !== 'string') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioEntry = formData.get('audio');
    const language = typeof formData.get('language') === 'string' ? String(formData.get('language')) : undefined;
    const browserTranscript =
      typeof formData.get('browserTranscript') === 'string'
        ? String(formData.get('browserTranscript'))
        : undefined;
    const durationSeconds = parseOptionalNumber(formData.get('durationSeconds'));

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
      const response: VoiceSttApiResponse = {
        success: false,
        error: sttResult.error || 'Failed to transcribe audio.',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const response: VoiceSttApiResponse = {
      success: true,
      data: {
        transcript: sttResult.transcript,
        confidence: sttResult.confidence,
        provider: sttResult.provider,
        languageRequested: sttResult.languageRequested,
        languageUsed: sttResult.languageUsed,
        fallbackApplied: sttResult.fallbackApplied,
        fallbackReason: sttResult.fallbackReason,
        guardrails: sttResult.guardrails,
      },
      error: null,
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Voice STT route error:', error);
    const response: VoiceSttApiResponse = {
      success: false,
      error: 'Failed to process STT request.',
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
