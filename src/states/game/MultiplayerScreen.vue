<template>
  <div class="multiplayer-shell">
    <div id="background-layer">
      <div class="shape-layer layer-far"></div>
      <div class="shape-layer layer-near"></div>
    </div>

    <main class="multiplayer-frame">
      <section class="hero-card">
        <span class="kicker">Wordis Online</span>
        <h1>Real-Time Duel Lobby</h1>
        <p>Host a room for a friend or jump into a code and race live racks head to head.</p>
        <div class="status-pill" :class="statusClass">
          <span class="status-dot"></span>
          <span>{{ connectionStatusLabel }}</span>
        </div>
      </section>

      <section class="action-panel">
        <div class="panel-card">
          <span class="kicker">Solo</span>
          <h2>Warm Up First</h2>
          <p>Practice the live rack flow against the bot before you take it online.</p>
          <button class="arcade-button secondary" @click="$emit('singleplayer')">Play vs Bot</button>
        </div>

        <div class="panel-card panel-card-primary">
          <span class="kicker">Host</span>
          <h2>Start a Room</h2>
          <p v-if="roomCode" class="room-preview">Room {{ roomCode }}</p>
          <p v-else>Spin up a private room and share the code with your opponent.</p>
          <button class="arcade-button" @click="handleHostGame" :disabled="isConnecting || !isSocketConnected">
            Host Multiplayer Game
          </button>
        </div>

        <div class="panel-card">
          <span class="kicker">Join</span>
          <h2>Enter Room Code</h2>
          <p>Drop into a friend match instantly and keep the pressure on from the first word.</p>
          <div class="join-section">
            <input
              v-model="joinCode"
              class="room-input"
              placeholder="Enter Room Code"
              :disabled="isConnecting || !isSocketConnected"
            />
            <button
              class="arcade-button teal"
              @click="handleJoinGame"
              :disabled="isConnecting || !isSocketConnected || !joinCode"
            >
              Join Multiplayer Game
            </button>
          </div>
        </div>
      </section>

      <section class="message-card">
        <span class="kicker">Status</span>
        <strong>{{ message || 'Multiplayer is standing by.' }}</strong>
        <p v-if="roomCode">Active room: {{ roomCode }}</p>
        <p v-else>When a room is ready, this screen will move straight into the duel.</p>
      </section>

      <button class="back-button" @click="$emit('home')">Back to Home</button>
    </main>
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
.multiplayer-shell {
  --bg-top: #ca6937;
  --bg-mid: #b63e3b;
  --bg-bottom: #341137;
  --bg-corner: #f39a54;
  --cream: #f7efe1;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  padding: 28px;
  color: var(--cream);
}

#background-layer {
  position: absolute;
  inset: 0;
  z-index: -2;
  background:
    radial-gradient(circle at 14% 18%, rgba(255, 228, 168, 0.2) 0, rgba(255, 228, 168, 0.2) 12%, transparent 30%),
    radial-gradient(circle at 82% 14%, rgba(255, 255, 255, 0.09) 0, rgba(255, 255, 255, 0.09) 8%, transparent 24%),
    linear-gradient(135deg, var(--bg-corner) 0%, var(--bg-top) 24%, var(--bg-mid) 58%, var(--bg-bottom) 100%);
  overflow: hidden;
}

.shape-layer {
  position: absolute;
  inset: -10%;
  pointer-events: none;
  mix-blend-mode: screen;
  background-repeat: repeat;
  background-size: 280px 280px;
}

.layer-far {
  opacity: 0.24;
  background-position: 0 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='280' viewBox='0 0 280 280'%3E%3Cg fill='none' stroke='%23fff4dc' stroke-width='2.6' stroke-opacity='.34'%3E%3Cpolygon points='40,24 68,74 12,74'/%3E%3Crect x='106' y='18' width='46' height='46' rx='4'/%3E%3Cpolygon points='217,22 245,38 245,70 217,86 189,70 189,38'/%3E%3Cpolygon points='44,118 72,134 72,166 44,182 16,166 16,134'/%3E%3Crect x='108' y='110' width='54' height='54' rx='6'/%3E%3Cpolygon points='214,110 246,164 182,164'/%3E%3Crect x='28' y='204' width='50' height='50' rx='5'/%3E%3Cpolygon points='136,198 164,214 164,246 136,262 108,246 108,214'/%3E%3Cpolygon points='220,198 248,248 192,248'/%3E%3C/g%3E%3C/svg%3E");
  animation: driftLayerFar 25s linear infinite;
}

.layer-near {
  inset: -6%;
  opacity: 0.18;
  background-size: 190px 190px;
  background-position: 28px 40px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='190' height='190' viewBox='0 0 190 190'%3E%3Cg fill='rgba(255,244,220,.14)' stroke='rgba(255,255,255,.16)' stroke-width='1.8'%3E%3Cpolygon points='26,20 52,64 0,64'/%3E%3Crect x='74' y='20' width='34' height='34' rx='3'/%3E%3Cpolygon points='150,18 170,30 170,54 150,66 130,54 130,30'/%3E%3Crect x='18' y='92' width='38' height='38' rx='4'/%3E%3Cpolygon points='96,88 118,126 74,126'/%3E%3Cpolygon points='152,86 174,98 174,124 152,136 130,124 130,98'/%3E%3Ccircle cx='42' cy='156' r='12'/%3E%3Crect x='82' y='144' width='28' height='28' rx='4'/%3E%3Cpolygon points='152,142 174,180 130,180'/%3E%3C/g%3E%3C/svg%3E");
  animation: driftLayerNear 30s linear infinite;
}

@keyframes driftLayerFar {
  0% { background-position: 0 0; }
  100% { background-position: 280px -140px; }
}

@keyframes driftLayerNear {
  0% { background-position: 28px 40px; }
  100% { background-position: -67px 420px; }
}

.multiplayer-frame {
  width: min(100%, 1180px);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.hero-card,
.panel-card,
.message-card {
  border-radius: 30px;
  padding: 24px 22px;
  border: 2px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 20px 50px rgba(38, 7, 22, 0.28);
}

.hero-card {
  background: linear-gradient(180deg, rgba(73, 107, 203, 0.94), rgba(53, 66, 161, 0.88));
}

.action-panel {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.panel-card {
  background: rgba(78, 18, 43, 0.82);
}

.panel-card-primary {
  background: linear-gradient(180deg, rgba(230, 117, 53, 0.92), rgba(160, 64, 36, 0.9));
}

.message-card {
  background: linear-gradient(180deg, rgba(148, 31, 70, 0.95), rgba(93, 18, 52, 0.88));
}

.kicker {
  display: inline-block;
  margin-bottom: 12px;
  font-size: 0.74rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  opacity: 0.75;
}

h1,
h2,
.message-card strong {
  margin: 0;
}

h1 {
  font-size: clamp(2rem, 5vw, 3.1rem);
  line-height: 1.05;
}

h2,
.message-card strong {
  font-size: 1.35rem;
  line-height: 1.2;
}

p {
  margin: 12px 0 0;
  line-height: 1.6;
  opacity: 0.88;
}

.status-pill {
  margin-top: 18px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border-radius: 999px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.12);
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ffd54f;
}

.status-connected {
  background: rgba(76, 175, 80, 0.24);
}

.status-connected .status-dot {
  background: #53d86b;
}

.status-disconnected,
.status-error {
  background: rgba(223, 78, 78, 0.24);
}

.status-disconnected .status-dot,
.status-error .status-dot {
  background: #ff7d7d;
}

.join-section {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.room-input {
  width: 100%;
  border: 2px solid rgba(255, 255, 255, 0.14);
  border-radius: 18px;
  padding: 14px 16px;
  background: rgba(21, 8, 22, 0.24);
  color: var(--cream);
  font: inherit;
  font-size: 1rem;
}

.room-input::placeholder {
  color: rgba(247, 239, 225, 0.55);
}

.room-preview {
  font-size: 1.1rem;
  font-weight: 700;
  color: #ffdf86;
}

.arcade-button,
.back-button {
  border: none;
  cursor: pointer;
  border-radius: 999px;
  padding: 14px 18px;
  color: white;
  font-family: "Press Start 2P", cursive;
  font-size: 0.88rem;
}

.arcade-button {
  margin-top: 16px;
  background: linear-gradient(180deg, #ff965b 0%, #e05e2a 100%);
}

.arcade-button.secondary {
  background: linear-gradient(180deg, #6d63e0 0%, #4b3dc0 100%);
}

.arcade-button.teal {
  background: linear-gradient(180deg, #48d2bc 0%, #269d8d 100%);
}

.arcade-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.back-button {
  align-self: flex-start;
  background: rgba(52, 16, 36, 0.7);
  border: 2px solid rgba(255, 255, 255, 0.14);
}

@media (max-width: 960px) {
  .action-panel {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .multiplayer-shell {
    padding: 18px;
  }

  .arcade-button,
  .back-button {
    width: 100%;
    font-size: 0.78rem;
  }

  .back-button {
    align-self: stretch;
  }
}
</style>
