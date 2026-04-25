<template>
  <div class="multi-round-shell">
    <div id="background-layer">
      <div class="shape-layer layer-far"></div>
      <div class="shape-layer layer-near"></div>
    </div>

    <main class="multi-round-frame">
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
              :class="{ active: selectedDifficulty === difficulty.value }"
              @click="selectedDifficulty = difficulty.value"
            >
              {{ difficulty.label }}
            </button>
          </div>
          <button class="arcade-button" @click="startMultiRound">Start Multi-Round</button>
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

      <!-- <section class="message-card">
        <span class="kicker">Rewards</span>
        <strong>Personal modifiers are not cards.</strong>
        <p>They stack across the run and can change tile values, modifier odds, word-length scoring, or grant immediate boons and time cards.</p>
      </section> -->
      <section class="reference-section">
        <div class="reference-header">
          <span class="kicker">Reference</span>
          <h2>{{ selectedReferenceType === 'personal' ? 'Possible Upgrades' : 'Possible Round Modifiers' }}</h2>
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
      </section>

      <button class="back-button" @click="$emit('type')">Back</button>
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { PERSONAL_MODIFIER_DEFINITIONS } from './multiround/personal-modifier-definitions.js';
import { ROUND_MODIFIER_DEFINITIONS } from './multiround/round-modifier-definitions.js';

const emit = defineEmits(['singleplayer', 'type']);
const selectedDifficulty = ref(localStorage.getItem('multiRoundDifficulty') || 'normal');
const selectedReferenceType = ref('personal');
const selectedPersonalTier = ref('common');
const selectedRoundDifficulty = ref('easy');
const difficulties = [
  {
    value: 'easy',
    label: 'Easy',
    rounds: 7,
    challengeRounds: 3,
    pace: 'Lenient',
    description: 'A shorter run with lower targets, more time, and fewer modifiers.',
    summary: 'Best for learning how time bonuses, reward choices, and challenge rounds fit together.'
  },
  {
    value: 'normal',
    label: 'Normal',
    rounds: 10,
    challengeRounds: 4,
    pace: 'Steady',
    description: 'A balanced run with moderate targets and a controlled modifier curve.',
    summary: 'Best when you know the mode and want room to build a focused upgrade path.'
  },
  {
    value: 'hard',
    label: 'Hard',
    rounds: 13,
    challengeRounds: 5,
    pace: 'Punishing',
    description: 'The original full-length track with higher targets and heavier challenge pressure.',
    summary: 'Best for strong runs where every reward choice and saved second matters.'
  }
];

const selectedDifficultyDetails = computed(() => {
  return difficulties.find((difficulty) => difficulty.value === selectedDifficulty.value) || difficulties[1];
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
const personalModifierGroups = computed(() => {
  const modifiers = Object.values(PERSONAL_MODIFIER_DEFINITIONS);
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
  const modifiers = Object.values(ROUND_MODIFIER_DEFINITIONS).filter((modifier) => !modifier.force_test);
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

const startMultiRound = () => {
  emit('singleplayer', {
    mode: 'multi_round',
    multiRoundDifficulty: selectedDifficulty.value
  });
};
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

#background-layer {
  position: fixed;
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

.multi-round-frame {
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
}
</style>
