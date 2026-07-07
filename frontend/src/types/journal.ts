export type JournalEntry = {
  tracking_id: string;
  image_base64?: string;
  note?: string;
  hydration: number;
  glow: number;
  texture: number;
  irritation: number;
  breakouts: number;
  redness: number;
  created_at: string;
};

export type SkinAnalysis = {
  skin_type: string;
  concerns: string[];
  summary: string;
};

export type ProductFeedback = {
  analysis_id: string;
  product_name: string;
  days_used?: number;
};

export type OasisLearnings = {
  total_feedbacks: number;
  positive_products: number;
  neutral_products: number;
  negative_products: number;
  insights?: string[];
  top_ingredients?: {
    ingredient: string;
  }[];
  ingredient_correlations?: any[];
};