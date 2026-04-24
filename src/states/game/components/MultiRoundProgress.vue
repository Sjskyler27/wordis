<template>
  <nav class="multi-round-progress" aria-label="Multi-round progress">
    <div class="round-track">
      <div class="round-track-fill" :style="{ width: `${progressPercent}%` }"></div>
    </div>
    <ol class="round-list">
      <li
        v-for="round in rounds"
        :key="round.id"
        class="round-step"
        :class="{
          complete: round.isComplete,
          current: round.isCurrent,
          challenge: round.isChallenge
        }"
      >
        <button
          type="button"
          class="round-marker"
          :aria-label="getRoundLabel(round)"
        >
          <span class="round-number">{{ round.number }}</span>
        </button>
        <div v-if="round.isChallenge && round.visibleModifierKeys.length" class="round-tooltip">
          <strong>{{ round.label }}</strong>
          <span
            v-for="modifierKey in round.visibleModifierKeys"
            :key="`${round.id}-${modifierKey}`"
          >
            {{ formatModifierKey(modifierKey) }}
          </span>
        </div>
      </li>
    </ol>
  </nav>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  rounds: {
    type: Array,
    default: () => []
  }
});

const progressPercent = computed(() => {
  if (props.rounds.length <= 1) {
    return props.rounds[0]?.isComplete ? 100 : 0;
  }

  const currentIndex = props.rounds.findIndex((round) => round.isCurrent);
  const completedCount = props.rounds.filter((round) => round.isComplete).length;
  const progressIndex = currentIndex === -1 ? completedCount : currentIndex;
  return Math.max(0, Math.min(100, (progressIndex / (props.rounds.length - 1)) * 100));
});

const formatModifierKey = (modifierKey = '') => {
  return modifierKey
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const getRoundLabel = (round) => {
  const status = round.isComplete ? 'complete' : round.isCurrent ? 'current' : 'upcoming';
  const challengeText = round.isChallenge ? ' challenge round' : '';
  return `${round.label}${challengeText}, ${status}`;
};
</script>

<style scoped>
.multi-round-progress {
  position: relative;
  width: min(760px, 100%);
  margin: 0 auto 16px;
  padding: 12px 10px 18px;
}

.round-track {
  position: absolute;
  left: 34px;
  right: 34px;
  top: 29px;
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  box-shadow: inset 0 1px 4px rgba(42, 7, 25, 0.32);
  overflow: hidden;
}

.round-track-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #ff5548, #ffb05f);
  box-shadow: 0 0 14px rgba(255, 96, 72, 0.45);
  transition: width 420ms ease;
}

.round-list {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(42px, 1fr));
  gap: 10px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.round-step {
  position: relative;
  display: flex;
  justify-content: center;
}

.round-marker {
  width: 38px;
  height: 38px;
  border: 1px solid rgba(255, 255, 255, 0.36);
  border-radius: 50%;
  color: #fff7e8;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.24), rgba(92, 74, 89, 0.64));
  box-shadow: inset 0 2px 8px rgba(255, 255, 255, 0.14), 0 8px 18px rgba(37, 8, 24, 0.28);
  cursor: default;
  transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.round-step.challenge .round-marker {
  border-radius: 8px;
  transform: rotate(45deg);
  background: linear-gradient(180deg, rgba(255, 185, 112, 0.86), rgba(172, 38, 56, 0.82));
}

.round-step.challenge .round-number {
  display: inline-block;
  transform: rotate(-45deg);
}

.round-step.complete .round-marker {
  border-color: rgba(255, 220, 139, 0.7);
  background: linear-gradient(180deg, rgba(255, 210, 110, 0.9), rgba(203, 99, 57, 0.86));
}

.round-step.current .round-marker {
  border-color: rgba(255, 255, 255, 0.82);
  box-shadow: inset 0 2px 8px rgba(255, 255, 255, 0.18), 0 0 0 4px rgba(255, 126, 84, 0.22), 0 10px 20px rgba(37, 8, 24, 0.32);
}

.round-number {
  font-size: 0.8rem;
  font-weight: 900;
}

.round-tooltip {
  position: absolute;
  top: 48px;
  left: 50%;
  min-width: 150px;
  padding: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #fff7e8;
  background: rgba(57, 16, 38, 0.96);
  box-shadow: 0 14px 28px rgba(20, 6, 14, 0.28);
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, -4px);
  transition: opacity 160ms ease, transform 160ms ease;
}

.round-tooltip strong,
.round-tooltip span {
  display: block;
  font-size: 0.72rem;
}

.round-marker:hover + .round-tooltip,
.round-marker:focus-visible + .round-tooltip {
  opacity: 1;
  transform: translate(-50%, 0);
}

@media (max-width: 700px) {
  .multi-round-progress {
    padding-inline: 0;
  }

  .round-track {
    left: 24px;
    right: 24px;
  }

  .round-list {
    gap: 6px;
  }

  .round-marker {
    width: 32px;
    height: 32px;
  }
}
</style>
