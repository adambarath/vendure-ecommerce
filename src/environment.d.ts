export {};

// Here we declare the members of the process.env object, so that we
// can use them in our application code in a type-safe manner.
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      APP_ENV: string;
      PORT?: string;
      COOKIE_SECRET: string;
      SUPERADMIN_USERNAME: string;
      SUPERADMIN_PASSWORD: string;
      DB_TYPE?: string;
      DB_URL?: string;
      DB_HOST: string;
      DB_PORT: number;
      DB_NAME?: string;
      DB_USERNAME: string;
      DB_PASSWORD: string;
      DB_SCHEMA: string;
      DB_CA_CERT?: string;

      RUN_JOB_QUEUE_FROM_SERVER: string;
      STOREFRONT_DOMAIN: string;
      
      ASSET_UPLOAD_DIR?: string;
      MINIO_ACCESS_KEY: string;
      MINIO_SECRET_KEY: string;
      MINIO_ENDPOINT?: string;

      SES_REGION: string;
      SES_ACCESS_KEY_ID: string;
      SES_SECRET_ACCESS_KEY: string;
      SES_FROM: string;
      SES_ORDER_PLACED_CC?: string;
    }
  }
}
