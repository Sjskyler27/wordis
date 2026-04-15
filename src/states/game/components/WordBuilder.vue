<template>
  <form class="word-console" @submit.prevent="$emit('submit')">
    <div class="bonus-ladder">
      <div
        v-for="step in lengthBonusSteps"
        :key="`bonus-${step.length}`"
        class="bonus-step"
        :class="{ active: currentWordLength >= step.length }"
      >
        <strong>+{{ step.bonus }}</strong>
        <span>{{ step.length }} letters</span>
      </div>
    </div>

    <div class="word-input-shell">
      <span class="console-label">Your Word</span>
      <div class="built-word-strip" :class="{ empty: !selectedTiles.length }">
        <div
          v-for="slot in wordSlots"
          :key="`word-slot-${slot.index}`"
          class="word-slot"
          :class="{
            filled: !!slot.tile,
            milestone: !!slot.bonus,
            active: currentWordLength >= slot.position
          }"
        >
          <Transition name="built-tile" mode="out-in">
            <button
              v-if="slot.tile"
              :key="`built-${slot.tile.id}`"
              type="button"
              class="built-tile"
              :style="getTileStyle(slot.tile)"
              @click="$emit('remove-specific', slot.tile.id)"
            >
              <span v-if="!getModifierUi(slot.tile.status).hideBadge && slot.tile.status !== 'normal'" class="tile-modifier" :style="getBadgeStyle(slot.tile)">
                {{ getModifierBadge(slot.tile.status) }}
              </span>
              <span class="tile-score">{{ tileScore(slot.tile) }}</span>
              <span class="tile-letter">{{ slot.tile.letter }}</span>
            </button>
            <div v-else :key="`placeholder-${slot.index}`" class="word-slot-placeholder">
              <span v-if="slot.bonus" class="word-slot-bonus">+{{ slot.bonus }}</span>
              <span class="word-slot-index">{{ slot.position }}</span>
            </div>
          </Transition>
        </div>
      </div>
      <span class="console-score">{{ currentWordScore }} pts</span>
    </div>

    <div class="builder-breakdown">
      <span>Letters {{ currentLetterTotal }}</span>
      <span v-if="currentFirstTileBonus > 0">Lead Tile +{{ currentFirstTileBonus }}</span>
      <span>Length Bonus +{{ currentLengthBonus }}</span>
      <span v-if="currentWordMultiplier > 1">Gold x{{ currentWordMultiplier }}</span>
      <span>Total {{ currentWordScore }}</span>
    </div>

    <div class="console-actions">
      <button type="button" class="ghost-button" @click="$emit('undo')">
        Undo
      </button>
      <button type="button" class="ghost-button" @click="$emit('clear')">
        Clear
      </button>
      <button type="submit" class="submit-button">
        Submit Word
      </button>
    </div>
  </form>
</template>

<script setup>
import { computed } from 'vue';
import { getModifierBadge, getModifierUi, tileScore } from '../tile-logic.js';

const props = defineProps({
  selectedTiles: {
    type: Array,
    required: true
  },
  currentWordLength: {
    type: Number,
    required: true
  },
  currentWordScore: {
    type: Number,
    required: true
  },
  currentLetterTotal: {
    type: Number,
    required: true
  },
  currentLengthBonus: {
    type: Number,
    required: true
  },
  currentFirstTileBonus: {
    type: Number,
    required: true
  },
  currentWordMultiplier: {
    type: Number,
    required: true
  },
  lengthBonusSteps: {
    type: Array,
    required: true
  }
});

defineEmits(['undo', 'clear', 'submit', 'remove-specific']);

const wordSlots = computed(() => {
  return Array.from({ length: 8 }, (_, index) => {
    const position = index + 1;
    const bonusStep = props.lengthBonusSteps.find((step) => step.length === position);

    return {
      index,
      position,
      tile: props.selectedTiles[index] || null,
      bonus: bonusStep?.bonus || 0
    };
  });
});

const getTileStyle = (tile) => {
  const ui = getModifierUi(tile.status);

  return {
    '--built-tile-bg': ui.tileBackground,
    '--built-tile-shadow': ui.tileShadow,
    '--built-tile-text-color': ui.textColor
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
.word-console {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-radius: 24px;
  background: rgba(48, 12, 28, 0.8);
}

.bonus-ladder {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.bonus-step {
  border-radius: 16px;
  padding: 14px 10px;
  text-align: center;
  background: rgba(255, 255, 255, 0.07);
  border: 2px solid rgba(255, 255, 255, 0.08);
  color: rgba(247, 239, 225, 0.7);
  transition: transform 140ms ease, background 140ms ease, color 140ms ease;
}

.bonus-step strong,
.bonus-step span {
  display: block;
}

.bonus-step strong {
  font-size: 1.15rem;
}

.bonus-step span {
  margin-top: 6px;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.bonus-step.active {
  background: linear-gradient(180deg, rgba(255, 149, 91, 0.38), rgba(181, 79, 33, 0.72));
  color: #f7efe1;
  transform: translateY(-2px);
  border-color: rgba(255, 202, 103, 0.34);
}

.word-input-shell {
  min-width: 0;
  min-height: 110px;
  flex: 1;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 10px 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.08);
}

.built-word-strip {
  min-height: 74px;
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 10px;
}

.built-word-strip.empty {
  color: rgba(254, 183, 59, 0.62);
}

.word-slot {
  min-height: 90px;
  min-width: 0;
  border-radius: 14px;
}

.word-slot-placeholder {
  width: 100%;
  min-height: 90px;
  border-radius: 14px;
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 10px 12px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01)),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    rgba(255, 255, 255, 0.035);
  background-size: auto, 18px 18px, 18px 18px, auto;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02);
}

.word-slot.milestone .word-slot-placeholder {
  border-color: rgba(255, 202, 103, 0.16);
}

.word-slot.active .word-slot-placeholder {
  background:
    linear-gradient(180deg, rgba(255, 180, 88, 0.12), rgba(255, 255, 255, 0.02)),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    rgba(255, 255, 255, 0.04);
}

.word-slot-bonus {
  position: absolute;
  left: 12px;
  top: 12px;
  font-size: 1rem;
  font-weight: 900;
  color: rgba(255, 202, 103, 0.28);
}

.word-slot-index {
  font-size: 0.82rem;
  font-weight: 800;
  color: rgba(247, 239, 225, 0.32);
}

.built-tile {
  appearance: none;
  border: none;
  cursor: pointer;
  min-height: 90px;
  min-width: 0;
  width: 100%;
  border-radius: 14px;
  position: relative;
  background: var(--built-tile-bg, linear-gradient(180deg, #fffef8 0%, #f2ebe0 70%, #d9cec0 100%));
  color: var(--built-tile-text-color, #1c1930);
  box-shadow: var(--built-tile-shadow, inset 0 -3px 0 rgba(0, 0, 0, 0.16));
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  will-change: transform, opacity;
}

.built-tile:focus-visible {
  outline: 3px solid rgba(255, 202, 103, 0.85);
  outline-offset: 2px;
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

.built-tile-enter-active {
  animation: builtTileIn 220ms cubic-bezier(0.2, 0.9, 0.3, 1.15);
  animation-fill-mode: both;
}

.built-tile-leave-active {
  animation: builtTileOut 180ms ease-in forwards;
  pointer-events: none;
}

@keyframes builtTileIn {
  0% {
    opacity: 0;
    transform: translateY(12px) scale(0.86);
  }
  70% {
    opacity: 1;
    transform: translateY(-2px) scale(1.04);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes builtTileOut {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-10px) scale(0.84);
  }
}

.builder-breakdown {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.builder-breakdown span {
  padding: 10px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.console-label,
.console-score {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.78rem;
  opacity: 0.82;
}

.console-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.ghost-button,
.submit-button {
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 12px 18px;
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  font-family: "Press Start 2P", cursive;
}

.ghost-button {
  background: rgba(255, 255, 255, 0.08);
  color: #f7efe1;
}

.submit-button {
  background: linear-gradient(180deg, #2cbf9d 0%, #1d987e 100%);
  color: #effff9;
  min-width: 130px;
}

@media (max-width: 720px) {
  .word-console {
    flex-direction: column;
    align-items: stretch;
  }

  .bonus-ladder {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .word-input-shell {
    grid-template-columns: 1fr;
  }

  .built-word-strip {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .console-actions {
    width: 100%;
    justify-content: stretch;
  }

  .console-actions button {
    flex: 1;
  }
}
</style>
