import type { Knex } from "knex";

const REFRESH_INDEX = "refresh_tokens_user_session_idx";
const AUTH_TOKEN_INDEX = "auth_tokens_type_hash_idx";
const AUTH_TOKEN_CREATED_INDEX = "auth_tokens_created_idx";

export async function up(knex: Knex): Promise<void> {
  const hasRefreshTokens = await knex.schema.hasTable("refresh_tokens");
  if (!hasRefreshTokens) {
    await knex.schema.createTable("refresh_tokens", (table) => {
      table.uuid("id").primary();
      table
        .uuid("user_id")
        .notNullable()
        .references("id")
        .inTable("users")
        .onUpdate("CASCADE")
        .onDelete("CASCADE");
      table
        .uuid("session_jti")
        .notNullable()
        .references("jti")
        .inTable("auth_sessions")
        .onUpdate("CASCADE")
        .onDelete("CASCADE");
      table.string("token_hash").notNullable().unique();
      table.timestamp("expires_at", { useTz: true }).notNullable();
      table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
      table.timestamp("revoked_at", { useTz: true }).nullable();
      table.timestamp("rotated_at", { useTz: true }).nullable();
    });

    await knex.schema.alterTable("refresh_tokens", (table) => {
      table.index(["user_id", "session_jti"], REFRESH_INDEX);
    });
  } else {
    const hasSessionColumn = await knex.schema.hasColumn("refresh_tokens", "session_jti");
    if (!hasSessionColumn) {
      await knex.schema.alterTable("refresh_tokens", (table) => {
        table
          .uuid("session_jti")
          .references("jti")
          .inTable("auth_sessions")
          .onUpdate("CASCADE")
          .onDelete("CASCADE");
      });
    }
    const hasRotatedColumn = await knex.schema.hasColumn("refresh_tokens", "rotated_at");
    if (!hasRotatedColumn) {
      await knex.schema.alterTable("refresh_tokens", (table) => {
        table.timestamp("rotated_at", { useTz: true }).nullable();
      });
    }
    await knex.raw(
      `CREATE INDEX IF NOT EXISTS ${REFRESH_INDEX} ON refresh_tokens (user_id, session_jti)`,
    );
  }

  const hasAuthTokens = await knex.schema.hasTable("auth_tokens");
  if (!hasAuthTokens) {
    await knex.schema.createTable("auth_tokens", (table) => {
      table.uuid("id").primary();
      table
        .uuid("user_id")
        .notNullable()
        .references("id")
        .inTable("users")
        .onUpdate("CASCADE")
        .onDelete("CASCADE");
      table.string("token_type", 64).notNullable();
      table.string("token_hash").notNullable().unique();
      table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
      table.timestamp("expires_at", { useTz: true }).notNullable();
      table.timestamp("consumed_at", { useTz: true }).nullable();
    });

    await knex.schema.alterTable("auth_tokens", (table) => {
      table.index(["token_type", "token_hash"], AUTH_TOKEN_INDEX);
      table.index(["created_at"], AUTH_TOKEN_CREATED_INDEX);
    });
  } else {
    const hasConsumedColumn = await knex.schema.hasColumn("auth_tokens", "consumed_at");
    if (!hasConsumedColumn) {
      await knex.schema.alterTable("auth_tokens", (table) => {
        table.timestamp("consumed_at", { useTz: true }).nullable();
      });
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasRefreshTokens = await knex.schema.hasTable("refresh_tokens");
  if (hasRefreshTokens) {
    await knex.raw(`DROP INDEX IF EXISTS ${REFRESH_INDEX}`);
    await knex.schema.dropTable("refresh_tokens");
  }

  const hasAuthTokens = await knex.schema.hasTable("auth_tokens");
  if (hasAuthTokens) {
    await knex.raw(`DROP INDEX IF EXISTS ${AUTH_TOKEN_INDEX}`);
    await knex.raw(`DROP INDEX IF EXISTS ${AUTH_TOKEN_CREATED_INDEX}`);
    await knex.schema.dropTable("auth_tokens");
  }
}
