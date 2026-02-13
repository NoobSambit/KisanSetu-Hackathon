/**
 * Farm Profile Page
 *
 * Full profile editor aligned with the Day 1/Day 2 backend contract.
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/lib/context/AuthContext';
import { FarmProfile, LearnedPattern, RiskPreference, FarmLocation } from '@/types';
import { Map as MapIcon, Check, Trash2 } from 'lucide-react';
import dynamic from 'next/dynamic';

const FarmAreaSelector = dynamic(() => import('@/components/FarmAreaSelector'), {
  ssr: false,
});

type EditableProfile = Omit<FarmProfile, 'userId' | 'createdAt' | 'lastUpdated'>;

const SOIL_TYPES = [
  'loamy',
  'clay',
  'sandy',
  'silt',
  'peaty',
  'chalky',
  'alluvial',
  'black',
  'red',
  'laterite',
  'mixed',
] as const;

const IRRIGATION_TYPES = ['rainfed', 'drip', 'sprinkler', 'canal', 'mixed', 'none'] as const;

const RISK_OPTIONS: RiskPreference[] = ['low', 'medium', 'high'];

const LANGUAGE_OPTIONS = ['English', 'Hindi', 'Marathi', 'Bengali', 'Tamil', 'Telugu', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Urdu', 'Odia', 'Assamese'];

const DEFAULT_PROFILE: EditableProfile = {
  farmerName: '',
  preferredLanguage: 'English',
  landSize: 1,
  landUnit: 'acres',
  soilType: 'loamy',
  irrigationType: 'rainfed',
  waterSource: '',
  location: {
    state: '',
    district: '',
    village: '',
  },
  primaryCrops: [],
  annualBudget: undefined,
  riskPreference: 'medium',
  historicalChallenges: [],
  notes: '',
};

function normalizeProfile(raw: Partial<FarmProfile> | null | undefined): EditableProfile {
  if (!raw) return DEFAULT_PROFILE;

  const validCoordinates =
    raw.location?.coordinates &&
    typeof raw.location.coordinates.lat === 'number' &&
    Number.isFinite(raw.location.coordinates.lat) &&
    typeof raw.location.coordinates.lon === 'number' &&
    Number.isFinite(raw.location.coordinates.lon)
      ? {
          lat: raw.location.coordinates.lat,
          lon: raw.location.coordinates.lon,
        }
      : undefined;

  return {
    farmerName: raw.farmerName || '',
    preferredLanguage: raw.preferredLanguage || DEFAULT_PROFILE.preferredLanguage,
    landSize: typeof raw.landSize === 'number' && raw.landSize > 0 ? raw.landSize : DEFAULT_PROFILE.landSize,
    landUnit: raw.landUnit || DEFAULT_PROFILE.landUnit,
    soilType: raw.soilType || DEFAULT_PROFILE.soilType,
    irrigationType: raw.irrigationType || DEFAULT_PROFILE.irrigationType,
    waterSource: raw.waterSource || '',
    location: {
      state: raw.location?.state || '',
      district: raw.location?.district || '',
      village: raw.location?.village || '',
      coordinates: validCoordinates,
      landGeometry: raw.location?.landGeometry,
    },
    primaryCrops: Array.isArray(raw.primaryCrops) ? raw.primaryCrops.filter(Boolean) : [],
    annualBudget:
      typeof raw.annualBudget === 'number' && !Number.isNaN(raw.annualBudget)
        ? raw.annualBudget
        : undefined,
    riskPreference: raw.riskPreference || DEFAULT_PROFILE.riskPreference,
    historicalChallenges: Array.isArray(raw.historicalChallenges)
      ? raw.historicalChallenges.filter(Boolean)
      : [],
    notes: raw.notes || '',
  };
}

export default function FarmProfilePage() {
  return (
    <ProtectedRoute>
      <FarmProfileContent />
    </ProtectedRoute>
  );
}

function FarmProfileContent() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<EditableProfile>(DEFAULT_PROFILE);
  const [patterns, setPatterns] = useState<LearnedPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const cropInputValue = useMemo(() => profile.primaryCrops.join(', '), [profile.primaryCrops]);
  const challengeInputValue = useMemo(
    () => (profile.historicalChallenges || []).join(', '),
    [profile.historicalChallenges]
  );

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;

      setLoading(true);
      setMessage(null);

      try {
        const response = await fetch(`/api/farm-profile?userId=${user.uid}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load farm profile');
        }

        const normalized = normalizeProfile(data.profile);
        setProfile(normalized);
        setPatterns(Array.isArray(data.patterns) ? data.patterns : []);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load profile';
        setMessage({ type: 'error', text: errorMessage });
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  const setLocationField = (field: 'state' | 'district' | 'village', value: string) => {
    setProfile((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value,
      },
    }));
  };

  const parseCommaSeparated = (value: string): string[] =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

  const validateBeforeSave = (candidateProfile: EditableProfile): string | null => {
    const landGeometry = candidateProfile.location.landGeometry;
    if (!landGeometry) return 'Select your farm boundary on map before saving profile.';
    if (!(landGeometry.calculatedAreaAcres > 0)) {
      return 'Selected farm boundary has invalid area. Please reselect on map.';
    }
    if (!candidateProfile.soilType?.trim()) return 'Please select a soil type.';
    if (!candidateProfile.irrigationType) return 'Please select an irrigation type.';
    if (!candidateProfile.location.state.trim() || !candidateProfile.location.district.trim()) {
      return 'State and district are required.';
    }
    if (!candidateProfile.primaryCrops || candidateProfile.primaryCrops.length === 0) {
      return 'Add at least one crop.';
    }
    return null;
  };

  const handleOpenMapSelector = () => {
    setIsMapOpen(true);
  };

  const handleCloseMapSelector = () => {
    setIsMapOpen(false);
  };

  const handleSaveGeometry = (geometry: FarmLocation['landGeometry']) => {
    if (!geometry) return;

    const normalizedArea = Number(geometry.calculatedAreaAcres.toFixed(2));
    const normalizedCenter = {
      lat: Number(geometry.centerPoint.lat.toFixed(6)),
      lon: Number(geometry.centerPoint.lon.toFixed(6)),
    };

    setProfile((prev) => ({
      ...prev,
      landSize: normalizedArea,
      landUnit: 'acres',
      location: {
        ...prev.location,
        coordinates: normalizedCenter,
        landGeometry: {
          ...geometry,
          calculatedAreaAcres: normalizedArea,
          centerPoint: normalizedCenter,
        },
      },
    }));

    setMessage({
      type: 'success',
      text: `Map boundary captured: ${normalizedArea.toFixed(2)} acres. Save profile to persist it.`,
    });
  };

  const handleClearGeometry = () => {
    setProfile((prev) => ({
      ...prev,
      landSize: 0,
      landUnit: 'acres',
      location: {
        ...prev.location,
        coordinates: undefined,
        landGeometry: undefined,
      },
    }));
    setMessage({ type: 'success', text: 'Farm area selection cleared.' });
  };

  const handleSave = async () => {
    if (!user) return;

    const geometry = profile.location.landGeometry;
    if (!geometry || !(geometry.calculatedAreaAcres > 0)) {
      setMessage({
        type: 'error',
        text: 'Select your farm boundary on map before saving profile.',
      });
      return;
    }

    const normalizedArea = Number(geometry.calculatedAreaAcres.toFixed(2));
    const normalizedCenter = {
      lat: Number(geometry.centerPoint.lat.toFixed(6)),
      lon: Number(geometry.centerPoint.lon.toFixed(6)),
    };

    const profilePayload: EditableProfile = {
      ...profile,
      landSize: normalizedArea,
      landUnit: 'acres',
      location: {
        ...profile.location,
        coordinates: normalizedCenter,
        landGeometry: {
          ...geometry,
          calculatedAreaAcres: normalizedArea,
          centerPoint: normalizedCenter,
        },
      },
    };

    const validationError = validateBeforeSave(profilePayload);
    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/farm-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          profile: profilePayload,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save profile');
      }

      setProfile(profilePayload);
      setMessage({ type: 'success', text: 'Profile saved successfully.' });
      if (Array.isArray(data.patterns)) {
        setPatterns(data.patterns);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save profile';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-neutral-500">Loading profile...</div>
    );
  }

  return (
    <div className="min-h-screen pt-16 pb-24 bg-neutral-50">
      <Container size="sm">
        <div className="mb-6 px-2">
          <h1 className="text-2xl font-bold text-neutral-900">Farm Profile</h1>
          <p className="text-neutral-500 text-sm">
            Keep profile complete for better AI answers and scheme matching.
          </p>
        </div>

        {message && (
          <div
            className={`mb-4 mx-2 p-3 rounded-xl text-sm border ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border-green-100'
                : 'bg-red-50 text-red-700 border-red-100'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          <Card className="space-y-4">
            <h2 className="font-bold text-neutral-800 border-b border-neutral-100 pb-2">Basics</h2>

            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase">Name</label>
              <input
                type="text"
                value={profile.farmerName || ''}
                onChange={(e) => setProfile((prev) => ({ ...prev, farmerName: e.target.value }))}
                className="w-full mt-1 p-3 bg-neutral-50 rounded-xl border border-neutral-200"
                placeholder="Farmer name"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase">Preferred Language</label>
              <select
                value={profile.preferredLanguage || 'English'}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, preferredLanguage: e.target.value }))
                }
                className="w-full mt-1 p-3 bg-neutral-50 rounded-xl border border-neutral-200"
              >
                {LANGUAGE_OPTIONS.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="font-bold text-neutral-800 border-b border-neutral-100 pb-2">Location</h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase">State</label>
                <input
                  type="text"
                  value={profile.location.state}
                  onChange={(e) => setLocationField('state', e.target.value)}
                  className="w-full mt-1 p-3 bg-neutral-50 rounded-xl border border-neutral-200"
                  placeholder="State"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase">District</label>
                <input
                  type="text"
                  value={profile.location.district}
                  onChange={(e) => setLocationField('district', e.target.value)}
                  className="w-full mt-1 p-3 bg-neutral-50 rounded-xl border border-neutral-200"
                  placeholder="District"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase">Village (Optional)</label>
              <input
                type="text"
                value={profile.location.village || ''}
                onChange={(e) => setLocationField('village', e.target.value)}
                className="w-full mt-1 p-3 bg-neutral-50 rounded-xl border border-neutral-200"
                placeholder="Village"
              />
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <label className="text-xs font-bold text-neutral-500 uppercase">
                    Farm Boundary (Map Required for Satellite Scan)
                  </label>
                  <p className="text-xs text-neutral-500 mt-1">
                    Draw your exact farm rectangle on map. Satellite analysis now uses only this saved boundary.
                  </p>
                  {profile.location.landGeometry ? (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        <Check className="w-3 h-3 mr-1" />
                        Area Selected: {profile.location.landGeometry.calculatedAreaAcres.toFixed(2)} acres
                      </span>
                      <button
                        onClick={handleClearGeometry}
                        className="text-xs text-red-600 hover:text-red-700 flex items-center"
                      >
                        <Trash2 className="w-3 h-3 mr-0.5" />
                        Clear
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-600 mt-2">
                      No area selected on map. Use the button below for precise satellite monitoring.
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={profile.location.landGeometry ? 'outline' : 'primary'}
                    onClick={handleOpenMapSelector}
                    className="rounded-lg px-3 py-1.5 text-xs"
                  >
                    <MapIcon className="w-3.5 h-3.5 mr-1" />
                    {profile.location.landGeometry ? 'Edit Map Selection' : 'Select on Map'}
                  </Button>
                </div>
              </div>

              {profile.location.coordinates ? (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg border border-neutral-200 bg-white p-2">
                    <p className="text-neutral-500 uppercase font-semibold">Center Latitude</p>
                    <p className="text-neutral-800 mt-1">{profile.location.coordinates.lat.toFixed(6)}</p>
                  </div>
                  <div className="rounded-lg border border-neutral-200 bg-white p-2">
                    <p className="text-neutral-500 uppercase font-semibold">Center Longitude</p>
                    <p className="text-neutral-800 mt-1">{profile.location.coordinates.lon.toFixed(6)}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="font-bold text-neutral-800 border-b border-neutral-100 pb-2">Land and Water</h2>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <p className="text-xs font-bold text-neutral-500 uppercase">Land Area (Map Derived)</p>
              {profile.location.landGeometry ? (
                <p className="text-lg font-bold text-neutral-900 mt-1">
                  {profile.location.landGeometry.calculatedAreaAcres.toFixed(2)} acres
                </p>
              ) : (
                <p className="text-sm text-amber-700 mt-1">
                  Select farm boundary on map to set land area.
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase">Soil Type</label>
              <select
                value={profile.soilType}
                onChange={(e) => setProfile((prev) => ({ ...prev, soilType: e.target.value }))}
                className="w-full mt-1 p-3 bg-neutral-50 rounded-xl border border-neutral-200"
              >
                {SOIL_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase">Irrigation Type</label>
              <select
                value={profile.irrigationType}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    irrigationType: e.target.value as EditableProfile['irrigationType'],
                  }))
                }
                className="w-full mt-1 p-3 bg-neutral-50 rounded-xl border border-neutral-200"
              >
                {IRRIGATION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase">Water Source (Optional)</label>
              <input
                type="text"
                value={profile.waterSource || ''}
                onChange={(e) => setProfile((prev) => ({ ...prev, waterSource: e.target.value }))}
                className="w-full mt-1 p-3 bg-neutral-50 rounded-xl border border-neutral-200"
                placeholder="e.g. borewell, canal, rainwater"
              />
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="font-bold text-neutral-800 border-b border-neutral-100 pb-2">Crops and Planning</h2>

            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase">
                Crops You Grow (comma separated)
              </label>
              <input
                type="text"
                value={cropInputValue}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    primaryCrops: parseCommaSeparated(e.target.value),
                  }))
                }
                className="w-full mt-1 p-3 bg-neutral-50 rounded-xl border border-neutral-200"
                placeholder="e.g. wheat, rice, tomato"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase">
                Annual Budget (INR, optional)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={profile.annualBudget ?? ''}
                onChange={(e) => {
                  const value = e.target.value.trim();
                  setProfile((prev) => ({
                    ...prev,
                    annualBudget: value === '' ? undefined : Number(value),
                  }));
                }}
                className="w-full mt-1 p-3 bg-neutral-50 rounded-xl border border-neutral-200"
                placeholder="e.g. 50000"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase">Risk Preference</label>
              <select
                value={profile.riskPreference || 'medium'}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    riskPreference: e.target.value as RiskPreference,
                  }))
                }
                className="w-full mt-1 p-3 bg-neutral-50 rounded-xl border border-neutral-200"
              >
                {RISK_OPTIONS.map((risk) => (
                  <option key={risk} value={risk}>
                    {risk}
                  </option>
                ))}
              </select>
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="font-bold text-neutral-800 border-b border-neutral-100 pb-2">History and Notes</h2>

            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase">
                Historical Challenges (comma separated)
              </label>
              <input
                type="text"
                value={challengeInputValue}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    historicalChallenges: parseCommaSeparated(e.target.value),
                  }))
                }
                className="w-full mt-1 p-3 bg-neutral-50 rounded-xl border border-neutral-200"
                placeholder="e.g. water scarcity, pest attack"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase">Notes (Optional)</label>
              <textarea
                value={profile.notes || ''}
                onChange={(e) => setProfile((prev) => ({ ...prev, notes: e.target.value }))}
                className="w-full mt-1 p-3 bg-neutral-50 rounded-xl border border-neutral-200 min-h-28"
                placeholder="Any farm-specific notes for future advice"
              />
            </div>
          </Card>

          <Button
            onClick={handleSave}
            isLoading={saving}
            size="lg"
            className="w-full py-4 rounded-xl text-lg"
          >
            Save Profile
          </Button>

          {patterns.length > 0 && (
            <Card className="space-y-2">
              <h3 className="font-bold text-neutral-700 text-sm uppercase">AI Learned Patterns</h3>
              <div className="space-y-2">
                {patterns.map((pattern, index) => (
                  <div
                    key={`${pattern.category}-${index}`}
                    className="bg-primary-50 p-3 rounded-xl border border-primary-100 text-sm text-primary-900"
                  >
                    {pattern.summary}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Farm Area Selector Modal */}
        <FarmAreaSelector
          isOpen={isMapOpen}
          onClose={handleCloseMapSelector}
          onSave={handleSaveGeometry}
          initialCenter={
            profile.location.landGeometry?.centerPoint
              ? {
                  lat: profile.location.landGeometry.centerPoint.lat,
                  lon: profile.location.landGeometry.centerPoint.lon,
                }
              : profile.location.coordinates
              ? { lat: profile.location.coordinates.lat, lon: profile.location.coordinates.lon }
              : undefined
          }
          existingGeometry={profile.location.landGeometry}
        />
      </Container>
    </div>
  );
}
