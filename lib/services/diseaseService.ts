/**
 * Disease Detection Service (Phase 3)
 *
 * Handles crop disease detection using AI models
 * Abstraction layer for disease prediction and treatment recommendations
 */

import {
  ServiceResponse,
  createSuccessResponse,
  createErrorResponse,
  handleAsyncOperation,
} from '../utils/errorHandler';
import { cache } from '../utils/cache';

export interface DiseasePrediction {
  prediction: string;
  confidence: number;
  treatment: string;
  scientificName?: string;
  severity?: 'low' | 'medium' | 'high';
  preventionTips?: string[];
}

/**
 * Predict disease from image using HuggingFace Inference API
 * Using a pretrained plant disease detection model
 */
export async function predictDiseaseFromImage(
  imageData: string | Buffer
): Promise<ServiceResponse<DiseasePrediction>> {
  try {
    // Check cache first (based on image hash - simplified for now)
    const cacheKey = `disease:${typeof imageData === 'string' ? imageData.substring(0, 50) : 'buffer'}`;

    const cached = cache.get<DiseasePrediction>(cacheKey);
    if (cached) {
      return createSuccessResponse(cached);
    }

    // For MVP, we'll use a mock prediction system
    // In production, integrate with HuggingFace API or TensorFlow.js model
    const prediction = await mockDiseasePrediction(imageData);

    // Cache result for 1 hour
    cache.set(cacheKey, prediction, 3600);

    return createSuccessResponse(prediction);
  } catch (error) {
    console.error('Disease prediction error:', error);
    return createErrorResponse(
      'Failed to analyze image. Please try again.',
      'PREDICTION_FAILED'
    );
  }
}

/**
 * Mock disease prediction (will be replaced with real AI model)
 * This simulates the response from a real disease detection model
 */
async function mockDiseasePrediction(
  imageData: string | Buffer
): Promise<DiseasePrediction> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Mock predictions - in production, this will call actual AI model
  const diseases = [
    {
      prediction: 'Leaf Blight',
      scientificName: 'Alternaria solani',
      confidence: 0.91,
      severity: 'high' as const,
      treatment:
        'Remove infected leaves immediately. Apply organic fungicide (Neem oil or copper-based). Ensure proper spacing between plants for air circulation. Water at the base, not on leaves.',
      preventionTips: [
        'Rotate crops every season',
        'Avoid overhead watering',
        'Remove crop debris after harvest',
        'Use disease-resistant varieties',
      ],
    },
    {
      prediction: 'Powdery Mildew',
      scientificName: 'Erysiphe cichoracearum',
      confidence: 0.87,
      severity: 'medium' as const,
      treatment:
        'Spray with a mixture of baking soda (1 tablespoon per liter of water). Apply weekly until symptoms reduce. Improve air circulation around plants.',
      preventionTips: [
        'Plant in sunny locations',
        'Space plants properly',
        'Avoid water stress',
        'Use resistant varieties when available',
      ],
    },
    {
      prediction: 'Bacterial Wilt',
      scientificName: 'Ralstonia solanacearum',
      confidence: 0.84,
      severity: 'high' as const,
      treatment:
        'Unfortunately, this disease cannot be cured once plants are infected. Remove and destroy infected plants immediately. Do NOT compost them. Disinfect tools. Wait 3-4 years before planting susceptible crops in that soil.',
      preventionTips: [
        'Use certified disease-free seeds',
        'Improve soil drainage',
        'Practice crop rotation',
        'Control root-knot nematodes',
      ],
    },
    {
      prediction: 'Healthy Plant',
      confidence: 0.93,
      severity: 'low' as const,
      treatment:
        'Your plant appears healthy! Continue with your current care routine. Ensure regular watering, adequate sunlight, and balanced nutrition.',
      preventionTips: [
        'Monitor plants regularly for early signs of disease',
        'Maintain soil health with organic matter',
        'Practice proper watering techniques',
        'Keep garden area clean',
      ],
    },
    {
      prediction: 'Early Blight',
      scientificName: 'Alternaria solani',
      confidence: 0.88,
      severity: 'medium' as const,
      treatment:
        'Remove affected lower leaves. Apply organic fungicide containing copper or sulfur. Mulch around plants to prevent soil splash onto leaves. Water early in the day.',
      preventionTips: [
        'Stake or cage plants for better air flow',
        'Mulch to prevent soil contact',
        'Remove infected plant debris',
        'Use drip irrigation instead of overhead watering',
      ],
    },
  ];

  // Randomly select a disease for demo purposes
  // In production, this will be the actual AI model output
  const randomDisease = diseases[Math.floor(Math.random() * diseases.length)];

  return randomDisease;
}

/**
 * Get disease information by name
 */
export async function getDiseaseInfo(
  diseaseName: string
): Promise<ServiceResponse<DiseasePrediction>> {
  return handleAsyncOperation(async () => {
    // Mock disease database
    const diseaseDatabase: Record<string, DiseasePrediction> = {
      'leaf-blight': {
        prediction: 'Leaf Blight',
        scientificName: 'Alternaria solani',
        confidence: 1.0,
        severity: 'high',
        treatment:
          'Remove infected leaves. Apply fungicide. Improve air circulation.',
        preventionTips: [
          'Crop rotation',
          'Proper spacing',
          'Disease-resistant varieties',
        ],
      },
      // Add more diseases as needed
    };

    const info = diseaseDatabase[diseaseName.toLowerCase()];
    if (!info) {
      throw new Error('Disease not found in database');
    }

    return info;
  }, 'Failed to fetch disease information');
}

/**
 * Validate image file
 */
export function validateImageFile(
  file: File
): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error:
        'Invalid file type. Please upload a JPEG, PNG, or WebP image.',
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File too large. Maximum size is 10MB.',
    };
  }

  return { valid: true };
}
