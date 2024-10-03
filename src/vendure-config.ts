import { dbConnectionOptions } from "./vendure-config-database";
import { plugins } from "./vendure-config-plugins";
import {
  dummyPaymentHandler,
  LanguageCode,
  VendureConfig,
} from "@vendure/core";
import "dotenv/config";
import path from "path";

const IS_DEV = process.env.APP_ENV === "dev";
const serverPort = +(process.env.PORT || 3000);

export const config: VendureConfig = {
  plugins,
  dbConnectionOptions,
  apiOptions: {
    hostname: process.env.HOSTNAME,
    port: serverPort,
    adminApiPath: "admin-api",
    shopApiPath: "shop-api",
    // The following options are useful in development mode,
    // but are best turned off for production for security
    // reasons.
    ...(IS_DEV
      ? {
          adminApiPlayground: {
            settings: { "request.credentials": "include" },
          },
          adminApiDebug: true,
          shopApiPlayground: {
            settings: { "request.credentials": "include" },
          },
          shopApiDebug: true,
        }
      : {}),
  },
  authOptions: {
    tokenMethod: ["bearer", "cookie"],
    superadminCredentials: {
      identifier: process.env.SUPERADMIN_USERNAME,
      password: process.env.SUPERADMIN_PASSWORD,
    },
    cookieOptions: {
      secret: process.env.COOKIE_SECRET,
    },
  },
  paymentOptions: {
    paymentMethodHandlers: [dummyPaymentHandler],
  },
  // When adding or altering custom field definitions, the database will
  // need to be updated. See the "Migrations" section in README.md.
  customFields: {
    // // deefined in: @vendure\payments-plugin\package\stripe\stripe.plugin.js
    // Customer: [ { name: "stripeCustomerId", type: "string"nullable: true, public: false, readonly: true, } ],
    Product: [
      // Rich text editor
      {
        label: [{ languageCode: LanguageCode.en, value: "Additional Info" }],
        name: "additionalInfo",
        type: "text",
        ui: { component: "rich-text-form-input" },
      },
      // JSON editor
      {
        label: [{ languageCode: LanguageCode.en, value: "JSON specs" }],
        name: "specs",
        type: "text",
        ui: { component: "json-editor-form-input" },
      },
      // Numeric with suffix
      {
        label: [{ languageCode: LanguageCode.en, value: "Weight (g)" }],
        name: "weight",
        type: "int",
        ui: { component: "number-form-input", suffix: "g" },
      },
      // Select with options
      {
        label: [
          { languageCode: LanguageCode.en, value: "Size Chart Reference" },
        ],
        name: "sizeChartType",
        type: "string",
        ui: {
          component: "select-form-input",
          options: [
            {
              value: "unisex-tshirt-01",
              label: [{ languageCode: LanguageCode.en, value: "Unisex" }],
            },
            {
              value: "women-tshirt-01",
              label: [
                { languageCode: LanguageCode.en, value: "Women t-shirt 01" },
              ],
            },
            {
              value: "men-tshirt-01",
              label: [
                { languageCode: LanguageCode.en, value: "Men t-shirt 01" },
              ],
            },
            {
              value: "women-tank-01",
              label: [
                { languageCode: LanguageCode.en, value: "Women tank 01" },
              ],
            },
            {
              value: "men-tank-01",
              label: [{ languageCode: LanguageCode.en, value: "Men tank 01" }],
            },
            {
              value: "women-hoodie-01",
              label: [
                { languageCode: LanguageCode.en, value: "Women hoodie 01" },
              ],
            },
            {
              value: "men-hoodie-01",
              label: [
                { languageCode: LanguageCode.en, value: "Men hoodie 01" },
              ],
            },
          ],
        },
      },
    ],
  },
};
