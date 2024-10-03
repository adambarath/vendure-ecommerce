import { VendureConfig } from "@vendure/core";
import "dotenv/config";
import path from "path";

// ("mysql" | "mariadb" | "postgres" | "cockroachdb" | "sqlite" | "mssql" | "sap" | "oracle" | "cordova" | "nativescript" | "react-native" | "sqljs" | "mongodb" | "aurora-mysql" |"aurora-postgres" | "expo"| "better-sqlite3" | "capacitor" | "spanner")
// type: (process.env.DB_TYPE as string) || "better-sqlite3",
//
export const dbConnectionOptions: VendureConfig["dbConnectionOptions"] =
  process.env.DB_TYPE == "sqlite" || process.env.DB_TYPE == "better-sqlite3"
    ? {
        // See the README.md "Migrations" section for an explanation of
        // the `synchronize` and `migrations` options.
        synchronize: false,
        migrations: [path.join(__dirname, "./migrations/*.+(js|ts)")],
        logging: false,

        type: "better-sqlite3",
        database: path.join(__dirname, "../" + process.env.DB_NAME),
      }
    : {
        // See the README.md "Migrations" section for an explanation of
        // the `synchronize` and `migrations` options.
        synchronize: false,
        migrations: [path.join(__dirname, "./migrations/*.+(js|ts)")],
        logging: false,

        type: "postgres",
        database: process.env.DB_NAME,
        schema: process.env.DB_SCHEMA,
        host: process.env.DB_HOST,
        url: process.env.DB_URL,
        port: +process.env.DB_PORT,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_CA_CERT
          ? {
              ca: process.env.DB_CA_CERT,
            }
          : undefined,
      };
