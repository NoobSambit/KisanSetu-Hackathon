/**
 * Crop Planner Page (Phase 4)
 * AI-powered seasonal crop planning assistant with wizard UI
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { CropPlanInputs } from '@/types';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Bihar', 'Gujarat', 'Haryana', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Punjab', 'Rajasthan', 'Tamil Nadu',
  'Uttar Pradesh', 'West Bengal', 'Other'
];

export default function CropPlannerPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);

  const [inputs, setInputs] = useState<CropPlanInputs>({
    landSize: 0,
    landUnit: 'acres',
    soilType: 'loamy',
    season: 'kharif',
    location: '',
    state: '',
    irrigationAvailable: false,
    budget: undefined,
  });

  const handleInputChange = (field: keyof CropPlanInputs, value: any) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => step < 4 && setStep(step + 1);
  const handleBack = () => step > 1 && setStep(step - 1);

  const handleSubmit = async () => {
    if (!isAuthenticated) return router.push('/login');

    setLoading(true);
    try {
      const response = await fetch('/api/crop-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.uid, inputs }),
      });
      const data = await response.json();
      if (data.success) {
        setPlan(data.plan);
        setStep(5);
      } else {
        alert(data.error || 'Failed to generate plan');
      }
    } catch (error) {
      alert('Failed to generate plan');
    } finally {
      setLoading(false);
    }
  };

  const Steps = [
    { id: 1, title: 'Land & Soil', icon: '🌱' },
    { id: 2, title: 'Location', icon: '📍' },
    { id: 3, title: 'Resources', icon: '💧' },
    { id: 4, title: 'Review', icon: '✅' },
  ];

  return (
    <div className="bg-neutral-50 min-h-screen pt-20 pb-12">
      <Container size="md">
        <div className="text-center mb-10">
          <div className="text-4xl mb-4">📋</div>
          <h1 className="text-3xl font-extrabold text-neutral-900 mb-2">Crop Planner</h1>
          <p className="text-neutral-500">AI-powered recommendations for your next season.</p>
        </div>

        {/* Stepper Header */}
        {step < 5 && (
          <div className="flex justify-between mb-8 relative px-4">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-neutral-200 -z-10 -translate-y-1/2 rounded-full"></div>
            <div className={`absolute top-1/2 left-0 h-1 bg-green-500 -z-10 -translate-y-1/2 rounded-full transition-all duration-500`} style={{ width: `${((step - 1) / 3) * 100}%` }}></div>

            {Steps.map((s) => (
              <div key={s.id} className="flex flex-col items-center gap-2 bg-neutral-50 px-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${s.id <= step ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-neutral-300 text-neutral-400'
                  }`}>
                  {s.id < step ? '✓' : s.id}
                </div>
                <span className={`text-xs font-semibold ${s.id <= step ? 'text-green-700' : 'text-neutral-400'}`}>{s.title}</span>
              </div>
            ))}
          </div>
        )}

        <Card className="p-8 shadow-xl border-none">
          {loading ? (
            <div className="py-20 text-center">
              <LoadingSpinner size="lg" text="Analyzing soil data and market trends..." />
            </div>
          ) : (
            <div className="animate-fade-in">
              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold">Land Details</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-bold text-neutral-700 mb-2">Soil Type</label>
                      <div className="grid grid-cols-3 gap-3">
                        {['Loamy', 'Clay', 'Sandy', 'Silt', 'Peaty', 'Chalky'].map((type) => (
                          <button
                            key={type}
                            onClick={() => handleInputChange('soilType', type.toLowerCase())}
                            className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all ${inputs.soilType === type.toLowerCase()
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-neutral-200 hover:border-green-200'
                              }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-neutral-700 mb-2">Size</label>
                      <input
                        type="number"
                        value={inputs.landSize || ''}
                        onChange={(e) => handleInputChange('landSize', parseFloat(e.target.value))}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-neutral-700 mb-2">Unit</label>
                      <select
                        value={inputs.landUnit}
                        onChange={(e) => handleInputChange('landUnit', e.target.value)}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-white"
                      >
                        <option value="acres">Acres</option>
                        <option value="hectares">Hectares</option>
                        <option value="bigha">Bigha</option>
                      </select>
                    </div>
                  </div>
                  <Button onClick={handleNext} disabled={!inputs.landSize || !inputs.soilType} className="w-full mt-4">Next Step</Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold">Location & Season</h2>
                  <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-2">Select Season</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { id: 'kharif', title: 'Kharif', sub: 'Jun-Oct', icon: '🌧️' },
                        { id: 'rabi', title: 'Rabi', sub: 'Nov-Mar', icon: '❄️' },
                        { id: 'zaid', title: 'Zaid', sub: 'Mar-Jun', icon: '☀️' }
                      ].map((s) => (
                        <button
                          key={s.id}
                          onClick={() => handleInputChange('season', s.id)}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${inputs.season === s.id
                              ? 'border-green-500 bg-green-50'
                              : 'border-neutral-200 hover:border-green-200'
                            }`}
                        >
                          <div className="text-2xl mb-2">{s.icon}</div>
                          <div className="font-bold text-neutral-900">{s.title}</div>
                          <div className="text-xs text-neutral-500">{s.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-neutral-700 mb-2">State</label>
                      <select
                        value={inputs.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-white"
                      >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-neutral-700 mb-2">District/City</label>
                      <input
                        type="text"
                        value={inputs.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                        placeholder="e.g. Nashik"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
                    <Button onClick={handleNext} disabled={!inputs.state || !inputs.location} className="flex-1">Next Step</Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold">Resources</h2>
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 cursor-pointer" onClick={() => handleInputChange('irrigationAvailable', !inputs.irrigationAvailable)}>
                    <div className="flex items-center gap-4">
                      <div className={`w-6 h-6 rounded border flex items-center justify-center ${inputs.irrigationAvailable ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-neutral-300'}`}>
                        {inputs.irrigationAvailable && '✓'}
                      </div>
                      <div>
                        <h3 className="font-bold text-blue-900">Irrigation Available</h3>
                        <p className="text-sm text-blue-700">Can you provide water artificially if rain fails?</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-neutral-700 mb-2">Budget (₹) <span className="text-neutral-400 font-normal">(Optional)</span></label>
                    <input
                      type="number"
                      value={inputs.budget || ''}
                      onChange={(e) => handleInputChange('budget', parseFloat(e.target.value))}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="Enter estimated budget"
                    />
                  </div>

                  <div className="flex gap-3 mt-4">
                    <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
                    <Button onClick={handleNext} className="flex-1">Review</Button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold">Review Details</h2>
                  <div className="bg-neutral-50 rounded-xl p-6 space-y-3">
                    <div className="flex justify-between border-b border-neutral-200 pb-2">
                      <span className="text-neutral-500">Inputs</span>
                      <span className="font-bold">{inputs.landSize} {inputs.landUnit}, {inputs.soilType}</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-200 pb-2">
                      <span className="text-neutral-500">Location</span>
                      <span className="font-bold">{inputs.location}, {inputs.state}</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-200 pb-2">
                      <span className="text-neutral-500">Season</span>
                      <span className="font-bold capitalize">{inputs.season}</span>
                    </div>
                  </div>

                  <Button onClick={handleSubmit} className="w-full py-4 text-lg shadow-lg shadow-green-500/20">
                    Generate Crop Plan 🚀
                  </Button>
                  <Button variant="ghost" onClick={handleBack} className="w-full">Back to Edit</Button>
                </div>
              )}

              {step === 5 && plan && (
                <div className="animate-slide-up">
                  <div className="text-center mb-8">
                    <div className="text-5xl mb-2">🎉</div>
                    <h2 className="text-3xl font-bold text-neutral-900">Your Plan is Ready!</h2>
                  </div>

                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      {plan.recommendations?.map((rec: any, idx: number) => (
                        <div key={idx} className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-2 bg-green-100 rounded-bl-xl text-green-700 font-bold text-xs">{rec.suitabilityScore}% Match</div>
                          <h3 className="text-xl font-bold text-neutral-900 mb-2">{rec.cropName}</h3>
                          <div className="text-sm space-y-1 text-neutral-600 mb-4">
                            <p>⏱️ {rec.duration}</p>
                            <p>💰 {rec.profitPotential}</p>
                          </div>
                          <div className="text-xs text-neutral-500 bg-neutral-50 p-2 rounded">
                            {rec.reasons?.[0]}
                          </div>
                        </div>
                      ))}
                    </div>

                    {plan.aiAdvice && (
                      <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl">
                        <h3 className="font-bold text-blue-900 mb-2">💡 Expert Insight</h3>
                        <p className="text-blue-800 leading-relaxed text-sm">{plan.aiAdvice}</p>
                      </div>
                    )}

                    <div className="flex gap-4">
                      <Button onClick={() => setStep(1)} variant="outline" className="flex-1">New Plan</Button>
                      <Button onClick={() => router.push('/dashboard')} className="flex-1">Go to Dashboard</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </Container>
    </div>
  );
}
