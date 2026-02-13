/**
 * Crop Disease Detection Page (Phase 3)
 * AI-powered plant disease identification and treatment recommendations
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import Container from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AlertCard from '@/components/ui/AlertCard';
import { useAuth } from '@/lib/context/AuthContext';
import { logPageView } from '@/lib/services/analyticsService';
import { Leaf, Camera, Scan, Pill, Shield, Microscope } from 'lucide-react';

interface PredictionResult {
  prediction: string;
  confidence: number;
  treatment: string;
  scientificName?: string;
  severity?: 'low' | 'medium' | 'high';
  preventionTips?: string[];
}

export default function DiseaseDetectionPage() {
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'results'>('upload');

  useEffect(() => {
    logPageView('/disease-detection', user?.uid);
  }, [user]);

  useEffect(() => {
    if (result) setActiveTab('results');
    else setActiveTab('upload');
  }, [result]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }

    setSelectedImage(file);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      if (user?.uid) formData.append('userId', user.uid);

      const response = await fetch('/api/disease/detect', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data.success) throw new Error(data.error);

      setResult({
        prediction: data.prediction,
        confidence: data.confidence,
        treatment: data.treatment,
        scientificName: data.scientificName,
        severity: data.severity,
        preventionTips: data.preventionTips,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-neutral-50 min-h-screen pt-20 pb-12">
      <Container>
        <div className="text-center mb-10 animate-slide-up">
          <div className="inline-block p-3 rounded-full bg-green-100 text-green-600 mb-4 shadow-sm">
            <Leaf className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-extrabold text-neutral-900 mb-4 tracking-tight">Disease Detection</h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            AI-driven diagnostics to save your crops.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 items-start">

          {/* Upload Card */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden animate-slide-up order-1">
            <div className="p-1 bg-gradient-to-r from-green-400 to-emerald-500"></div>
            <div className="p-8">
              <h2 className="text-2xl font-bold text-neutral-800 mb-6 flex items-center gap-2">
                <Camera className="w-6 h-6 text-neutral-600" /> Upload Photo
              </h2>

              {!imagePreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-3 border-dashed border-neutral-200 rounded-2xl p-10 text-center cursor-pointer hover:border-green-500 hover:bg-green-50/50 transition-all group"
                >
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-100 group-hover:text-green-600 transition-colors">
                    <Camera className="w-8 h-8 text-neutral-400 group-hover:text-green-600" />
                  </div>
                  <p className="font-bold text-neutral-700 text-lg mb-1">Click to Upload</p>
                  <p className="text-neutral-400 text-sm">or drag and drop</p>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden shadow-md group">
                  <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button onClick={resetAnalysis} variant="secondary" size="sm" className="bg-white text-neutral-900">Change Photo</Button>
                  </div>
                </div>
              )}

              {imagePreview && !result && (
                <Button
                  onClick={analyzeImage}
                  disabled={isAnalyzing}
                  className="w-full mt-6 text-lg py-4 shadow-lg shadow-green-500/20"
                  isLoading={isAnalyzing}
                >
                  {isAnalyzing ? 'Analyzing Leaf...' : (
                    <span className="flex items-center gap-2 justify-center">
                      <Scan className="w-5 h-5" /> Analyze Disease
                    </span>
                  )}
                </Button>
              )}
              {error && <div className="mt-4"><AlertCard type="error" message={error} /></div>}
            </div>
          </div>

          {/* Results Card */}
          <div className={`transition-all duration-500 order-2 ${result ? 'opacity-100 translate-x-0' : 'opacity-50 translate-x-4 grayscale blur-[1px]'}`}>
            {result ? (
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-neutral-100">
                <div className={`p-6 ${result.severity === 'high' ? 'bg-red-50' :
                  result.severity === 'medium' ? 'bg-amber-50' :
                    'bg-green-50'
                  }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-neutral-900 mb-1">{result.prediction}</h2>
                      <p className="text-neutral-500 italic text-sm mb-4">{result.scientificName}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${result.severity === 'high' ? 'bg-red-200 text-red-800' :
                      result.severity === 'medium' ? 'bg-amber-200 text-amber-800' :
                        'bg-green-200 text-green-800'
                      }`}>
                      {result.severity || 'Analysis'}
                    </span>
                  </div>

                  <div className="w-full bg-white/50 rounded-full h-2 mb-1">
                    <div className={`h-2 rounded-full ${result.confidence > 0.8 ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${result.confidence * 100}%` }}></div>
                  </div>
                  <p className="text-xs text-right text-neutral-500">{Math.round(result.confidence * 100)}% Confidence</p>
                </div>

                <div className="p-6 space-y-6">
                  <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                    <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                      <Pill className="w-5 h-5" /> Treatment
                    </h3>
                    <p className="text-blue-800 text-sm leading-relaxed">{result.treatment}</p>
                  </div>

                  {result.preventionTips && (
                    <div>
                      <h3 className="font-bold text-neutral-800 mb-3 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-neutral-600" /> Prevention
                      </h3>
                      <ul className="space-y-2">
                        {result.preventionTips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-neutral-600 bg-neutral-50 p-3 rounded-lg">
                            <span className="text-green-500 mt-0.5">✓</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white/50 border-2 border-dashed border-neutral-200 rounded-3xl p-12 text-center h-full flex flex-col justify-center items-center">
                <div className="mb-4 opacity-20">
                  <Microscope className="w-16 h-16 text-neutral-400" />
                </div>
                <h3 className="text-xl font-bold text-neutral-400 mb-2">Results will appear here</h3>
                <p className="text-neutral-400 text-sm max-w-xs">Upload an image and run analysis to see disease diagnosis and treatment.</p>
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
