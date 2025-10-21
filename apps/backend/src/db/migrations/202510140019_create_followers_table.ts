import type { Knex } from "knex";

const FOLLOWERS_UNIQUE = "followers_follower_following_unique";
const FOLLOWERS_NO_SELF = "followers_no_self_follow";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("followers", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("follower_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
    table
      .uuid("following_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.unique(["follower_id", "following_id"], FOLLOWERS_UNIQUE);
  });

  await knex.raw(
    `ALTER TABLE followers ADD CONSTRAINT ${FOLLOWERS_NO_SELF} CHECK (follower_id <> following_id);`,
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`ALTER TABLE followers DROP CONSTRAINT IF EXISTS ${FOLLOWERS_NO_SELF};`);
  await knex.schema.dropTableIfExists("followers");
}
