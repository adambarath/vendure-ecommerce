import { AwsSesEmailSender } from "./plugins/email-plugin/awsses-email-sender";
import {
  DefaultJobQueuePlugin,
  DefaultSearchPlugin,
  VendureConfig,
} from "@vendure/core";
import {
  defaultEmailHandlers,
  EmailPlugin,
  FileBasedTemplateLoader,
} from "@vendure/email-plugin";
import {
  AssetServerPlugin,
  configureS3AssetStorage,
} from "@vendure/asset-server-plugin";
import { AdminUiPlugin } from "@vendure/admin-ui-plugin";
import { StripePlugin } from "@vendure/payments-plugin/package/stripe";
import "dotenv/config";
import path from "path";

const IS_DEV = process.env.APP_ENV === "dev";
const serverPort = +(process.env.PORT || 3000);

export const plugins: VendureConfig["plugins"] = [
  AssetServerPlugin.init({
    route: "assets",
    assetUploadDir:
      process.env.ASSET_UPLOAD_DIR || path.join(__dirname, "../static/assets"),
    // If the MINIO_ENDPOINT environment variable is set, we'll use
    // Minio as the asset storage provider. Otherwise, we'll use the
    // default local provider.
    storageStrategyFactory: process.env.MINIO_ENDPOINT
      ? configureS3AssetStorage({
          bucket: "vendure-assets",
          credentials: {
            accessKeyId: process.env.MINIO_ACCESS_KEY,
            secretAccessKey: process.env.MINIO_SECRET_KEY,
          },
          nativeS3Configuration: {
            endpoint: process.env.MINIO_ENDPOINT,
            forcePathStyle: true,
            signatureVersion: "v4",
            // The `region` is required by the AWS SDK even when using MinIO,
            // so we just use a dummy value here.
            region: "eu-west-1",
          },
        })
      : undefined,
    // For local dev, the correct value for assetUrlPrefix should
    // be guessed correctly, but for production it will usually need
    // to be set manually to match your production url.
    assetUrlPrefix: IS_DEV ? undefined : process.env.STOREFRONT_DOMAIN,
  }),

  DefaultJobQueuePlugin.init({ useDatabaseForBuffer: true }),

  DefaultSearchPlugin.init({ bufferUpdates: false, indexStockStatus: true }),

  EmailPlugin.init({
    devMode: true,
    outputPath: path.join(__dirname, "../static/email/test-emails"),
    route: "mailbox",
    handlers: defaultEmailHandlers,
    templateLoader: new FileBasedTemplateLoader(
      path.join(__dirname, "../static/email/templates")
    ),
    globalTemplateVars: {
      // The following variables will change depending on your storefront implementation.
      fromAddress: process.env.SES_FROM,
      verifyEmailAddressUrl: process.env.STOREFRONT_DOMAIN + "/verify",
      passwordResetUrl: process.env.STOREFRONT_DOMAIN + "/password-reset",
      changeEmailAddressUrl:
        process.env.STOREFRONT_DOMAIN + "/verify-email-address-change",
    },
    emailSender: new AwsSesEmailSender(),
  }),

  AdminUiPlugin.init({
    route: "admin",
    port: serverPort + 2,
    adminUiConfig: {
      apiPort: serverPort,
    },
  }),

  // https://docs.vendure.io/reference/core-plugins/payments-plugin/stripe-plugin/#stripeplugin
  StripePlugin.init({
    // This prevents different customers from using the same PaymentIntent
    storeCustomersInStripe: true,
  }),
];
