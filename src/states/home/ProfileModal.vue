<template>
  <div class="profile-modal-backdrop animated-fade-in">
    <div ref="modalRef" class="profile-modal animated-slide-up">
      <button ref="closeButton" class="profile-close" @click="emit('close')">&times;</button>
      <h2>Profile</h2>

      <div class="profile-tabs">
        <button
          type="button"
          class="profile-tab-button"
          :class="{ active: activeView === 'account' }"
          @click="activeView = 'account'"
        >
          Account
        </button>
        <button
          v-if="!hidePastGames"
          type="button"
          class="profile-tab-button"
          :class="{ active: activeView === 'past' }"
          @click="openPastGames"
        >
          Past Games
        </button>
      </div>

      <div v-if="activeView === 'account'">
        <div v-if="user" class="profile-details">
          <span>Signed in as</span>
          <strong>{{ user?.email || 'Wordis player' }}</strong>
        </div>

        <div v-else class="profile-login-panel">
          <span>Account</span>
          <strong>Log in to sync progress</strong>
          <input ref="emailInput" v-model="email" type="email" placeholder="Email" />
          <input ref="passwordInput" v-model="password" type="password" placeholder="Password" />
          <p v-if="authError" class="profile-error">{{ authError }}</p>
          <div class="profile-actions">
            <button ref="signUpButton" class="profile-button" @click="signUp">Sign Up</button>
            <button ref="loginButton" class="profile-button primary" @click="login">Log In</button>
          </div>
        </div>

        <label v-if="user" class="sync-toggle">
          <input
            type="checkbox"
            :checked="savedGameSyncEnabled"
            @change="emit('savedGameSyncChange', $event.target.checked)"
          />
          <span>Sync saved games</span>
        </label>

        <div v-if="user" class="profile-actions">
          <button ref="logoutButton" class="profile-button danger" @click="emit('logout')">Log Out</button>
          <button ref="doneButton" class="profile-button" @click="emit('close')">Done</button>
        </div>
      </div>

      <div v-else class="past-games-view">
        <div class="past-games-tabs">
          <button
            v-for="mode in visibleModes"
            :key="mode.mode"
            type="button"
            class="past-mode-tab"
            :class="{ active: selectedMode === mode.mode }"
            @click="selectedMode = mode.mode"
          >
            {{ mode.label }}
          </button>
        </div>

        <p class="sync-status">{{ syncStatus }}</p>

        <div v-if="activeGames.length" class="past-games-list">
          <article v-for="game in activeGames" :key="game.id" class="past-game-card">
            <div class="past-game-heading">
              <strong>{{ formatResult(game.rs) }}</strong>
              <span>{{ formatDate(game.ca) }}</span>
            </div>
            <div class="past-game-stats">
              <span>Score {{ game.sc || 0 }}</span>
              <span v-if="game.os !== undefined">Machine {{ game.os || 0 }}</span>
              <span>{{ formatDuration(game.dur) }}</span>
            </div>
            <p v-if="game.bw" class="best-word">
              Best word: {{ game.bw.w }} · {{ game.bw.sc }} pts<span v-if="game.bw.rn"> · R{{ game.bw.rn }}</span>
            </p>
            <div v-if="game.rds?.length" class="round-list">
              <span
                v-for="round in game.rds"
                :key="`${game.id}-${round.rn}`"
                class="round-pill"
              >
                R{{ round.rn }} {{ round.sc }}/{{ round.trg }} · {{ formatDuration(round.su) }}
              </span>
            </div>
          </article>
        </div>
        <p v-else class="empty-games">No games saved for this mode yet.</p>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { hidePastGames } from '../../../globalVariables.js';
import { auth, firebaseEnabled } from '../../firebaseClient.js';
import { initializeNewUser } from '../../userstate/initializeNewUser.js';
import {
  getPastGamesByMode,
  getVisiblePastGameModes,
  syncPastGames
} from '../../userstate/pastGames.js';

const props = defineProps({
  user: Object,
  savedGameSyncEnabled: Boolean
});

const emit = defineEmits(['close', 'loggedIn', 'logout', 'savedGameSyncChange']);
const closeButton = ref(null);
const logoutButton = ref(null);
const doneButton = ref(null);
const emailInput = ref(null);
const passwordInput = ref(null);
const signUpButton = ref(null);
const loginButton = ref(null);
const modalRef = ref(null);
const activeView = ref('account');
const visibleModes = getVisiblePastGameModes();
const selectedMode = ref(visibleModes[0]?.mode || '');
const pastGamesVersion = ref(0);
const syncStatus = ref('Sync when opened.');
const isSyncingPastGames = ref(false);
const email = ref('');
const password = ref('');
const authError = ref('');

const activeGames = computed(() => {
  pastGamesVersion.value;
  return selectedMode.value ? getPastGamesByMode(selectedMode.value) : [];
});

const getFocusTargets = () => {
  if (!modalRef.value) {
    return [];
  }

  return Array.from(modalRef.value.querySelectorAll('button:not(:disabled), input:not(:disabled)'))
    .filter((target) => target.offsetParent !== null);
};

const focusTarget = (index) => {
  const availableTargets = getFocusTargets();
  if (!availableTargets.length) {
    return;
  }

  const targetIndex = (index + availableTargets.length) % availableTargets.length;
  availableTargets[targetIndex]?.focus();
};

const openPastGames = async () => {
  if (!props.user) {
    activeView.value = 'account';
    authError.value = 'Log in to sync and view past games.';
    nextTick(() => emailInput.value?.focus());
    return;
  }

  activeView.value = 'past';
  if (!selectedMode.value && visibleModes.length) {
    selectedMode.value = visibleModes[0].mode;
  }

  syncStatus.value = 'Syncing past games...';
  isSyncingPastGames.value = true;

  try {
    const result = await syncPastGames();
    syncStatus.value = result.skipped
      ? 'Showing local games.'
      : `Synced ${result.downloaded} down, ${result.uploaded} up.`;
  } catch (error) {
    console.warn('Past game sync failed.', error);
    syncStatus.value = 'Showing local games.';
  } finally {
    isSyncingPastGames.value = false;
    pastGamesVersion.value += 1;
    nextTick(() => focusTarget(0));
  }
};

const validateAuthForm = () => {
  authError.value = '';
  if (!email.value || !password.value) {
    authError.value = 'Email and password are required.';
    return false;
  }

  return true;
};

const signUp = async () => {
  if (!validateAuthForm()) {
    return;
  }

  if (password.value.length < 6) {
    authError.value = 'Password must be at least 6 characters.';
    return;
  }

  try {
    if (!firebaseEnabled || !auth) {
      throw new Error('Account features are unavailable right now.');
    }

    const credential = await createUserWithEmailAndPassword(auth, email.value, password.value);
    await initializeNewUser(credential.user);
    localStorage.setItem('userAgreed', true);
    emit('loggedIn');
  } catch (error) {
    authError.value = error.message;
  }
};

const login = async () => {
  if (!validateAuthForm()) {
    return;
  }

  try {
    if (!firebaseEnabled || !auth) {
      throw new Error('Account features are unavailable right now.');
    }

    await signInWithEmailAndPassword(auth, email.value, password.value);
    localStorage.setItem('userAgreed', true);
    emit('loggedIn');
  } catch (error) {
    authError.value = error.message;
  }
};

const formatDate = (timestamp) => {
  if (!timestamp) {
    return '';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(timestamp));
};

const formatDuration = (seconds = 0) => {
  const safeSeconds = Math.max(0, Math.round(Number(seconds) || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = String(safeSeconds % 60).padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
};

const formatResult = (result = '') => {
  if (result === 'won') return 'Won';
  if (result === 'failed') return 'Failed Run';
  if (result === 'lost') return 'Lost';
  return 'Game';
};

const cycleMode = (direction) => {
  if (activeView.value !== 'past' || !visibleModes.length) {
    return false;
  }

  const currentIndex = visibleModes.findIndex((mode) => mode.mode === selectedMode.value);
  const nextIndex = (currentIndex + direction + visibleModes.length) % visibleModes.length;
  selectedMode.value = visibleModes[nextIndex].mode;
  pastGamesVersion.value += 1;
  return true;
};

const handleKeyDown = (event) => {
  if (event.key === 'Escape' || event.key === 'b') {
    event.preventDefault();
    emit('close');
    return;
  }

  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    if (cycleMode(event.key === 'ArrowRight' ? 1 : -1)) {
      event.preventDefault();
    }
    return;
  }

  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
    return;
  }

  const availableTargets = getFocusTargets();
  const currentIndex = availableTargets.findIndex((target) => target === document.activeElement);
  const nextIndex = event.key === 'ArrowDown' ? currentIndex + 1 : currentIndex - 1;
  event.preventDefault();
  focusTarget(currentIndex === -1 ? 0 : nextIndex);
};

onMounted(() => {
  nextTick(() => {
    (props.user ? doneButton.value : emailInput.value)?.focus();
  });
  window.addEventListener('keydown', handleKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.profile-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 8, 18, 0.76);
}

.profile-modal {
  position: relative;
  width: min(620px, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  border: 4px solid #f7d35d;
  border-radius: 8px;
  padding: 28px;
  color: #fff;
  font-family: 'Press Start 2P', cursive;
  background: linear-gradient(180deg, rgba(36, 46, 62, 0.98), rgba(20, 25, 39, 0.98));
  box-shadow: 0 20px 42px rgba(0, 0, 0, 0.42);
}

.profile-close {
  position: absolute;
  top: 8px;
  right: 10px;
  border: 0;
  color: #fff;
  background: transparent;
  font-size: 28px;
  cursor: pointer;
}

h2 {
  margin: 0 0 22px;
  color: #f7d35d;
  font-size: 22px;
  text-align: center;
}

.profile-details {
  display: grid;
  gap: 10px;
  margin-bottom: 22px;
  font-size: 10px;
  line-height: 1.6;
}

.profile-tabs,
.past-games-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.profile-tab-button,
.past-mode-tab {
  min-height: 38px;
  border: 2px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
  font-family: inherit;
  font-size: 9px;
  cursor: pointer;
}

.profile-tab-button.active,
.past-mode-tab.active {
  color: #111827;
  background: #f7d35d;
}

.profile-details strong {
  overflow-wrap: anywhere;
  color: #9ff0ff;
}

.profile-login-panel {
  display: grid;
  gap: 12px;
  margin-bottom: 22px;
  font-size: 10px;
  line-height: 1.6;
}

.profile-login-panel strong {
  color: #9ff0ff;
}

.profile-login-panel input {
  min-height: 42px;
  border: 2px solid rgba(247, 211, 93, 0.48);
  border-radius: 6px;
  padding: 0 12px;
  color: #111827;
  font-family: inherit;
  font-size: 10px;
  background: rgba(255, 255, 255, 0.94);
}

.profile-error {
  margin: 0;
  color: #ff9aa5;
}

.sync-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  font-size: 11px;
  line-height: 1.5;
  cursor: pointer;
}

.sync-toggle input {
  width: 20px;
  height: 20px;
}

.profile-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.profile-button {
  min-height: 44px;
  border: 0;
  border-radius: 6px;
  color: #111827;
  background: #f7d35d;
  font-family: inherit;
  font-size: 10px;
  cursor: pointer;
}

.profile-button.danger {
  color: #fff;
  background: #b83945;
}

.profile-button.primary {
  color: #0b2b2c;
  background: #82fdee;
}

.profile-button:focus-visible,
.profile-close:focus-visible,
.profile-tab-button:focus-visible,
.past-mode-tab:focus-visible,
.profile-login-panel input:focus-visible {
  outline: 3px solid rgba(130, 253, 238, 0.9);
  outline-offset: 3px;
}

.sync-status,
.empty-games {
  font-size: 10px;
  line-height: 1.5;
  opacity: 0.78;
}

.past-games-list {
  display: grid;
  gap: 12px;
}

.past-game-card {
  display: grid;
  gap: 10px;
  padding: 14px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 10px;
  line-height: 1.5;
}

.past-game-heading,
.past-game-stats,
.round-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.past-game-heading {
  justify-content: space-between;
}

.past-game-heading strong {
  color: #f7d35d;
}

.best-word {
  margin: 0;
  color: #9ff0ff;
}

.round-pill {
  padding: 5px 7px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.18);
}
</style>
