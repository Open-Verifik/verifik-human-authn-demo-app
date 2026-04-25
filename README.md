# HumanAuthn Multi-Platform Demo

Welcome to the **HumanAuthn** project—a comprehensive, multi-platform demonstration of Verifik's biometric and authentication APIs. This repository contains identical, high-fidelity user experiences across **Web**, **Mobile (iOS & Android)**, and **Desktop (macOS/Windows)**.

## Architecture

This project is structured as a **pnpm Monorepo**.

```text
verifik-human-authn-demo-app/
├── apps/
│   ├── web/        (Next.js 14 Web Application)
│   ├── mobile/     (Expo / React Native Application)
│   └── desktop/    (Electron wrapper around the Web app)
├── packages/
│   └── api-client/ (Shared HTTP fetch module & Environment routers)
└── .agents/        (Automated AI Workflows & Troubleshooting)
```

### Key Technologies

* **Web Toolkit:** Next.js, TailwindCSS (with unified tokens), Framer Motion (for animations).
* **Mobile Toolkit:** React Native, Expo Router, Expo Camera.
* **Desktop Toolkit:** Electron, electron-builder.
* **Shared Logic:** The `@humanauthn/api-client` handles switching between Development (`https://verifik.app`) and Production (`https://prod.verifik.co`) environments seamlessly based on node environments.

---

## Prerequisites (all platforms)

Use a **normal user** shell (not a persistent `sudo su` / root session). Running `pnpm install` as root can create root-owned files under `node_modules`, and later installs or `next dev` may fail with permission errors.

From the **repository root** (`verifik-human-authn-demo-app/`):

```bash
cd verifik-human-authn-demo-app
pnpm install
```

**Node / tooling:** Use a current LTS Node.js. The repo expects **pnpm** (see `packageManager` in the root `package.json`).

---

## Web (Next.js)

### Environment variables

The dev and production `start` scripts read **`PORT`** from `apps/web/.env` or `apps/web/.env.local` (`.env.local` wins if both set `PORT`). If **`PORT` is not set**, the server uses **3000**. The example file sets **3017**—see `apps/web/.env.example`.

**`NEXT_PUBLIC_SITE_URL`** is the canonical public URL used for the sitemap, `robots.txt`, Open Graph tags, and `llms.txt`. Production is **`https://demos.verifik.co`** (also the default when this variable is unset). For local-only absolute URLs in those artifacts, set e.g. `http://localhost:3000` in `.env.local`.

First-time setup:

```bash
cp apps/web/.env.example apps/web/.env
```

### Run (development)

From the repository root, any of the following start the Next.js dev server:

```bash
pnpm dev              # alias: runs turbo dev for the web app
pnpm dev:web
pnpm --filter web dev
```

Open **http://localhost:${PORT}** (e.g. **http://localhost:3000** if `PORT` is unset, or **http://localhost:3017** if you copied the example).

> **Note:** `pnpm dev:desktop` and the Electron app read the same port from `apps/web/scripts/dev-port.cjs`, so you only configure `PORT` in one place.

### Build (compile for production)

From the repository root:

```bash
pnpm build:web          # turbo: build only the web app
pnpm build              # turbo: build all packages that define a `build` task (web + desktop)
```

Output: Next.js production bundle under `apps/web/.next/`.

### Run the production build locally

After `pnpm build:web`:

```bash
pnpm --filter web start
```

Serves the compiled app on the same **PORT** rules as development.

---

## Mobile (Expo / React Native)

The app uses the **Expo** CLI and **Metro**. Do not run Expo or Metro as root.

### Run (development)

From the repository root:

```bash
pnpm dev:mobile
# equivalent: pnpm --filter mobile dev   →   expo start
```

Then:

- Press **`a`** in the terminal to open Android, **`i`** for iOS (simulator), or scan the QR code with Expo Go; or
- In a **second** terminal from the repo root, open a platform directly:

```bash
pnpm --filter mobile android    # expo start --android
pnpm --filter mobile ios        # expo start --ios
```

To clear Metro cache when debugging stale bundles (from `apps/mobile`):

```bash
cd apps/mobile
pnpm exec expo start --clear
# add --android or --ios if you want to jump straight to a device
```

> **Troubleshooting:** If Android shows “Cannot connect to Metro”, port **8081** may be stuck. Exit any root shell, run `killall node` (macOS) or free the port, then start Expo again. See also `apps/mobile/README.md`.

### Build / compile (native binaries)

The `mobile` package does not define a root `build` script in `package.json`. For **installable** Android/iOS artifacts you typically use **EAS Build** (Expo Application Services) or a local native build after prebuild:

- **EAS (recommended for CI and store builds):** install `eas-cli`, log in, then `eas build --platform android` / `ios` (you may need an `eas.json` in `apps/mobile`; the app references an EAS project id in `app.json`).
- **Local debug builds:** from `apps/mobile`, `npx expo prebuild` then `npx expo run:android` or `npx expo run:ios` (requires Android SDK / Xcode as per Expo docs).

Type-check only (no binary):

```bash
pnpm --filter mobile type-check
```

---

## Desktop (Electron)

The desktop app wraps the **web** build and packages it with **electron-builder**.

### Run (development)

Starts Next.js in dev mode and opens Electron when the dev server is ready:

```bash
pnpm dev:desktop
# or, equivalently:
pnpm dev:all
```

From the desktop package only:

```bash
pnpm --filter desktop dev
```

If the web server is **already** running separately, launch only the Electron shell:

```bash
pnpm --filter desktop start
```

### Build (compile installers)

This runs **`next build`** for the web app, then **electron-builder** (DMG / NSIS / Linux targets per `apps/desktop/package.json`):

```bash
pnpm --filter desktop build
```

Artifacts are written under `apps/desktop/dist/`.

Other desktop packaging commands (from repo root):

```bash
pnpm --filter desktop pack    # electron-builder --dir (unpackaged test)
pnpm --filter desktop dist    # electron-builder (same family as `build` without the web step—ensure `.next` exists)
```

> For a full fresh desktop release build, prefer `pnpm --filter desktop build` so the web bundle is always current.

---

## Troubleshooting: Web / pnpm

**`Cannot find module 'next-intl/plugin'` (or other missing packages)**  
Dependencies are missing or `pnpm install` did not finish. From the repo root, as your normal user:

```bash
cd verifik-human-authn-demo-app
pnpm install
pnpm --filter web dev
```

**`EACCES: permission denied` when running `pnpm install` (often when creating symlinks under `node_modules`)**  
Some folders were probably created as **root** (for example after installing from a `sudo su` shell). Fix ownership once, then reinstall. Afterward, use your regular user for all `pnpm` and Next.js commands:

```bash
cd verifik-human-authn-demo-app
sudo chown -R "$(whoami)" .
pnpm install
pnpm --filter web dev
```

Do not run day-to-day `pnpm` or `next dev` from `sudo su`; use `sudo` only for the one-off `chown` if needed.

---

## Configuration & APIs

All apps route their backend traffic through `packages/api-client/src/config.ts`.

By default, the logic intercepts the `NODE_ENV`:

* **Development:** Uses `https://verifik.app`
* **Production:** Uses `https://prod.verifik.co`

No manual `.env` configuration is required for switching standard demonstration keys.

---

## Current State & Progress

**Completed:**

* Monorepo initialization & dependency wiring.
* "Precision Minimalism" Design System unified across platforms.
* Web App: Splash, Auth Flow (Email + Phone), OTP Verification, Face Checking Demos.
* Mobile App: Metro Bundler stabilized, Splash Screen, Auth Flow, and API Client hooks.
* Centralized Environment routing to dynamically support Verifik staging vs production keys.
* Desktop App shell created and tested.

**Pending / Next Steps:**

* **Mobile Camera Hooks:** Wire up `expo-camera` specifically for the Face Detection and Liveness screens in `apps/mobile`.
* **Deployment (Mobile):** Run EAS build pipelines to output `.apk` and `.ipa` files.
* **Deployment (Desktop):** Build production Electron executables (`electron-builder`).
* **QA Testing:** Run full cross-platform QA on the biometric handshake paths.
