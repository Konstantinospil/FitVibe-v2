export interface MetricTargets {
  reps?: number;
  weight?: number;
  duration_sec?: number;
  distance?: number;
}
export type MetricUnit = 'kg' | 'lb' | 'km' | 'mi' | 'sec' | 'min';
export type MetricMeasure = 'weight' | 'reps' | 'duration' | 'distance' | 'rpe';
export interface MetricSpec {
  unit?: MetricUnit;
  measure?: MetricMeasure;
  targets?: MetricTargets;
}

export interface Exercise {
  id: string;
  name: string;
  type_code: string;
  owner_user_id?: string | null;
  default_metrics?: MetricSpec;
  is_archived?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateExerciseDTO {
  name: string;
  type_code: string;
  default_metrics?: Partial<MetricSpec>;
  owner_user_id?: string | null; // admin may specify; normal users ignored
}

export interface UpdateExerciseDTO {
  name?: string;
  type_code?: string;
  default_metrics?: Partial<MetricSpec>;
}

export interface ExerciseQuery {
  search?: string;
  type_code?: string;
  include_archived?: boolean;
  limit?: number;
  offset?: number;
  owner_user_id?: string | null; // admin may specify; normal users ignored

}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}
