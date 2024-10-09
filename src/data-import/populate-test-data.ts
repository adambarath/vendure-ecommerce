// https://github.com/vendure-ecommerce/real-world-vendure/blob/master/populate.ts
// https://docs.vendure.io/guides/developer-guide/importing-data/
// https://github.com/vendure-ecommerce/vendure/blob/master/packages/core/src/cli/populate.ts
// https://github.com/NadimD/vendure-simple-importer/blob/main/services/simple-importer.service.ts

/* eslint-disable @typescript-eslint/no-var-requires */
import { INestApplication } from "@nestjs/common";
import {
  bootstrap,
  defaultConfig,
  Logger,
  mergeConfig,
  RuntimeVendureConfig,
  DefaultJobQueuePlugin,
  LanguageCode,
  CollectionDefinition,
  InitialData,
  Channel,
  CollectionService,
  FacetValueService,
  PaymentMethodService,
  RequestContextService,
  RoleService,
  ShippingMethodService,
  TransactionalConnection,
  User,
  ChannelService,
  runMigrations,
} from "@vendure/core";
import {
  importProductsFromCsv,
  populate,
  populateCollections,
} from "@vendure/core/cli";
import { config } from "../vendure-config";
import path from "path";
import fs from "fs";
import { initializeDatabaseOnFirstRun } from "./initialize-database";
import { StripePlugin } from "@vendure/payments-plugin/package/stripe";

export const productsCsvFiles = [
  path.join(__dirname, "../../assets/seed-custom/products_1.csv"),
  path.join(__dirname, "../../assets/seed-custom/products_2.csv"),
];
const initialDataJsonFile = path.join(
  __dirname,
  "../../assets/seed-custom/initial-data.json"
);
const initialCollectionsJsonFile = path.join(
  __dirname,
  "../../assets/seed-custom/initial-collections.json"
);

const baseConfig = {
  ...config,
  importExportOptions: {
    importAssetsDir: path.join(initialDataJsonFile, "../images"),
  },
  dbConnectionOptions: {
    ...config.dbConnectionOptions,
    synchronize: true,
  },
};

if (require.main === module) {
  importData().then(
    () => process.exit(0),
    (err) => {
      console.log(err);
      process.exit(1);
    }
  );
}

async function importData() {
  await initializeDatabaseOnFirstRun(baseConfig);

  // if (baseConfig.plugins) {
  //   for (let i = 0; i < (baseConfig.plugins?.length ?? 0); i++) {
  //     let pluginDefinition = baseConfig.plugins[i];
  //     if (pluginDefinition) {
  //       console.log(pluginDefinition);
  //     }
  //   }
  // }
  const migrationConfig = {
    ...baseConfig,
    dbConnectionOptions: {
      ...baseConfig.dbConnectionOptions,
      synchronize: false,
    },
  };
  // Error: CustomFields config error: - Customer entity has duplicated custom field name: "stripeCustomerId"
  await runMigrations(migrationConfig);

  const populateConfig = {
    ...baseConfig,
    plugins: (baseConfig.plugins || []).filter(
      // Remove your JobQueuePlugin during populating to avoid
      // generating lots of unnecessary jobs as the Collections get created.
      (plugin) => plugin !== DefaultJobQueuePlugin
    ),
  };
  const app = await bootstrap(populateConfig);

  //await importProducts(app);
  await importCollections(app);

  app.close();
}

async function importProducts(app: INestApplication) {
  let data: InitialData = JSON.parse(
    fs.readFileSync(initialCollectionsJsonFile, "utf-8")
  );

  for (let i = 0; productsCsvFiles.length; i++) {
    await importProductsFromCsv(
      app,
      productsCsvFiles[i],
      data.defaultLanguage
      //'my-channel-token' // optional - used to assign imported
    ); //                   // entities to the specified Channel
  }
}

/**
 * @description
 * Should be run *after* the products have been populated, otherwise the expected FacetValues will not
 * yet exist.
 */
async function importCollections(app: INestApplication) {
  let data: InitialData = JSON.parse(
    fs.readFileSync(initialCollectionsJsonFile, "utf-8")
  );

  let channel = undefined;
  const ctx = await createRequestContext(app, data, channel);
  const collectionEntities = await app.get(CollectionService).findAll(ctx);
  const collectionsToInsert =
    collectionEntities.totalItems == 0
      ? data.collections
      : data.collections.filter((x) => {
          collectionEntities.items.find(
            (existinCollection) => existinCollection.name == x.name
          );
        });

  // console.log(collectionEntities);
  // console.log(data.collections);
  // console.log(collectionsToInsert);
  await populateCollections(
    app,
    {
      defaultLanguage: data.defaultLanguage, // en!  nem fog mukodni a collection facet szures kulonbozo nyelvekkel
      defaultZone: "",
      countries: [],
      taxRates: [],
      shippingMethods: [],
      paymentMethods: [],
      collections: collectionsToInsert,
    },
    undefined
  );
}

async function createRequestContext(
  app: INestApplication,
  data: InitialData,
  channel?: Channel
) {
  const { superadminCredentials } = baseConfig.authOptions;
  const channelService = await app.get(ChannelService);
  const connection = await app.get(TransactionalConnection);
  const requestContextService = await app.get(RequestContextService);
  const superAdminUser = await connection.rawConnection
    .getRepository(User)
    .findOne({
      where: {
        identifier: superadminCredentials!.identifier,
      },
    });

  const ctx = await requestContextService.create({
    user: superAdminUser ?? undefined,
    apiType: "admin",
    languageCode: data.defaultLanguage,
    channelOrToken: channel ?? (await channelService.getDefaultChannel()),
  });

  return ctx;
}

// import { clearAllTables, populateCustomers, SimpleGraphQLClient } from '@vendure/testing';
// import gql from 'graphql-tag';
// import { AdminUiPlugin } from '@vendure/admin-ui-plugin';

// const initialData = require('@vendure/create/assets/initial-data.json');

// // tslint:disable:no-console

// /**
//  * A CLI script which populates the database with some sample data
//  */
// if (require.main === module) {
//     // Running from command line
//     const populateConfig = mergeConfig(
//         defaultConfig,
//         mergeConfig(config, {
//             authOptions: {
//                 tokenMethod: 'bearer',
//                 requireVerification: false,
//             },
//             importExportOptions: {
//                 importAssetsDir: resolveFromCreatePackage('assets/images'),
//             },
//             customFields: {},
//             plugins: config.plugins!.filter(plugin => plugin !== AdminUiPlugin),
//         }),
//     );
//     clearAllTables(populateConfig, true)
//         .then(() =>
//             populate(
//                 () => bootstrap(populateConfig),
//                 initialData,
//                 resolveFromCreatePackage('assets/products.csv'),
//             ),
//         )
//         .then(async app => {
//             console.log('populating customers...');
//             await populateCustomers(app, 10, message => Logger.error(message));
//             await populateReview(populateConfig);
//             return app.close();
//         })
//         .then(
//             () => process.exit(0),
//             err => {
//                 console.log(err);
//                 process.exit(1);
//             },
//         );
// }

// function resolveFromCreatePackage(target: string): string {
//     return path.join(path.dirname(require.resolve('@vendure/create')), target);
// }

// async function populateReview(config: RuntimeVendureConfig) {
//     const { port, shopApiPath } = config.apiOptions;
//     const client = new SimpleGraphQLClient(config, `http://localhost:${port}/${shopApiPath}`);

//     await client.query(gql`
//         mutation {
//             submitProductReview(
//                 input: {
//                     productId: "1"
//                     summary: "A great laptop!"
//                     body: "The laptop looks great an performance is flawless."
//                     rating: 5
//                     authorName: "Randall M"
//                     authorLocation: "Vienna"
//                 }
//             ) {
//                 id
//             }
//         }
//     `);
// }
