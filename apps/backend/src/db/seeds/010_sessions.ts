import type { Knex } from "knex";

const now = new Date();
const upcoming = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 2);
upcoming.setHours(7, 30, 0, 0);
const completed = new Date(now.getTime() - 1000 * 60 * 60 * 6);

const SESSIONS = [
  {
    id: "99999999-9999-9999-9999-999999999999",
    owner_id: "22222222-2222-2222-2222-222222222222",
    title: "Strength Block A",
    plan_id: "33333333-3333-3333-3333-333333333333",
    planned_at: upcoming,
    started_at: null,
    completed_at: null,
    status: "planned",
    visibility: "private",
    calories: 480,
    points: 45,
    notes: "Heavy lower-body emphasis",
    created_at: now,
    updated_at: now,
    deleted_at: null,
  },
  {
    id: "aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    owner_id: "22222222-2222-2222-2222-222222222222",
    title: "Tempo Run",
    planned_at: completed,
    started_at: new Date(completed.getTime() + 5 * 60 * 1000),
    completed_at: new Date(completed.getTime() + 45 * 60 * 1000),
    status: "completed",
    visibility: "public",
    calories: 320,
    points: 30,
    notes: "Maintain threshold pace throughout.",
    created_at: now,
    updated_at: now,
    deleted_at: null,
  },
];

export async function seed(knex: Knex): Promise<void> {
  await knex.raw("SELECT public.ensure_monthly_partitions();");
  await knex("sessions").insert(SESSIONS).onConflict("id").ignore();
}
