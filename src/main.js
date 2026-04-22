// main.js
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { auth, db, firebaseApp } from './firebaseClient.js'
import { cleanupWavedashServiceWorkers, initWavedash, isWavedashEnabled, updateWavedashLoadProgress } from './wavedash.js'

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

const bootstrap = async () => {
  let mountError = null;
  logWavedash('[Wavedash] Bootstrap start');
  await cleanupWavedashServiceWorkers();
  await updateWavedashLoadProgress(0.2);
  logWavedash('[Wavedash] Bootstrap progress 0.2 sent');

  try {
    logWavedash('[Wavedash] Creating Vue app');
    const app = createApp(App);
    app.config.warnHandler = () => {};

    await updateWavedashLoadProgress(0.75);
    logWavedash('[Wavedash] Bootstrap progress 0.75 sent');
    logWavedash('[Wavedash] Mounting Vue app');
    app.mount('#app');
    logWavedash('[Wavedash] Vue app mounted successfully');
  } catch (error) {
    mountError = error;
    errorWavedash('App bootstrap failed before Wavedash init:', error);
  } finally {
    logWavedash('[Wavedash] Entering bootstrap finally block');
    await updateWavedashLoadProgress(1);
    logWavedash('[Wavedash] Bootstrap progress 1 sent');
    await initWavedash({ debug: import.meta.env.DEV });
    logWavedash('[Wavedash] Bootstrap init phase complete');
  }

  if (mountError) {
    errorWavedash('[Wavedash] Rethrowing mount error after init handoff');
    throw mountError;
  }

  logWavedash('[Wavedash] Bootstrap complete');
};

bootstrap();

export { db, auth, firebaseApp }
