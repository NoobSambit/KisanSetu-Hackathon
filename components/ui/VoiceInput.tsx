/**
 * VoiceInput Component (Phase 4)
 *
 * Visual component for voice input with:
 * - Microphone button
 * - Recording animation
 * - Sound wave visualization
 * - Error display
 */

'use client';

import React, { useEffect } from 'react';
import { useVoiceInput } from '@/lib/hooks/useVoiceInput';
import Button from './Button';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  className?: string;
}

export default function VoiceInput({ onTranscript, className = '' }: VoiceInputProps) {
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    error,
  } = useVoiceInput({
    language: 'en-IN',
    continuous: false,
    interimResults: true,
  });

  // Send transcript to parent when final
  useEffect(() => {
    if (transcript && !isListening) {
      onTranscript(transcript);
      resetTranscript();
    }
  }, [transcript, isListening, onTranscript, resetTranscript]);

  const handleToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <div className={`text-center p-4 bg-gray-100 rounded-lg ${className}`}>
        <p className="text-sm text-gray-600">
          Voice input is not supported in your browser.
          <br />
          Please try Chrome, Edge, or Safari.
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {/* Microphone Button */}
      <button
        onClick={handleToggle}
        className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 scale-110 animate-pulse'
            : 'bg-green-500 hover:bg-green-600'
        } shadow-lg`}
        aria-label={isListening ? 'Stop recording' : 'Start recording'}
      >
        {isListening ? (
          <svg
            className="w-8 h-8 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <rect x="6" y="6" width="8" height="8" rx="1" />
          </svg>
        ) : (
          <svg
            className="w-8 h-8 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a3 3 0 116 0v2a3 3 0 11-6 0V9z"
              clipRule="evenodd"
            />
          </svg>
        )}

        {/* Pulsing ring animation when listening */}
        {isListening && (
          <>
            <span className="absolute w-full h-full rounded-full bg-red-400 animate-ping opacity-75" />
            <span className="absolute w-20 h-20 rounded-full border-4 border-red-300 animate-pulse" />
          </>
        )}
      </button>

      {/* Status Text */}
      <div className="text-center min-h-[3rem]">
        {isListening && (
          <div className="space-y-1">
            <p className="text-sm font-semibold text-red-600 animate-pulse">
              🎤 Listening...
            </p>
            {/* Sound Wave Animation */}
            <div className="flex justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-red-500 rounded-full animate-wave"
                  style={{
                    height: '20px',
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
            {interimTranscript && (
              <p className="text-xs text-gray-600 italic mt-2 max-w-xs">
                "{interimTranscript}"
              </p>
            )}
          </div>
        )}

        {!isListening && !error && (
          <p className="text-sm text-gray-600">
            Click to speak your question
          </p>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 max-w-xs">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}
      </div>

      {/* Instructions */}
      {isListening && (
        <p className="text-xs text-gray-500 text-center max-w-xs">
          Speak clearly and pause when done
        </p>
      )}

      {/* Custom wave animation styles */}
      <style jsx>{`
        @keyframes wave {
          0%,
          100% {
            transform: scaleY(1);
          }
          50% {
            transform: scaleY(2);
          }
        }

        .animate-wave {
          animation: wave 0.6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
