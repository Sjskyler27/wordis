import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const requiredFirebaseKeys = [
  "apiKey",
  "authDomain",
  "projectId",
  "appId"
];

const hasRequiredFirebaseConfig = requiredFirebaseKeys.every((key) => {
  return typeof firebaseConfig[key] === "string" && firebaseConfig[key].trim().length > 0;
});

let firebaseApp = null;
let firebaseInitError = null;

if (hasRequiredFirebaseConfig) {
  try {
    firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  } catch (error) {
    firebaseInitError = error;
    console.warn("Firebase initialization failed. Firebase features will be disabled.", error);
  }
} else {
  console.warn("Firebase env vars are incomplete or missing. Firebase features will be disabled.");
}

const createServiceSafely = (factory, label) => {
  if (!firebaseApp) {
    return null;
  }

  try {
    return factory(firebaseApp);
  } catch (error) {
    console.warn(`Firebase ${label} failed to initialize. ${label} features will be disabled.`, error);
    return null;
  }
};

export const db = createServiceSafely(getDatabase, "database");
export const auth = createServiceSafely(getAuth, "auth");
export const functions = createServiceSafely(getFunctions, "functions");
export const firebaseEnabled = Boolean(firebaseApp);
export const firebaseUnavailableReason = firebaseInitError
  ? "init-error"
  : hasRequiredFirebaseConfig
    ? null
    : "missing-config";
export { firebaseApp };

