# FlashMaster — Android Deployment Guide

App Name: **FlashMaster**
Package / App ID: **com.klbrother.flashmaster**
Framework: TanStack Start (React 19) + Capacitor 8

---

## Prerequisites (one-time, on your laptop)

- Node.js 20+ and `bun` (or npm)
- Android Studio (latest stable) with:
  - Android SDK Platform 34+
  - Android SDK Build-Tools 34+
  - An Android Virtual Device (AVD) or a real device with USB debugging
- JDK 17 (Android Studio ships with one — make sure it's selected under
  `File → Settings → Build, Execution, Deployment → Build Tools → Gradle → Gradle JDK`)

---

## Step 1 — Clone the repository

```bash
git clone <YOUR_GIT_URL>
cd <your-project-folder>
```

## Step 2 — Install dependencies

```bash
bun install
# or
npm install
```

## Step 3 — Build the web project

Capacitor packages a static web bundle. Build the client output:

```bash
bun run build
```

This produces `dist/client/` which Capacitor reads as `webDir`
(already configured in `capacitor.config.ts`).

> If `dist/client/index.html` is missing in your build (some SSR-only
> builds skip it), copy `dist/client/__root.html` (or your generated
> shell) to `index.html`, OR add a small `prerender` step. Capacitor
> only needs a single entry HTML.

## Step 4 — Add the Android platform

```bash
npx cap add android
```

This creates the `android/` Gradle project. Commit it.

## Step 5 — Sync Capacitor

Every time you rebuild the web app, run:

```bash
bun run build
npx cap sync android
```

This copies `dist/client/` into `android/app/src/main/assets/public/`
and updates native plugin bindings.

## Step 6 — Open Android Studio

```bash
npx cap open android
```

First open will trigger a Gradle sync — let it finish.
Verify:
- `applicationId` in `android/app/build.gradle` is `com.klbrother.flashmaster`
- App display name in `android/app/src/main/res/values/strings.xml`
  is `FlashMaster`

## Step 7 — Generate a debug APK (for testing)

In Android Studio:
`Build → Build Bundle(s) / APK(s) → Build APK(s)`

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

Install on a connected device:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## Step 8 — Generate a signed release AAB (Play Store)

1. `Build → Generate Signed Bundle / APK`
2. Choose **Android App Bundle**
3. Create a new keystore (store the `.jks` file and passwords somewhere safe — losing it means you can never update the app)
4. Build variant: `release`
5. Output: `android/app/build/outputs/bundle/release/app-release.aab`

Upload `app-release.aab` to Google Play Console.

---

## Useful Capacitor commands

```bash
npx cap sync          # after every web rebuild
npx cap copy          # only copies web assets (no native plugin update)
npx cap open android  # opens Android Studio
npx cap run android   # build + install on connected device
```

---

## Replacing the icon & splash

Drop these into `resources/` then run `cordova-res` (one-time tool):

```bash
npm i -g cordova-res
cordova-res android --skip-config --copy
```

Files needed:
- `resources/icon.png` (1024×1024, no transparency)
- `resources/splash.png` (2732×2732, logo centered, background `#0B0B12`)

---

## Known constraints

- The app stores all data in **localStorage** via Zustand. Android WebView
  persists localStorage per-app, so progress survives app restarts but is
  cleared if the user clears app data.
- No backend / no network permissions required.
- Minimum Android version: API 23 (Android 6.0). Set in
  `android/variables.gradle` if you need to change it.
