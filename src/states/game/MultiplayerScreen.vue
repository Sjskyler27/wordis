<template>
  <div ref="screenRoot" class="multiplayer-shell">

    <main class="multiplayer-frame" :class="{ exiting: isExiting }">
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
          <span class="kicker">Bot Match</span>
          <h2>Train Against AI</h2>
          <p>Pick a bot difficulty and jump into the same rack duel flow without opening a live lobby.</p>
          <div class="difficulty-row">
            <button
              v-for="difficulty in difficulties"
              :key="difficulty.value"
              type="button"
              class="difficulty-chip"
              :class="{ active: selectedDifficulty === difficulty.value }"
              @click="selectedDifficulty = difficulty.value"
            >
              {{ difficulty.label }}
            </button>
          </div>
          <button class="arcade-button secondary" @click="startBotMatch">Play vs Bot</button>
        </div>

        <div class="panel-card panel-card-primary">
          <span class="kicker">Host</span>
          <h2>Start a Room</h2>
          <p v-if="roomCode" class="room-preview">Room {{ roomCode }}</p>
          <p v-else>{{ hostVisibilityText }}</p>
          <div class="host-options">
            <span class="kicker">Options</span>
            <label class="toggle-row">
              <span>Overtime</span>
              <input
                v-model="hostOvertimeEnabled"
                type="checkbox"
                :disabled="isConnecting || !isSocketConnected"
              />
            </label>
          </div>
          <label class="toggle-row">
            <span>Private Room</span>
            <input
              v-model="hostIsPrivate"
              type="checkbox"
              :disabled="isConnecting || !isSocketConnected"
            />
          </label>
          <button class="arcade-button" @click="handleHostGame" :disabled="isExiting || isConnecting || !isSocketConnected">
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
              autocapitalize="characters"
              spellcheck="false"
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
        <span class="kicker">Open Lobbies</span>
        <strong>{{ availableLobbies.length ? 'Join a live public room' : 'No public lobbies right now.' }}</strong>
        <div v-if="availableLobbies.length" class="lobby-list">
          <button
            v-for="lobby in availableLobbies"
            :key="lobby.roomCode"
            type="button"
            class="lobby-row"
            :disabled="isConnecting || !isSocketConnected"
            @click="joinLobby(lobby.roomCode)"
          >
            <span class="lobby-room">{{ lobby.roomCode }}</span>
            <span class="lobby-meta">{{ lobby.players }}/2 players</span>
            <span class="lobby-cta">Join</span>
          </button>
        </div>
        <p v-else>Host a public room to make it appear here for other players.</p>
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
import { ref, computed, nextTick, onBeforeUnmount, onMounted, watch } from 'vue';
import {
  roomCode,
  message,
  isConnecting,
  hostGame,
  joinGame,
  availableLobbies,
  requestLobbyList,
  connectionStatus,
  isSocketConnected
} from './multiplayer.js';
import { overtimeEnabled } from './play-config.js';

const joinCode = ref('');
const hostIsPrivate = ref(true);
const hostOvertimeEnabled = ref(overtimeEnabled.value);
const selectedDifficulty = ref('normal');
const screenRoot = ref(null);
const controllerFocusIndex = ref(0);
const isExiting = ref(false);
const emit = defineEmits(['game', 'home', 'singleplayer']);
const difficulties = [
  { value: 'easy', label: 'Easy' },
  { value: 'normal', label: 'Normal' },
  { value: 'hard', label: 'Hard' }
];

const startBotMatch = () => {
  emit('singleplayer', {
    mode: 'bot_match',
    difficulty: selectedDifficulty.value
  });
};

const handleHostGame = () => {
  if (isExiting.value) {
    return;
  }

  isExiting.value = true;
  overtimeEnabled.value = hostOvertimeEnabled.value;
  localStorage.setItem('overtimeEnabled', JSON.stringify(hostOvertimeEnabled.value));
  window.setTimeout(() => {
    hostGame({
      isPrivate: hostIsPrivate.value,
      overtimeEnabled: hostOvertimeEnabled.value
    });
  }, 240);
};

const handleJoinGame = () => {
  joinGame(joinCode.value);
};

const joinLobby = (code) => {
  joinGame(code);
};

const getControllerTargets = () => {
  if (!screenRoot.value) {
    return [];
  }

  return Array.from(screenRoot.value.querySelectorAll('button:not(:disabled), input:not(:disabled)'))
    .filter((element) => element.offsetParent !== null);
};

const setControllerFocus = (nextIndex) => {
  const targets = getControllerTargets();
  if (!targets.length) {
    return;
  }

  controllerFocusIndex.value = Math.max(0, Math.min(nextIndex, targets.length - 1));
  targets[controllerFocusIndex.value]?.focus();
};

const syncControllerFocusIndex = () => {
  const targets = getControllerTargets();
  const activeIndex = targets.findIndex((element) => element === document.activeElement);
  if (activeIndex >= 0) {
    controllerFocusIndex.value = activeIndex;
  }
};

const handleControllerKeyDown = (event) => {
  const activeElement = document.activeElement;
  const activeTag = activeElement?.tagName?.toLowerCase();
  const isTextInput = activeTag === 'input' && activeElement?.type !== 'checkbox';

  if (event.key === 'Escape') {
    event.preventDefault();
    emit('home');
    return;
  }

  if (isTextInput && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
    return;
  }

  if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
    event.preventDefault();
    syncControllerFocusIndex();
    setControllerFocus(controllerFocusIndex.value + 1);
    return;
  }

  if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
    event.preventDefault();
    syncControllerFocusIndex();
    setControllerFocus(controllerFocusIndex.value - 1);
    return;
  }

  if ((event.key === 'Enter' || event.key === ' ') && activeTag !== 'input') {
    event.preventDefault();
    activeElement?.click();
  }
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
const hostVisibilityText = computed(() => {
  return hostIsPrivate.value
    ? 'Spin up a private room and share the code with your opponent.'
    : 'Spin up a public room so anyone browsing open lobbies can jump in.';
});
const readyToStartMultiplayer = computed(
  () => !!roomCode.value && connectionStatus.value === 'connected'
);
const hasNavigated = ref(false);

watch(readyToStartMultiplayer, (ready) => {
  if (ready && !hasNavigated.value) {
    hasNavigated.value = true;
    if (!isExiting.value) {
      isExiting.value = true;
    }
    window.setTimeout(() => emit('game'), 320);
  }
});

watch(joinCode, (value) => {
  const normalizedValue = (value || '').toUpperCase();
  if (normalizedValue !== value) {
    joinCode.value = normalizedValue;
  }
});

watch(connectionStatus, (status) => {
  if (status === 'connected') {
    requestLobbyList();
  }
}, { immediate: true });

onMounted(() => {
  window.addEventListener('keydown', handleControllerKeyDown);
  nextTick(() => setControllerFocus(0));
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleControllerKeyDown);
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
  position: fixed;
  inset: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 28px;
  color: var(--cream);
}


.multiplayer-frame {
  width: min(100%, 1180px);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  transform-origin: center top;
  transition:
    transform 520ms cubic-bezier(0.7, 0, 0.84, 0),
    opacity 420ms ease,
    filter 520ms ease;
}

.multiplayer-frame.exiting {
  transform: translateY(120vh) scale(0.96);
  opacity: 0;
  filter: blur(3px);
  pointer-events: none;
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

.host-options {
  margin: 16px 0 14px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
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
  text-transform: uppercase;
  letter-spacing: 0.18em;
}

.room-input::placeholder {
  color: rgba(247, 239, 225, 0.55);
}

.room-preview {
  font-size: 1.1rem;
  font-weight: 700;
  color: #ffdf86;
}

.toggle-row {
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.09);
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.toggle-row input {
  width: 20px;
  height: 20px;
}

.difficulty-row {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.difficulty-chip {
  border: 1px solid rgba(255, 255, 255, 0.14);
  cursor: pointer;
  border-radius: 999px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--cream);
  font-family: inherit;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.difficulty-chip.active {
  background: linear-gradient(180deg, rgba(93, 230, 203, 0.24), rgba(46, 179, 151, 0.38));
  border-color: rgba(111, 245, 221, 0.54);
}

.lobby-list {
  margin-top: 16px;
  display: grid;
  gap: 12px;
}

.lobby-row {
  border: none;
  cursor: pointer;
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--cream);
  font-family: inherit;
  text-align: left;
}

.lobby-room {
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.lobby-meta {
  opacity: 0.75;
}

.lobby-cta {
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #6ff5dd;
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

.difficulty-chip:focus-visible,
.lobby-row:focus-visible,
.arcade-button:focus-visible,
.back-button:focus-visible,
.room-input:focus-visible,
.toggle-row input:focus-visible {
  outline: 4px solid rgba(130, 253, 238, 0.86);
  outline-offset: 3px;
  box-shadow:
    0 0 0 5px rgba(92, 25, 41, 0.38),
    0 16px 26px rgba(33, 10, 30, 0.28);
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
