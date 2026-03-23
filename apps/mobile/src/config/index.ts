import { Platform } from 'react-native';

const LOCALHOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_CONFIG = {
  // Local dev URLs — only used if you explicitly switch to DEV
  DEV: {
    BASE_URL: `http://${LOCALHOST}:3000`,
    API_URL: `http://${LOCALHOST}:3000/api`,
    POWERSYNC_URL: `http://${LOCALHOST}:6061`,
  },
  // Production — always used (like fajr app)
  PROD: {
    BASE_URL: 'https://sitemap.live',
    API_URL: 'https://sitemap.live/api',
    POWERSYNC_URL: 'https://sync.sitemap.live',
  },
  // Always use production
  get current() {
    return this.PROD;
  },
};

export const AUTH_CONFIG = {
  STORAGE_KEYS: {
    USER: '@sitemap:user',
    TOKEN: '@sitemap:token',
    SESSION: '@sitemap:session',
  },
  SESSION_TIMEOUT: 14 * 24 * 60 * 60 * 1000, // 14 days
};

export const DB_CONFIG = {
  NAME: 'sitemap-db',
};

export const APP_CONFIG = {
  NAME: 'SiteMap',
  VERSION: '1.0.0',
  FEATURES: {
    OFFLINE_MODE: true,
    AUTO_SYNC: true,
  },
  NETWORK: {
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
  },
};

export const getApiUrl = (endpoint: string = ''): string => {
  return endpoint
    ? `${API_CONFIG.current.API_URL}${endpoint}`
    : API_CONFIG.current.API_URL;
};

export const getBaseUrl = (): string => {
  return API_CONFIG.current.BASE_URL;
};

export const getPowerSyncUrl = (): string => {
  return API_CONFIG.current.POWERSYNC_URL;
};
