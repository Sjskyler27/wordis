// main.js
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { auth, db, firebaseApp } from './firebaseClient.js'

const app = createApp(App)
app.config.warnHandler = () => {}
app.mount('#app')

export { db, auth, firebaseApp }
