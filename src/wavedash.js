let wavedashPromise = null;
let wavedashInitStarted = false;

const clampProgress = (value) => {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
};

export const cleanupWavedashServiceWorkers = async () => {
  if (typeof window === 'undefined' || !/(^|\.)wavedash\.com$/i.test(window.location.hostname)) {
    return;
  }

  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    if (!registrations.length) {
      console.log('[Wavedash] No service workers to unregister');
      return;
    }

    await Promise.all(registrations.map((registration) => registration.unregister()));
    console.log('[Wavedash] Unregistered service workers for Wavedash host', registrations.length);
  } catch (error) {
    console.error('[Wavedash] Failed to unregister service workers', error);
  }
};

const getWavedashPromise = () => {
  if (wavedashPromise !== null) {
    console.log('[Wavedash] Reusing cached SDK promise');
    return wavedashPromise;
  }

  if (typeof window === 'undefined') {
    console.log('[Wavedash] SDK unavailable outside the browser');
    console.log('[Wavedash] SDK not detected in this environment');
    wavedashPromise = Promise.resolve(null);
    return wavedashPromise;
  }

  const injectedSdk = window.WavedashJS;
  if (!injectedSdk) {
    console.log('[Wavedash] SDK not detected on window');
    wavedashPromise = Promise.resolve(null);
    return wavedashPromise;
  }

  // `wavedash dev` injects a Promise, while uploaded builds may expose the SDK object directly.
  if (typeof injectedSdk.then === 'function') {
    console.log('[Wavedash] SDK promise detected on window');
    wavedashPromise = injectedSdk
      .then((sdk) => {
        console.log('[Wavedash] SDK promise resolved');
        return sdk || null;
      })
      .catch((error) => {
        console.error('[Wavedash] SDK promise rejected', error);
        return null;
      });
    return wavedashPromise;
  }

  console.log('[Wavedash] SDK object detected on window', {
    keys: Object.keys(injectedSdk)
  });
  wavedashPromise = Promise.resolve(injectedSdk);
  return wavedashPromise;
};

export const updateWavedashLoadProgress = async (progress) => {
  const sdk = await getWavedashPromise();
  if (!sdk?.updateLoadProgressZeroToOne) {
    console.log('[Wavedash] Skipping load progress update; API unavailable', progress);
    return null;
  }

  const nextProgress = clampProgress(progress);
  console.log('[Wavedash] Updating load progress', nextProgress);
  sdk.updateLoadProgressZeroToOne(nextProgress);
  return sdk;
};

export const initWavedash = async ({ debug = false } = {}) => {
  const sdk = await getWavedashPromise();
  if (!sdk?.init) {
    console.log('[Wavedash] Skipping init; API unavailable');
    return sdk;
  }

  if (wavedashInitStarted) {
    console.log('[Wavedash] Skipping init; already started');
    return sdk;
  }

  wavedashInitStarted = true;
  console.log('[Wavedash] Calling init()', { debug });
  sdk.init({ debug });
  console.log('[Wavedash] init() call finished');
  return sdk;
};

export const getWavedashSdk = async () => {
  return getWavedashPromise();
};
