# Wordis Wavedash Setup

This document records how Wordis is set up for Wavedash and the loading issue we hit with the old PWA service worker.

## Current Setup

Wordis builds Wavedash with:

```bash
npm run build:wavedash
```

That script sets:

```bash
VITE_MODE=prod VITE_WAVEDASH=true
```

The upload script is:

```bash
npm run wavedash:push
```

Wavedash-specific helpers live in `src/wavedash.js`. The app imports those helpers from `src/main.js`, `src/App.vue`, and `src/states/home/StartScreen.vue`.

## Important Rule

Do not register a Wordis service worker on Wavedash, Steam, or Itch.

Wavedash owns the page wrapper, SDK injection, loading screen, and caching behavior. Wordis should let Wavedash handle that environment.

The old `vite-plugin-pwa` setup generated service-worker and Workbox assets. That worker could cache and later serve a stale `index.html`. When that happened, the browser ran an older HTML entry instead of the fresh Wavedash-injected page, so `window.WavedashJS` was missing.

That is why the game could show a stuck Wavedash loading screen even though the Vue app itself was mounting and Firebase was working.

## What Was Not The Root Cause

During debugging we tested a few theories that looked plausible but were not the real issue:

- Firebase auth and profile sync were not blocking the app.
- The missing `PressStart2P-Regular.ttf` request was stale asset noise, not the loader failure.
- Hard-coded startup delays did not fix the underlying issue.
- Extra checks for the Wavedash SDK only made debugging clearer; they did not solve stale HTML.

The root cause was stale caching from the app's own PWA/service worker layer.

## Fix Applied

Wordis made the PWA plugin Netlify-only:

- `npm run build` does not enable PWA.
- `npm run build:wavedash` does not enable PWA.
- `npm run build:app` does not enable PWA.
- `npm run build:netlify` sets `VITE_PWA=true` and enables PWA.

`vite.config.js` may import `vite-plugin-pwa`, but the plugin must only be included when:

```js
process.env.VITE_PWA === 'true'
```

`index.html` did not contain a manual PWA registration script, but if this ever comes back, this line should not be present:

```html
<script id="vite-plugin-pwa:register-sw" src="./registerSW.js"></script>
```

## Wavedash Detection

`VITE_WAVEDASH` is a Vite build-time variable. Wavedash does not provide it at runtime.

That means this check only works when the bundle was built with `VITE_WAVEDASH=true`:

```js
import.meta.env.VITE_WAVEDASH === 'true'
```

For runtime behavior, Wordis should use the shared detector in `src/wavedash.js`, which can also recognize Wavedash by host or SDK presence.

Use:

```js
import { isWavedashEnabled } from './wavedash.js';
```

Avoid duplicating raw `import.meta.env.VITE_WAVEDASH` checks in components. This matters for UI like the PWA prompt, which should stay hidden on Wavedash.

## Expected Verification

After building, these should be true:

- `dist` has no `registerSW.js`.
- `dist` has no `sw.js`.
- `dist` has no `manifest.webmanifest`.
- Wavedash, Steam, and Itch builds do not set `VITE_PWA=true`.
- Wavedash logs show the app mounting without waiting on our own service worker cleanup.

Useful checks:

```bash
npm run build:wavedash
find dist -maxdepth 2 -type f -name '*sw*' -o -name '*manifest*' -o -name 'workbox-*'
rg -n "registerSW|register-sw|manifest.webmanifest" dist
```

## If Loading Breaks Again

Check these in order:

1. Confirm the build uploaded to Wavedash was created with `npm run build:wavedash`.
2. Confirm the Wavedash build did not set `VITE_PWA=true`.
3. Confirm Wavedash runtime logs show whether `window.WavedashJS` exists.
4. Confirm `App mounted start` reports `wavedash: true` when running on Wavedash.
5. Treat service-worker cleanup carefully. Unregistering Wavedash-owned workers can also interfere with platform behavior.
