<template>
  <div id="background-layer"></div>

  <div class="admin-container">
    <h1 class="admin-title">Admin Dashboard</h1>

    <div v-if="isAdmin" class="admin-tabs">
      <button @click="activePage = 'home'" :class="{ active: activePage === 'home' }">Home</button>
      <button @click="activePage = 'feedback'" :class="{ active: activePage === 'feedback' }">Feedback</button>
      <button @click="emit('home')" >Back to Game</button>
      <button @click="emit('continue')" v-if="gameInProgress" >continue</button>
    </div>
    <button v-if="!isAdmin" @click="emit('home')" >Back to Game</button>

    <div class="admin-content">
      <div v-if="activePage === 'home'" class="admin-section">
        <h2>Overview</h2>
        <div class="admin-box">
          <p><strong>Total Users:</strong> {{ userCount }}</p>
        </div>
      </div>

      <div v-else-if="activePage === 'feedback'" class="admin-section">
        <h2>Feedback</h2>
        <FeedbackEditor />
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, defineEmits } from 'vue';

import { firebaseEnabled } from '../firebaseClient.js';
import FeedbackEditor from './FeedbackEditor.vue';

const isAdmin = (localStorage.getItem('isA') || 'null') === import.meta.env.VITE_AD_C;
const emit = defineEmits(["home", "close", "continue"]);
  const gameInProgress = ref(localStorage.getItem("gameInProgress")); // Check if game is in progress


const activePage = ref('home');
const userCount = ref(12);

onMounted(async () => {
  if (!firebaseEnabled) {
    return;
  }
});
</script>

<style lang="scss" scoped>

p{
    text-shadow: 0 0 0 #000;
}
.admin-container {
  max-width: 80vw;
  max-height: 75vh;
  margin: 2rem auto;
  margin-bottom: 400px;
  padding: 2rem;
  background: rgba(10, 10, 25, 1);
  border-radius: 1rem;
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.05);
  font-family: system-ui, sans-serif;
  overflow-y: auto;
}

.admin-title {
  font-size: 1.75rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  color: #ffffff;
}
h2 {
  color: #ffffff;
}
.admin-tabs {
  color: #ffffff;
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;

  button {
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    border: none;
    background: #742a2a;
    cursor: pointer;
    font-weight: 500;
    transition: background 0.2s;

    &.active {
      background: #2563eb;
      color: white;
    }

    &:hover:not(.active) {
      background: #ccc;
    }
  }
}

.admin-content {
  .admin-section {
    h2 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
    }

    .admin-box {
      padding: 1rem;
      border-radius: 0.5rem;
      background: #f3f4f6;

      &.warning {
        background: #fef3c7;
        border-left: 4px solid #facc15;
      }

      &.info {
        background: #dbeafe;
        border-left: 4px solid #3b82f6;
      }
    }
  }
}
</style>
