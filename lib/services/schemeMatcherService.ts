import {
  EligibilityDelta,
  FarmProfile,
  MissingEligibilityInput,
  SchemeCatalogEntry,
  SchemeConfidenceTag,
  SchemeDuplicatePair,
  SchemeEligibilityInputKey,
  SchemeEligibilityReason,
  SchemeRecommendation,
  SchemeRecommendationStatus,
} from '@/types';

const INPUT_WEIGHTS: Record<SchemeEligibilityInputKey, number> = {
  location: 30,
  farm_size: 20,
  crop_type: 20,
  irrigation: 10,
  budget: 10,
  risk_preference: 10,
};

const PROFILE_INPUT_PROMPTS: Record<SchemeEligibilityInputKey, string> = {
  location: 'Add your state and district in Farm Profile for state-wise scheme matching.',
  farm_size: 'Add land size to improve subsidy and support eligibility scoring.',
  crop_type: 'Add your primary crops to match crop-specific schemes accurately.',
  irrigation: 'Add irrigation type to match water and infrastructure schemes.',
  budget: 'Add annual budget so credit and subsidy recommendations improve.',
  risk_preference: 'Add risk preference to better rank insurance and risk-cover schemes.',
};

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeState(value: string): string {
  return normalizeText(value).replace(/\s+/g, ' ');
}

function toAcres(landSize: number, unit: FarmProfile['landUnit']): number {
  if (unit === 'acres') return landSize;
  if (unit === 'hectares') return landSize * 2.47105;

  // Bigha varies region-wise; use a practical default for recommendation ranking.
  return landSize * 0.619834;
}

function profileHasInput(profile: FarmProfile | null, key: SchemeEligibilityInputKey): boolean {
  if (!profile) return false;

  if (key === 'location') {
    return Boolean(profile.location?.state && profile.location?.district);
  }

  if (key === 'farm_size') {
    return Number(profile.landSize) > 0;
  }

  if (key === 'crop_type') {
    return Array.isArray(profile.primaryCrops) && profile.primaryCrops.length > 0;
  }

  if (key === 'irrigation') {
    return Boolean(profile.irrigationType);
  }

  if (key === 'budget') {
    return typeof profile.annualBudget === 'number' && profile.annualBudget > 0;
  }

  if (key === 'risk_preference') {
    return Boolean(profile.riskPreference);
  }

  return false;
}

function profileMissingInputs(profile: FarmProfile | null): MissingEligibilityInput[] {
  const keys = Object.keys(PROFILE_INPUT_PROMPTS) as SchemeEligibilityInputKey[];

  const missing = keys.filter((key) => !profileHasInput(profile, key));

  return missing.map((key, index) => ({
    key,
    prompt: PROFILE_INPUT_PROMPTS[key],
    priority: index < 2 ? 'high' : index < 4 ? 'medium' : 'low',
  }));
}

function stateMatches(profile: FarmProfile | null, scheme: SchemeCatalogEntry): boolean {
  if (!profile?.location?.state) return false;

  const profileState = normalizeState(profile.location.state);
  const scopedStates = scheme.eligibilityRules.states || scheme.stateScope;

  if (scopedStates.some((state) => normalizeState(state) === 'all')) return true;

  return scopedStates.some((state) => normalizeState(state) === profileState);
}

function cropMatches(profile: FarmProfile | null, scheme: SchemeCatalogEntry): boolean {
  if (!profile || !Array.isArray(profile.primaryCrops) || profile.primaryCrops.length === 0) return false;

  const cropIncludes = scheme.eligibilityRules.cropIncludes || [];
  const cropExcludes = scheme.eligibilityRules.cropExcludes || [];

  if (cropIncludes.length === 0 && cropExcludes.length === 0) return true;

  const profileCrops = profile.primaryCrops.map((crop) => normalizeText(crop));
  const includeSet = cropIncludes.map((crop) => normalizeText(crop));
  const excludeSet = cropExcludes.map((crop) => normalizeText(crop));

  if (excludeSet.some((crop) => profileCrops.includes(crop))) return false;
  if (includeSet.length === 0) return true;

  return includeSet.some((crop) => profileCrops.includes(crop));
}

function irrigationMatches(profile: FarmProfile | null, scheme: SchemeCatalogEntry): boolean {
  if (!profile?.irrigationType) return false;

  const include = scheme.eligibilityRules.irrigationIncludes || [];
  const exclude = scheme.eligibilityRules.irrigationExcludes || [];

  if (exclude.includes(profile.irrigationType)) return false;
  if (include.length === 0) return true;

  return include.includes(profile.irrigationType);
}

function budgetMatches(profile: FarmProfile | null, scheme: SchemeCatalogEntry): boolean {
  if (typeof profile?.annualBudget !== 'number') return false;

  const budget = profile.annualBudget;
  const minBudget = scheme.eligibilityRules.budgetFloorINR;
  const maxBudget = scheme.eligibilityRules.budgetCeilingINR;

  if (typeof minBudget === 'number' && budget < minBudget) return false;
  if (typeof maxBudget === 'number' && budget > maxBudget) return false;

  return true;
}

function farmSizeMatches(profile: FarmProfile | null, scheme: SchemeCatalogEntry): boolean {
  if (!profile || !profile.landUnit || !profile.landSize) return false;

  const landAcres = toAcres(profile.landSize, profile.landUnit);
  const minSize = scheme.eligibilityRules.minLandSizeAcres;
  const maxSize = scheme.eligibilityRules.maxLandSizeAcres;

  if (typeof minSize === 'number' && landAcres < minSize) return false;
  if (typeof maxSize === 'number' && landAcres > maxSize) return false;

  return true;
}

function riskMatches(profile: FarmProfile | null, scheme: SchemeCatalogEntry): boolean {
  if (!profile?.riskPreference) return false;

  const preferred = scheme.eligibilityRules.preferredRiskProfiles || [];
  if (preferred.length === 0) return true;

  return preferred.includes(profile.riskPreference);
}

function evaluateInput(
  input: SchemeEligibilityInputKey,
  profile: FarmProfile | null,
  scheme: SchemeCatalogEntry
): { matched: boolean; reason: SchemeEligibilityReason; unmet: boolean } {
  const weight = INPUT_WEIGHTS[input];

  if (!profileHasInput(profile, input)) {
    return {
      matched: false,
      unmet: false,
      reason: {
        code: `${input}_unknown`,
        type: 'unknown',
        field: input,
        weight,
        message: PROFILE_INPUT_PROMPTS[input],
      },
    };
  }

  if (input === 'location') {
    const matched = stateMatches(profile, scheme);
    return {
      matched,
      unmet: !matched,
      reason: {
        code: matched ? 'location_match' : 'location_mismatch',
        type: matched ? 'match' : 'mismatch',
        field: input,
        weight,
        message: matched
          ? `Scheme available for ${profile?.location.state}.`
          : `Scheme scope does not currently include ${profile?.location.state}.`,
      },
    };
  }

  if (input === 'farm_size') {
    const matched = farmSizeMatches(profile, scheme);
    return {
      matched,
      unmet: !matched,
      reason: {
        code: matched ? 'farm_size_match' : 'farm_size_mismatch',
        type: matched ? 'match' : 'mismatch',
        field: input,
        weight,
        message: matched
          ? 'Land size aligns with scheme criteria.'
          : 'Land size does not align with current scheme thresholds.',
      },
    };
  }

  if (input === 'crop_type') {
    const matched = cropMatches(profile, scheme);
    return {
      matched,
      unmet: !matched,
      reason: {
        code: matched ? 'crop_match' : 'crop_mismatch',
        type: matched ? 'match' : 'mismatch',
        field: input,
        weight,
        message: matched
          ? 'Primary crops align with this scheme focus.'
          : 'Primary crops are not in this scheme focus list.',
      },
    };
  }

  if (input === 'irrigation') {
    const matched = irrigationMatches(profile, scheme);
    return {
      matched,
      unmet: !matched,
      reason: {
        code: matched ? 'irrigation_match' : 'irrigation_mismatch',
        type: matched ? 'match' : 'mismatch',
        field: input,
        weight,
        message: matched
          ? 'Irrigation profile matches scheme requirements.'
          : 'Irrigation type does not match this scheme filter.',
      },
    };
  }

  if (input === 'budget') {
    const matched = budgetMatches(profile, scheme);
    return {
      matched,
      unmet: !matched,
      reason: {
        code: matched ? 'budget_match' : 'budget_mismatch',
        type: matched ? 'match' : 'mismatch',
        field: input,
        weight,
        message: matched
          ? 'Budget profile fits this scheme criteria.'
          : 'Budget profile is outside this scheme range.',
      },
    };
  }

  const matched = riskMatches(profile, scheme);
  return {
    matched,
    unmet: !matched,
    reason: {
      code: matched ? 'risk_match' : 'risk_mismatch',
      type: matched ? 'match' : 'mismatch',
      field: input,
      weight,
      message: matched
        ? 'Risk preference aligns with scheme design.'
        : 'Risk preference differs from scheme preference.',
    },
  };
}

function degradeConfidence(confidence: SchemeConfidenceTag, levels: number): SchemeConfidenceTag {
  const ordered: SchemeConfidenceTag[] = ['low', 'medium', 'high'];
  const current = ordered.indexOf(confidence);
  const degraded = Math.max(0, current - levels);
  return ordered[degraded];
}

function buildEligibilityDelta(unmetFields: SchemeEligibilityInputKey[]): EligibilityDelta[] {
  const deltas: EligibilityDelta[] = [];

  unmetFields.forEach((field) => {
    if (field === 'location') {
      deltas.push({
        title: 'Check State Alternative',
        description: 'This scheme is likely out-of-state. Look for an equivalent state scheme.',
        impact: 'high',
      });
      return;
    }

    if (field === 'farm_size') {
      deltas.push({
        title: 'Validate Land Record Category',
        description: 'Verify your land category and try schemes aligned to your farm size bracket.',
        impact: 'medium',
      });
      return;
    }

    if (field === 'crop_type') {
      deltas.push({
        title: 'Check Notified Crops',
        description: 'Verify if your crop is notified in the latest district/season notification.',
        impact: 'high',
      });
      return;
    }

    if (field === 'irrigation') {
      deltas.push({
        title: 'Improve Irrigation Readiness',
        description: 'Micro-irrigation setup can unlock additional subsidy-oriented schemes.',
        impact: 'medium',
      });
      return;
    }

    if (field === 'budget') {
      deltas.push({
        title: 'Bridge Budget with Credit',
        description: 'KCC or cooperative credit can improve eligibility for higher-investment schemes.',
        impact: 'medium',
      });
      return;
    }

    deltas.push({
      title: 'Tune Risk Strategy',
      description: 'Insurance-oriented schemes can reduce downside in high-risk seasons.',
      impact: 'low',
    });
  });

  return deltas;
}

function classifyStatus(
  score: number,
  missingCount: number,
  unmetCount: number
): SchemeRecommendationStatus {
  if (missingCount >= 2 && score < 70) return 'insufficient_data';
  if (score >= 75 && unmetCount <= 1) return 'eligible';
  if (score >= 45) return 'partially_eligible';
  return 'not_eligible';
}

function normalizeNameTokens(name: string): string[] {
  const stopWords = new Set([
    'scheme',
    'yojana',
    'pradhan',
    'mantri',
    'kisan',
    'krishi',
    'government',
    'govt',
    'state',
    'national',
  ]);

  return normalizeText(name)
    .split(/[^a-z0-9]+/)
    .filter((token) => token && !stopWords.has(token));
}

function jaccardScore(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const aSet = new Set(a);
  const bSet = new Set(b);
  const intersection = [...aSet].filter((token) => bSet.has(token)).length;
  const union = new Set([...aSet, ...bSet]).size;
  return union === 0 ? 0 : intersection / union;
}

function statesOverlap(a: SchemeCatalogEntry, b: SchemeCatalogEntry): boolean {
  const aStates = a.stateScope.map(normalizeState);
  const bStates = b.stateScope.map(normalizeState);

  if (aStates.includes('all') || bStates.includes('all')) return true;
  return aStates.some((state) => bStates.includes(state));
}

export function detectSchemeDuplicates(catalog: SchemeCatalogEntry[]): SchemeDuplicatePair[] {
  const duplicates: SchemeDuplicatePair[] = [];

  for (let i = 0; i < catalog.length; i += 1) {
    for (let j = i + 1; j < catalog.length; j += 1) {
      const first = catalog[i];
      const second = catalog[j];

      if (!statesOverlap(first, second)) continue;
      if (first.authority === second.authority) continue;

      const nameSimilarity = jaccardScore(
        normalizeNameTokens(first.schemeName),
        normalizeNameTokens(second.schemeName)
      );

      const firstTags = new Set(first.tags.map(normalizeText));
      const secondTags = new Set(second.tags.map(normalizeText));
      const tagOverlap = [...firstTags].filter((tag) => secondTags.has(tag)).length;

      const overlapScore = Number((nameSimilarity * 0.6 + Math.min(tagOverlap, 4) * 0.1).toFixed(2));

      if (overlapScore >= 0.35) {
        duplicates.push({
          schemeAId: first.schemeId,
          schemeBId: second.schemeId,
          overlapScore,
          reason:
            nameSimilarity >= 0.45
              ? 'Similar scheme identity across central/state catalogs.'
              : 'Similar benefits/tags detected across central/state catalogs.',
        });
      }
    }
  }

  return duplicates.sort((a, b) => b.overlapScore - a.overlapScore);
}

export function scoreSchemeForProfile(
  profile: FarmProfile | null,
  scheme: SchemeCatalogEntry
): SchemeRecommendation {
  const reasons: SchemeEligibilityReason[] = [];
  const missingInputs: MissingEligibilityInput[] = [];
  const matchedFields: SchemeEligibilityInputKey[] = [];
  const unmetFields: SchemeEligibilityInputKey[] = [];

  const applicableInputs = scheme.eligibilityInputs;
  let maxScore = 0;
  let earnedScore = 0;

  applicableInputs.forEach((input) => {
    const weight = INPUT_WEIGHTS[input];
    maxScore += weight;

    const evaluation = evaluateInput(input, profile, scheme);
    reasons.push(evaluation.reason);

    if (evaluation.reason.type === 'unknown') {
      missingInputs.push({
        key: input,
        prompt: PROFILE_INPUT_PROMPTS[input],
        priority: weight >= 20 ? 'high' : weight >= 10 ? 'medium' : 'low',
      });
      return;
    }

    if (evaluation.matched) {
      earnedScore += weight;
      matchedFields.push(input);
      return;
    }

    if (evaluation.unmet) {
      unmetFields.push(input);
    }
  });

  const rawScore = maxScore > 0 ? (earnedScore / maxScore) * 100 : 0;
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  const confidencePenalty = Math.floor(missingInputs.length / 2) + (unmetFields.length >= 3 ? 1 : 0);
  const confidenceTag = degradeConfidence(scheme.confidenceTag, confidencePenalty);

  reasons.push({
    code: 'source_confidence',
    type: 'info',
    field: 'general',
    message: `Rule confidence: ${confidenceTag}. Source checked on ${scheme.sourceLastCheckedAt}.`,
  });

  const status = classifyStatus(score, missingInputs.length, unmetFields.length);

  return {
    schemeId: scheme.schemeId,
    schemeName: scheme.schemeName,
    authorityLabel: scheme.authorityLabel,
    officialLink: scheme.officialLink,
    score,
    status,
    confidenceTag,
    reasons,
    missingInputs,
    eligibilityDelta: buildEligibilityDelta(unmetFields),
    documentsRequired: scheme.documentsRequired,
    actionSteps: scheme.actionSteps,
    benefits: scheme.benefits,
    deadlines: scheme.deadlines,
    estimatedEffort: scheme.estimatedEffort,
    cashImpactWindow: scheme.cashImpactWindow,
    matchedFields,
    unmetFields,
  };
}

function confidenceWeight(confidence: SchemeConfidenceTag): number {
  if (confidence === 'high') return 3;
  if (confidence === 'medium') return 2;
  return 1;
}

export function generateSchemeRecommendations(params: {
  profile: FarmProfile | null;
  catalog: SchemeCatalogEntry[];
  limit?: number;
}): {
  recommendations: SchemeRecommendation[];
  profileCompleteness: number;
  missingProfileInputs: MissingEligibilityInput[];
  duplicatePairs: SchemeDuplicatePair[];
} {
  const { profile, catalog, limit = 10 } = params;

  const missingProfileInputs = profileMissingInputs(profile);
  const profileCompleteness = Math.max(
    0,
    Math.round((1 - missingProfileInputs.length / Object.keys(PROFILE_INPUT_PROMPTS).length) * 100)
  );

  const scored = catalog
    .map((scheme) => scoreSchemeForProfile(profile, scheme))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (confidenceWeight(b.confidenceTag) !== confidenceWeight(a.confidenceTag)) {
        return confidenceWeight(b.confidenceTag) - confidenceWeight(a.confidenceTag);
      }
      return a.schemeName.localeCompare(b.schemeName);
    });

  return {
    recommendations: scored.slice(0, limit),
    profileCompleteness,
    missingProfileInputs,
    duplicatePairs: detectSchemeDuplicates(catalog),
  };
}

export function getChecklistProgress(checklist: Record<string, boolean>): number {
  const total = Object.keys(checklist).length;
  if (total === 0) return 0;

  const completed = Object.values(checklist).filter(Boolean).length;
  return Math.round((completed / total) * 100);
}

export function buildDefaultChecklist(documentsRequired: string[]): Record<string, boolean> {
  return documentsRequired.reduce<Record<string, boolean>>((acc, item) => {
    const key = item
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    acc[key || `doc_${Object.keys(acc).length + 1}`] = false;
    return acc;
  }, {});
}
