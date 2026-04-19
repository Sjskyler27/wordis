<template>
  <section
    class="lane"
    :class="{
      'lane-burst-low': burstTier === 'low',
      'lane-burst-medium': burstTier === 'medium',
      'lane-burst-high': burstTier === 'high',
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
              'tile-must-alert': mustAlertIds.has(tile.id),
              'tile-controller-focus': controllerFocusedTileId === tile.id,
              [getTileAnimationClass(tile)]: !!getTileAnimationClass(tile)
            }"
            :style="getTileStyle(tile)"
            :data-controller-tile="`${side}-${index}`"
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
import { onBeforeUnmount, ref, watch } from 'vue';
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
  },
  controllerFocusedTileId: {
    type: String,
    default: ''
  }
});

defineEmits(['tile-click']);

const getTileStyle = (tile) => {
  const ui = getModifierUi(tile.status);

  return {
    '--tile-bg': ui.tileBackground,
    '--tile-shadow': ui.tileShadow,
    '--tile-hover-shadow': ui.tileHoverShadows || ui.tileShadow,
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

const activeTileAnimations = ref({});
const seenTileAnimationKeys = ref({});
const tileAnimationTimeoutIds = new Map();
const TILE_ANIMATION_DURATIONS = {
  blaze: 1080
};

const stopTileAnimation = (tileId) => {
  window.clearTimeout(tileAnimationTimeoutIds.get(tileId));
  tileAnimationTimeoutIds.delete(tileId);

  if (!activeTileAnimations.value[tileId]) {
    return;
  }

  const nextAnimations = { ...activeTileAnimations.value };
  delete nextAnimations[tileId];
  activeTileAnimations.value = nextAnimations;
};

const startTileAnimation = (tile) => {
  const animationState = tile?.animationState;
  if (!tile?.id || !animationState?.name || !animationState?.key) {
    return;
  }

  if (seenTileAnimationKeys.value[tile.id] === animationState.key) {
    return;
  }

  seenTileAnimationKeys.value = {
    ...seenTileAnimationKeys.value,
    [tile.id]: animationState.key
  };
  activeTileAnimations.value = {
    ...activeTileAnimations.value,
    [tile.id]: animationState.key
  };

  window.clearTimeout(tileAnimationTimeoutIds.get(tile.id));
  tileAnimationTimeoutIds.set(tile.id, window.setTimeout(() => {
    stopTileAnimation(tile.id);
  }, TILE_ANIMATION_DURATIONS[animationState.name] || 900));
};

const getTileAnimationClass = (tile) => {
  const animationState = tile?.animationState;
  if (!animationState?.name) {
    return '';
  }

  return activeTileAnimations.value[tile.id] === animationState.key
    ? `tile-anim-${animationState.name}`
    : '';
};

const burstTier = ref('');
let burstTimeoutId = null;
const getBurstTier = (score) => {
  if (!score || score < 6) {
    return '';
  }

  if (score >= 25) {
    return 'epic';
  }

  if (score >= 20) {
    return 'high';
  }

  if (score >= 12) {
    return 'medium';
  }

  return 'low';
};

watch(() => [props.burstPulse, props.lastWordScore], ([nextPulse]) => {
  if (!nextPulse) {
    return;
  }

  const nextTier = getBurstTier(props.lastWordScore);
  if (!nextTier) {
    return;
  }

  window.clearTimeout(burstTimeoutId);
  burstTier.value = '';

  requestAnimationFrame(() => {
    burstTier.value = nextTier;
    burstTimeoutId = window.setTimeout(() => {
      burstTier.value = '';
    }, nextTier === 'epic' ? 1220 : nextTier === 'high' ? 1020 : nextTier === 'medium' ? 900 : 760);
  });
});

watch(() => props.tiles, (nextTiles) => {
  nextTiles.forEach((tile) => startTileAnimation(tile));
}, {
  immediate: true,
  deep: true
});

onBeforeUnmount(() => {
  window.clearTimeout(burstTimeoutId);
  tileAnimationTimeoutIds.forEach((timeoutId) => {
    window.clearTimeout(timeoutId);
  });
  tileAnimationTimeoutIds.clear();
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

.lane-burst-low {
  animation: lane-burst-low 760ms ease-out;
}

.lane-burst-medium {
  animation: lane-burst-medium 900ms ease-out;
}

.lane-burst-high {
  animation: lane-burst-high 1020ms ease-out;
}

.lane-burst-epic {
  animation: lane-burst-epic 1220ms ease-out;
}

.lane-burst-low::after {
  animation: lane-flare-low 760ms ease-out;
  background:
    radial-gradient(circle at 50% 50%, rgba(255, 222, 145, 0.22) 0%, rgba(255, 182, 93, 0.12) 42%, rgba(255, 182, 93, 0) 72%);
}

.lane-burst-medium::after {
  animation: lane-flare-medium 900ms ease-out;
  background:
    radial-gradient(circle at 50% 50%, rgba(255, 222, 145, 0.34) 0%, rgba(255, 182, 93, 0.18) 42%, rgba(255, 182, 93, 0) 72%);
}

.lane-burst-high::after {
  animation: lane-flare-high 1020ms ease-out;
  background:
    radial-gradient(circle at 50% 50%, rgba(255, 229, 151, 0.42) 0%, rgba(255, 175, 79, 0.24) 40%, rgba(255, 175, 79, 0) 74%);
}

.lane-burst-epic::after {
  animation: lane-flare-epic 1220ms ease-out;
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

.tile:focus,
.tile:focus-visible  {
  outline: 3px solid rgba(255, 202, 103, 0.85);
  outline-offset: 2px;
  transform: translateY(-2px);
  box-shadow: var(--tile-focus-shadow, inset 0 -4px 0 rgba(0, 0, 0, 0.12), 0 0 0 4px rgba(92, 25, 41, 0.45), 0 14px 20px rgba(45, 10, 24, 0.24)) !important;
}

.tile-controller-focus {
  outline-offset: 2px;
  transform: translateY(-2px);
  box-shadow: var(--tile-focus-shadow, inset 0 -4px 0 rgba(0, 0, 0, 0.12), 0 0 0 4px rgba(92, 25, 41, 0.45), 0 14px 20px rgba(45, 10, 24, 0.24));
}


.tile.opponent.active {
  outline-color: rgba(75, 199, 176, 0.5);
}

.tile.opponent:focus,
.tile.opponent:focus-visible {
  outline-color: rgba(75, 199, 176, 0.85);
}

.tile.opponent.tile-controller-focus {
  outline-color: rgba(75, 199, 176, 0.85);
}

.tile-in-use {
  box-shadow:
    inset 0 0 0 9999px rgba(0, 0, 0, 0.38), /* soft dark overlay */
    inset 0 4px 10px rgba(38, 20, 12, 0.32),
    inset 0 -2px 0 rgba(255, 255, 255, 0.18);
  transform: translateY(2px) scale(0.98);
}

.tile-in-use:hover,
.tile-in-use:focus,
.tile-in-use:focus-visible {
  box-shadow:
    inset 0 0 0 9999px rgba(0, 0, 0, 0.38), /* soft dark overlay */
    inset 0 4px 10px rgba(38, 20, 12, 0.22),
    inset 0 -2px 0 rgba(255, 255, 255, 0.18) !important;
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

.tile-anim-blaze {
  animation: tile-blaze 1080ms ease-out;
}

.tile-anim-blaze::after {
  content: '';
  position: absolute;
  inset: -8px;
  border-radius: 22px;
  pointer-events: none;
  background:
    radial-gradient(circle at 50% 86%, rgba(255, 218, 134, 0.95) 0%, rgba(255, 179, 64, 0.6) 16%, rgba(255, 101, 22, 0.52) 34%, rgba(255, 83, 34, 0.24) 52%, rgba(255, 83, 34, 0) 72%);
  mix-blend-mode: screen;
  animation: tile-blaze-flare 1080ms ease-out;
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

@keyframes tile-blaze {
  0%,
  100% {
    transform: translateY(0) scale(1);
    filter: saturate(1) brightness(1);
  }
  24% {
    transform: translateY(-3px) scale(1.03) rotate(-1deg);
    filter: saturate(1.14) brightness(1.08);
  }
  48% {
    transform: translateY(-1px) scale(1.01) rotate(1deg);
    filter: saturate(1.2) brightness(1.12);
  }
}

@keyframes tile-blaze-flare {
  0% {
    opacity: 0;
    transform: translateY(8px) scale(0.9);
  }
  22% {
    opacity: 1;
    transform: translateY(-2px) scale(1.06);
  }
  100% {
    opacity: 0;
    transform: translateY(-12px) scale(1.16);
  }
}

@keyframes lane-burst-low {
  0%,
  100% {
    transform: translateY(0);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.12),
      0 0 0 rgba(255, 208, 120, 0);
  }
  35% {
    transform: translateY(-1px);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.15),
      0 0 18px rgba(255, 208, 120, 0.14),
      0 0 0 1px rgba(255, 208, 120, 0.16);
  }
}

@keyframes lane-burst-medium {
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

@keyframes lane-flare-low {
  0%,
  100% {
    opacity: 0;
    transform: scale(0.96);
  }
  35% {
    opacity: 0.52;
    transform: scale(1.01);
  }
}

@keyframes lane-flare-medium {
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

@keyframes lane-burst-high {
  0%,
  100% {
    transform: translateY(0) scale(1);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.12),
      0 0 0 rgba(255, 196, 104, 0);
  }
  35% {
    transform: translateY(-3px) scale(1.01);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.18),
      0 0 38px rgba(255, 196, 104, 0.28),
      0 0 0 3px rgba(255, 196, 104, 0.24);
  }
}

@keyframes lane-flare-high {
  0%,
  100% {
    opacity: 0;
    transform: scale(0.95);
  }
  35% {
    opacity: 1;
    transform: scale(1.03);
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
