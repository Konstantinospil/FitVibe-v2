import { Knex } from "knex";

const ROLES = [
  { code: "admin", description: "Platform administrator" },
  { code: "coach", description: "Coach / trainer with team oversight" },
  { code: "athlete", description: "Individual athlete" },
  { code: "support", description: "Support staff (nutrition, physio, etc.)" },
];

export async function seed(knex: Knex): Promise<void> {
  await knex("roles").insert(ROLES).onConflict("code").ignore();
}

