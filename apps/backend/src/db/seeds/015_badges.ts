import type { Knex } from "knex";

const now = new Date();

const BADGE_CATALOG = [
  {
    code: "first_session",
    name: "First Session",
    description: "Completed your very first training session.",
    category: "milestone",
    icon: "spark",
    priority: 10,
    criteria: { completed_sessions: 1 },
  },
  {
    code: "streak_7_day",
    name: "7-Day Streak",
    description: "Logged at least one session every day for 7 consecutive days.",
    category: "streak",
    icon: "flame",
    priority: 20,
    criteria: { consecutive_days: 7 },
  },
  {
    code: "run_10k",
    name: "10K Run",
    description: "Logged a running session covering at least 10 kilometers.",
    category: "distance",
    icon: "run",
    priority: 30,
    criteria: { activity: "run", distance_km: 10 },
  },
  {
    code: "ride_100k",
    name: "100K Ride",
    description: "Completed a cycling session covering at least 100 kilometers.",
    category: "distance",
    icon: "bike",
    priority: 40,
    criteria: { activity: "ride", distance_km: 100 },
  },
];

const BADGES = [
  {
    id: "55555555-6666-7777-8888-999999999999",
    user_id: "22222222-2222-2222-2222-222222222222",
    badge_type: "first_session",
    awarded_at: now,
    metadata: {
      session_id: "aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    },
  },
];

export async function seed(knex: Knex): Promise<void> {
  await knex("badge_catalog").insert(BADGE_CATALOG).onConflict("code").merge();
  await knex("badges").insert(BADGES).onConflict("id").ignore();
}
