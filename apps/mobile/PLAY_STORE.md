# HumanAuthn Android — Play Store & EAS Build

## Prerequisites

1. **Fix workspace permissions** (if `pnpm install` fails with EACCES):

```bash
cd verifik-human-authn-demo-app
sudo chown -R "$(whoami)" .
pnpm install
```

2. **Install EAS CLI** and log in:

```bash
npm i -g eas-cli
eas login
```

3. **Google Play Console** app created for package `co.verifik.humanauthn`.

4. **Service account JSON** for automated submit (optional): save as `apps/mobile/google-play-service-account.json` (gitignored).

## Environment

Copy and adjust:

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

Production builds use EAS profile env vars in [`eas.json`](./eas.json) (`https://prod.verifik.co` + prod project IDs).

## Build commands

From `apps/mobile`:

```bash
# Internal APK for device QA
eas build --platform android --profile preview

# Play Store AAB (auto-increments versionCode)
eas build --platform android --profile production

# Submit to internal testing track
eas submit --platform android --profile production
```

## Device QA checklist

- [ ] Email OTP sign-in
- [ ] Phone OTP sign-in
- [ ] Home shows all **18 demos** in Traditional + HumanAuthn sections
- [ ] Settings → Profile save
- [ ] Settings → API Key renew / revoke / copy
- [ ] Settings → Language (13 locales)
- [ ] Camera permission grant / deny / re-request
- [ ] All demos require sign-in and call live Verifik APIs
- [ ] HumanID create / decrypt / preview / QR on physical device
- [ ] Production build uses `prod.verifik.co` (not staging)

## Play Console checklist

- [ ] Store listing (title, descriptions, screenshots)
- [ ] Privacy policy URL (camera + biometric data)
- [ ] Data safety form
- [ ] Content rating questionnaire
- [ ] Internal → closed → production rollout

## Parity reference

| Web route | Mobile route |
|-----------|--------------|
| `/demos/create-collection` | `/demos/create-collection` |
| … (18 total) | Same paths under `app/demos/` |

Shared packages: `@humanauthn/api-client`, `@humanauthn/demo-catalog`, `@humanauthn/i18n-messages`.
