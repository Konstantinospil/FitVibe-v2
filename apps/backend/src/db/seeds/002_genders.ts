import type { Knex } from "knex";

const GENDERS = [
  { code: "female", description: "Female" },
  { code: "male", description: "Male" },
  { code: "non_binary", description: "Non-binary" },
  { code: "unspecified", description: "Prefer not to say" },
];

export async function seed(knex: Knex): Promise<void> {
  await knex("genders").insert(GENDERS).onConflict("code").ignore();
}
