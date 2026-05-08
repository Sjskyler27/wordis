let wavedashPromise = null;
let wavedashInitStarted = false;
const WAVEDASH_SDK_TIMEOUT_MS = 2500;
const WAVEDASH_HOST_PATTERN = /(^|\.)wavedash(?:cdn)?\.com$/i;

const isWavedashHost = () => {
  return typeof window !== 'undefined' && WAVEDASH_HOST_PATTERN.test(window.location.hostname);
};

export const isWavedashEnabled = import.meta.env.VITE_WAVEDASH === 'true'
  || isWavedashHost()
  || (typeof window !== 'undefined' && Boolean(window.WavedashJS));

const logWavedash = (...args) => {
  if (isWavedashEnabled) {
    console.log(...args);
  }
};

const errorWavedash = (...args) => {
  if (isWavedashEnabled) {
    console.error(...args);
  }
};

const clampProgress = (value) => {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
};

const withTimeout = (promise, label, timeoutMs = WAVEDASH_SDK_TIMEOUT_MS) => {
  let timeoutId;

  const timeoutPromise = new Promise((resolve) => {
    timeoutId = window.setTimeout(() => {
      logWavedash(`[Wavedash] ${label} timed out after ${timeoutMs}ms`);
      resolve(null);
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise])
    .finally(() => {
      window.clearTimeout(timeoutId);
    });
};

export const cleanupWavedashServiceWorkers = async () => {
  if (typeof window === 'undefined' || !isWavedashHost()) {
    return;
  }

  logWavedash('[Wavedash] Leaving Wavedash service workers intact');
};

const getWavedashPromise = () => {
  if (wavedashPromise !== null) {
    logWavedash('[Wavedash] Reusing cached SDK promise');
    return wavedashPromise;
  }

  if (typeof window === 'undefined') {
    logWavedash('[Wavedash] SDK unavailable outside the browser');
    logWavedash('[Wavedash] SDK not detected in this environment');
    wavedashPromise = Promise.resolve(null);
    return wavedashPromise;
  }

  const injectedSdk = window.WavedashJS;
  if (!injectedSdk) {
    logWavedash('[Wavedash] SDK not detected on window');
    wavedashPromise = Promise.resolve(null);
    return wavedashPromise;
  }

  // `wavedash dev` injects a Promise, while uploaded builds may expose the SDK object directly.
  if (typeof injectedSdk.then === 'function') {
    logWavedash('[Wavedash] SDK promise detected on window');
    wavedashPromise = withTimeout(injectedSdk, 'SDK promise')
      .then((sdk) => {
        logWavedash('[Wavedash] SDK promise resolved');
        return sdk || null;
      })
      .catch((error) => {
        errorWavedash('[Wavedash] SDK promise rejected', error);
        return null;
      });
    return wavedashPromise;
  }

  logWavedash('[Wavedash] SDK object detected on window', {
    keys: Object.keys(injectedSdk)
  });
  wavedashPromise = Promise.resolve(injectedSdk);
  return wavedashPromise;
};

export const updateWavedashLoadProgress = async (progress) => {
  const nextProgress = clampProgress(progress);

  try {
    const sdk = await getWavedashPromise();
    if (!sdk?.updateLoadProgressZeroToOne) {
      logWavedash('[Wavedash] Skipping load progress update; API unavailable', nextProgress);
      return null;
    }

    logWavedash('[Wavedash] Updating load progress', nextProgress);
    sdk.updateLoadProgressZeroToOne(nextProgress);
    return sdk;
  } catch (error) {
    errorWavedash('[Wavedash] Failed to update load progress', nextProgress, error);
    return null;
  }
};

export const initWavedash = async ({ debug = false } = {}) => {
  try {
    const sdk = await getWavedashPromise();
    if (!sdk?.init) {
      logWavedash('[Wavedash] Skipping init; API unavailable');
      return sdk;
    }

    if (wavedashInitStarted) {
      logWavedash('[Wavedash] Skipping init; already started');
      return sdk;
    }

    wavedashInitStarted = true;
    logWavedash('[Wavedash] Calling init()', { debug });
    sdk.init({ debug });
    logWavedash('[Wavedash] init() call finished');
    return sdk;
  } catch (error) {
    errorWavedash('[Wavedash] init failed', error);
    return null;
  }
};

export const getWavedashSdk = async () => {
  return getWavedashPromise();
};
