import { populate } from "@vendure/core/cli";
import { bootstrap, VendureConfig } from "@vendure/core";
import { createConnection } from "typeorm";
import path from "path";

/**
 * @description
 * This function is responsible for populating the DB with test data on the first run. It
 * first checks to see if the configured DB has any tables, and if not, runs the `populate()`
 * function using data from the @vendure/create package.
 *
 * make sure that you installed the following packages:
 *   @vendure/cli
 *   @vendure/create
 *
 * https://github.com/vendure-ecommerce/one-click-deploy
 */
export async function initializeDatabaseOnFirstRun(config: VendureConfig) {
  const dbTablesAlreadyExist = await tablesExist(config);
  if (!dbTablesAlreadyExist) {
    console.log(`No Vendure tables found in DB. Populating database...`);

    const app = await populate(
      () =>
        bootstrap({
          ...config,
          importExportOptions: {
            importAssetsDir: path.join(
              require.resolve("../../assets/seed-custom/initial-data.json"),
              "../images"
            ),
          },
          dbConnectionOptions: {
            ...config.dbConnectionOptions,
            synchronize: true,
          },
        }),
      require("../../assets/seed-custom/initial-data.json"),
      undefined //  collections and product are imported by a standalon command
    );

    app.close();
  } else {
    return;
  }
}

async function tablesExist(config: VendureConfig) {
  const connection = await createConnection(config.dbConnectionOptions);

  if (config.dbConnectionOptions.type == "postgres") {
    const result = await connection.query(`
            select n.nspname as table_schema,
                   c.relname as table_name,
                   c.reltuples as rows
            from pg_class c
            join pg_namespace n on n.oid = c.relnamespace
            where c.relkind = 'r'
                  and n.nspname = '${process.env.DB_SCHEMA}'
            order by c.reltuples desc;`);
    await connection.close();
    return 0 < result.length;
  }

  if (
    config.dbConnectionOptions.type == "better-sqlite3" ||
    config.dbConnectionOptions.type == "sqlite"
  ) {
    try {
      const result = await connection.query(`select name from sqlite_sequence`);
      await connection.close();
      return 0 < result.length;
    } catch (error) {
      // SqliteError: no such table: sqlite_sequence
      return false;
    }
  }

  return false;
}
