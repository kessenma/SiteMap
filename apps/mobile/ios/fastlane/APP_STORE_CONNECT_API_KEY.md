# App Store Connect API Key Setup

## Overview

To upload builds to TestFlight, you need an **App Store Connect API Key**. This is a `.p8` file that authenticates Fastlane with Apple's services.

## Getting Your API Key

### 1. Log in to App Store Connect

Visit: [https://appstoreconnect.apple.com/access/integrations/api](https://appstoreconnect.apple.com/access/integrations/api)

### 2. Generate a New Key

1. Click the **"+"** button to create a new key
2. Name it (e.g., "SiteMap Fastlane")
3. Select **"Admin"** or **"App Manager"** access level
4. Click **"Generate"**

### 3. Download the Key

> **You can only download this key once!** Keep it safe.

1. Click **"Download API Key"**
2. Save the file (it will be named like `AuthKey_XXXXXXXXXX.p8`)
3. Note the following from the page:
   - **Key ID** (e.g., `9Q42867745`)
   - **Issuer ID** (a UUID, e.g., `69a6de8e-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

## Installation

### 1. Place the API Key File

Copy your `.p8` file into the fastlane directory:

```bash
cp ~/Downloads/AuthKey_XXXXXXXXXX.p8 apps/mobile/ios/fastlane/
```

This file is gitignored — it will never be committed.

### 2. Update the .env File

```bash
# If you haven't already, create .env from the template
cp apps/mobile/ios/fastlane/.env.example apps/mobile/ios/fastlane/.env
```

Edit `apps/mobile/ios/fastlane/.env`:

```bash
# Key ID from the .p8 filename
APP_STORE_CONNECT_API_KEY_ID=XXXXXXXXXX

# Issuer ID from App Store Connect
APP_STORE_CONNECT_ISSUER_ID=69a6de8e-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Path to the .p8 file (relative to the fastlane directory)
APP_STORE_CONNECT_API_PRIVATE_KEY_PATH=./AuthKey_XXXXXXXXXX.p8
```

### 3. Verify It's Gitignored

```bash
cd apps/mobile/ios/fastlane
git check-ignore AuthKey_*.p8
# Should output: AuthKey_*.p8
```

## Verification

Test that Fastlane can find and read the key:

```bash
cd apps/mobile/ios
BUNDLE_GEMFILE=../Gemfile bundle exec fastlane list
```

If the key path is wrong, you'll see an error like `API key file not found`.

## Troubleshooting

### Error: "API key file not found"
- Verify the file exists: `ls ios/fastlane/AuthKey_*.p8`
- Check the path in `.env` matches your actual filename
- The path must be relative to the `ios/fastlane/` directory

### Error: "Invalid API Key"
- Verify `APP_STORE_CONNECT_ISSUER_ID` is correct
- Make sure the key hasn't been revoked in App Store Connect

### Error: "Insufficient permissions"
- The API key needs **Admin** or **App Manager** role
- Check in App Store Connect → Users and Access → Integrations → Keys

## Security Best Practices

1. **Never commit** the `.p8` file to git
2. Store a backup in a secure password manager (1Password, etc.)
3. Share with team members through secure channels only
4. If compromised, revoke the key in App Store Connect and generate a new one
5. Use different keys for CI/CD vs. local development if possible

## Team Onboarding

When a new team member needs to upload builds:

1. Share the `.p8` file through a secure channel (1Password, Signal, etc.)
2. Share the `.env` configuration values (Key ID, Issuer ID)
3. Have them place the `.p8` file in `apps/mobile/ios/fastlane/`
4. Have them create their `.env` from the template
5. Test with: `pnpm run version:ios:current`

## References

- [App Store Connect API Documentation](https://developer.apple.com/documentation/appstoreconnectapi)
- [Fastlane API Key Documentation](https://docs.fastlane.tools/app-store-connect-api/)
- [Creating API Keys (Apple)](https://developer.apple.com/documentation/appstoreconnectapi/creating_api_keys_for_app_store_connect_api)
