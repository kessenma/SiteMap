import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import * as Repack from '@callstack/repack';
import { ReanimatedPlugin } from '@callstack/repack-plugin-reanimated';
import rspack from '@rspack/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from monorepo root and expose selected vars as process.env.*
const envPath = path.resolve(__dirname, '../../.env');
const envVars = {};
try {
  const envFile = readFileSync(envPath, 'utf-8');
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    envVars[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
  }
} catch {
  // .env is optional
}

const EXPOSED_ENV_KEYS = [
  'MOBILE_API_URL',
  'MOBILE_POWERSYNC_URL',
  'PROD_API_URL',
  'PROD_POWERSYNC_URL',
  'NODE_ENV',
];

const defineValues = {};
for (const key of EXPOSED_ENV_KEYS) {
  defineValues[`process.env.${key}`] = JSON.stringify(envVars[key] || '');
}

export default Repack.defineRspackConfig({
  context: __dirname,
  entry: './index.js',
  resolve: {
    ...Repack.getResolveOptions(),
    modules: ['node_modules', path.resolve(__dirname, 'node_modules')],
    alias: {
      '@sitemap/shared/types': path.resolve(__dirname, '../../packages/shared/src/types/index.ts'),
      '@sitemap/shared/theme': path.resolve(__dirname, '../../packages/shared/src/theme/index.ts'),
      '@sitemap/shared/schema': path.resolve(__dirname, '../../packages/shared/src/schema/index.ts'),
      '@sitemap/shared/auth': path.resolve(__dirname, '../../packages/shared/src/auth/index.ts'),
      '@sitemap/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
  module: {
    rules: [
      // Babel-only for @powersync/common — SWC rejects its "use strict" pattern
      {
        test: /\.[cm]?[jt]sx?$/,
        include: [/node_modules[/\\]@powersync[/\\]common/],
        type: 'javascript/auto',
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['module:@react-native/babel-preset'],
          },
        },
      },
      {
        test: /\.[cm]?[jt]sx?$/,
        exclude: [/node_modules[/\\]@powersync[/\\]common/],
        type: 'javascript/auto',
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['module:@react-native/babel-preset'],
          },
        },
      },
      ...Repack.getAssetTransformRules(),
    ],
  },
  plugins: [
    new Repack.RepackPlugin(),
    new ReanimatedPlugin({
      unstable_disableTransform: true,
    }),
    new rspack.DefinePlugin(defineValues),
  ],
});
