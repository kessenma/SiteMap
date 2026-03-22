// Env vars are injected at build time via rspack DefinePlugin (see rspack.config.mjs)
declare namespace NodeJS {
  interface ProcessEnv {
    MOBILE_API_URL: string;
    MOBILE_POWERSYNC_URL: string;
    PROD_API_URL: string;
    PROD_POWERSYNC_URL: string;
    NODE_ENV: string;
  }
}
