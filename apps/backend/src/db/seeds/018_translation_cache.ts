import type { Knex } from "knex";

const now = new Date();

const ENTRIES = [
  {
    id: "cccc3333-dddd-4444-eeee-555555555555",
    source: "Keep the tempo steady throughout the run.",
    lang: "de",
    translated: "Halte das Tempo während des Laufs konstant.",
    created_at: now,
  },
  {
    id: "dddd4444-eeee-5555-ffff-666666666666",
    source: "Congratulations on your three-week streak!",
    lang: "en",
    translated: "Congratulations on your three-week streak!",
    created_at: new Date(now.getTime() + 1000 * 60 * 60),
  },
];

export async function seed(knex: Knex): Promise<void> {
  await knex("translation_cache").insert(ENTRIES).onConflict("id").ignore();
}
