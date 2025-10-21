import type { Knex } from "knex";

const now = new Date();

const EXERCISES = [
  {
    id: "77777777-7777-7777-7777-777777777777",
    owner_id: null,
    name: "Back Squat",
    type_code: "strength",
    muscle_group: "Lower Body",
    equipment: "Barbell",
    tags: ["compound", "lower-body", "strength"],
    is_public: true,
    description_en: "Barbell squat focusing on posterior chain strength.",
    description_de: "Kniebeuge mit Langhantel für die hintere Muskelkette.",
    created_at: now,
    updated_at: now,
    archived_at: null,
  },
  {
    id: "88888888-8888-8888-8888-888888888888",
    owner_id: "22222222-2222-2222-2222-222222222222",
    name: "Tempo Run 5K",
    type_code: "cardio",
    muscle_group: "Cardio",
    equipment: "Running Shoes",
    tags: ["tempo", "endurance"],
    is_public: false,
    description_en: "5K tempo run targeting threshold pace.",
    description_de: null,
    created_at: now,
    updated_at: now,
    archived_at: null,
  },
];

export async function seed(knex: Knex): Promise<void> {
  await knex("exercises").insert(EXERCISES).onConflict("id").ignore();
}
