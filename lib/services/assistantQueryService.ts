import { generateFarmingAnswerWithMeta } from '@/lib/ai/groq';
import {
  buildFarmMemoryContext,
  getConversationContext,
  logAIInteraction,
  refreshLearnedPatterns,
  saveFarmInteractionMemory,
} from '@/lib/firebase/firestore';
import { AIQueryResponse, AssistantModelProvider } from '@/types';

export interface AssistantQueryInput {
  question: string;
  userId?: string | null;
  sessionId?: string;
  responseLanguageHint?: string | null;
  modelProvider?: AssistantModelProvider | null | string;
}

export interface AssistantQueryResult {
  success: boolean;
  answer: string | null;
  error: string | null;
  status: number;
  meta?: AIQueryResponse['meta'];
  context: {
    conversationContext: string[];
    farmMemoryContext: string[];
    sessionId: string;
  };
}

function validateQuestion(rawQuestion: unknown): { ok: true; question: string } | { ok: false; error: string; status: number } {
  if (!rawQuestion || typeof rawQuestion !== 'string') {
    return {
      ok: false,
      error: 'Question is required and must be a string',
      status: 400,
    };
  }

  const question = rawQuestion.trim();
  if (question.length === 0) {
    return {
      ok: false,
      error: 'Question cannot be empty',
      status: 400,
    };
  }

  if (question.length > 1500) {
    return {
      ok: false,
      error: 'Question is too long (max 1500 characters)',
      status: 400,
    };
  }

  return { ok: true, question };
}

function validateModelProvider(
  rawProvider: AssistantQueryInput['modelProvider']
): { ok: true; provider: AssistantModelProvider | null } | { ok: false; error: string; status: number } {
  if (rawProvider === null || rawProvider === undefined) {
    return { ok: true, provider: null };
  }

  if (typeof rawProvider !== 'string') {
    return {
      ok: false,
      error: 'Provider must be a string when provided',
      status: 400,
    };
  }

  const normalized = rawProvider.trim().toLowerCase();
  if (!normalized) {
    return { ok: true, provider: null };
  }

  if (normalized === 'ollama' || normalized === 'groq') {
    return { ok: true, provider: normalized };
  }

  return {
    ok: false,
    error: "Unsupported provider. Use 'ollama' or 'groq'.",
    status: 400,
  };
}

export async function runAssistantQuery(
  input: AssistantQueryInput,
  options?: {
    persistMemory?: boolean;
  }
): Promise<AssistantQueryResult> {
  const validation = validateQuestion(input.question);
  if (!validation.ok) {
    return {
      success: false,
      answer: null,
      error: validation.error,
      status: validation.status,
      context: {
        conversationContext: [],
        farmMemoryContext: [],
        sessionId: input.sessionId || `session-${Date.now()}`,
      },
    };
  }

  const question = validation.question;
  const providerValidation = validateModelProvider(input.modelProvider);
  if (!providerValidation.ok) {
    return {
      success: false,
      answer: null,
      error: providerValidation.error,
      status: providerValidation.status,
      context: {
        conversationContext: [],
        farmMemoryContext: [],
        sessionId: input.sessionId || `session-${Date.now()}`,
      },
    };
  }

  const userId = input.userId || null;
  const sessionId = input.sessionId || `session-${Date.now()}`;
  const persistMemory = options?.persistMemory ?? true;

  let conversationContext: string[] = [];
  let farmMemoryContext: string[] = [];

  if (userId && sessionId) {
    try {
      const [conversation, memory] = await Promise.all([
        getConversationContext(userId, sessionId, 3),
        buildFarmMemoryContext(userId),
      ]);

      conversationContext = conversation;
      farmMemoryContext = memory.promptContext;
    } catch (contextError) {
      console.error('Error fetching context for assistant query:', contextError);
    }
  }

  let answer: string;
  let meta: AIQueryResponse['meta'];

  try {
    const generation = await generateFarmingAnswerWithMeta(
      question,
      conversationContext,
      farmMemoryContext,
      {
        responseLanguageHint: input.responseLanguageHint,
        modelProvider: providerValidation.provider,
      }
    );
    answer = generation.text;
    meta = generation.meta;
  } catch (aiError) {
    console.error('Assistant generation error:', aiError);
    return {
      success: false,
      answer: null,
      error: aiError instanceof Error ? aiError.message : 'Failed to generate AI response',
      status: 500,
      context: {
        conversationContext,
        farmMemoryContext,
        sessionId,
      },
    };
  }

  if (persistMemory && userId) {
    logAIInteraction(userId, question, answer, sessionId, conversationContext, meta).catch((logError) => {
      console.error('Failed to log AI interaction:', logError);
    });

    saveFarmInteractionMemory(userId, question, answer, sessionId)
      .then(() => refreshLearnedPatterns(userId))
      .catch((memoryError) => {
        console.error('Failed to update farm memory:', memoryError);
      });
  }

  return {
    success: true,
    answer,
    error: null,
    status: 200,
    meta,
    context: {
      conversationContext,
      farmMemoryContext,
      sessionId,
    },
  };
}
