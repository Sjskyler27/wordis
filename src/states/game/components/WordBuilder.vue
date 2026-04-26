<template>
  <section class="word-console" :class="{ overtime: isOvertimeActive }">
    <div class="console-topline">
      <span class="console-label"><span v-if="currentWordScore < 10" style="visibility:hidden">_</span>{{ currentWordScore }} pts</span>
      <div
        v-if="minimumVowels"
        class="vowel-toll-meter"
        :class="{ complete: vowelTollMet }"
      >
        <span>Vowels</span>
        <strong>{{ selectedVowelCount }}/{{ minimumVowels }}</strong>
      </div>
      <div v-if="isOvertimeActive" class="overtime-banner animated-pulse ">{{ overtimeLabel }}</div>
    </div>
    <div class="bonus-ladder">
    </div>

    <div class="word-input-shell">
      <div class="built-word-strip" :class="{ empty: !selectedTiles.length }">
        <div v-if="scorePopTiles.length" class="score-pop-overlay">
          <div
            v-for="(tile, index) in scorePopTiles"
            :key="`score-pop-${scorePopPulse}-${tile.id}-${index}`"
            class="score-pop-slot"
            :style="{ gridColumn: index + 1 }"
          >
            <div class="built-tile scoring score-pop-clone" :style="getTileStyle(tile, index)">
              <span v-if="!getTileUi(tile).hideBadge && tile.status !== 'normal'" class="tile-modifier" :style="getBadgeStyle(tile)">
                {{ getTileBadge(tile) }}
              </span>
              <span class="tile-score">{{ getBuiltTileScore(tile, index) }}</span>
              <span class="tile-letter">{{ tile.letter }}</span>
            </div>
          </div>
        </div>
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
          <div v-if="!slot.tile" class="word-slot-placeholder">
            <div
              class="word-slot-placeholder-surface"
              :class="{
                milestone: !!slot.bonus && !slot.minimumRequired,
                'minimum-required': slot.minimumRequired
              }"
              :style="getPlaceholderStyle(slot)"
            >
              <span v-if="slot.bonus && !slot.minimumRequired" class="word-slot-bonus">+{{ slot.bonus }}</span>
              <span v-if="slot.rewardLabel && !slot.minimumRequired" class="word-slot-reward">{{ slot.rewardLabel }}</span>
              <span class="word-slot-index">{{ slot.position }}</span>
            </div>
          </div>

          <Transition name="built-tile">
            <button
              v-if="slot.tile"
              :key="`built-${slot.tile.id}`"
              type="button"
              class="built-tile"
              :class="{
                shaking: isShaking,
                'built-tile-banned-letter': isBannedLetter(slot.tile),
                'built-tile-muted-consonant': isZeroedConsonantSlot(slot.index),
                'built-tile-controller-focus': controllerFocusedBuiltTileId === slot.tile.id
              }"
              :style="getTileStyle(slot.tile, slot.index)"
              :data-controller-built="slot.index"
              @click="$emit('tile-click', slot.tile)"
              @mouseenter="showTooltipLater(slot.tile, $event)"
              @mousemove="updateTooltipPosition($event)"
              @mouseleave="hideTooltip"
            >
              <span v-if="!getTileUi(slot.tile).hideBadge && slot.tile.status !== 'normal'" class="tile-modifier" :style="getBadgeStyle(slot.tile)">
                {{ getTileBadge(slot.tile) }}
              </span>
              <span class="tile-score">{{ getBuiltTileScore(slot.tile, slot.index) }}</span>
              <span class="tile-letter">{{ slot.tile.letter }}</span>
            </button>
          </Transition>
        </div>
      </div>
      <span class="console-score"></span>
    </div>

    <div class="builder-breakdown">
    </div>

    <div class="console-actions">
      <button
        type="button"
        class="ghost-button"
        :class="{ 'console-action-controller-focus': controllerFocusedActionIndex === 0 }"
        data-controller-action="0"
        @click="$emit('undo')"
      >
        Undo
      </button>
      <button
        type="button"
        class="ghost-button"
        :class="{ 'console-action-controller-focus': controllerFocusedActionIndex === 1 }"
        data-controller-action="1"
        @click="$emit('clear')"
      >
        Clear
      </button>
      <button
        type="button"
        class="ghost-button"
        :class="{ 'console-action-controller-focus': controllerFocusedActionIndex === 2 }"
        data-controller-action="2"
        :disabled="currentWordLength <= 0"
        @click="$emit('save-letters')"
      >
        Save Letters
      </button>
      <button
        type="button"
        class="ghost-button"
        :class="{ 'console-action-controller-focus': controllerFocusedActionIndex === 3 }"
        data-controller-action="3"
        :disabled="clearCount <= 0"
        @click="$emit('clear-rack')"
      >
        New Rack {{ clearCount }}
      </button>
      <button
        type="button"
        class="submit-button"
        :class="{ 'console-action-controller-focus': controllerFocusedActionIndex === 4 }"
        data-controller-action="4"
        @click="$emit('submit')"
      >
        Submit Word
      </button>
    </div>
    <TileHoverTooltip
      :tile="hoveredTile"
      :visible="canShowTooltip"
      :x="tooltipPosition.x"
      :y="tooltipPosition.y"
    />
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { getModifierBadge, getModifierUi, tileScore } from '../tile-logic.js';
import TileHoverTooltip from './TileHoverTooltip.vue';

const props = defineProps({
  isMobile: Boolean,
  selectedTiles: {
    type: Array,
    required: true
  },
  invalidPulse: {
    type: Number,
    default: 0
  },
  scorePopPulse: {
    type: Number,
    default: 0
  },
  scorePopTiles: {
    type: Array,
    default: () => []
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
  currentWordSide: {
    type: String,
    default: 'host'
  },
  currentPlayerScores: {
    type: Object,
    default: () => ({ host: 0, opponent: 0 })
  },
  scoreOptions: {
    type: Object,
    default: () => ({})
  },
  clearCount: {
    type: Number,
    required: true
  },
  lengthBonusSteps: {
    type: Array,
    required: true
  },
  controllerFocusedBuiltTileId: {
    type: String,
    default: ''
  },
  controllerFocusedActionIndex: {
    type: Number,
    default: -1
  },
  isOvertimeActive: {
    type: Boolean,
    default: false
  },
  overtimeLabel: {
    type: String,
    default: 'Final Word!'
  }
});

defineEmits(['undo', 'clear', 'submit', 'remove-specific', 'clear-rack', 'save-letters', 'tile-click']);
const hoveredTile = ref(null);
const isTooltipVisible = ref(false);
const tooltipPosition = ref({ x: 0, y: 0 });
const canShowTooltip = computed(() => isTooltipVisible.value && !props.isMobile);
let tooltipTimeoutId = null;

const wordSlots = computed(() => {
  const minimumWordLength = props.scoreOptions?.roundModifierEffects?.minimumWordLength || 0;
  const slots = Array.from({ length: 9 }, (_, index) => {
    const position = index + 1;
    const bonusStep = props.lengthBonusSteps.find((step) => step.length === position);

	    return {
	      index,
	      position,
	      tile: props.selectedTiles[index] || null,
	      bonus: bonusStep?.bonus || 0,
	      difference: bonusStep?.difference || 0,
	      rewardLabel: bonusStep?.rewardLabel || '',
	      minimumRequired: position <= minimumWordLength
	    };
	  });

  const milestoneSlots = slots.filter((slot) => slot.bonus && !slot.minimumRequired);
  const milestoneCount = milestoneSlots.length || 1;

  return slots.map((slot) => ({
    ...slot,
    milestoneIndex: slot.bonus ? milestoneSlots.findIndex((entry) => entry.index === slot.index) : -1,
    milestoneCount
  }));
});

const minimumVowels = computed(() => props.scoreOptions?.roundModifierEffects?.minimumVowels || 0);
const selectedVowelCount = computed(() => {
  return props.selectedTiles.filter((tile) => isVowelLetter(getTileLetter(tile))).length;
});
const vowelTollMet = computed(() => selectedVowelCount.value >= minimumVowels.value);

const isShaking = ref(false);
let shakeTimeoutId = null;

watch(() => props.invalidPulse, (nextPulse) => {
  if (!nextPulse) {
    return;
  }

  window.clearTimeout(shakeTimeoutId);
  isShaking.value = false;

  requestAnimationFrame(() => {
    isShaking.value = true;
    shakeTimeoutId = window.setTimeout(() => {
      isShaking.value = false;
    }, 320);
  });
});

watch(() => props.scorePopPulse, (nextPulse) => {
  if (!nextPulse || !props.scorePopTiles.length) {
    return;
  }
});

const showTooltipLater = (tile, event) => {
  if (props.isMobile) {
    hideTooltip();
    return;
  }

  tooltipPosition.value = {
    x: event.clientX,
    y: event.clientY
  };
  window.clearTimeout(tooltipTimeoutId);
  isTooltipVisible.value = false;
  tooltipTimeoutId = window.setTimeout(() => {
    hoveredTile.value = tile;
    isTooltipVisible.value = true;
  }, 1000);
};

const updateTooltipPosition = (event) => {
  if (props.isMobile) {
    hideTooltip();
    return;
  }

  tooltipPosition.value = {
    x: event.clientX,
    y: event.clientY
  };
};

const hideTooltip = () => {
  window.clearTimeout(tooltipTimeoutId);
  isTooltipVisible.value = false;
  hoveredTile.value = null;
};

watch(() => props.isMobile, (isMobile) => {
  if (isMobile) {
    hideTooltip();
  }
});

const getYinYangState = (tile) => {
  if (tile?.status !== 'yinYang') {
    return '';
  }

  const opponentSide = props.currentWordSide === 'host' ? 'opponent' : 'host';
  const scoreDelta = (props.currentPlayerScores?.[props.currentWordSide] || 0) - (props.currentPlayerScores?.[opponentSide] || 0);
  if (scoreDelta < 0) {
    return 'behind';
  }
  if (scoreDelta > 0) {
    return 'ahead';
  }
  return 'tied';
};

const getTileUi = (tile) => {
  const ui = getModifierUi(tile.status);
  const yinYangState = getYinYangState(tile);

  if (yinYangState === 'behind') {
    return {
      ...ui,
      tileBackground: 'linear-gradient(225deg, #181217 0%, #6f6f6f 48%, #f6f0e4 49%, #f6f0e4 100%)',
      
      badgeBackground: 'rgba(255, 255, 255, 0.92)',
      badgeColor: '#181217'
    };
  }

  if (yinYangState === 'ahead') {
    return {
      ...ui,
      tileBackground: 'linear-gradient(225deg, #f6f0e4 0%, #f6f0e4 48%, #6f6f6f 49%, #181217 100%)',
      badgeBackground: 'rgba(24, 18, 23, 0.92)',
      badgeColor: '#f6f0e4'
    };
  }

  return ui;
};

const getTileBadge = (tile) => {
  const yinYangState = getYinYangState(tile);
  if (yinYangState === 'behind') {
    return 'YIN';
  }
  if (yinYangState === 'ahead') {
    return 'YANG';
  }

  return getModifierBadge(tile);
};

const getTileStyle = (tile, index = 0) => {
  const ui = getTileUi(tile);

  return {
    '--built-tile-bg': ui.tileBackground,
    '--built-tile-shadow': ui.tileShadow,
    '--built-tile-text-color': ui.textColor,
    '--built-tile-letter-stroke': tile.status === 'yinYang' ? '1px rgba(255, 255, 255, 0.92)' : '0 transparent',
    '--score-pop-delay': `${index * 110}ms`
  };
};

const getBadgeStyle = (tile) => {
  const ui = getTileUi(tile);

  return {
    background: ui.badgeBackground,
    color: ui.badgeColor
  };
};

const getBuiltTileScore = (tile, index) => {
  if (isZeroedConsonantSlot(index)) {
    return 0;
  }

  return tileScore(tile, {
    side: props.currentWordSide,
    scores: props.currentPlayerScores,
    positionIndex: index,
    ...props.scoreOptions
  });
};
const getTileLetter = (tile) => (tile?.baseLetter || tile?.letter || '').toUpperCase();
const isBannedLetter = (tile) => {
  const bannedLetters = new Set(props.scoreOptions?.roundModifierEffects?.bannedLetters || []);
  return bannedLetters.has(getTileLetter(tile));
};
const isVowelLetter = (letter = '') => ['A', 'E', 'I', 'O', 'U'].includes(letter.toUpperCase());
const isConsonantTile = (tile) => {
  const letter = getTileLetter(tile);
  return /^[A-Z]$/.test(letter) && !isVowelLetter(letter);
};
const zeroedConsonantIndex = computed(() => {
  if (!props.scoreOptions?.roundModifierEffects?.zeroHighestConsonant) {
    return -1;
  }

  const highestEntry = props.selectedTiles.reduce((highest, tile, index) => {
    if (!isConsonantTile(tile)) {
      return highest;
    }

    const score = tileScore(tile, {
      side: props.currentWordSide,
      scores: props.currentPlayerScores,
      positionIndex: index,
      ...props.scoreOptions
    });

    if (!highest || score > highest.score) {
      return { index, score };
    }

    return highest;
  }, null);

  return highestEntry?.index ?? -1;
});
const isZeroedConsonantSlot = (index) => zeroedConsonantIndex.value === index;

const getPlaceholderStyle = (slot) => {
  if (!slot.bonus) {
    return {};
  }

  const segmentCount = Math.max(1, slot.milestoneCount);
  const segmentIndex = Math.max(0, slot.milestoneIndex);

  return {
    '--milestone-gradient-size': `${segmentCount * 100}% 100%`,
    '--milestone-gradient-position': `${(segmentIndex / Math.max(1, segmentCount - 1)) * 100}% 0%`
  };
};

onBeforeUnmount(() => {
  window.clearTimeout(shakeTimeoutId);
  window.clearTimeout(tooltipTimeoutId);
});
</script>

<style scoped>
button:focus{
  outline: none;
  box-shadow: none;
}
.word-console {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-radius: 24px;
  background: rgba(48, 12, 28, 0.23);
  position: relative;
}

.console-topline {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.overtime-banner {
  flex: 0 0 auto;
  padding: 10px 14px;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(153, 25, 41, 0.96), rgba(82, 10, 22, 0.96));
  color: #ffd5cf;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  text-align: center;
  box-shadow: inset 0 1px 0 rgba(255, 205, 193, 0.12);
}

.vowel-toll-meter {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 11px;
  border: 1px solid rgba(255, 226, 184, 0.34);
  border-radius: 999px;
  background: rgba(92, 24, 43, 0.78);
  color: #ffe3c2;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  box-shadow: inset 0 -2px 0 rgba(24, 8, 18, 0.22);
}

.vowel-toll-meter strong {
  color: #ffffff;
  font-size: 0.82rem;
}

.vowel-toll-meter.complete {
  border-color: rgba(129, 243, 196, 0.58);
  background: rgba(33, 106, 82, 0.78);
  color: #dfffee;
}

.word-console.overtime {
  background: rgba(72, 11, 21, 0.54);
  border: 1px solid rgba(255, 140, 140, 0.2);
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
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 10px 14px;
  border-radius: 18px;
}

.built-word-strip {
  min-height: 74px;
  display: grid;
  grid-template-columns: repeat(9, minmax(0, 1fr));
  position: relative;
}

.score-pop-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(9, minmax(0, 1fr));
  pointer-events: none;
  z-index: 3;
}

.score-pop-slot {
  display: flex;
}

.built-word-strip.empty {
  color: rgba(254, 183, 59, 0.62);
}

.word-slot {
  position: relative;
  max-width: 106px;
  width: 98px;
  min-height: 94px;
  border-radius: 14px;
}

.word-slot-placeholder {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.word-slot-placeholder-surface {
  min-height: 94px;
  width: 98px;
  border-radius: 14px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    linear-gradient(180deg, rgba(147, 147, 147, 0.52), rgba(57, 57, 57, 0.58));
  box-shadow:
    inset 0 1px 0 rgba(255, 227, 167, 0.08),
    inset 0 -2px 0 rgba(73, 31, 8, 0.28);
}

.word-slot-placeholder-surface.milestone {
  background:
    linear-gradient(
      90deg,
      rgba(133, 92, 54, 0.80) 0%,
      rgba(173, 101, 35, 0.75) 20%,
      rgba(187, 111, 29, 0.76) 48%,
      rgba(195, 130, 39, 0.8) 72%,
      rgba(204, 153, 51, 0.84) 100%
    );
  background-size: var(--milestone-gradient-size, 100% 100%);
  background-position: var(--milestone-gradient-position, 0% 0%);
  border-color: rgba(255, 202, 103, 0.22);
}

.word-slot-placeholder-surface.minimum-required {
  background:
    linear-gradient(180deg, rgba(147, 147, 147, 0.52), rgba(57, 57, 57, 0.58));
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 227, 167, 0.08),
    inset 0 -2px 0 rgba(73, 31, 8, 0.28);
}


.word-slot-bonus {
  font-size: 2rem;
  font-weight: 900;
  line-height: 1;
  color: rgba(181, 181, 181, 0.997);
  text-shadow: 0 1px 0 rgba(255, 226, 163, 0.08);
}

.word-slot-reward {
  position: absolute;
  left: 50%;
  bottom: 10px;
  transform: translateX(-50%);
  font-size: 0.5rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 240, 218, 0.88);
  text-align: center;
  white-space: nowrap;
}

.word-slot-index {
  visibility: hidden;
  position: absolute;
  right: 10px;
  bottom: 8px;
  font-size: 0.82rem;
  font-weight: 800;
  color: rgba(184, 184, 184, 0.99);
}

@keyframes invalid-word-shake {
  0% { transform: translateX(0); }
  20% { transform: translateX(-8px) rotate(-0.8deg); }
  40% { transform: translateX(7px) rotate(0.7deg); }
  60% { transform: translateX(-6px) rotate(-0.5deg); }
  80% { transform: translateX(4px) rotate(0.35deg); }
  100% { transform: translateX(0); }
}

.built-tile.shaking {
  animation: invalid-word-shake 280ms ease;
}

.built-tile.scoring {
  animation: built-tile-score-pop 520ms cubic-bezier(0.22, 0.9, 0.3, 1) both;
  animation-delay: var(--score-pop-delay, 0ms);
}

.score-pop-clone {
  pointer-events: none;
  position: relative;
}

.word-slot.filled .word-slot-placeholder {
  opacity: 0.6;
}

.built-tile {
  appearance: none;
  border: none;
  cursor: pointer;
  font: inherit;
  font-weight: inherit;
  font-family: "Press Start 2P", cursive;
  min-height: 94px;
  width: 98px;
  border-radius: 14px;
  position: relative;
  z-index: 2;
  background: var(--built-tile-bg, linear-gradient(180deg, #fffef8 0%, #f2ebe0 70%, #d9cec0 100%));
  color: var(--built-tile-text-color, #1c1930);
  box-shadow: var(--built-tile-shadow, inset 0 -3px 0 rgba(0, 0, 0, 0.16));
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  will-change: transform, opacity;
}

.built-tile-banned-letter::before {
  content: '';
  position: absolute;
  left: 13%;
  right: 13%;
  top: 50%;
  height: 8px;
  border-radius: 999px;
  background: rgba(213, 31, 55, 0.94);
  box-shadow: 0 0 0 2px rgba(255, 231, 220, 0.62), 0 6px 12px rgba(88, 5, 18, 0.26);
  pointer-events: none;
  transform: translateY(-50%) rotate(-38deg);
  z-index: 4;
}

.built-tile-muted-consonant {
  filter: saturate(0.58) brightness(0.92);
}

.built-tile-muted-consonant::after {
  content: '0';
  position: absolute;
  left: 50%;
  bottom: 8px;
  transform: translateX(-50%);
  min-width: 28px;
  padding: 3px 7px;
  border-radius: 999px;
  background: rgba(32, 23, 34, 0.9);
  color: #f8ecff;
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-align: center;
  box-shadow: 0 4px 10px rgba(20, 6, 18, 0.22);
  z-index: 4;
}

.built-tile:focus{
  outline: 5px solid rgba(130, 253, 238, 0.85);


}
.built-tile:focus-visible {
  outline: 5px solid rgba(130, 253, 238, 0.85);

  outline-offset: 2px;
}

.built-tile-controller-focus {
  outline: 5px solid rgba(130, 253, 238, 0.85);

  outline-offset: 2px;
}

.console-action-controller-focus {
  outline: 5px solid rgba(130, 253, 238, 0.85) !important;
  outline-offset: 2px;
}


.tile-letter {
  font-size: 2.4rem;
  font-weight: 900;
  line-height: 1;
  -webkit-text-stroke: var(--built-tile-letter-stroke, 0 transparent);
  paint-order: stroke fill;
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
  top: 6px;
  left: 7px;
  min-width: 30px;
  padding: 3px 7px;
  border-radius: 999px;
  font-size: 0.58rem;
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
  position: absolute;
  inset: 0;
  z-index: 1;
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

@keyframes built-tile-score-pop {
  0% {
    transform: translateY(0) scale(1);
    box-shadow: var(--built-tile-shadow, inset 0 -3px 0 rgba(0, 0, 0, 0.16));
    filter: brightness(1);
  }
  38% {
    transform: translateY(-6px) scale(1.08);
    box-shadow:
      0 0 0 2px rgba(255, 214, 112, 0.55),
      0 0 28px rgba(255, 214, 112, 0.28),
      var(--built-tile-shadow, inset 0 -3px 0 rgba(0, 0, 0, 0.16));
    filter: brightness(1.08);
  }
  100% {
    transform: translateY(0) scale(1);
    box-shadow: var(--built-tile-shadow, inset 0 -3px 0 rgba(0, 0, 0, 0.16));
    filter: brightness(1);
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
  
  font-size: 2rem;
  font-weight: 900;
  line-height: 1;
  color: rgba(181, 181, 181, 0.997);
  text-shadow: 0 1px 0 rgba(255, 226, 163, 0.08);
  padding-right: 20px;
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

@media (max-width: 1000px) {
  .word-console {
    flex-direction: column;
    align-items: stretch;
    gap: 0px;
  }

  .console-topline {
    position: absolute;
    top: 10px;
    left: 12px;
    right: 12px;
    z-index: 2;
    pointer-events: none;
  }

  .overtime-banner {
    margin: 0;
    max-width: 200px;
  }

  .bonus-ladder {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .word-input-shell {
    padding: 0px;
    grid-template-columns: 1fr;
    padding-top: 10px;
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
