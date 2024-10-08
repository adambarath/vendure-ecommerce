import { INestApplicationContext } from "@nestjs/common";
import {
  bootstrapWorker,
  ConfigService,
  Importer,
  LanguageCode,
  ParsedProductWithVariants,
  RequestContext,
  RequestContextService,
  TransactionalConnection,
  User,
  SearchService,
  ImportProgress,
} from "@vendure/core";

import { productsCsvFiles } from "./populate-test-data";

import { config } from "../vendure-config";

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
  // We use the bootstrapWorker() function instead of bootstrap() because we don't
  // need to start the server, we just need access to the services.
  const { app } = await bootstrapWorker(config);

  // Let's grab a reference to each of the Vendure services we'll need.
  const importer = app.get(Importer);

  // Most service methods require a RequestContext, so we'll create one here.
  const ctx = await getSuperadminContext(app);

  // To reindex after importing products
  const searchService = app.get(SearchService);

  // Import the products
  await importer.parseAndImport(productsCsvFiles[0], ctx, true);

  // todo
  //   const globalSettingsg = await app.get(TransactionalConnection).getRepository(GlobalSettings).findOneOrFail({ where: { id: 1 } });
  //   globalSettingsg.availableLanguages = [LanguageCode.hu, ... globalSettingsg.availableLanguages]
  //   await app.get(TransactionalConnection).getRepository(GlobalSettings).update(,globalSettingsg)

  /*
  // Create an instace of the client we'll be using to interact with the
  // OldCommerce API
  const client = createClient({ 
    // OldCommerce client config 
  });

  // Fetch all the products to import from the OldCommerce API
  const productsToImport: OldCommerceProduct[] = await client.getAllProducts();

  // Transform the OldCommerce products into the format expected by the Importer
  const importRows: ParsedProductWithVariants[] = productsToImport.map(
    (product) => ({
      product: {
        translations: [
          {
            languageCode: LanguageCode.en,
            name: product.name,
            slug: product.slug,
            description: product.description,
            customFields: {},
          },
        ],
        assetPaths: product.images.map((image) => image.sourceUrl),
        facets: [],
        optionGroups: product.options.map((option) => ({
          translations: [
            {
              languageCode: LanguageCode.en,
              name: option.name,
              values: option.values.map((value) => value.name),
            },
          ],
        })),
      },
      variants: product.variations.map((variation) => {
        const optionValues = variation.options.map((option) => option.value);
        return {
          sku: variation.productCode,
          price: variation.price,
          stockOnHand: variation.stock,
          translations: [{ languageCode: LanguageCode.en, optionValues }],
        };
      }),
    })
  );

  // Import the products
  await importer.importProducts(ctx, importRows, (progress) => {
    console.log(
      `Imported ${progress.imported} of ${importRows.length} products`
    );
  });

  // */

  // Rebuild search index
  await searchService.reindex(ctx);

  // Close the app
  await app.close();
}

/**
 * Creates a RequestContext configured for the default Channel with the activeUser set
 * as the superadmin user.
 */
export async function getSuperadminContext(
  app: INestApplicationContext
): Promise<RequestContext> {
  const { superadminCredentials } = app.get(ConfigService).authOptions;
  const superAdminUser = await app
    .get(TransactionalConnection)
    .getRepository(User)
    .findOneOrFail({ where: { identifier: superadminCredentials.identifier } });
  return app.get(RequestContextService).create({
    apiType: "admin",
    user: superAdminUser,
  });
}
