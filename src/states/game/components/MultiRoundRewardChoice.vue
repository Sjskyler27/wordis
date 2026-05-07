<template>
  <div class="reward-choice-overlay">
    <section class="reward-choice-panel animated-slide-up">
      <span class="reward-kicker">Round Complete</span>
      <strong>{{ choiceTitle }}</strong>
      <div v-if="upcomingRound" class="upcoming-round-preview">
        <span class="upcoming-round-kicker">Next Round</span>
        <strong>{{ upcomingRound.label }}</strong>
        <div class="upcoming-round-modifiers">
          <template v-if="upcomingRound.visibleModifierKeys?.length">
            <span
              v-for="modifierKey in upcomingRound.visibleModifierKeys"
              :key="`${upcomingRound.id}-${modifierKey}`"
              class="upcoming-round-modifier"
            >
              {{ getModifierLabel(modifierKey) }}
            </span>
          </template>
          <span v-else class="upcoming-round-empty">No round modifiers</span>
        </div>
        <button
          v-if="canRerollRoundModifiers"
          type="button"
          class="reroll-round-button"
          @click="$emit('reroll-round-modifiers')"
        >
          Reroll round modifiers
        </button>
      </div>
      <div class="reward-choice-grid">
        <button
          v-for="(reward, index) in rewards"
          :key="reward.key"
          type="button"
          class="reward-card"
          :class="[reward.tier, { 'reward-card-controller-focus': controllerFocusedRewardIndex === index }]"
          :data-controller-reward="index"
          @click="$emit('choose', reward.key)"
        >
          <span>{{ reward.tier }}</span>
          <strong>{{ reward.label }}</strong>
          <p>{{ reward.description }}</p>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { getRoundModifierDefinition } from '../multiround/round-modifier-definitions.js';

const props = defineProps({
  rewards: {
    type: Array,
    required: true
  },
  upcomingRound: {
    type: Object,
    default: null
  },
  controllerFocusedRewardIndex: {
    type: Number,
    default: -1
  },
  selectionTotal: {
    type: Number,
    default: 1
  },
  selectionsRemaining: {
    type: Number,
    default: 1
  },
  selectionsChosen: {
    type: Number,
    default: 0
  },
  canRerollRoundModifiers: {
    type: Boolean,
    default: false
  }
});

defineEmits(['choose', 'reroll-round-modifiers']);

const formatModifierKey = (modifierKey = '') => {
  return modifierKey
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const getModifierLabel = (modifierKey = '') => {
  return getRoundModifierDefinition(modifierKey)?.label || formatModifierKey(modifierKey);
};

const choiceTitle = computed(() => {
  const selectionTotal = Math.max(1, Number(props.selectionTotal) || 1);
  if (selectionTotal <= 1) {
    return 'Choose a modifier';
  }

  const remaining = Math.max(0, Number(props.selectionsRemaining) || 0);
  const chosen = Math.max(0, Number(props.selectionsChosen) || 0);
  return `Select ${selectionTotal} modifiers (${chosen}/${selectionTotal}, ${remaining} left)`;
});
</script>

<style scoped>
.reward-choice-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--layer-reward-modal, 50);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.reward-choice-scrim {
  position: absolute;
  inset: 0;
  border-radius: 30px;
  background: rgba(24, 8, 24, 0.72);
  backdrop-filter: blur(4px);
}

.reward-choice-panel {
  position: fixed;
  max-height: 40%;
  height: 40%;
  bottom: 20%;
  z-index: calc(var(--layer-reward-modal, 50) + 1);
  visibility: hidden;
  width: min(100%, 820px);
  padding: 100px 80px;
  border-radius: 24px;
  color: #fff7e8;
  background: rgba(72, 22, 48, 0.96);
  border: 2px solid rgba(255, 220, 144, 0.22);
  box-shadow: 0 24px 50px rgba(20, 6, 18, 0.34);
  pointer-events: auto;

  overflow: hidden;
  overflow-y: auto;
}

.reward-kicker {
  display: inline-block;
  font-size: 0.72rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  opacity: 0.76;
}

.reward-choice-panel > strong {
  display: block;
  margin-top: 10px;
  color: #ffd265;
  font-size: 1.5rem;
}

.reward-choice-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
  overflow: hidden;
  overflow-y: auto;
  padding: 16px;
}

.upcoming-round-preview {
  margin-top: 18px;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(31, 10, 25, 0.52);
  border: 1px solid rgba(255, 220, 144, 0.14);
}

.upcoming-round-kicker {
  display: inline-block;
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.72;
}

.upcoming-round-preview strong {
  display: block;
  margin-top: 6px;
  font-size: 1rem;
  color: #fff0c2;
}

.upcoming-round-modifiers {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.upcoming-round-modifier,
.upcoming-round-empty {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  font-size: 0.76rem;
}

.reroll-round-button {
  appearance: none;
  margin-top: 12px;
  min-height: 34px;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 220, 144, 0.3);
  background: rgba(255, 202, 103, 0.14);
  color: #ffe3a3;
  cursor: pointer;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 800;
}

.reroll-round-button:hover,
.reroll-round-button:focus-visible {
  background: rgba(255, 202, 103, 0.22);
}

.reward-card {
  appearance: none;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 18px;
  min-height: 190px;
  padding: 16px;
  text-align: left;
  color: #fff7e8;
  cursor: pointer;
  font: inherit;
  background: linear-gradient(180deg, rgba(76, 156, 138, 0.96), rgba(43, 92, 98, 0.94));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 14px 24px rgba(20, 6, 18, 0.22);
  transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
}

.reward-card.rare {
  background: linear-gradient(180deg, rgba(82, 136, 215, 0.96), rgba(50, 62, 148, 0.94));
}

.reward-card.epic {
  background: linear-gradient(180deg, rgba(215, 151, 68, 0.98), rgba(142, 62, 72, 0.96));
}

.reward-card:hover,
.reward-card:focus-visible {
  transform: translateY(-3px);
 }



.reward-card span {
  display: inline-block;
  font-size: 0.66rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.76;
}

.reward-card strong {
  display: block;
  margin-top: 10px;
  font-size: 1.1rem;
  color: #fff2bd;
}

.reward-card p {
  margin: 12px 0 0;
  line-height: 1.42;
  opacity: 0.86;
}

@media (max-width: 1000px) {

  .reward-choice-panel {
    padding: 20px;
    width: 60%;
    max-height: 70%;
    min-height: 70%;
    overflow-y: auto;
    bottom: 10%;
  }


}
</style>
