<template>
  <section
    class="lane"
    :class="{
      'lane-burst': burstTier === 'burst',
      'lane-burst-epic': burstTier === 'epic'
    }"
  >
    <div class="lane-header">
      <div>
        <p class="lane-label">{{ label }} </p>
        <h2>{{ submittedWord || 'Waiting for a word...' }} <strong v-if="submittedWord">+ {{ lastWordScore }}</strong></h2>
      </div>
    </div>

    <div class="rack-grid">
      <div v-for="(tile, index) in tiles" :key="`${side}-slot-${index}`" class="rack-slot">
        <Transition name="rack-tile" mode="out-in">
          <button
            :key="tile.id"
            type="button"
            class="tile"
            :class="{
              opponent: side === 'opponent',
              active: isActive,
              'tile-in-use': selectedTileIds.has(tile.id),
              'tile-saved': savedTileIds.has(tile.id),
              'tile-locked': tile.locked,
              'tile-must-alert': mustAlertIds.has(tile.id)
            }"
            :style="getTileStyle(tile)"
            @click="$emit('tile-click', tile)"
          >
            <span v-if="!getModifierUi(tile.status).hideBadge && tile.status !== 'normal'" class="tile-modifier" :style="getBadgeStyle(tile)">
              {{ getModifierBadge(tile) }}
            </span>
            <span class="tile-score">{{ tileScore(tile) }}</span>
            <span class="tile-letter">{{ tile.letter }}</span>
          </button>
        </Transition>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, watch } from 'vue';
import { getModifierBadge, getModifierUi, tileScore } from '../tile-logic.js';

const props = defineProps({
  side: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  submittedWord: {
    type: String,
    default: ''
  },
  score: {
    type: Number,
    required: true
  },
  tiles: {
    type: Array,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  selectedTileIds: {
    type: Object,
    required: true
  },
  savedTileIds: {
    type: Object,
    required: true
  },
  mustAlertIds: {
    type: Object,
    default: () => new Set()
  },
  lastWordScore: {
    type: Number,
    required: false
  },
  burstPulse: {
    type: Number,
    default: 0
  }
});

defineEmits(['tile-click']);

const getTileStyle = (tile) => {
  const ui = getModifierUi(tile.status);

  return {
    '--tile-bg': ui.tileBackground,
    '--tile-shadow': ui.tileShadow,
    '--tile-hover-shadow': ui.tileHoverShadow || ui.tileShadow,
    '--tile-focus-shadow': ui.tileFocusShadow || ui.tileShadow,
    '--tile-text-color': ui.textColor
  };
};

const getBadgeStyle = (tile) => {
  const ui = getModifierUi(tile.status);

  return {
    background: ui.badgeBackground,
    color: ui.badgeColor
  };
};

const burstTier = ref('');
let burstTimeoutId = null;

watch(() => [props.burstPulse, props.lastWordScore], ([nextPulse]) => {
  if (!nextPulse) {
    return;
  }

  if (!props.lastWordScore || props.lastWordScore < 18) {
    return;
  }

  window.clearTimeout(burstTimeoutId);
  burstTier.value = '';

  requestAnimationFrame(() => {
    burstTier.value = props.lastWordScore >= 32 ? 'epic' : 'burst';
    burstTimeoutId = window.setTimeout(() => {
      burstTier.value = '';
    }, props.lastWordScore >= 32 ? 1200 : 850);
  });
});
</script>

<style scoped>
.lane {
  position: relative;
  border-radius: 28px;
  padding: 20px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02)),
    rgba(72, 17, 38, 0.35);
  border: 2px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: box-shadow 180ms ease, transform 180ms ease;
}

.lane::after {
  content: '';
  position: absolute;
  inset: -12px;
  border-radius: 34px;
  pointer-events: none;
  opacity: 0;
  transform: scale(0.96);
}

.lane-burst {
  animation: lane-burst 820ms ease-out;
}

.lane-burst-epic {
  animation: lane-burst-epic 1180ms ease-out;
}

.lane-burst::after {
  animation: lane-flare 820ms ease-out;
  background:
    radial-gradient(circle at 50% 50%, rgba(255, 222, 145, 0.34) 0%, rgba(255, 182, 93, 0.18) 42%, rgba(255, 182, 93, 0) 72%);
}

.lane-burst-epic::after {
  animation: lane-flare-epic 1180ms ease-out;
  background:
    radial-gradient(circle at 50% 50%, rgba(125, 255, 227, 0.34) 0%, rgba(95, 240, 214, 0.2) 42%, rgba(95, 240, 214, 0) 72%);
}

.lane-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.lane-label {
  margin: 0 0 6px;
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  opacity: 0.72;
}

.lane-header h2 {
  margin: 0;
  font-size: clamp(1.45rem, 2.8vw, 2.4rem);
  line-height: 1;
  word-break: break-word;
}



.rack-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  max-width: 530px;
}

.rack-slot {
  min-height: 94px;
}

.tile {
  appearance: none;
  border: none;
  cursor: pointer;
  min-height: 94px;
  min-width: 94px;
  max-width: 106px;
  width: 100%;
  border-radius: 16px;
  background: var(--tile-bg, linear-gradient(180deg, #fffef8 0%, #f2ebe0 70%, #d9cec0 100%));
  color: var(--tile-text-color, #1c1930);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--tile-shadow, inset 0 -4px 0 rgba(0, 0, 0, 0.12), 0 10px 18px rgba(45, 10, 24, 0.16));
  transition: transform 140ms ease, box-shadow 140ms ease;
  padding: 15px;
  will-change: transform, opacity;
}

.tile:hover {
  transform: translateY(-2px);
  box-shadow: var(--tile-hover-shadow, inset 0 -4px 0 rgba(0, 0, 0, 0.12), 0 14px 20px rgba(45, 10, 24, 0.24));
}

.tile:focus-visible {
  outline: 3px solid rgba(255, 202, 103, 0.85);
  outline-offset: 2px;
  transform: translateY(-2px);
  box-shadow: var(--tile-focus-shadow, inset 0 -4px 0 rgba(0, 0, 0, 0.12), 0 0 0 4px rgba(92, 25, 41, 0.45), 0 14px 20px rgba(45, 10, 24, 0.24));
}

.tile.active {
  outline: 3px solid rgba(255, 202, 103, 0.55);
}

.tile.opponent.active {
  outline-color: rgba(75, 199, 176, 0.5);
}

.tile.opponent:focus-visible {
  outline-color: rgba(75, 199, 176, 0.85);
}

.tile-in-use {
  box-shadow:
    inset 0 0 0 9999px rgba(0, 0, 0, 0.18), /* soft dark overlay */
    inset 0 4px 10px rgba(38, 20, 12, 0.32),
    inset 0 -2px 0 rgba(255, 255, 255, 0.18);
  transform: translateY(2px) scale(0.98);
}

.tile-in-use:hover,
.tile-in-use:focus-visible {
  box-shadow:
    inset 0 0 0 9999px rgba(0, 0, 0, 0.08), /* soft dark overlay */
    inset 0 4px 10px rgba(38, 20, 12, 0.22),
    inset 0 -2px 0 rgba(255, 255, 255, 0.18);
  transform: translateY(2px) scale(0.98);
  transform: translateY(1px) scale(0.98);
}

.tile-locked {
  cursor: not-allowed;
  filter: saturate(0.76);
}

.tile-saved:not(.tile-in-use) {
  box-shadow:
    inset 0 0 0 3px rgba(95, 224, 199, 0.72),
    inset 0 0 0 8px rgba(95, 224, 199, 0.14),
    var(--tile-shadow, inset 0 -4px 0 rgba(0, 0, 0, 0.12), 0 10px 18px rgba(45, 10, 24, 0.16));
  filter: saturate(0.92) brightness(0.98);
}

.tile-saved:not(.tile-in-use)::after {
  content: 'SAVE';
  position: absolute;
  bottom: 8px;
  left: 10px;
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(88, 206, 186, 0.9);
  color: #153233;
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  box-shadow: 0 4px 10px rgba(18, 57, 53, 0.2);
}

.tile-must-alert {
  animation: must-tile-flash 520ms ease 2;
}

@keyframes must-tile-flash {
  0%,
  100% {
    box-shadow: var(--tile-shadow, inset 0 -4px 0 rgba(0, 0, 0, 0.12), 0 10px 18px rgba(45, 10, 24, 0.16));
    filter: saturate(1);
  }
  40% {
    box-shadow:
      inset 0 0 0 3px rgba(255, 247, 180, 0.92),
      0 0 0 5px rgba(255, 205, 120, 0.28),
      0 0 24px rgba(255, 226, 141, 0.68),
      var(--tile-shadow, inset 0 -4px 0 rgba(0, 0, 0, 0.12), 0 10px 18px rgba(45, 10, 24, 0.16));
    filter: saturate(1.18) brightness(1.08);
  }
}

@keyframes lane-burst {
  0%,
  100% {
    transform: translateY(0);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.12),
      0 0 0 rgba(255, 208, 120, 0);
  }
  35% {
    transform: translateY(-2px);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.16),
      0 0 30px rgba(255, 208, 120, 0.24),
      0 0 0 2px rgba(255, 208, 120, 0.24);
  }
}

@keyframes lane-flare {
  0%,
  100% {
    opacity: 0;
    transform: scale(0.96);
  }
  35% {
    opacity: 1;
    transform: scale(1.02);
  }
}

@keyframes lane-burst-epic {
  0%,
  100% {
    transform: translateY(0) scale(1);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.12),
      0 0 0 rgba(95, 240, 214, 0);
  }
  35% {
    transform: translateY(-3px) scale(1.01);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.16),
      0 0 42px rgba(95, 240, 214, 0.24),
      0 0 0 3px rgba(95, 240, 214, 0.22);
  }
}

@keyframes lane-flare-epic {
  0%,
  100% {
    opacity: 0;
    transform: scale(0.94);
  }
  35% {
    opacity: 1;
    transform: scale(1.03);
  }
}

.tile-letter {
  font-size: 2.4rem;
  font-weight: 900;
  line-height: 1;
}

.tile-score {
  position: absolute;
  top: 8px;
  right: 10px;
  font-size: 0.95rem;
  font-weight: 800;
}

.tile-modifier {
  position: absolute;
  top: 8px;
  left: 10px;
  min-width: 30px;
  padding: 3px 7px;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-align: center;
  box-shadow: 0 4px 10px rgba(27, 11, 20, 0.18);
}

.rack-tile-enter-active {
  animation: rackTileIn 180ms cubic-bezier(0.2, 0.9, 0.3, 1.05);
  animation-fill-mode: both;
}

.rack-tile-leave-active {
  animation: rackTileOut 140ms ease-in forwards;
  pointer-events: none;
}

@keyframes rackTileIn {
  0% {
    opacity: 0;
    transform: scale(0.88);
    filter: brightness(1.08);
  }
  65% {
    opacity: 1;
    transform: scale(1.03);
  }
  100% {
    opacity: 1;
    transform: scale(1);
    filter: none;
  }
}

@keyframes rackTileOut {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0.82);
    filter: brightness(0.8);
  }
}

@media (max-width: 560px) {
  .rack-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
