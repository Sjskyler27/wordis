// main.js
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { initializeApp } from "firebase/app"
import { getDatabase } from "firebase/database"
import { getAuth } from "firebase/auth"

let firebaseApp = null
let db = null
let auth = null

if (import.meta.env.VITE_FIREBASE_API_KEY) {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  }

  try {
    firebaseApp = initializeApp(firebaseConfig)
    db = getDatabase(firebaseApp)
    auth = getAuth(firebaseApp)
  } catch (error) {
    console.warn('Firebase initialization failed:', error)
  }
} else {
  console.warn('Firebase API key not found. Firebase features will be disabled.')
}

const app = createApp(App)
app.config.warnHandler = () => {}
app.mount('#app')

export { db, auth, firebaseApp }