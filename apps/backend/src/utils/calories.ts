export interface ExerciseEntryMetrics {
  actual_duration_s?: number | null;
  actual_sets?: number | null;
  actual_total_reps?: number | null;
  actual_avg_load_kg?: number | null;
}

export interface AthleteProfileMetrics {
  weight_kg?: number | null;
}

export function estimateEntryCalories(
  entry: ExerciseEntryMetrics,
  profile: AthleteProfileMetrics,
): number {
  const weight = Number(profile.weight_kg ?? 70);
  let kcal = 0;

  if (entry.actual_duration_s !== null && entry.actual_duration_s !== undefined) {
    const mins = Number(entry.actual_duration_s) / 60;
    const met = 6; // simplified default
    kcal = ((met * 3.5 * weight) / 200) * mins;
  } else if (entry.actual_sets && entry.actual_total_reps) {
    const reps = Number(entry.actual_total_reps);
    const load = Number(entry.actual_avg_load_kg ?? weight * 0.3);
    kcal = (reps * load * 0.1) / 4.184;
  }

  return Math.round(Math.max(0, kcal) * 10) / 10;
}
