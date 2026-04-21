// main.js
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { auth, db, firebaseApp } from './firebaseClient.js'
import { cleanupWavedashServiceWorkers, initWavedash, updateWavedashLoadProgress } from './wavedash.js'

const bootstrap = async () => {
  let mountError = null;
  console.log('[Wavedash] Bootstrap start');
  await cleanupWavedashServiceWorkers();
  await updateWavedashLoadProgress(0.2);
  console.log('[Wavedash] Bootstrap progress 0.2 sent');

  try {
    console.log('[Wavedash] Creating Vue app');
    const app = createApp(App);
    app.config.warnHandler = () => {};

    await updateWavedashLoadProgress(0.75);
    console.log('[Wavedash] Bootstrap progress 0.75 sent');
    console.log('[Wavedash] Mounting Vue app');
    app.mount('#app');
    console.log('[Wavedash] Vue app mounted successfully');
  } catch (error) {
    mountError = error;
    console.error('App bootstrap failed before Wavedash init:', error);
  } finally {
    console.log('[Wavedash] Entering bootstrap finally block');
    await updateWavedashLoadProgress(1);
    console.log('[Wavedash] Bootstrap progress 1 sent');
    await initWavedash({ debug: import.meta.env.DEV });
    console.log('[Wavedash] Bootstrap init phase complete');
  }

  if (mountError) {
    console.error('[Wavedash] Rethrowing mount error after init handoff');
    throw mountError;
  }

  console.log('[Wavedash] Bootstrap complete');
};

bootstrap();

export { db, auth, firebaseApp }
