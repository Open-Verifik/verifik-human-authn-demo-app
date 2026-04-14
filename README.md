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

## Running the Apps

### Prerequisites

Use a **normal user** shell (not a persistent `sudo su` / root session). Running `pnpm install` as root can create root-owned files under `node_modules`, and later installs or `next dev` may fail with permission errors.

From the **repository root** (`verifik-human-authn-demo-app/`), not from `apps/web`:

```bash
cd verifik-human-authn-demo-app
pnpm install
```

### Web Environment

The dev and production `start` scripts read **`PORT`** from `apps/web/.env` or `apps/web/.env.local` (`.env.local` wins if both set `PORT`). If **`PORT` is not set**, the server uses **3000**. The example file sets **3017**—see `apps/web/.env.example`.

**`NEXT_PUBLIC_SITE_URL`** is the canonical public URL used for the sitemap, `robots.txt`, Open Graph tags, and `llms.txt`. Set it to your production domain (e.g. `https://humanauthn.verifik.co`) in deployment. Defaults to `http://localhost:3000` when unset.

```bash
cp apps/web/.env.example apps/web/.env   # first-time: create .env (gitignored) if you do not have one yet
```

From the repository root:

```bash
pnpm --filter web dev
```

Open **http://localhost:${PORT}** (e.g. **http://localhost:3000** with no `.env`, or **http://localhost:3017** if you copied the example).

> **Note:** `pnpm dev` / `pnpm dev:desktop` and the Electron app resolve the same port via `apps/web/scripts/dev-port.cjs`, so you only change `PORT` in one place.

### Mobile Environment

The mobile app relies on the Expo bundler (Metro).

*Note: Do not run these commands as root/sudo!*

```bash
pnpm --filter mobile run android --clear
# or for iOS
pnpm --filter mobile run ios --clear
```

> **Troubleshooting Note:** If the Android emulator throws a "Cannot connect to Metro" error, port `8081` might be locked. Run `killall node` to forcefully clear it, step out of any root terminal, and restart the Expo command.

### Desktop Environment

For local development (recommended), run Electron + Next.js together:

```bash
pnpm --filter desktop run dev
```

If the web server is already running separately, you can launch only the Electron shell:

```bash
pnpm --filter desktop run start
```

### Troubleshooting: Web / pnpm

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
