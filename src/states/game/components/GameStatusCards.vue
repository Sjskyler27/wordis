<template>
  <div class="bonus-card accent-blue" :class="{ 'machine-status-card': isBotMode }">
    <span class="bonus-kicker" v-if="!isMobile">Game mode</span>
    <strong v-if="!isMobile">{{ modeTitle }}</strong>
    <p v-if="isMultiplayer">
      <button type="button" class="room-code-button" @click="$emit('copy-room-code')">
        Room {{ roomCode }}
      </button>
      · {{ isHost ? 'Host lane' : 'Opponent lane' }}
    </p>
    <p>{{ modeSubtitle }}</p>
    <div v-if="isMultiRoundMode" class="round-modifier-panel">
      <span class="round-modifier-heading">Round Modifiers</span>
      <div class="round-modifier-list">
        <template v-if="activeRoundModifiers.length">
          <button
            v-for="modifier in activeRoundModifiers"
            :key="modifier.key"
            type="button"
            class="round-modifier-chip"
            :aria-label="`${modifier.label}: ${modifier.description}`"
          >
            <span>{{ modifier.label }}</span>
            <small>{{ modifier.description }}</small>
          </button>
        </template>
        <span v-else class="round-modifier-empty">No round modifiers</span>
      </div>
    </div>
  </div>

  <div class="bonus-card accent-red" :class="{ 'machine-status-card': isBotMode }">
    <span class="bonus-kicker">Info</span>
    <strong>{{ localMessage || statusHeadline }}</strong>
    <p v-if="isMultiplayer && !gameStarted">Waiting for opponent to connect</p>
    <p v-else-if="isTimedSoloMode">Timer ends the run, so play fast and bank points.</p>
    <p v-else-if="isMultiRoundMode">Clear the current target to advance the run.</p>
    <p v-else>Words must be 4 letters, larger words score bonus points and may gain cards. Only used letters are replaced.</p>
  </div>
</template>

<script setup>
defineEmits(['copy-room-code']);

defineProps({
  isMobile: {
    type: Boolean,
    default: false
  },
  isMultiplayer: {
    type: Boolean,
    default: false
  },
  roomCode: {
    type: String,
    default: ''
  },
  isHost: {
    type: Boolean,
    default: false
  },
  modeTitle: {
    type: String,
    required: true
  },
  modeSubtitle: {
    type: String,
    required: true
  },
  isBotMode: {
    type: Boolean,
    default: false
  },
  isMultiRoundMode: {
    type: Boolean,
    default: false
  },
  activeRoundModifiers: {
    type: Array,
    default: () => []
  },
  localMessage: {
    type: String,
    default: ''
  },
  statusHeadline: {
    type: String,
    required: true
  },
  gameStarted: {
    type: Boolean,
    default: false
  },
  isTimedSoloMode: {
    type: Boolean,
    default: false
  }
});
</script>

<style scoped lang="scss">
.bonus-card {
  border-radius: 28px;
  padding: 22px 18px;
  min-height: 156px;
  background: rgba(68, 20, 46, 0.9);
  border: 2px solid rgba(255, 255, 255, 0.12);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  position: relative;
  overflow: visible;
}

.bonus-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(circle 60px at calc(100% + 30px) calc(100% + 30px), rgba(255, 255, 255, 0.08) 0 99%, transparent 100%);
  pointer-events: none;
  z-index: 0;
}

.bonus-kicker {
  display: inline-block;
  margin-bottom: 10px;
  font-size: 0.74rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  opacity: 0.7;
}

.bonus-card strong,
.bonus-card p {
  display: block;
  position: relative;
  z-index: 1;
}

.bonus-card strong {
  font-size: 1.35rem;
  line-height: 1.1;
}

.bonus-card p {
  margin: 10px 0 0;
  opacity: 0.85;
}

.round-modifier-panel {
  position: relative;
  z-index: 1;
  margin-top: 16px;
  padding: 12px;
  border-radius: 16px;
  background: rgba(28, 8, 28, 0.22);
  border: 1px solid rgba(255, 236, 187, 0.22);
}

.round-modifier-heading {
  display: block;
  margin-bottom: 10px;
  font-size: 0.68rem;
  line-height: 1;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 244, 218, 0.78);
}

.round-modifier-list {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 10px;
}

.round-modifier-chip,
.round-modifier-empty {
  appearance: none;
  position: relative;
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 8px 11px;
  border-radius: 999px;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 900;
  line-height: 1;
  cursor: help;
  background: linear-gradient(180deg, rgba(255, 210, 112, 0.28), rgba(164, 48, 68, 0.26));
  border: 1px solid rgba(255, 236, 187, 0.38);
  color: #fff4d4;
  box-shadow: 0 8px 16px rgba(34, 8, 26, 0.18);
}

.round-modifier-chip small {
  position: absolute;
  left: 0;
  top: calc(100% + 8px);
  width: min(260px, 72vw);
  padding: 9px 10px;
  border-radius: 10px;
  background: rgba(35, 10, 31, 0.96);
  border: 1px solid rgba(255, 236, 187, 0.24);
  color: rgba(255, 248, 236, 0.92);
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.35;
  text-align: left;
  opacity: 0;
  pointer-events: none;
  transform: translateY(-4px);
  transition: opacity 150ms ease, transform 150ms ease;
  box-shadow: 0 14px 28px rgba(20, 6, 14, 0.28);
}

.round-modifier-chip:hover small,
.round-modifier-chip:focus-visible small {
  opacity: 1;
  transform: translateY(0);
}

.round-modifier-empty {
  cursor: default;
  opacity: 0.72;
}

.room-code-button {
  appearance: none;
  border: none;
  background: rgba(255, 255, 255, 0.12);
  color: inherit;
  cursor: pointer;
  border-radius: 999px;
  padding: 5px 10px;
  font: inherit;
  font-weight: 700;
  margin-right: 6px;
}

.accent-blue {
  border-radius: 28px 68px;
  background: linear-gradient(180deg, rgba(58, 111, 208, 0.9), rgba(49, 78, 170, 0.82));
}

.accent-red {
  min-height: 106px;
  border-radius: 28px 68px;
  background: linear-gradient(180deg, rgba(164, 38, 68, 0.95), rgba(105, 22, 54, 0.88));
}

.bonus-card.machine-status-card {
  background: rgba(25, 38, 51, 0.9);
  border-color: rgba(166, 230, 244, 0.18);
}

.bonus-card.machine-status-card.accent-red {
  background: rgba(123,133,133, 0.95);
  border-color: rgba(166, 230, 244, 0.18);
}

.bonus-card.machine-status-card {
  box-shadow:
    inset 0 1px 0 rgba(214, 248, 255, 0.1),
    0 14px 24px rgba(6, 18, 28, 0.2);
}

.bonus-card.machine-status-card::after {
  width: auto;
  height: auto;
  border-radius: 0;
  background: url('/src/assets/images/small-cog.png') calc(100% + 18px) calc(100% + 24px) / 112px 112px no-repeat;
  opacity: 0.24;
  filter:
    invert(84%)
    sepia(9%)
    saturate(369%)
    hue-rotate(169deg)
    brightness(1.12)
    contrast(1.18);
}

@media (max-width: 1000px) {
  .accent-blue {
    height: 100px;
  }
}
</style>
