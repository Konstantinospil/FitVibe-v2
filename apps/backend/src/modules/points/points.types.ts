export type PointsSourceType =
  | "session_completed"
  | "streak_bonus"
  | "seasonal_event"
  | "manual_adjustment"
  | string;

export interface PointsEventRecord {
  id: string;
  user_id: string;
  source_type: PointsSourceType;
  source_id: string | null;
  algorithm_version: string | null;
  points: number;
  calories: number | null;
  metadata: Record<string, unknown>;
  awarded_at: string;
  created_at: string;
}

export interface InsertPointsEvent {
  id: string;
  user_id: string;
  source_type: PointsSourceType;
  source_id: string | null;
  algorithm_version: string;
  points: number;
  calories: number | null;
  metadata: Record<string, unknown>;
  awarded_at: Date;
  created_at: Date;
}

export interface PointsSummary {
  balance: number;
  recent: PointsEventRecord[];
}

export interface PointsHistoryQuery {
  cursor?: string;
  limit?: number;
  from?: string;
  to?: string;
}

export interface PointsHistoryResult {
  items: PointsEventRecord[];
  nextCursor: string | null;
}

export interface UserPointsProfile {
  dateOfBirth?: string | null;
  genderCode?: string | null;
  fitnessLevelCode?: string | null;
  trainingFrequency?: string | null;
}

export interface PointsCalculationContext {
  sessionCalories: number | null;
  averageRpe: number | null;
  distanceMeters: number;
  profile: UserPointsProfile;
}

export interface PointsCalculationResult {
  points: number;
  inputs: {
    calories: number | null;
    averageRpe: number | null;
    distanceMeters: number;
    ageYears: number | null | undefined;
    fitnessLevelCode: string | null | undefined;
    trainingFrequency: string | null | undefined;
  };
}

export interface AwardPointsResult {
  awarded: boolean;
  pointsAwarded: number | null;
  eventId: string | null;
  badgesAwarded: string[];
}

export interface ExerciseMetadata {
  id: string;
  type_code: string | null;
  tags: string[];
}

export interface BadgeCatalogEntry {
  code: string;
  name: string;
  description: string;
  category: string;
  icon?: string | null;
  priority: number;
  criteria: Record<string, unknown>;
}

export interface BadgeAwardRecord {
  id: string;
  user_id: string;
  badge_type: string;
  metadata: Record<string, unknown>;
  awarded_at: string;
}

export interface InsertBadgeAward {
  id: string;
  user_id: string;
  badge_type: string;
  metadata: Record<string, unknown>;
  awarded_at: Date;
}

export interface SessionMetricsSnapshot {
  averageRpe: number | null;
  distanceMeters: number;
  runDistanceMeters: number;
  rideDistanceMeters: number;
}

export interface BadgeEvaluationResult {
  badgeCode: string;
  metadata: Record<string, unknown>;
}
