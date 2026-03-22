# TestFlight Deployment Setup Guide

This guide covers setting up automated TestFlight deployment for the SiteMap iOS app.

## Prerequisites

1. **Apple Developer Account** — active Apple Developer Program membership
2. **App Store Connect Access** — with Admin or App Manager role
3. **Ruby** — 2.6.10 or newer
4. **Bundler** — `gem install bundler`
5. **Node.js** — 22+
6. **Xcode** — latest stable version

## Initial Setup

### 1. Install Dependencies

```bash
cd apps/mobile

# Install Ruby gems (including Fastlane)
bundle install

# Install Node modules (if not already done)
pnpm install

# Install CocoaPods dependencies
cd ios && pod install && cd ..
```

### 2. Configure App Store Connect API Key

See [APP_STORE_CONNECT_API_KEY.md](APP_STORE_CONNECT_API_KEY.md) for the full guide on generating and placing your `.p8` key.

### 3. Configure Environment Variables

```bash
# Copy the template
cp ios/fastlane/.env.example ios/fastlane/.env

# Edit with your values (NEVER commit this file)
```

Fill in `ios/fastlane/.env`:

```env
APP_STORE_CONNECT_API_KEY_ID=YOUR_KEY_ID
APP_STORE_CONNECT_ISSUER_ID=YOUR_ISSUER_ID
APP_STORE_CONNECT_API_PRIVATE_KEY_PATH=./AuthKey_XXXXXXXXXX.p8

APPLE_ID=you@example.com
TEAM_ID=XXXXXXXXXX
APP_IDENTIFIER=com.sitemap.app

SKIP_WAITING_FOR_BUILD_PROCESSING=true
DISTRIBUTE_EXTERNAL=false
NOTIFY_EXTERNAL_TESTERS=false
```

### 4. Update Bundle Identifier

Make sure your app's bundle identifier matches across:

1. Xcode project → Select the SiteMap target → Bundle Identifier
2. `ios/fastlane/Appfile` → `app_identifier`
3. `ios/fastlane/.env` → `APP_IDENTIFIER`
4. `ios/ExportOptions.plist` → provisioningProfiles key

### 5. Update ExportOptions.plist

Edit `ios/ExportOptions.plist` and replace:
- `XXXXXXXXXX` with your Team ID
- `com.sitemap.app` with your bundle ID (if different)
- Update the provisioning profile name to match yours

### 6. Initialize Version Tracking

```bash
node scripts/bump-ios-version.js init
```

This creates/syncs `ios-version.json` with your Xcode project.

## Usage

### Deploy to TestFlight

The simplest way — bumps version, builds, and uploads:

```bash
pnpm run deploy:ios:beta
```

This will:
1. Prune old build logs (keeps last 10)
2. Bump the version and build number
3. Archive with xcodebuild
4. Export to IPA
5. Upload to TestFlight
6. Save a full build log to `build-logs/`

### Version Management

```bash
# Show current version
pnpm run version:ios:current

# Bump patch version (1.0.0 → 1.0.1, build always increments)
pnpm run version:ios:bump-patch

# Bump minor version (1.0.1 → 1.1.0)
pnpm run version:ios:bump-minor

# Bump major version (1.1.0 → 2.0.0)
pnpm run version:ios:bump-major
```

Build number is automatically incremented with every version bump.

## Available pnpm Scripts

| Script | Description |
|--------|-------------|
| `deploy:ios:beta` | Build and upload to TestFlight |
| `version:ios:current` | Show current version |
| `version:ios:bump-patch` | Bump patch version |
| `version:ios:bump-minor` | Bump minor version |
| `version:ios:bump-major` | Bump major version |

## Build Logs

Every deployment creates a timestamped log file:

```
build-logs/
└── deploy-beta/
    ├── 2026-03-22/
    │   ├── deploy-beta-14-30-45.log
    │   └── deploy-beta-15-45-20.log
    └── 2026-03-21/
        └── deploy-beta-10-15-30.log
```

Only the last 10 logs are kept — older logs are automatically pruned on each deploy.

## Environment Variables Reference

### Required

| Variable | Description |
|----------|-------------|
| `APP_STORE_CONNECT_API_KEY_ID` | Your API Key ID |
| `APP_STORE_CONNECT_ISSUER_ID` | Your Issuer ID |
| `APP_STORE_CONNECT_API_PRIVATE_KEY_PATH` | Path to your .p8 file |
| `TEAM_ID` | Apple Developer Team ID |
| `APP_IDENTIFIER` | Bundle identifier (e.g., `com.sitemap.app`) |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `SKIP_WAITING_FOR_BUILD_PROCESSING` | `true` | Skip waiting for Apple to process the build |
| `DISTRIBUTE_EXTERNAL` | `false` | Auto-distribute to external testers |
| `NOTIFY_EXTERNAL_TESTERS` | `false` | Notify external testers on new build |
| `BUMP_MARKETING_VERSION` | — | Set to `1` to bump marketing version |
| `BUMP_MARKETING_VERSION_BUMP_TYPE` | `patch` | `patch`, `minor`, or `major` |

## Troubleshooting

### "IPA not found" Error

The build step may have failed. Check the build log:
```bash
ls build-logs/deploy-beta/
```

### "API key file not found" Error

1. Verify the `.p8` file exists: `ls ios/fastlane/AuthKey_*.p8`
2. Check the path in `ios/fastlane/.env` matches
3. The path is relative to `ios/fastlane/`

### Ruby Version Issues

```bash
ruby -v

# Install with rbenv
rbenv install 3.2.0
rbenv local 3.2.0

# Or with mise
mise install ruby@3.2.0
mise use ruby@3.2.0
```

### Bundle Install Fails

```bash
bundle install --force
```

### Code Signing Issues

1. Ensure you have the correct certificates and provisioning profiles
2. Bundle ID must match in Xcode, Appfile, .env, and ExportOptions.plist
3. You may need to update `PROVISIONING_PROFILE_SPECIFIER` in the Fastfile

## CI/CD Integration

For GitHub Actions or other CI:

1. Store secrets as environment variables:
   - `APP_STORE_CONNECT_API_KEY_ID`
   - `APP_STORE_CONNECT_ISSUER_ID`
   - `APP_STORE_CONNECT_API_KEY_CONTENT` (base64 encoded .p8 file)
   - `TEAM_ID`

2. In your CI script, decode and save the API key:
```bash
echo "$APP_STORE_CONNECT_API_KEY_CONTENT" | base64 -d > ios/fastlane/AuthKey.p8
export APP_STORE_CONNECT_API_PRIVATE_KEY_PATH=./AuthKey.p8
```

3. Run the deployment:
```bash
pnpm run deploy:ios:beta
```

## Resources

- [Fastlane Documentation](https://docs.fastlane.tools/)
- [App Store Connect API](https://developer.apple.com/app-store-connect/api/)
- [TestFlight Beta Testing](https://developer.apple.com/testflight/)
- [Rock Documentation](https://rock-docs.callstack.com/)
