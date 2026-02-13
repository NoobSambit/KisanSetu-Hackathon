import { NextRequest, NextResponse } from 'next/server';
import { synthesizeSpeech } from '@/lib/services/voiceService';
import { VoiceTtsApiResponse } from '@/types';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text = typeof body.text === 'string' ? body.text : '';
    const language = typeof body.language === 'string' ? body.language : undefined;
    const slow = Boolean(body.slow);

    const ttsResult = await synthesizeSpeech({
      text,
      language,
      slow,
    });

    if (!ttsResult.success) {
      const response: VoiceTtsApiResponse = {
        success: false,
        error: ttsResult.error || 'Failed to synthesize speech.',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const response: VoiceTtsApiResponse = {
      success: true,
      data: {
        provider: ttsResult.provider,
        languageRequested: ttsResult.languageRequested,
        languageUsed: ttsResult.languageUsed,
        fallbackApplied: ttsResult.fallbackApplied,
        fallbackReason: ttsResult.fallbackReason,
        mimeType: ttsResult.mimeType,
        audioBase64: ttsResult.audioBase64,
        text,
      },
      error: null,
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Voice TTS route error:', error);
    const response: VoiceTtsApiResponse = {
      success: false,
      error: 'Failed to process TTS request.',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed. Use POST with JSON body.',
    },
    { status: 405 }
  );
}
