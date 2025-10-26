import path from "node:path";
import knex from "knex";

const DATABASE_URL = process.env.TEST_DATABASE_URL ?? "";

const describeFn = DATABASE_URL ? describe : describe.skip;

describeFn("database migrations", () => {
  let client: knex.Knex;

  beforeAll(async () => {
    const admin = knex({
      client: "pg",
      connection: DATABASE_URL,
    });

    await admin.raw("DROP SCHEMA IF EXISTS tmp_migration_test CASCADE;");
    await admin.raw("CREATE SCHEMA tmp_migration_test;");
    await admin.destroy();

    client = knex({
      client: "pg",
      connection: DATABASE_URL,
      searchPath: ["tmp_migration_test"],
      migrations: {
        loadExtensions: [".ts"],
        directory: path.resolve(__dirname, "../../src/db/migrations"),
      },
    });
  });

  afterAll(async () => {
    if (client) {
      await client.destroy();
    }
    const admin = knex({
      client: "pg",
      connection: DATABASE_URL,
    });
    await admin.raw("DROP SCHEMA IF EXISTS tmp_migration_test CASCADE;");
    await admin.destroy();
  });

  it("applies latest migrations and rolls back cleanly", async () => {
    await client.migrate.latest();
    await client.migrate.rollback(undefined, true);
  });
});

if (!DATABASE_URL) {
  test.skip("Set TEST_DATABASE_URL to enable migration tests", () => undefined);
}
