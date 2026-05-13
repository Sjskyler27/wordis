<template>
  <div ref="screenRoot" class="multi-round-shell">

    <main class="multi-round-frame" :class="{ exiting: isExiting }">
      <section class="hero-card">
        <span class="kicker">Wordis Run Mode</span>
        <h1>Wordis Run</h1>
        <p>Meet each rounds required score within the time limit. Gain permanent upgrades to help you get through each round as they scale in difficulty.</p>
      </section>

      <section class="action-panel">
        <div class="panel-card">
          <span class="kicker">How It Works</span>
          <ul class="rules-list">
            <li>Rounds have a set score that you need to reach within the time limit.</li>
            <li>When time runs out you may play one final word</li>
            <li>Unused time becomes starting score for the next round. The faster you get the better you will do.</li>
            <li>Round modifiers are listed in the top left, they make each round more challenging. Hover over round numbers to see upcoming challenges.</li>
            <li>After each cleared round, choose one persistent personal modifier.</li>
            <li>Challenge rounds reveal temporary rules that change scoring, cards, or word limits.</li>
            <li>Fail a round after your final word and the run ends.</li>
          </ul>
        </div>

        <div class="panel-card panel-card-primary">
          <span class="kicker">Difficulty</span>
          <h2>Select A Run</h2>
          <p>{{ selectedDifficultyDetails.description }}</p>
          <div class="difficulty-row">
            <button
              v-for="difficulty in difficulties"
              :key="difficulty.value"
              type="button"
              class="difficulty-chip"
              :class="{ active: selectedDifficulty === difficulty.value, locked: !isDifficultyUnlocked(difficulty.value) }"
              :disabled="!isDifficultyUnlocked(difficulty.value)"
              :data-difficulty="difficulty.value"
              @click="selectDifficulty(difficulty.value)"
            >
              {{ difficulty.label }}
              <small v-if="!isDifficultyUnlocked(difficulty.value)">Locked</small>
            </button>
          </div>
          <button class="arcade-button" :disabled="isExiting || !selectedDifficultyUnlocked" @click="startMultiRound">Start Multi-Round</button>
        </div>

        <div class="panel-card">
          <span class="kicker">Selected Track</span>
          <h2>{{ selectedDifficultyDetails.label }}</h2>
          <div class="stat-grid">
            <div>
              <strong>{{ selectedDifficultyDetails.rounds }}</strong>
              <span>Rounds</span>
            </div>
            <div>
              <strong>{{ selectedDifficultyDetails.challengeRounds }}</strong>
              <span>Challenges</span>
            </div>
            <div>
              <strong>{{ selectedDifficultyDetails.pace }}</strong>
              <span>Pace</span>
            </div>
          </div>
          <p>{{ selectedDifficultyDetails.summary }}</p>
        </div>
      </section>

      <section class="score-section">
        <div class="score-section-header">
          <span class="kicker">High Scores</span>
          <strong>{{ selectedDifficultyDetails.label }} Best: {{ formatHighScore(selectedDifficultyScore?.score) }}</strong>
        </div>
        <div class="score-grid">
          <article
            v-for="difficulty in difficulties"
            :key="`score-${difficulty.value}`"
            class="score-card"
            :class="{ active: selectedDifficulty === difficulty.value }"
          >
            <span>{{ difficulty.label }}</span>
            <strong>{{ formatHighScore(highScores[difficulty.value]?.score) }}</strong>
            <small>{{ formatScoreDetail(highScores[difficulty.value]) }}</small>
          </article>
        </div>
      </section>

      <!-- <section class="message-card">
        <span class="kicker">Rewards</span>
        <strong>Personal modifiers are not cards.</strong>
        <p>They stack across the run and can change tile values, modifier odds, word-length scoring, or grant immediate tray modifiers and tactics.</p>
      </section> -->
      <section class="reference-section">
        <div class="reference-header">
          <span class="kicker">Reference</span>
          <h2>{{ referenceTitle }}</h2>
        </div>
        <div class="reference-toggle">
          <button
            type="button"
            class="reference-toggle-button"
            :class="{ active: selectedReferenceType === 'personal' }"
            @click="selectedReferenceType = 'personal'"
          >
            Upgrades
          </button>
          <button
            type="button"
            class="reference-toggle-button"
            :class="{ active: selectedReferenceType === 'round' }"
            @click="selectedReferenceType = 'round'"
          >
            Round Modifiers
          </button>
          <button
            type="button"
            class="reference-toggle-button"
            :class="{ active: selectedReferenceType === 'cards' }"
            @click="selectedReferenceType = 'cards'"
          >
            Cards
          </button>
        </div>
        <div v-if="selectedReferenceType === 'personal'" class="filter-row">
          <button
            v-for="group in personalModifierGroups"
            :key="group.tier"
            type="button"
            class="filter-chip"
            :class="[`tier-${group.tier}`, { active: selectedPersonalTier === group.tier }]"
            @click="selectedPersonalTier = group.tier"
          >
            {{ group.label }}
          </button>
        </div>
        <div v-if="selectedReferenceType === 'personal'" class="tier-group">
          <div class="tier-heading" :class="`tier-${activePersonalModifierGroup.tier}`">
            <strong>{{ activePersonalModifierGroup.label }}</strong>
            <span>{{ activePersonalModifierGroup.modifiers.length }} modifiers</span>
          </div>
          <div class="modifier-grid">
            <article
              v-for="modifier in activePersonalModifierGroup.modifiers"
              :key="modifier.key"
              class="modifier-card"
              :class="`tier-${modifier.tier}`"
            >
              <div class="modifier-card-heading">
                <strong>{{ modifier.label }}</strong>
                <span class="modifier-pill">{{ modifier.tier }}</span>
              </div>
              <p>{{ modifier.description }}</p>
              <small>Stacks: {{ modifier.maxStacks }}</small>
            </article>
          </div>
        </div>
        <div v-if="selectedReferenceType === 'round'" class="filter-row">
          <button
            v-for="group in roundModifierGroups"
            :key="group.difficulty"
            type="button"
            class="filter-chip"
            :class="[`difficulty-${group.difficulty}`, { active: selectedRoundDifficulty === group.difficulty }]"
            @click="selectedRoundDifficulty = group.difficulty"
          >
            {{ group.label }}
          </button>
        </div>
        <div v-if="selectedReferenceType === 'round'" class="tier-group">
          <div class="tier-heading" :class="`difficulty-${activeRoundModifierGroup.difficulty}`">
            <strong>{{ activeRoundModifierGroup.label }}</strong>
            <span>{{ activeRoundModifierGroup.modifiers.length }} modifiers</span>
          </div>
          <div class="modifier-grid">
            <article
              v-for="modifier in activeRoundModifierGroup.modifiers"
              :key="modifier.key"
              class="modifier-card round-card"
              :class="`difficulty-${modifier.difficulty}`"
            >
              <div class="modifier-card-heading">
                <strong>{{ modifier.label }}</strong>
                <span class="modifier-pill">{{ modifier.difficulty }}</span>
              </div>
              <p>{{ modifier.description }}</p>
            </article>
          </div>
        </div>
        <div v-if="selectedReferenceType === 'cards'" class="filter-row">
          <button
            v-for="group in cardGroups"
            :key="group.kind"
            type="button"
            class="filter-chip"
            :class="[`card-kind-${group.kind}`, { active: selectedCardKind === group.kind }]"
            @click="selectedCardKind = group.kind"
          >
            {{ group.label }}
          </button>
        </div>
        <div v-if="selectedReferenceType === 'cards'" class="tier-group">
          <div class="tier-heading" :class="`card-kind-${activeCardGroup.kind}`">
            <strong>{{ activeCardGroup.label }}</strong>
            <span>{{ activeCardGroup.cards.length }} cards</span>
          </div>
          <div class="modifier-grid">
            <article
              v-for="card in activeCardGroup.cards"
              :key="card.key"
              class="modifier-card card-reference-card"
              :class="`card-kind-${card.kind}`"
            >
              <div class="modifier-card-heading">
                <strong>{{ card.label }}</strong>
                <span class="modifier-pill">{{ card.kind }}</span>
              </div>
              <p>{{ card.description }}</p>
              <small>{{ formatCardDetail(card) }}</small>
            </article>
          </div>
        </div>
      </section>

      <button class="back-button" @click="$emit('type')">Back</button>
    </main>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { PERSONAL_MODIFIER_DEFINITIONS } from './multiround/personal-modifier-definitions.js';
import { ROUND_MODIFIER_DEFINITIONS } from './multiround/round-modifier-definitions.js';
import { getMultiRoundRounds, normalizeMultiRoundDifficulty } from './multiround/multi-round-difficulties.js';
import { resolveBackgroundPaletteKey } from './multiround/useMultiRoundRun.js';
import { readLocalMultiRoundHighScores } from '../../userstate/multiRoundHighScores.js';
import {
  getFirstUnlockedMultiRoundDifficulty,
  isMultiRoundDifficultyUnlocked,
  readLocalMultiRoundDifficultyUnlockState,
  unlockNextDifficultyForStartedRun
} from '../../userstate/multiRoundDifficultyUnlocks.js';
import {
  MODIFIER_UNLOCK_TYPES,
  getUnlockedModifierKeys,
  readLocalModifierUnlockState
} from '../../userstate/modifierUnlocks.js';
import './card-definitions.cjs';

const {
  CARD_DEFINITIONS = {},
  TRAY_MODIFIER_CARD_KEYS = [],
  MULTI_ROUND_TACTIC_CARD_KEYS = []
} = globalThis.__wordisCardDefinitions || {};

const emit = defineEmits(['singleplayer', 'type']);
const difficultyUnlockState = ref(readLocalMultiRoundDifficultyUnlockState());
const modifierUnlockState = ref(readLocalModifierUnlockState());
const savedDifficulty = normalizeMultiRoundDifficulty(localStorage.getItem('multiRoundDifficulty') || 'normal');
const selectedDifficulty = ref(isMultiRoundDifficultyUnlocked(savedDifficulty, difficultyUnlockState.value)
  ? savedDifficulty
  : getFirstUnlockedMultiRoundDifficulty(difficultyUnlockState.value));
const selectedReferenceType = ref('personal');
const selectedPersonalTier = ref('common');
const selectedRoundDifficulty = ref('easy');
const selectedCardKind = ref('trayModifier');
const screenRoot = ref(null);
const controllerFocusIndex = ref(0);
const isExiting = ref(false);
const highScores = ref(readLocalMultiRoundHighScores());
const difficulties = [
  {
    value: 'micro',
    label: 'Easy',
    rounds: 7,
    challengeRounds: 4,
    pace: 'Guided',
    description: 'A guided run with the lowest targets, relaxed timers, and a softer modifier curve.',
    summary: 'Best for learning the run flow before moving into full difficulty tracks.'
  },
  {
    value: 'easy',
    label: 'Normal',
    rounds: 7,
    challengeRounds: 3,
    pace: 'Lenient',
    description: 'A shorter run with lower targets, more time, and fewer modifiers.',
    summary: 'Best for learning how time bonuses, reward choices, and challenge rounds fit together.'
  },
  {
    value: 'normal',
    label: 'Hard',
    rounds: 10,
    challengeRounds: 4,
    pace: 'Steady',
    description: 'A balanced run with moderate targets and a controlled modifier curve.',
    summary: 'Best when you know the mode and want room to build a focused upgrade path.'
  },
  {
    value: 'hard',
    label: 'Marathon',
    rounds: 13,
    challengeRounds: 5,
    pace: 'Punishing',
    description: 'The original full-length track with higher targets and heavier challenge pressure.',
    summary: 'Best for strong runs where every reward choice and saved second matters.'
  }
];

const selectedDifficultyUnlocked = computed(() => isDifficultyUnlocked(selectedDifficulty.value));
const selectedDifficultyDetails = computed(() => {
  return difficulties.find((difficulty) => difficulty.value === selectedDifficulty.value)
    || difficulties.find((difficulty) => difficulty.value === 'normal')
    || difficulties[0];
});
const selectedDifficultyScore = computed(() => highScores.value[selectedDifficulty.value] || null);
const referenceTitle = computed(() => {
  if (selectedReferenceType.value === 'cards') {
    return 'Available Cards';
  }

  return selectedReferenceType.value === 'personal' ? 'Possible Upgrades' : 'Possible Round Modifiers';
});
const firstRoundBackgroundPaletteKey = computed(() => {
  const rounds = getMultiRoundRounds(selectedDifficulty.value);
  return resolveBackgroundPaletteKey(rounds[0] || {});
});
const personalTierRank = {
  common: 1,
  rare: 2,
  epic: 3
};
const roundDifficultyRank = {
  easy: 1,
  medium: 2,
  hard: 3
};
const roundDifficultyLabels = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard'
};
const personalTierLabels = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic'
};
const unlockedPersonalModifierKeys = computed(() => new Set(getUnlockedModifierKeys(MODIFIER_UNLOCK_TYPES.PERSONAL, modifierUnlockState.value)));
const unlockedRoundModifierKeys = computed(() => new Set(getUnlockedModifierKeys(MODIFIER_UNLOCK_TYPES.ROUND, modifierUnlockState.value)));
const unlockedCardKeys = computed(() => new Set(getUnlockedModifierKeys(MODIFIER_UNLOCK_TYPES.CARD, modifierUnlockState.value)));
const personalModifierGroups = computed(() => {
  const modifiers = Object.values(PERSONAL_MODIFIER_DEFINITIONS)
    .filter((modifier) => unlockedPersonalModifierKeys.value.has(modifier.key));
  return Object.keys(personalTierRank).map((tier) => ({
    tier,
    label: personalTierLabels[tier] || tier,
    modifiers: modifiers
      .filter((modifier) => modifier.tier === tier)
      .sort((first, second) => first.label.localeCompare(second.label))
  })).filter((group) => group.modifiers.length);
});
const activePersonalModifierGroup = computed(() => {
  return personalModifierGroups.value.find((group) => group.tier === selectedPersonalTier.value)
    || personalModifierGroups.value[0]
    || { tier: 'common', label: 'Common', modifiers: [] };
});
const roundModifierGroups = computed(() => {
  const modifiers = Object.values(ROUND_MODIFIER_DEFINITIONS)
    .filter((modifier) => !modifier.force_test && unlockedRoundModifierKeys.value.has(modifier.key));
  return Object.keys(roundDifficultyRank).map((difficulty) => ({
    difficulty,
    label: roundDifficultyLabels[difficulty] || difficulty,
    modifiers: modifiers
      .filter((modifier) => modifier.difficulty === difficulty)
      .sort((first, second) => first.label.localeCompare(second.label))
  })).filter((group) => group.modifiers.length);
});
const activeRoundModifierGroup = computed(() => {
  return roundModifierGroups.value.find((group) => group.difficulty === selectedRoundDifficulty.value)
    || roundModifierGroups.value[0]
    || { difficulty: 'easy', label: 'Easy', modifiers: [] };
});
const buildCardEntries = (keys = []) => {
  return keys
    .filter((key) => unlockedCardKeys.value.has(key))
    .map((key) => ({ key, ...(CARD_DEFINITIONS[key] || {}) }))
    .filter((card) => card.label)
    .sort((first, second) => first.label.localeCompare(second.label));
};
const cardGroups = computed(() => ([
  {
    kind: 'trayModifier',
    label: 'Tray Modifiers',
    cards: buildCardEntries(TRAY_MODIFIER_CARD_KEYS)
  },
  {
    kind: 'tactic',
    label: 'Tactics',
    cards: buildCardEntries(MULTI_ROUND_TACTIC_CARD_KEYS)
  }
]));
const activeCardGroup = computed(() => {
  return cardGroups.value.find((group) => group.kind === selectedCardKind.value)
    || cardGroups.value[0]
    || { kind: 'trayModifier', label: 'Tray Modifiers', cards: [] };
});
const formatCardDetail = (card) => {
  if (card.amount) {
    return `Value: ${card.amount}`;
  }
  if (card.modifier) {
    return `Modifier: ${card.modifier}`;
  }
  return card.effectType ? `Effect: ${card.effectType.replaceAll('_', ' ')}` : 'Card';
};
const formatHighScore = (score = 0) => {
  return Math.max(0, Math.round(Number(score || 0))).toLocaleString();
};
const formatScoreDetail = (score) => {
  if (!score?.score) {
    return 'No run scored';
  }

  const rounds = `${score.roundsCleared || 0}/${score.totalRounds || 0}`;
  return `${rounds} rounds · ${score.timeScore || 0} time · ${score.overScore || 0} over`;
};
const refreshHighScores = () => {
  highScores.value = readLocalMultiRoundHighScores();
};
const refreshDifficultyUnlocks = (event) => {
  difficultyUnlockState.value = event?.detail || readLocalMultiRoundDifficultyUnlockState();
  if (!isDifficultyUnlocked(selectedDifficulty.value)) {
    selectedDifficulty.value = getFirstUnlockedMultiRoundDifficulty(difficultyUnlockState.value);
  }
};
const refreshModifierUnlocks = (event) => {
  modifierUnlockState.value = event?.detail || readLocalModifierUnlockState();
  if (!personalModifierGroups.value.find((group) => group.tier === selectedPersonalTier.value)) {
    selectedPersonalTier.value = personalModifierGroups.value[0]?.tier || 'common';
  }
  if (!roundModifierGroups.value.find((group) => group.difficulty === selectedRoundDifficulty.value)) {
    selectedRoundDifficulty.value = roundModifierGroups.value[0]?.difficulty || 'easy';
  }
};

const isDifficultyUnlocked = (difficulty) => {
  return isMultiRoundDifficultyUnlocked(difficulty, difficultyUnlockState.value);
};

const selectDifficulty = (difficulty) => {
  if (!isDifficultyUnlocked(difficulty)) {
    return;
  }

  selectedDifficulty.value = difficulty;
};

const startMultiRound = () => {
  if (isExiting.value || !selectedDifficultyUnlocked.value) {
    return;
  }

  unlockNextDifficultyForStartedRun(selectedDifficulty.value);
  isExiting.value = true;
  window.setTimeout(() => {
    emit('singleplayer', {
      mode: 'multi_round',
      multiRoundDifficulty: selectedDifficulty.value,
      initialMultiRoundBackgroundPaletteKey: firstRoundBackgroundPaletteKey.value
    });
  }, 560);
};

const getControllerTargets = () => {
  if (!screenRoot.value) {
    return [];
  }

  return Array.from(screenRoot.value.querySelectorAll('button:not(:disabled)'))
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

const focusSelectedDifficulty = () => {
  const targets = getControllerTargets();
  const selectedDifficultyIndex = targets.findIndex((element) => element.dataset.difficulty === selectedDifficulty.value);
  setControllerFocus(selectedDifficultyIndex >= 0 ? selectedDifficultyIndex : 0);
};

const handleControllerKeyDown = (event) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    emit('type');
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

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    document.activeElement?.click();
  }
};

onMounted(() => {
  refreshHighScores();
  refreshDifficultyUnlocks();
  window.addEventListener('wordis:multi-round-high-scores-changed', refreshHighScores);
  window.addEventListener('wordis:multi-round-difficulty-unlocks-changed', refreshDifficultyUnlocks);
  window.addEventListener('wordis:modifier-unlocks-changed', refreshModifierUnlocks);
  window.addEventListener('keydown', handleControllerKeyDown);
  nextTick(focusSelectedDifficulty);
});

onBeforeUnmount(() => {
  window.removeEventListener('wordis:multi-round-high-scores-changed', refreshHighScores);
  window.removeEventListener('wordis:multi-round-difficulty-unlocks-changed', refreshDifficultyUnlocks);
  window.removeEventListener('wordis:modifier-unlocks-changed', refreshModifierUnlocks);
  window.removeEventListener('keydown', handleControllerKeyDown);
});
</script>

<style scoped>
.multi-round-shell {
  --bg-top: #ca6937;
  --bg-mid: #b63e3b;
  --bg-bottom: #341137;
  --bg-corner: #f39a54;
  --cream: #f7efe1;
  position: fixed;
  inset: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 28px;
  color: var(--cream);
}

.multi-round-frame {
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

.multi-round-frame.exiting {
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

.message-card {
  background: linear-gradient(180deg, rgba(148, 31, 70, 0.95), rgba(93, 18, 52, 0.88));
}

.score-section {
  border-radius: 30px;
  padding: 20px 22px;
  background: rgba(36, 11, 31, 0.72);
  border: 2px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 20px 50px rgba(38, 7, 22, 0.22);
}

.score-section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.score-section-header strong {
  font-size: 1rem;
}

.score-grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.score-card {
  min-height: 116px;
  padding: 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.score-card.active {
  border-color: rgba(111, 245, 221, 0.5);
  background: linear-gradient(180deg, rgba(93, 230, 203, 0.2), rgba(46, 179, 151, 0.26));
}

.score-card span,
.score-card small {
  display: block;
  color: rgba(247, 239, 225, 0.72);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.score-card strong {
  display: block;
  margin-top: 10px;
  font-size: 1.55rem;
  line-height: 1;
}

.score-card small {
  margin-top: 12px;
  line-height: 1.45;
  text-transform: none;
  letter-spacing: 0;
}

.reference-section {
  border-radius: 30px;
  padding: 24px 22px;
  background: rgba(36, 11, 31, 0.82);
  border: 2px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 20px 50px rgba(38, 7, 22, 0.22);
}

.reference-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.reference-toggle {
  margin-top: 18px;
  display: inline-flex;
  padding: 5px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.reference-toggle-button {
  cursor: pointer;
  border-radius: 999px;
  padding: 10px 14px;
  background: transparent;
  color: rgba(247, 239, 225, 0.68);
  font-family: inherit;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.reference-toggle-button.active {
  background: linear-gradient(180deg, rgba(93, 230, 203, 0.24), rgba(46, 179, 151, 0.38));
  color: var(--cream);
}

.modifier-grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.filter-chip {
  border: 1px solid rgba(255, 255, 255, 0.14);
  cursor: pointer;
  border-radius: 999px;
  padding: 10px 14px;
  color: var(--cream);
  font-family: inherit;
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.72;
}

.filter-chip.active {
  opacity: 1;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.18), 0 10px 24px rgba(0, 0, 0, 0.22);
}

.tier-group {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.tier-group .modifier-grid {
  margin-top: 0;
}

.tier-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.tier-heading strong {
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.tier-heading span {
  color: rgba(247, 239, 225, 0.7);
  font-size: 0.76rem;
}

.modifier-card {
  min-height: 150px;
  padding: 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.modifier-card-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.modifier-card strong {
  line-height: 1.25;
}

.modifier-card p {
  font-size: 0.84rem;
}

.modifier-card small {
  display: block;
  margin-top: 12px;
  color: rgba(247, 239, 225, 0.68);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.modifier-pill {
  flex: 0 0 auto;
  border-radius: 999px;
  padding: 5px 8px;
  background: rgba(111, 245, 221, 0.16);
  color: #9cf7e6;
  font-size: 0.64rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.modifier-card.tier-common,
.tier-heading.tier-common {
  background: linear-gradient(180deg, rgba(86, 142, 118, 0.3), rgba(42, 86, 72, 0.22));
  border-color: rgba(151, 229, 190, 0.28);
}

.modifier-card.tier-rare,
.tier-heading.tier-rare {
  background: linear-gradient(180deg, rgba(64, 118, 190, 0.34), rgba(37, 66, 137, 0.26));
  border-color: rgba(145, 192, 255, 0.34);
}

.modifier-card.tier-epic,
.tier-heading.tier-epic {
  background: linear-gradient(180deg, rgba(142, 79, 188, 0.36), rgba(91, 45, 128, 0.28));
  border-color: rgba(220, 169, 255, 0.38);
}

.tier-common .modifier-pill {
  background: rgba(151, 229, 190, 0.18);
  color: #a8f0c7;
}

.tier-rare .modifier-pill {
  background: rgba(145, 192, 255, 0.18);
  color: #afd0ff;
}

.tier-epic .modifier-pill {
  background: rgba(220, 169, 255, 0.18);
  color: #e8c2ff;
}

.round-card .modifier-pill {
  background: rgba(255, 223, 134, 0.16);
  color: #ffdf86;
}

.modifier-card.card-kind-trayModifier,
.tier-heading.card-kind-trayModifier {
  background: linear-gradient(180deg, rgba(68, 160, 138, 0.32), rgba(28, 92, 84, 0.26));
  border-color: rgba(142, 255, 222, 0.3);
}

.modifier-card.card-kind-tactic,
.tier-heading.card-kind-tactic {
  background: linear-gradient(180deg, rgba(168, 83, 111, 0.34), rgba(104, 34, 65, 0.28));
  border-color: rgba(255, 154, 184, 0.32);
}

.card-kind-trayModifier .modifier-pill {
  background: rgba(142, 255, 222, 0.18);
  color: #a6ffe5;
}

.card-kind-tactic .modifier-pill {
  background: rgba(255, 154, 184, 0.18);
  color: #ffb8ca;
}

.modifier-card.difficulty-easy,
.tier-heading.difficulty-easy {
  background: linear-gradient(180deg, rgba(80, 157, 124, 0.3), rgba(42, 96, 75, 0.24));
  border-color: rgba(140, 238, 196, 0.28);
}

.modifier-card.difficulty-medium,
.tier-heading.difficulty-medium {
  background: linear-gradient(180deg, rgba(194, 128, 52, 0.34), rgba(125, 72, 30, 0.26));
  border-color: rgba(255, 202, 124, 0.34);
}

.modifier-card.difficulty-hard,
.tier-heading.difficulty-hard {
  background: linear-gradient(180deg, rgba(179, 62, 83, 0.36), rgba(116, 32, 55, 0.3));
  border-color: rgba(255, 143, 163, 0.36);
}

.difficulty-easy .modifier-pill {
  background: rgba(140, 238, 196, 0.18);
  color: #a1f2cd;
}

.difficulty-medium .modifier-pill {
  background: rgba(255, 202, 124, 0.18);
  color: #ffd58d;
}

.difficulty-hard .modifier-pill {
  background: rgba(255, 143, 163, 0.18);
  color: #ffb1c0;
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

p,
.rules-list {
  margin: 12px 0 0;
  line-height: 1.6;
  opacity: 0.88;
}

.rules-list {
  padding-left: 20px;
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

.difficulty-chip.locked {
  cursor: not-allowed;
  filter: grayscale(1);
  opacity: 0.46;
}

.difficulty-chip small {
  display: block;
  margin-top: 5px;
  font-size: 0.56rem;
  letter-spacing: 0.1em;
}

.difficulty-chip:focus-visible,
.reference-toggle-button:focus-visible,
.filter-chip:focus-visible,
.arcade-button:focus-visible,
.back-button:focus-visible {
  outline: 4px solid rgba(130, 253, 238, 0.86);
  outline-offset: 3px;
  box-shadow:
    0 0 0 5px rgba(92, 25, 41, 0.38),
    0 16px 26px rgba(33, 10, 30, 0.28);
}

.stat-grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.stat-grid div {
  padding: 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.08);
}

.stat-grid strong,
.stat-grid span {
  display: block;
}

.stat-grid span {
  margin-top: 6px;
  font-size: 0.72rem;
  opacity: 0.72;
  text-transform: uppercase;
  letter-spacing: 0.08em;
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

.back-button {
  align-self: flex-start;
  background: rgba(52, 16, 36, 0.7);
  border: 2px solid rgba(255, 255, 255, 0.14);
}

@media (max-width: 960px) {
  .action-panel {
    grid-template-columns: 1fr;
  }

  .modifier-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .score-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .multi-round-shell {
    padding: 18px;
  }

  .arcade-button,
  .back-button {
    width: 100%;
    font-size: 0.78rem;
  }

  .modifier-grid {
    grid-template-columns: 1fr;
  }

  .score-grid {
    grid-template-columns: 1fr;
  }
}
</style>
