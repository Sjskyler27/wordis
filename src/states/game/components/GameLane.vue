<template>
  <section class="lane">
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
              'tile-locked': tile.locked
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
import { getModifierBadge, getModifierUi, tileScore } from '../tile-logic.js';

defineProps({
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
  lastWordScore: {
    type: Number,
    required: false
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
</script>

<style scoped>
.lane {
  border-radius: 28px;
  padding: 20px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02)),
    rgba(72, 17, 38, 0.75);
  border: 2px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  background:
    linear-gradient(180deg, #c8bdb0 0%, #a79887 70%, #857565 100%);
  color: rgba(28, 25, 48, 0.78);
  box-shadow:
    inset 0 4px 10px rgba(38, 20, 12, 0.22),
    inset 0 -2px 0 rgba(255, 255, 255, 0.18);
  transform: translateY(2px) scale(0.98);
}

.tile-in-use:hover,
.tile-in-use:focus-visible {
  transform: translateY(1px) scale(0.98);
}

.tile-locked {
  cursor: not-allowed;
  filter: saturate(0.76);
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
