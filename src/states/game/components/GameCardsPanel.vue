<template>
  <div class="bonus-card accent-purple">
    <span v-if="!isMobile" class="bonus-kicker">Cards </span>
    <strong>{{ cardSummary }}</strong>
    <span v-if="activeBoonCard">
      {{ activeBoonCard.label }} is ready. Select a tile!
    </span>
    <span v-else> &#x200b;</span>
    <div class="card-hand">
      <button
        v-for="(cardGroup, index) in groupedBoonCards"
        :key="cardGroup.key"
        type="button"
        class="action-card"
        :style="getCardStyle(cardGroup.card)"
        :class="{
          armed: cardGroup.cards.some((card) => activeBoonCardId === card.id),
          'action-card-controller-focus': controllerRegion === 'cards' && controllerCardCursorIndex === index
        }"
        :disabled="cardControlsDisabled"
        :data-controller-card="index"
        @click="$emit('select-boon', cardGroup.card)"
      >
        <span class="action-card-type">Boon</span>
        <span v-if="cardGroup.count > 1" class="action-card-count">x{{ cardGroup.count }}</span>
        <strong>{{ cardGroup.card.label }}</strong>
        <span>{{ cardGroup.card.description }}</span>
        <ControllerButtonHint
          v-if="controllerRegion === 'cards' && controllerCardCursorIndex === index"
          action-key="select"
          :controller-mapping="controllerMapping"
          :controller-connected="isControllerConnected"
          :size="26"
        />
      </button>
      <button
        v-if="attacksEnabled"
        v-for="(cardGroup, attackIndex) in groupedAttackCards"
        :key="cardGroup.key"
        type="button"
        class="action-card"
        :style="getCardStyle(cardGroup.card)"
        :class="{
          'action-card-controller-focus': controllerRegion === 'cards' && controllerCardCursorIndex === groupedBoonCards.length + attackIndex
        }"
        :disabled="cardControlsDisabled"
        :data-controller-card="groupedBoonCards.length + attackIndex"
        @click="$emit('use-attack', cardGroup.card)"
      >
        <span class="action-card-type">Attack</span>
        <span v-if="cardGroup.count > 1" class="action-card-count">x{{ cardGroup.count }}</span>
        <strong>{{ cardGroup.card.label }}</strong>
        <span>{{ cardGroup.card.description }}</span>
        <ControllerButtonHint
          v-if="controllerRegion === 'cards' && controllerCardCursorIndex === groupedBoonCards.length + attackIndex"
          action-key="select"
          :controller-mapping="controllerMapping"
          :controller-connected="isControllerConnected"
          :size="26"
        />
      </button>
    </div>
  </div>
</template>

<script setup>
import ControllerButtonHint from './ControllerButtonHint.vue';

defineEmits(['select-boon', 'use-attack']);

defineProps({
  isMobile: Boolean,
  cardSummary: {
    type: String,
    default: ''
  },
  activeBoonCard: {
    type: Object,
    default: null
  },
  groupedBoonCards: {
    type: Array,
    default: () => []
  },
  groupedAttackCards: {
    type: Array,
    default: () => []
  },
  attacksEnabled: Boolean,
  cardControlsDisabled: Boolean,
  activeBoonCardId: {
    type: String,
    default: null
  },
  controllerRegion: {
    type: String,
    default: ''
  },
  controllerCardCursorIndex: {
    type: Number,
    default: 0
  },
  controllerMapping: {
    type: Object,
    default: () => ({})
  },
  isControllerConnected: {
    type: Boolean,
    default: false
  }
});

const getCardStyle = (card) => {
  const ui = card?.ui || {};
  return {
    '--card-glow': ui.cardGlow || 'rgba(255, 255, 255, 0.16)',
    '--card-edge': ui.cardEdge || 'rgba(255, 255, 255, 0.24)',
    '--card-pattern': ui.cardPattern || 'rgba(255, 255, 255, 0.08)',
    '--card-background': ui.cardBackground || 'linear-gradient(180deg, rgba(119, 206, 113, 0.96), rgba(63, 129, 84, 0.96))',
    '--card-badge-background': ui.cardBadgeBackground || 'rgba(24, 8, 22, 0.26)'
  };
};
</script>

<style scoped lang="scss">
.card-hand {
  display: grid;
  gap: 10px;
  margin-top: 12px;
  position: relative;
  z-index: 1;
  max-height: 450px;
  overflow-y: auto;
}
.action-card > * {
  pointer-events: none;
}

.action-card {
  --card-glow: rgba(255, 255, 255, 0.16);
  --card-edge: rgba(255, 255, 255, 0.22);
  --card-pattern: rgba(255, 255, 255, 0.08);
  --card-background: linear-gradient(180deg, rgba(119, 206, 113, 0.96), rgba(63, 129, 84, 0.96));
  --card-badge-background: rgba(24, 8, 22, 0.26);
  --card-ink: #fff7ee;
  appearance: none;
  border: 1px solid var(--card-edge);
  cursor: pointer;
  width: 100%;
  max-width: 280px;
  text-align: left;
  display: grid;
  gap: 8px;
  padding: 14px 14px 15px;
  border-radius: 22px;
  color: var(--card-ink);
  font: inherit;
  position: relative;
  overflow: hidden;
  background: var(--card-background);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    inset 0 -3px 0 rgba(39, 11, 25, 0.28),
    0 10px 18px rgba(30, 8, 34, 0.18);
  transition: transform 140ms ease, box-shadow 140ms ease, filter 140ms ease, border-color 140ms ease;
}

.action-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 18% 20%, var(--card-glow) 0, transparent 36%),
    linear-gradient(135deg, var(--card-pattern) 0%, transparent 35%, var(--card-pattern) 100%);
  opacity: 0.9;
  pointer-events: none;
}

.action-card::after {
  content: '';
  position: absolute;
  inset: 7px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.01));
  pointer-events: none;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    inset 0 -3px 0 rgba(39, 11, 25, 0.32),
    0 14px 22px rgba(30, 8, 34, 0.24);
  border-color: rgba(255, 236, 187, 0.38);
}

.action-card:disabled {
  cursor: default;
  opacity: 0.52;
  filter: saturate(0.65);
}

.action-card:disabled:hover {
  transform: none;
  border-color: var(--card-edge);
}

.action-card strong {
  position: relative;
  z-index: 1;
  font-size: 1.2rem;
  line-height: 1.05;
  text-shadow: 0 1px 0 rgba(48, 18, 8, 0.28);
}

.action-card span:last-child {
  position: relative;
  z-index: 1;
  font-size: 0.99rem;
  line-height: 1.35;
  color: rgba(255, 248, 236, 0.84);
}

.action-card-type {
  position: relative;
  z-index: 1;
  justify-self: start;
  padding: 4px 8px 3px;
  border-radius: 999px;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: rgba(255, 248, 236, 0.92);
  background: var(--card-badge-background);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.action-card-count {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  min-width: 44px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  border-radius: 999px;
  border: 2px solid rgba(255, 248, 220, 0.9);
  background:
    linear-gradient(180deg, rgba(246, 238, 206, 0.98), rgba(252, 194, 123, 0.826));
  color: #35111f;
  font-size: 1.25rem;
  font-weight: 900;
  line-height: 1;
  text-shadow: none;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    0 4px 0 rgba(66, 17, 30, 0.34),
    0 8px 16px rgba(20, 6, 18, 0.28);
}

.action-card.armed {
  transform: translateY(-2px);
  box-shadow:
    inset 0 0 0 3px rgba(255, 232, 160, 0.8),
    inset 0 2px 0 rgba(255, 255, 255, 0.2),
    inset 0 -3px 0 rgba(39, 11, 25, 0.32),
    0 16px 24px rgba(30, 8, 34, 0.28);
  border-color: rgba(255, 236, 187, 0.78);
}

:global(.side-stack.side-stack-drawer) .action-card {
  max-width: none;
}


@media (max-width: 1000px) {
.card-hand{
  max-height: 95%;
}
}
</style>
