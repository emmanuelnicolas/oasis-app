export type EstimatedActiveLevel = {
  level: string;
  confidence: number;
  position: number;
  effective_at_low_dose: boolean;
};

export type FormulaAnalysis = {
  active_balance: string;
  active_balance_score: number;
  hydration_score: number;
  barrier_support: number;
  irritation_risk: number;
  active_position_quality: number;
  marketing_confidence: number;
  formula_confidence: number;
  database_coverage: number;
  matched_ingredients: number;
  unknown_ingredients: number;
  one_percent_line_index?: number | null;
  hydration_supporters: string[];
  barrier_supporters: string[];
  irritation_sources: string[];
  estimated_active_levels: Record<
    string,
    EstimatedActiveLevel
  >;
};

export type MarketingClaimResult = {
  claim: string;
  status: string;
  confidence: number;
  supporting_ingredients: string[];
  reason?: string;
};

export type MarketingFlag = {
  ingredient: string;
  position: number;
  severity: "low" | "medium" | "high" | string;
  type: string;
  message: string;
};

export type MarketingAnalysis = {
  verdict: string;
  marketing_confidence: number;
  ingredient_integrity_score: number;
  database_coverage: number;
  one_percent_line_index?: number | null;
  recognized_actives: number;
  supported_claims: MarketingClaimResult[];
  weak_claims: MarketingClaimResult[];
  marketing_flags: MarketingFlag[];
};

export type SynergySignal = {
  type: string;
  severity: string;
  ingredients: string[];
  message: string;
  recommendation: string;
  score_delta: number;
};

export type ActiveLoad = {
  level: string;
  active_count: number;
  strong_active_count: number;
  irritating_active_count: number;
};

export type SynergyAnalysis = {
  verdict: string;
  balance_score: number;
  cumulative_irritation_risk: number;
  active_load: ActiveLoad;
  synergies: SynergySignal[];
  conflicts: SynergySignal[];
  redundancies: SynergySignal[];
  summary: {
    synergy_count: number;
    conflict_count: number;
    redundancy_count: number;
  };
};