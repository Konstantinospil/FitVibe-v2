import type { Knex } from "knex";
import bcrypt from "bcryptjs";

const ADMIN_ID = "11111111-1111-1111-1111-111111111111";
const ATHLETE_ID = "22222222-2222-2222-2222-222222222222";

export async function seed(knex: Knex): Promise<void> {
  const [adminPassword, athletePassword] = await Promise.all([
    bcrypt.hash("Admin123!", 12),
    bcrypt.hash("Athlete123!", 12),
  ]);

  const users = [
    {
      id: ADMIN_ID,
      username: "admin",
      display_name: "FitVibe Admin",
      locale: "en-US",
      preferred_lang: "en",
      status: "active",
      role_code: "admin",
      password_hash: adminPassword,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: ATHLETE_ID,
      username: "jane.doe",
      display_name: "Jane Doe",
      locale: "en-GB",
      preferred_lang: "en",
      status: "active",
      role_code: "athlete",
      password_hash: athletePassword,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  await knex("users").insert(users).onConflict("id").ignore();
}
