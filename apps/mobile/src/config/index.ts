import { Platform } from 'react-native';

const __DEV__ = process.env.NODE_ENV === 'development';
const LOCALHOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

const devApiBase = process.env.MOBILE_API_URL || `http://${LOCALHOST}:3000`;
const devPowerSyncUrl = process.env.MOBILE_POWERSYNC_URL || `http://${LOCALHOST}:6061`;
const prodApiBase = process.env.PROD_API_URL || 'https://sitemap.yourdomain.com';
const prodPowerSyncUrl = process.env.PROD_POWERSYNC_URL || 'https://sync.sitemap.yourdomain.com';

export const API_CONFIG = {
  DEV: {
    BASE_URL: devApiBase,
    API_URL: `${devApiBase}/api`,
    POWERSYNC_URL: devPowerSyncUrl,
  },
  PROD: {
    BASE_URL: prodApiBase,
    API_URL: `${prodApiBase}/api`,
    POWERSYNC_URL: prodPowerSyncUrl,
  },
  get current() {
    return __DEV__ ? this.DEV : this.PROD;
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
