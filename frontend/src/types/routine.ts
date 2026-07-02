export type RoutineStep = {
  order: number;
  name: string;
  product_type: string;
  instructions: string;
  benefits: string;
};

export type Routine = {
  routine_id: string;
  type: string;
  title: string;
  description: string;
  steps: RoutineStep[];
};

export type RoutinesByType = {
  [key: string]: Routine;
};

export type TrackingCompleted = {
  [key: string]: boolean;
};

export type TrackingStats = {
  streak: number;
  total_days: number;
};

export type SeasonalTip = {
  season: string;
  tip_of_day: string;
};