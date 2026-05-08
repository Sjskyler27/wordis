# Reusable Wavedash Vite Guide

This guide describes a stable Wavedash setup for a Vite game.

## Core Principle

Let Wavedash own the browser shell.

Wavedash injects its SDK into the page and manages platform loading/caching behavior. A game should not also register a service worker unless the platform explicitly supports that setup.

For most Vite games on Wavedash, do not enable `vite-plugin-pwa`.

## Why PWA Service Workers Cause Trouble

A PWA service worker can intercept navigation requests and serve cached HTML. If it serves an older `index.html`, the browser may run a document that Wavedash did not freshly inject with its SDK.

Common symptoms:

- `window.WavedashJS` is missing.
- Wavedash loading screen stays visible.
- The game logs show that its app mounted or started behind the loader.
- The issue appears inconsistent: first load, reload, incognito, or cleared site data behave differently.

This is not usually because Wavedash dislikes Vite or Firebase. It is because the game's service worker can take control of the document request before Wavedash's current shell is used.

## Recommended Vite Config

Keep the Vite config simple:

```js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  base: './',
  plugins: [
    vue()
  ]
});
```

For Wavedash-only games, do not include:

```js
import { VitePWA } from 'vite-plugin-pwa';
```

Do not include:

```js
VitePWA({ ... })
```

If the dependency is installed only for Wavedash builds, remove it:

```bash
npm uninstall vite-plugin-pwa
```

If the same app ships to a normal web host where PWA is desired, make PWA opt-in by build target:

```js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    vue(),
    process.env.VITE_PWA === 'true' && VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Your Game',
        short_name: 'Your Game',
        start_url: '/',
        display: 'fullscreen',
        background_color: '#000000',
        theme_color: '#000000',
        icons: []
      }
    })
  ].filter(Boolean)
});
```

Then use target-specific scripts:

```json
{
  "scripts": {
    "build": "vite build",
    "build:netlify": "VITE_PWA=true vite build",
    "build:wavedash": "VITE_WAVEDASH=true vite build",
    "build:app": "vite build && electron-builder"
  }
}
```

Only the Netlify/web-host build sets `VITE_PWA=true`. Wavedash, Steam, Itch, and Electron builds should leave it unset.

## Index HTML

Do not manually register a service worker in `index.html`.

Remove lines like:

```html
<script id="vite-plugin-pwa:register-sw" src="./registerSW.js"></script>
```

## Build Script

If the game needs build-time Wavedash flags, define them in the build command:

```json
{
  "scripts": {
    "build:wavedash": "VITE_WAVEDASH=true vite build",
    "wavedash:push": "npm run build:wavedash && wavedash build push"
  }
}
```

Remember that `VITE_WAVEDASH` is a Vite build-time variable. The Wavedash SDK does not set it at runtime. Once the bundle is built, `import.meta.env.VITE_WAVEDASH` is baked into the JavaScript.

## Runtime Detection

Use one shared helper for Wavedash checks instead of duplicating raw env checks:

```js
const WAVEDASH_HOST_PATTERN = /(^|\.)wavedash(?:cdn)?\.com$/i;

export const isWavedashEnabled =
  import.meta.env.VITE_WAVEDASH === 'true' ||
  (typeof window !== 'undefined' && WAVEDASH_HOST_PATTERN.test(window.location.hostname)) ||
  (typeof window !== 'undefined' && Boolean(window.WavedashJS));
```

Use that helper for:

- Platform-specific logging.
- Hiding install/PWA prompts.
- Calling Wavedash loading APIs.
- Avoiding browser APIs that conflict with the Wavedash wrapper.

## SDK Calls

Guard SDK calls so the game still runs outside Wavedash:

```js
const getWavedashSdk = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.WavedashJS || null;
};

export const updateWavedashLoadProgress = (progress) => {
  const sdk = getWavedashSdk();
  sdk?.updateLoadProgressZeroToOne?.(progress);
};
```

Do not block app mount for a long time waiting for the SDK. If the SDK is missing, log it and continue. A missing SDK is often a packaging or hosting problem, not something the game can fix by waiting.

## Verification Checklist

After a Wavedash build:

- `dist/index.html` references the expected built JS/CSS assets.
- There is no `registerSW.js`.
- There is no `sw.js`.
- There is no `manifest.webmanifest`.
- There are no service-worker registration files in Wavedash, Steam, Itch, or Electron builds.
- The game logs whether Wavedash was detected.
- The app can still mount if the SDK is unavailable.

Useful commands:

```bash
npm run build:wavedash
find dist -maxdepth 2 -type f -name '*sw*' -o -name '*manifest*' -o -name 'workbox-*'
rg -n "registerSW|register-sw|manifest.webmanifest" dist
```

## Debugging Loading Issues

If the loader sticks:

1. Clear old site data once to remove any already-installed service worker from previous builds.
2. Confirm the new build no longer creates a service worker.
3. Check whether `window.WavedashJS` exists in the console.
4. Check whether the game logs show a fresh build hash.
5. Confirm the app is not serving an old `index.html`.
6. Avoid unregistering Wavedash-owned service workers unless Wavedash support specifically asks you to do it.
