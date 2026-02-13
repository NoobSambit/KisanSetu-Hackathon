/**
 * LLM Abstraction Layer
 *
 * This module provides a clean abstraction over local and cloud LLM usage.
 * Assistant supports both local Ollama (default) and Groq (cloud).
 */

import Groq from 'groq-sdk';
import type { AssistantModelProvider } from '@/types';

export interface FarmingAnswerMeta {
  provider: AssistantModelProvider;
  model: string;
  latencyMs: number;
}

export interface FarmingAnswerResult {
  text: string;
  meta: FarmingAnswerMeta;
}

/**
 * System prompt that guides the AI's behavior
 */
const SYSTEM_PROMPT = `You are KisanSetu AI Assistant, a helpful farming advisor for Indian farmers.

Your role:
- Provide practical, accurate farming advice in the farmer's language
- Explain government schemes and agricultural programs clearly
- Suggest best practices for crop care, soil management, irrigation, and pest control
- Always prioritize farmer safety and sustainable practices

SAFETY GUIDELINES (CRITICAL):
- NEVER provide medical advice or suggest pesticides/chemicals without warning
- NEVER recommend dangerous practices or shortcuts
- For serious pest infestations, crop diseases, or soil issues: ALWAYS encourage consulting local agricultural officers or experts
- For health issues in livestock: ALWAYS recommend consulting a veterinarian
- If uncertain about any advice, explicitly state that and recommend expert consultation

Communication Style:
- Use very simple words in the response language so farmers with basic education can understand
- Avoid technical jargon; explain terms when necessary
- Break complex topics into simple steps
- Keep answers concise (prefer 6-8 short points unless the farmer asks for a detailed plan)
- Use examples from everyday farming when possible
- Be patient, respectful, and supportive
- Focus on Indian agricultural context
- Never ask the farmer to switch to English unless the farmer explicitly asks for English

Remember: You are helping hardworking farmers make better decisions for their livelihood. Their safety and success depend on accurate, responsible advice.`;

const LANGUAGE_HINT_BY_CODE: Record<string, string> = {
  en: 'English',
  'en-in': 'English',
  hi: 'Hindi',
  'hi-in': 'Hindi',
  mr: 'Marathi',
  'mr-in': 'Marathi',
  bn: 'Bengali',
  'bn-in': 'Bengali',
  ta: 'Tamil',
  'ta-in': 'Tamil',
  te: 'Telugu',
  'te-in': 'Telugu',
  gu: 'Gujarati',
  'gu-in': 'Gujarati',
  kn: 'Kannada',
  'kn-in': 'Kannada',
  ml: 'Malayalam',
  'ml-in': 'Malayalam',
  pa: 'Punjabi',
  'pa-in': 'Punjabi',
  ur: 'Urdu',
  'ur-in': 'Urdu',
  or: 'Odia',
  'or-in': 'Odia',
  as: 'Assamese',
  'as-in': 'Assamese',
};

const SCRIPT_LANGUAGE_PATTERNS: Array<{ language: string; pattern: RegExp }> = [
  { language: 'Bengali', pattern: /[\u0980-\u09FF]/ },
  { language: 'Devanagari (Hindi/Marathi)', pattern: /[\u0900-\u097F]/ },
  { language: 'Gujarati', pattern: /[\u0A80-\u0AFF]/ },
  { language: 'Gurmukhi (Punjabi)', pattern: /[\u0A00-\u0A7F]/ },
  { language: 'Tamil', pattern: /[\u0B80-\u0BFF]/ },
  { language: 'Odia', pattern: /[\u0B00-\u0B7F]/ },
  { language: 'Telugu', pattern: /[\u0C00-\u0C7F]/ },
  { language: 'Kannada', pattern: /[\u0C80-\u0CFF]/ },
  { language: 'Malayalam', pattern: /[\u0D00-\u0D7F]/ },
  { language: 'Urdu', pattern: /[\u0600-\u06FF]/ },
];

const ROMANIZED_LANGUAGE_KEYWORDS: Array<{ language: string; keywords: string[] }> = [
  {
    language: 'Bengali',
    keywords: ['ami', 'amar', 'korte', 'chai', 'dhan', 'chaas', 'chas', 'tumi'],
  },
  {
    language: 'Hindi',
    keywords: ['mera', 'meri', 'kheti', 'fasal', 'kya', 'kaise', 'chahiye', 'pani'],
  },
  {
    language: 'Marathi',
    keywords: ['majha', 'majhi', 'sheti', 'pahije', 'kasa', 'kashi', 'ahe'],
  },
  {
    language: 'Gujarati',
    keywords: ['hu', 'mare', 'shu', 'kheti', 'joiye', 'chhe'],
  },
  {
    language: 'Tamil',
    keywords: ['naan', 'enakku', 'vivasayam', 'venum', 'seyyanum'],
  },
  {
    language: 'Telugu',
    keywords: ['nenu', 'naaku', 'vyavasayam', 'cheyali', 'kavali'],
  },
  {
    language: 'Kannada',
    keywords: ['nanu', 'nanage', 'krishi', 'beku', 'madabeku'],
  },
  {
    language: 'Malayalam',
    keywords: ['njaan', 'enikku', 'krishi', 'venam', 'cheyyanam'],
  },
  {
    language: 'Punjabi',
    keywords: ['mainu', 'kheti', 'chahida', 'ki'],
  },
  {
    language: 'Odia',
    keywords: ['mu', 'mora', 'chasa', 'kariba', 'darkar'],
  },
  {
    language: 'Assamese',
    keywords: ['moi', 'amar', 'kheti', 'koribo', 'bisaru'],
  },
];

const ENGLISH_MARKER_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'can',
  'do',
  'farm',
  'for',
  'help',
  'how',
  'i',
  'in',
  'is',
  'me',
  'my',
  'need',
  'please',
  'should',
  'the',
  'to',
  'what',
  'when',
  'where',
  'why',
  'wheat',
]);

const SUPPORTED_ASSISTANT_PROVIDERS: AssistantModelProvider[] = ['ollama', 'groq'];

function normalizeAssistantProvider(
  provider: AssistantModelProvider | string | null | undefined
): AssistantModelProvider {
  if (provider && typeof provider === 'string') {
    const normalized = provider.trim().toLowerCase();
    if (SUPPORTED_ASSISTANT_PROVIDERS.includes(normalized as AssistantModelProvider)) {
      return normalized as AssistantModelProvider;
    }
  }

  return 'ollama';
}

function normalizeLanguageHint(languageHint: string | null | undefined): string | null {
  if (!languageHint || typeof languageHint !== 'string') {
    return null;
  }

  const normalized = languageHint.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (LANGUAGE_HINT_BY_CODE[normalized]) {
    return LANGUAGE_HINT_BY_CODE[normalized];
  }

  const compact = normalized.replace('_', '-');
  if (LANGUAGE_HINT_BY_CODE[compact]) {
    return LANGUAGE_HINT_BY_CODE[compact];
  }

  return languageHint.trim();
}

function inferLanguageFromScript(question: string): string | null {
  for (const candidate of SCRIPT_LANGUAGE_PATTERNS) {
    if (candidate.pattern.test(question)) {
      return candidate.language;
    }
  }
  return null;
}

function inferLanguageFromRomanizedText(question: string): string | null {
  const tokens: string[] = question.toLowerCase().match(/[a-z]+/g) || [];
  if (tokens.length === 0) return null;

  let bestLanguage: string | null = null;
  let bestScore = 0;

  for (const candidate of ROMANIZED_LANGUAGE_KEYWORDS) {
    let score = 0;
    for (const keyword of candidate.keywords) {
      if (tokens.includes(keyword)) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestLanguage = candidate.language;
    }
  }

  return bestScore >= 2 ? bestLanguage : null;
}

function containsSupportedNonLatinScript(text: string): boolean {
  return SCRIPT_LANGUAGE_PATTERNS.some((candidate) => candidate.pattern.test(text));
}

function inferLanguageFromEnglishText(question: string): string | null {
  if (containsSupportedNonLatinScript(question)) {
    return null;
  }

  const tokens: string[] = question.toLowerCase().match(/[a-z]+/g) || [];
  if (tokens.length === 0) {
    return null;
  }

  const englishHits = tokens.filter((token) => ENGLISH_MARKER_WORDS.has(token)).length;
  if (englishHits >= 2) {
    return 'English';
  }

  if (tokens.length <= 3 && englishHits >= 1) {
    return 'English';
  }

  if (tokens.length >= 4 && englishHits / tokens.length >= 0.35) {
    return 'English';
  }

  return null;
}

function inferLanguageFromQuestion(question: string): string | null {
  const scriptLanguage = inferLanguageFromScript(question);
  if (scriptLanguage) return scriptLanguage;

  const romanizedLanguage = inferLanguageFromRomanizedText(question);
  if (romanizedLanguage) return romanizedLanguage;

  return inferLanguageFromEnglishText(question);
}

function resolveResponseLanguage(
  userQuestion: string,
  explicitLanguageHint?: string | null
): string | null {
  const explicit = normalizeLanguageHint(explicitLanguageHint);
  if (explicit) {
    return explicit;
  }
  return inferLanguageFromQuestion(userQuestion);
}

function shouldForceLanguageRetry(answerText: string, targetLanguage: string | null): boolean {
  if (!targetLanguage) {
    return false;
  }

  if (/english/i.test(targetLanguage)) {
    return containsSupportedNonLatinScript(answerText);
  }

  const normalized = answerText.toLowerCase();
  return (
    /english/.test(normalized) &&
    /(speak|write|communicate|understand|language other than english|please use english)/.test(
      normalized
    )
  );
}

/**
 * Initialize the Groq client lazily
 */
let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      throw new Error(
        'GROQ_API_KEY is not set in environment variables. ' +
          'Please add it to your .env.local file.'
      );
    }

    groqClient = new Groq({ apiKey });
  }

  return groqClient;
}

/**
 * Build a prompt with conversation and farm memory context
 */
function buildPrompt(
  userQuestion: string,
  conversationContext?: string[],
  farmMemoryContext?: string[],
  responseLanguageHint?: string | null
): string {
  let fullPrompt = SYSTEM_PROMPT;
  const hasFarmMemory = !!farmMemoryContext && farmMemoryContext.length > 0;
  const targetLanguage = resolveResponseLanguage(userQuestion, responseLanguageHint);

  fullPrompt +=
    '\n\nResponse language policy (CRITICAL):' +
    '\n- Reply in the same language as the farmer\'s latest question.' +
    '\n- Do not ask the farmer to switch to English unless the farmer explicitly requests English.' +
    '\n- If the farmer uses Bengali/Hindi/Marathi/Tamil/Telugu/Gujarati/Kannada/Malayalam/Punjabi/Urdu/Odia/Assamese, respond in that language.' +
    '\n- If the farmer writes in Latin transliteration (example: "ami dhanchas korte chai"), keep the same language and do not force English.';
  if (targetLanguage) {
    fullPrompt += `\n- Target response language for this turn: ${targetLanguage}.`;
  }

  if (hasFarmMemory) {
    fullPrompt +=
      '\n\nPersonalization instruction:' +
      '\n- You MUST tailor advice to the farmer profile and learned patterns below.' +
      '\n- Mention at least one concrete farm detail (location/crop/soil/irrigation) in your answer.' +
      '\n- Do not ask generic profile questions if profile details are already provided.';
  }

  if (hasFarmMemory) {
    fullPrompt += '\n\nFarmer profile and memory context:\n';
    fullPrompt += farmMemoryContext.join('\n');
  }

  if (conversationContext && conversationContext.length > 0) {
    fullPrompt += '\n\nPrevious conversation:\n';
    fullPrompt += conversationContext.join('\n');
  }

  fullPrompt += `\n\nFarmer's Question: ${userQuestion}\n\nYour Response:`;

  return fullPrompt;
}

function createAbortController(timeoutMs: number): AbortController {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
  // Do not keep Node event loop alive solely for timeout cleanup.
  if (typeof timeoutHandle.unref === 'function') {
    timeoutHandle.unref();
  }
  return controller;
}

function isTimeoutLikeError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const normalized = `${error.name} ${error.message}`.toLowerCase();
  return (
    normalized.includes('abort') ||
    normalized.includes('timeout') ||
    normalized.includes('timed out')
  );
}

function mapAssistantGenerationError(error: Error): Error {
  const normalized = error.message.toLowerCase();

  if (normalized.includes('groq_api_key is not set')) {
    return new Error('Groq mode requires GROQ_API_KEY in server environment.');
  }

  if (
    normalized.includes('quota') ||
    normalized.includes('rate limit') ||
    normalized.includes('too many requests') ||
    normalized.includes('[429')
  ) {
    return new Error(
      'Groq request rate limit exceeded for this API key. Please try again later or switch to Local LLM.'
    );
  }

  if (
    normalized.includes('api key') ||
    normalized.includes('unauthorized') ||
    normalized.includes('authentication') ||
    normalized.includes('[401') ||
    normalized.includes('[403')
  ) {
    return new Error(
      'Groq API key is invalid or not authorized. Update GROQ_API_KEY or switch to Local LLM.'
    );
  }

  if (normalized.includes('model') && (normalized.includes('not found') || normalized.includes('not available'))) {
    return new Error(
      'The requested Groq model is not available. Check your GROQ_MODEL configuration.'
    );
  }

  return error;
}

async function executeWithTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    if (timeoutHandle && typeof timeoutHandle.unref === 'function') {
      timeoutHandle.unref();
    }
  });

  try {
    return await Promise.race([operation, timeoutPromise]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

function trimContextLines(
  lines: string[] | undefined,
  maxLines: number,
  maxCharsPerLine: number,
  fromEnd: boolean = false
): string[] {
  if (!lines || lines.length === 0) return [];

  const selected = fromEnd ? lines.slice(-maxLines) : lines.slice(0, maxLines);

  return selected
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => (line.length > maxCharsPerLine ? `${line.slice(0, maxCharsPerLine)}...` : line));
}

function mergeContinuation(baseText: string, continuationText: string): string {
  const base = baseText.trim();
  const continuation = continuationText.trim();

  if (!base) return continuation;
  if (!continuation) return base;
  if (base.endsWith(continuation)) return base;

  const maxOverlap = Math.min(120, base.length, continuation.length);
  for (let overlap = maxOverlap; overlap >= 20; overlap -= 1) {
    const baseSuffix = base.slice(-overlap).toLowerCase();
    const continuationPrefix = continuation.slice(0, overlap).toLowerCase();
    if (baseSuffix === continuationPrefix) {
      return `${base}${continuation.slice(overlap)}`;
    }
  }

  return `${base}${base.endsWith('\n') ? '' : ' '}${continuation}`;
}

function looksPossiblyTruncated(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 80) return false;
  if (/[.!?।]\s*$/.test(trimmed)) return false;
  if (/[,;:]\s*$/.test(trimmed)) return true;
  if (/\b(and|or|but|so|because|if|when|while|to|for|with|then|please|make)\s*$/i.test(trimmed)) {
    return true;
  }
  return !/[.!?।]/.test(trimmed.slice(-50));
}

interface InternalGenerationResult extends FarmingAnswerResult {
  stopReason?: string;
}

async function generateWithOllama(
  prompt: string,
  options?: {
    timeoutMs?: number;
    numPredict?: number;
  }
): Promise<InternalGenerationResult> {
  const startedAt = Date.now();
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
  const ollamaModel = process.env.OLLAMA_MODEL || 'qwen2.5:7b';
  const timeoutMs = options?.timeoutMs ?? 45000;
  const numPredict = options?.numPredict ?? 360;

  const controller = createAbortController(timeoutMs);
  const response = await fetch(`${ollamaBaseUrl}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: ollamaModel,
      prompt,
      stream: false,
      options: {
        temperature: 0.2,
        num_predict: numPredict,
      },
    }),
    signal: controller.signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Ollama request failed (${response.status}): ${errorText || response.statusText}`
    );
  }

  const data = await response.json();
  const text = data?.response;
  const doneReason = typeof data?.done_reason === 'string' ? data.done_reason : undefined;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Received empty response from local Ollama model');
  }

  return {
    text: text.trim(),
    meta: {
      provider: 'ollama',
      model: ollamaModel,
      latencyMs: Date.now() - startedAt,
    },
    stopReason: doneReason,
  };
}

async function generateWithGroq(
  prompt: string,
  options?: {
    timeoutMs?: number;
    maxTokens?: number;
  }
): Promise<InternalGenerationResult> {
  const startedAt = Date.now();
  const timeoutMs = options?.timeoutMs ?? 45000;
  const maxTokens = options?.maxTokens ?? 1024;
  const client = getGroqClient();
  
  // Use environment variable for model, fallback to llama-3.3-70b-versatile
  const groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  try {
    const chatCompletion = await executeWithTimeout(
      client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: groqModel,
        temperature: 0.2,
        max_tokens: maxTokens,
      }),
      timeoutMs,
      `Groq request timed out after ${timeoutMs}ms`
    );

    const text = chatCompletion.choices[0]?.message?.content;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error(`Received empty response from Groq model (${groqModel})`);
    }

    return {
      text: text.trim(),
      meta: {
        provider: 'groq',
        model: groqModel,
        latencyMs: Date.now() - startedAt,
      },
      stopReason: chatCompletion.choices[0]?.finish_reason || undefined,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw mapAssistantGenerationError(error);
    }
    throw error;
  }
}

type GenerationRunner = (
  prompt: string,
  options?: {
    timeoutMs?: number;
    numPredict?: number;
  }
) => Promise<InternalGenerationResult>;

function generationRunnerForProvider(provider: AssistantModelProvider): GenerationRunner {
  if (provider === 'groq') {
    return (prompt, options) =>
      generateWithGroq(prompt, {
        timeoutMs: options?.timeoutMs,
        maxTokens: options?.numPredict ? Math.min(options.numPredict * 3, 2048) : 1024,
      });
  }

  return generateWithOllama;
}

/**
 * Generate answer with selected assistant provider:
 * - `ollama` (default local model)
 * - `groq` (cloud model when explicitly requested)
 */
export async function generateFarmingAnswerWithMeta(
  userQuestion: string,
  conversationContext?: string[],
  farmMemoryContext?: string[],
  options?: {
    responseLanguageHint?: string | null;
    modelProvider?: AssistantModelProvider | string | null;
  }
): Promise<FarmingAnswerResult> {
  try {
    if (!userQuestion || userQuestion.trim().length === 0) {
      throw new Error('Question cannot be empty');
    }

    if (userQuestion.trim().length > 1500) {
      throw new Error('Question is too long. Please keep it under 1500 characters.');
    }

    const targetLanguage = resolveResponseLanguage(userQuestion, options?.responseLanguageHint);
    const selectedProvider = normalizeAssistantProvider(options?.modelProvider);
    const generateWithProvider = generationRunnerForProvider(selectedProvider);
    const fullPrompt = buildPrompt(
      userQuestion,
      conversationContext,
      farmMemoryContext,
      options?.responseLanguageHint
    );
    let generation: InternalGenerationResult;

    try {
      generation = await generateWithProvider(fullPrompt, {
        timeoutMs: selectedProvider === 'groq' ? 35000 : 45000,
        numPredict: 360,
      });
    } catch (primaryError) {
      if (!isTimeoutLikeError(primaryError)) {
        throw primaryError;
      }

      // Retry with reduced context to keep request reliable under load.
      const leanConversation = trimContextLines(conversationContext, 2, 180, true);
      const leanFarmMemory = trimContextLines(farmMemoryContext, 6, 180);
      const leanPrompt = buildPrompt(
        userQuestion,
        leanConversation,
        leanFarmMemory,
        options?.responseLanguageHint
      );

      generation = await generateWithProvider(leanPrompt, {
        timeoutMs: selectedProvider === 'groq' ? 30000 : 45000,
        numPredict: 280,
      });
    }

    if (generation.stopReason === 'length' || looksPossiblyTruncated(generation.text)) {
      const continuationPrompt =
        `${fullPrompt}\n\n` +
        'Assistant draft (possibly truncated):\n' +
        `${generation.text}\n\n` +
        'Continue from the exact stopping point without repeating prior lines.\n' +
        `Finish with a complete final sentence in ${targetLanguage || 'the same language as the question'}.\n\n` +
        'Continuation:';

      try {
        const continuation = await generateWithProvider(continuationPrompt, {
          timeoutMs: selectedProvider === 'groq' ? 22000 : 30000,
          numPredict: 220,
        });
        generation = {
          ...generation,
          text: mergeContinuation(generation.text, continuation.text),
          stopReason: continuation.stopReason ?? generation.stopReason,
        };
      } catch (continuationError) {
        if (!isTimeoutLikeError(continuationError)) {
          throw continuationError;
        }
      }
    }

    if (shouldForceLanguageRetry(generation.text, targetLanguage)) {
      const correctionPrompt =
        `${fullPrompt}\n\n` +
        'Correction instruction:\n' +
        `- Your previous draft did not follow the target response language (${targetLanguage}).\n` +
        `- Rewrite the response fully in ${targetLanguage}.\n` +
        '- Do not mention language switching.\n' +
        '- Give only practical farming guidance in simple words.\n\n' +
        'Corrected Response:';
      try {
        generation = await generateWithProvider(correctionPrompt, {
          timeoutMs: selectedProvider === 'groq' ? 22000 : 30000,
          numPredict: 260,
        });
      } catch (retryError) {
        // Keep the first successful answer if correction pass times out.
        if (!isTimeoutLikeError(retryError)) {
          throw retryError;
        }
      }
    }

    return {
      text: generation.text,
      meta: generation.meta,
    };
  } catch (error) {
    console.error('Error in generateFarmingAnswerWithMeta:', error);

    if (isTimeoutLikeError(error)) {
      throw new Error('Request timed out. Please try again.');
    }

    if (error instanceof Error) {
      throw mapAssistantGenerationError(error);
    }

    throw new Error('Failed to generate response. Please try again.');
  }
}

/**
 * Backward-compatible helper for older callers that only need answer text
 */
export async function generateFarmingAnswer(
  userQuestion: string,
  conversationContext?: string[],
  farmMemoryContext?: string[]
): Promise<string> {
  const result = await generateFarmingAnswerWithMeta(
    userQuestion,
    conversationContext,
    farmMemoryContext
  );

  return result.text;
}

/**
 * Simple benchmark helper for local model latency checks
 */
export async function benchmarkLocalModel(
  samplePrompt: string = 'Give 3 short tips for wheat crop disease prevention in Punjab.'
): Promise<FarmingAnswerResult> {
  const prompt = `${SYSTEM_PROMPT}\n\nFarmer's Question: ${samplePrompt}\n\nYour Response:`;
  return generateWithOllama(prompt);
}

/**
 * Generate AI Crop Plan (Phase 4)
 *
 * Creates personalized crop recommendations based on land, soil, season, and location
 */
export async function generateCropPlan(inputs: any): Promise<any> {
  try {
    const client = getGroqClient();
    const groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

    const prompt = `You are an expert agricultural advisor for Indian farmers. Generate a comprehensive crop plan based on the following inputs:

Land Size: ${inputs.landSize} ${inputs.landUnit}
Soil Type: ${inputs.soilType}
Season: ${inputs.season}
Location: ${inputs.location}, ${inputs.state}
Irrigation Available: ${inputs.irrigationAvailable ? 'Yes' : 'No'}
Budget: ${inputs.budget ? `₹${inputs.budget}` : 'Not specified'}

Please provide:
1. Top 3-5 crop recommendations with suitability scores (0-100)
2. Expected yield estimates
3. Investment requirements
4. Growing duration
5. Profit potential (low/medium/high)
6. Detailed growing schedule with stages
7. Resource requirements (seeds, fertilizers, water, labor)
8. General advice and warnings

Format your response as a valid JSON object with this structure:
{
  "recommendations": [
    {
      "cropName": "string",
      "suitabilityScore": number,
      "expectedYield": "string",
      "investmentRequired": "string",
      "duration": "string",
      "profitPotential": "low|medium|high",
      "reasons": ["string"],
      "warnings": ["string"]
    }
  ],
  "schedule": {
    "sowingPeriod": "string",
    "growthStages": [
      {
        "stage": "string",
        "duration": "string",
        "activities": ["string"]
      }
    ],
    "harvestPeriod": "string",
    "totalDuration": "string"
  },
  "resourcePlan": {
    "seeds": [{"type": "string", "quantity": "string", "cost": "string"}],
    "fertilizers": [{"type": "string", "quantity": "string", "timing": "string"}],
    "pesticides": [{"type": "string", "usage": "string"}],
    "laborRequirement": "string",
    "waterRequirement": "string",
    "equipmentNeeded": ["string"]
  },
  "aiAdvice": "string"
}

Important: Provide practical, India-specific advice. Consider local market conditions, seasonal patterns, and farming practices in ${inputs.state}.`;

    const chatCompletion = await client.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert agricultural advisor for Indian farmers. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: groqModel,
      temperature: 0.2,
      max_tokens: 2048,
    });

    const text = chatCompletion.choices[0]?.message?.content || '';

    // Try to parse JSON response
    try {
      // Clean up the response to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Failed to parse JSON from AI response');
    }

    // Fallback: return basic structure with text
    return {
      recommendations: [
        {
          cropName: 'Based on your inputs',
          suitabilityScore: 75,
          expectedYield: 'Varies',
          investmentRequired: 'Contact local agriculture office',
          duration: '3-4 months',
          profitPotential: 'medium',
          reasons: [text.substring(0, 200)],
          warnings: [],
        },
      ],
      schedule: {
        sowingPeriod: 'As per season',
        growthStages: [],
        harvestPeriod: 'After maturity',
        totalDuration: '3-4 months',
      },
      resourcePlan: {
        seeds: [],
        fertilizers: [],
        laborRequirement: 'Moderate',
        waterRequirement: 'Regular',
        equipmentNeeded: [],
      },
      aiAdvice: text,
    };
  } catch (error) {
    console.error('Error generating crop plan:', error);
    throw error;
  }
}
