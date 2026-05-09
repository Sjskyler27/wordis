<template>
  <div class="profile-modal-backdrop animated-fade-in">
    <div
      ref="modalRef"
      class="profile-modal animated-slide-up"
      :class="{ 'profile-modal-modifiers': activeView === 'modifiers' }"
    >
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
        <button
          type="button"
          class="profile-tab-button"
          :class="{ active: activeView === 'modifiers' }"
          @click="openModifiers"
        >
          Modifiers
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

      <div v-else-if="activeView === 'past'" class="past-games-view">
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

      <div v-else class="modifier-collection-view">
        <div class="modifier-collection-heading">
          <p class="sync-status">{{ modifierUnlockSummary }}</p>
          <button type="button" class="profile-button unlock-all-button" @click="unlockEveryModifier">Unlock All</button>
        </div>

        <div class="past-games-tabs">
          <button
            v-for="type in modifierTypes"
            :key="type.key"
            type="button"
            class="past-mode-tab"
            :class="{ active: selectedModifierType === type.key }"
            @click="selectModifierType(type.key)"
          >
            {{ type.label }}
          </button>
        </div>

        <div class="past-games-tabs">
          <button
            v-for="group in activeModifierGroups"
            :key="group.key"
            type="button"
            class="past-mode-tab"
            :class="{ active: selectedModifierGroup === group.key }"
            @click="selectedModifierGroup = group.key"
          >
            {{ group.label }}
          </button>
        </div>

        <div class="modifier-collection-grid">
          <article
            v-for="modifier in activeModifierCatalog"
            :key="`${modifier.type}-${modifier.key}`"
            class="modifier-collection-card reward-card"
            :class="[modifier.type, modifier.group, { locked: !modifier.unlocked }]"
          >
            <div
              v-if="modifier.type === 'tile'"
              class="modifier-preview-tile"
              :style="modifier.preview?.style"
            >
              <span
                v-if="modifier.preview?.badge && !modifier.preview?.hideBadge"
                class="modifier-preview-tile-badge"
                :style="modifier.preview?.badgeStyle"
              >
                {{ modifier.preview.badge }}
              </span>
              <span class="modifier-preview-tile-score">{{ modifier.preview?.score }}</span>
              <span class="modifier-preview-tile-letter">{{ modifier.preview?.letter }}</span>
            </div>
            <div class="modifier-collection-card-heading">
              <strong>{{ modifier.label }}</strong>
              <span>{{ modifier.group }}</span>
            </div>
            <p>{{ modifier.unlocked ? modifier.description : '???' }}</p>
          </article>
        </div>
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
import {
  getModifierUnlockCatalog,
  readLocalModifierUnlockState,
  unlockAllModifiers
} from '../../userstate/modifierUnlocks.js';

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
const modifierUnlockState = ref(readLocalModifierUnlockState());
const selectedModifierType = ref('tile');
const selectedModifierGroup = ref('good');
const modifierTypes = [
  { key: 'tile', label: 'Tile' },
  { key: 'round', label: 'Round' },
  { key: 'personal', label: 'Upgrades' }
];
const modifierGroupsByType = {
  tile: [
    { key: 'good', label: 'Good' },
    { key: 'neutral', label: 'Neutral' },
    { key: 'bad', label: 'Bad' }
  ],
  round: [
    { key: 'easy', label: 'Easy' },
    { key: 'medium', label: 'Medium' },
    { key: 'hard', label: 'Hard' }
  ],
  personal: [
    { key: 'common', label: 'Common' },
    { key: 'rare', label: 'Rare' },
    { key: 'epic', label: 'Epic' }
  ]
};

const profileLog = (...args) => {
  console.log('[Profile Modal]', ...args);
};

const profileWarn = (...args) => {
  console.warn('[Profile Modal]', ...args);
};

const activeGames = computed(() => {
  pastGamesVersion.value;
  return selectedMode.value ? getPastGamesByMode(selectedMode.value) : [];
});
const modifierCatalog = computed(() => getModifierUnlockCatalog(modifierUnlockState.value));
const activeModifierGroups = computed(() => modifierGroupsByType[selectedModifierType.value] || []);
const activeModifierCatalog = computed(() => {
  return (modifierCatalog.value[selectedModifierType.value] || [])
    .filter((modifier) => modifier.group === selectedModifierGroup.value);
});
const modifierUnlockSummary = computed(() => {
  const catalog = modifierCatalog.value;
  const unlocked = [...catalog.tile, ...catalog.round, ...catalog.personal].filter((modifier) => modifier.unlocked).length;
  const total = catalog.tile.length + catalog.round.length + catalog.personal.length;
  return `${unlocked}/${total} unlocked`;
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
  profileLog('past games tab requested', { hasUser: Boolean(props.user) });
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
    profileLog('past games sync finished', result);
    syncStatus.value = result.skipped
      ? 'Showing local games.'
      : `Synced ${result.downloaded} down, ${result.uploaded} up.`;
  } catch (error) {
    profileWarn('Past game sync failed safely.', error);
    syncStatus.value = 'Showing local games.';
  } finally {
    isSyncingPastGames.value = false;
    pastGamesVersion.value += 1;
    nextTick(() => focusTarget(0));
  }
};

const openModifiers = () => {
  modifierUnlockState.value = readLocalModifierUnlockState();
  activeView.value = 'modifiers';
  nextTick(() => focusTarget(0));
};

const selectModifierType = (type) => {
  selectedModifierType.value = type;
  selectedModifierGroup.value = modifierGroupsByType[type]?.[0]?.key || '';
};

const unlockEveryModifier = () => {
  modifierUnlockState.value = unlockAllModifiers();
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
  profileLog('signup requested');
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
    profileLog('firebase signup completed', { uid: credential.user?.uid?.slice(0, 6) });
    await initializeNewUser(credential.user);
    profileLog('new user shell initialized');
    localStorage.setItem('userAgreed', true);
    emit('loggedIn');
  } catch (error) {
    profileWarn('signup failed safely', error);
    authError.value = error.message;
  }
};

const login = async () => {
  profileLog('login requested');
  if (!validateAuthForm()) {
    return;
  }

  try {
    if (!firebaseEnabled || !auth) {
      throw new Error('Account features are unavailable right now.');
    }

    await signInWithEmailAndPassword(auth, email.value, password.value);
    profileLog('firebase login completed');
    localStorage.setItem('userAgreed', true);
    emit('loggedIn');
  } catch (error) {
    profileWarn('login failed safely', error);
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
  visibility: hidden;
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 8, 18, 0.76);
}

.profile-modal {
  visibility: hidden;
  position: relative;
  width: min(880px, calc(100vw - 32px));
  max-height: 80%;
  height: 80%;
  overflow-y: auto;
  border: 4px solid #f7d35d;
  border-radius: 8px;
  padding: 28px;
  color: #fff;
  font-family: 'Press Start 2P', cursive;
  background: linear-gradient(180deg, rgba(36, 46, 62, 0.98), rgba(20, 25, 39, 0.98));
  box-shadow: 0 20px 42px rgba(0, 0, 0, 0.42);
}

.profile-modal-modifiers {
  width: min(1220px, calc(100vw - 32px));
  max-height: 88%;
  height: 88%;
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
  font-size: 23px;
  text-align: center;
}

.profile-details {
  display: grid;
  gap: 10px;
  margin-bottom: 22px;
  font-size: 12px;
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
  font-size: 11px;
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
  font-size: 12px;
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

.modifier-collection-view {
  display: grid;
  gap: 14px;
}

.modifier-collection-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.unlock-all-button {
  min-width: 140px;
  background: #b83945;
  color: #fff;
}

.modifier-collection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

.modifier-collection-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas:
    "tile"
    "heading"
    "body";
  gap: 12px;
  min-height: 260px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 18px;
  color: #fff7e8;
  background: linear-gradient(180deg, rgba(76, 156, 138, 0.96), rgba(43, 92, 98, 0.94));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 14px 24px rgba(20, 6, 18, 0.22);
  font-size: 9px;
  line-height: 1.45;
}

.modifier-collection-card.round,
.modifier-collection-card.personal {
  grid-template-areas:
    "heading"
    "body";
  min-height: 180px;
}

.modifier-collection-card.rare,
.modifier-collection-card.medium,
.modifier-collection-card.neutral {
  background: linear-gradient(180deg, rgba(82, 136, 215, 0.96), rgba(50, 62, 148, 0.94));
}

.modifier-collection-card.epic,
.modifier-collection-card.hard,
.modifier-collection-card.bad {
  background: linear-gradient(180deg, rgba(215, 151, 68, 0.98), rgba(142, 62, 72, 0.96));
}

.modifier-collection-card.locked {
  filter: grayscale(1);
  opacity: 0.46;
}

.modifier-collection-card-heading {
  grid-area: heading;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: flex-start;
}

.modifier-collection-card-heading strong {
  color: #f7d35d;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.modifier-collection-card-heading span {
  color: #9ff0ff;
  text-transform: uppercase;
}

.modifier-collection-card p {
  grid-area: body;
  margin: 0;
  opacity: 0.86;
  overflow-wrap: anywhere;
}

.modifier-preview-tile {
  grid-area: tile;
  align-self: center;
  justify-self: center;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 82px;
  height: 82px;
  border-radius: 14px;
  background: var(--tile-bg, linear-gradient(180deg, #fffef8 0%, #f2ebe0 70%, #d9cec0 100%));
  color: var(--tile-text-color, #1c1930);
  box-shadow: var(--tile-shadow, inset 0 -4px 0 rgba(0, 0, 0, 0.12), 0 10px 18px rgba(45, 10, 24, 0.16));
}

.modifier-preview-tile-letter {
  position: relative;
  z-index: 3;
  font-size: 2.1rem;
  font-weight: 900;
  line-height: 1;
  -webkit-text-stroke: var(--tile-letter-stroke, 0 transparent);
  paint-order: stroke fill;
}

.modifier-preview-tile-score {
  position: absolute;
  z-index: 5;
  top: 7px;
  right: 9px;
  font-size: 0.82rem;
  font-weight: 800;
}

.modifier-preview-tile-badge {
  position: absolute;
  z-index: 6;
  top: 6px;
  left: 7px;
  min-width: 26px;
  padding: 3px 6px;
  border-radius: 999px;
  font-size: 0.5rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-align: center;
  text-transform: uppercase;
  box-shadow: 0 4px 10px rgba(27, 11, 20, 0.18);
}


@media (max-width: 1000px) {
.profile-modal {
max-width: 90%;
max-height: 90%;
width: 90%;
height: 90%;
}

.profile-modal-modifiers {
  width: 96%;
  max-width: 96%;
}

.profile-details {

  font-size: 22px;
  line-height: 1.6;
}
.profile-tab-button{
  font-size: 18px;
}
.profile-button{
  font-size: 18px;
}
.past-mode-tab{
  font-size: 15px;
}
.profile-close{
  font-size: 35px;
}

.past-game-card {
  padding: 14px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 18px;
  line-height: 1.5;
}

.modifier-collection-card {
  min-height: 220px;
  font-size: 15px;
}
}
</style>
