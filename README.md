# 🛡️ HumanAuthn Multi-Platform Demo

Welcome to the **HumanAuthn** project—a comprehensive, multi-platform demonstration of Verifik's biometric and authentication APIs. This repository contains identical, high-fidelity user experiences across **Web**, **Mobile (iOS & Android)**, and **Desktop (macOS/Windows)**.

## 🏗️ Architecture
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
*   **Web Toolkit:** Next.js, TailwindCSS (with unified tokens), Framer Motion (for animations).
*   **Mobile Toolkit:** React Native, Expo Router, Expo Camera.
*   **Desktop Toolkit:** Electron, electron-builder.
*   **Shared Logic:** The `@humanauthn/api-client` handles switching between Development (`https://verifik.app`) and Production (`https://prod.verifik.co`) environments seamlessly based on node environments.

---

## 🚀 Running the Apps

### Prerequisites
Make sure dependencies are installed from the root:
```bash
pnpm install
```

### 💻 Web Environment
To run the Next.js web application locally on port 3000:
```bash
pnpm --filter web dev
```

### 📱 Mobile Environment
The mobile app relies on the Expo bundler (Metro). 
*Note: Do not run these commands as root/sudo!*
```bash
pnpm --filter mobile run android --clear
# or for iOS
pnpm --filter mobile run ios --clear
```
> **Troubleshooting Note:** If the Android emulator throws a "Cannot connect to Metro" error, port `8081` might be locked. Run `killall node` to forcefully clear it, step out of any root terminal, and restart the Expo command.

### 🖥️ Desktop Environment
For local development (recommended), run Electron + Next.js together:
```bash
pnpm --filter desktop run dev
```

If the web server is already running separately, you can launch only the Electron shell:
```bash
pnpm --filter desktop run start
```

---

## 🔒 Configuration & APIs

All apps route their backend traffic through `packages/api-client/src/config.ts`.
By default, the logic intercepts the `NODE_ENV`:
*   **Development:** Uses `https://verifik.app`
*   **Production:** Uses `https://prod.verifik.co` 

No manual `.env` configuration is required for switching standard demonstration keys.

---

## 📊 Current State & Progress

✅ **Completed:**
*   Monorepo initialization & dependency wiring.
*   "Precision Minimalism" Design System unified across platforms.
*   Web App: Splash, Auth Flow (Email + Phone), OTP Verification, Face Checking Demos.
*   Mobile App: Metro Bundler stabilized, Splash Screen, Auth Flow, and API Client hooks.
*   Centralized Environment routing to dynamically support Verifik staging vs production keys.
*   Desktop App shell created and tested.

⏳ **Pending / Next Steps:**
*   **Mobile Camera Hooks:** Wire up `expo-camera` specifically for the Face Detection and Liveness screens in `apps/mobile`.
*   **Deployment (Mobile):** Run EAS build pipelines to output `.apk` and `.ipa` files.
*   **Deployment (Desktop):** Build production Electron executables (`electron-builder`).
*   **QA Testing:** Run full cross-platform QA on the biometric handshake paths.
