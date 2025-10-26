import type { Knex } from "knex";

const USER_POINTS_TABLE = "user_points";
const USER_POINTS_SOURCE_INDEX = "user_points_source_unique_idx";
const BADGE_CATALOG_TABLE = "badge_catalog";
const BADGES_TABLE = "badges";
const BADGES_UNIQUE_INDEX = "badges_user_badge_unique_idx";
const BADGES_FK_NAME = "badges_badge_type_fk";

async function addColumnIfMissing(
  knex: Knex,
  tableName: string,
  columnName: string,
  builder: (table: Knex.CreateTableBuilder | Knex.AlterTableBuilder) => void,
) {
  const hasColumn = await knex.schema.hasColumn(tableName, columnName);
  if (!hasColumn) {
    await knex.schema.alterTable(tableName, builder);
  }
}

export async function up(knex: Knex): Promise<void> {
  await addColumnIfMissing(knex, USER_POINTS_TABLE, "source_id", (table) => {
    table.uuid("source_id").nullable();
  });

  await addColumnIfMissing(knex, USER_POINTS_TABLE, "calories", (table) => {
    table.integer("calories").nullable();
  });

  await addColumnIfMissing(knex, USER_POINTS_TABLE, "metadata", (table) => {
    table.jsonb("metadata").notNullable().defaultTo(knex.raw("'{}'::jsonb"));
  });

  await addColumnIfMissing(knex, USER_POINTS_TABLE, "created_at", (table) => {
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw(`
    CREATE UNIQUE INDEX IF NOT EXISTS ${USER_POINTS_SOURCE_INDEX}
    ON ${USER_POINTS_TABLE}(user_id, source_type, source_id)
    WHERE source_id IS NOT NULL
  `);

  const hasBadgeCatalog = await knex.schema.hasTable(BADGE_CATALOG_TABLE);
  if (!hasBadgeCatalog) {
    await knex.schema.createTable(BADGE_CATALOG_TABLE, (table) => {
      table.string("code").primary();
      table.string("name").notNullable();
      table.text("description").notNullable();
      table.string("category").notNullable();
      table.string("icon").nullable();
      table.integer("priority").notNullable().defaultTo(0);
      table.jsonb("criteria").notNullable().defaultTo(knex.raw("'{}'::jsonb"));
      table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    });
  }

  await addColumnIfMissing(knex, BADGES_TABLE, "metadata", (table) => {
    table.jsonb("metadata").notNullable().defaultTo(knex.raw("'{}'::jsonb"));
  });

  await knex.raw(`
    CREATE UNIQUE INDEX IF NOT EXISTS ${BADGES_UNIQUE_INDEX}
    ON ${BADGES_TABLE}(user_id, badge_type)
  `);

  const existingTypes = (await knex(BADGES_TABLE)
    .distinct("badge_type")
    .pluck("badge_type")) as string[];
  if (existingTypes.length > 0) {
    const seedCatalogRows = existingTypes.map((badgeType) => ({
      code: badgeType,
      name: badgeType.replace(/_/g, " "),
      description: "Legacy badge definition (auto-generated during migration).",
      category: "legacy",
      icon: null,
      priority: 0,
      criteria: {},
    }));
    await knex(BADGE_CATALOG_TABLE).insert(seedCatalogRows).onConflict("code").ignore();
  }

  await knex.raw(`
    ALTER TABLE ${BADGES_TABLE}
    ADD CONSTRAINT ${BADGES_FK_NAME}
    FOREIGN KEY (badge_type) REFERENCES ${BADGE_CATALOG_TABLE}(code)
    ON UPDATE CASCADE ON DELETE CASCADE
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`ALTER TABLE ${BADGES_TABLE} DROP CONSTRAINT IF EXISTS ${BADGES_FK_NAME};`);
  await knex.raw(`DROP INDEX IF EXISTS ${BADGES_UNIQUE_INDEX};`);

  const badgesHasMetadata = await knex.schema.hasColumn(BADGES_TABLE, "metadata");
  if (badgesHasMetadata) {
    await knex.schema.alterTable(BADGES_TABLE, (table) => {
      table.dropColumn("metadata");
    });
  }

  await knex.schema.dropTableIfExists(BADGE_CATALOG_TABLE);

  await knex.raw(`DROP INDEX IF EXISTS ${USER_POINTS_SOURCE_INDEX};`);

  const pointsColumns = ["created_at", "metadata", "calories", "source_id"] as const;
  for (const column of pointsColumns) {
    const hasColumn = await knex.schema.hasColumn(USER_POINTS_TABLE, column);
    if (hasColumn) {
      await knex.schema.alterTable(USER_POINTS_TABLE, (table) => {
        table.dropColumn(column);
      });
    }
  }
}
