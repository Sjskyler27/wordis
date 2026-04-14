<template>
  <div id="background-layer"></div>
  <div class="multiplayer-container">
    <h1>Game Mode</h1>
    <div class="options">
      <button @click="$emit('singleplayer')" class="primary">Play vs Bot</button>
      <div class="divider">OR</div>
      <button @click="handleHostGame" :disabled="isConnecting || !isSocketConnected">Host Multiplayer Game</button>
      <div class="join-section">
        <input v-model="joinCode" placeholder="Enter Room Code" :disabled="isConnecting || !isSocketConnected" />
        <button @click="handleJoinGame" :disabled="isConnecting || !isSocketConnected || !joinCode">Join Multiplayer Game</button>
      </div>
    </div>
    <div class="connection-status" :class="statusClass">
      <span class="status-dot"></span>
      <p>{{ connectionStatusLabel }}</p>
    </div>
    <div class="message">
        <p v-if="message">{{ message }}</p>
    </div>
    <button @click="$emit('home')">Back to Home</button>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import {
  roomCode,
  message,
  isConnecting,
  hostGame,
  joinGame,
  connectionStatus,
  isSocketConnected
} from './multiplayer.js';

const joinCode = ref('');
const emit = defineEmits(['game', 'home', 'singleplayer']);

const handleHostGame = () => {
  hostGame();
};

const handleJoinGame = () => {
  joinGame(joinCode.value);
};

const connectionStatusLabel = computed(() => {
  switch (connectionStatus.value) {
    case 'connected':
      return 'Connected to multiplayer server';
    case 'connecting':
      return 'Connecting to multiplayer server...';
    case 'disconnected':
      return 'Disconnected. Multiplayer unavailable.';
    case 'error':
      return 'Connection error. Please try again.';
    default:
      return 'Connecting to multiplayer server...';
  }
});

const statusClass = computed(() => `status-${connectionStatus.value}`);
const readyToStartMultiplayer = computed(
  () => !!roomCode.value && connectionStatus.value === 'connected'
);
const hasNavigated = ref(false);

watch(readyToStartMultiplayer, (ready) => {
  if (ready && !hasNavigated.value) {
    hasNavigated.value = true;
    emit('game');
  }
});
</script>

<style scoped>
  #background-layer {
    position: absolute;
    inset: 0;
    z-index: -1;
    background-image: url('/src/assets/images/homeScreen.png');
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
    pointer-events: none;
  }

.multiplayer-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: grey;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 20px 0;
}

.join-section {
  display: flex;
  gap: 10px;
}

input {
  padding: 10px;
  font-size: 16px;
}

button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}

button.primary {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 15px 32px;
  font-size: 18px;
  font-weight: bold;
}

button.primary:hover {
  background-color: #45a049;
}

.divider {
  margin: 10px 0;
  text-align: center;
  color: white;
  font-weight: bold;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 0.12);
  margin-bottom: 12px;
  color: #fff;
  font-size: 14px;
}

.connection-status p {
  margin: 0;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #ffd54f;
}

.connection-status.status-connected {
  background-color: rgba(76, 175, 80, 0.25);
}

.connection-status.status-connected .status-dot {
  background-color: #4CAF50;
}

.connection-status.status-connecting {
  background-color: rgba(255, 193, 7, 0.25);
}

.connection-status.status-disconnected,
.connection-status.status-error {
  background-color: rgba(244, 67, 54, 0.2);
}

.connection-status.status-error .status-dot,
.connection-status.status-disconnected .status-dot {
  background-color: #f44336;
}

.message{
    background-color: grey;
}
button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
