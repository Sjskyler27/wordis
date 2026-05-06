<template>
  <section class="word-console" :class="{ overtime: isOvertimeActive }">
    <div class="console-topline">
      <div class="console-label"><span v-if="currentWordScore < 10" style="visibility:hidden">_</span>{{ currentWordScore }} pts</div>
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
            <div
              class="built-tile scoring score-pop-clone"
              :class="{
                'built-tile-lightning': tile.status === 'lightningTile',
                'built-tile-glass': tile.status === 'glassTile',
                'built-tile-glass-cracked': tile.glassCracked,
                'built-tile-cornucopia': tile.status === 'cornucopiaTile',
                'built-tile-void': tile.status === 'voidTile',
                'built-tile-hourglass': tile.status === 'hourglassTile',
                'built-tile-barricade': tile.status === 'barricadeTile',
                'built-tile-bag': tile.status === 'bagTile',
                'built-tile-bagged': isBaggedTile(tile),
                'built-tile-leecher': tile.status === 'leecherTile',
                'built-tile-leecher-drained': tile.leecherDrained,
                'built-tile-twin': tile.status === 'twinTile',
                'built-tile-twin-active': hasTwinMatch(tile)
              }"
              :style="getTileStyle(tile, index)"
            >
              <span v-if="tile.status === 'lightningTile'" class="built-tile-lightning-spark spark-left" aria-hidden="true"></span>
              <span v-if="tile.status === 'lightningTile'" class="built-tile-lightning-spark spark-right" aria-hidden="true"></span>
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
            active: currentWordLength >= slot.position,
            'drag-target': isDragTarget(slot.index)
          }"
          :data-word-slot-index="slot.index"
        >
          <div v-if="!slot.tile" class="word-slot-placeholder">
            <div
              class="word-slot-placeholder-surface"
              :class="{
                milestone: !!slot.bonus,
                'minimum-required': slot.minimumRequired
              }"
              :style="getPlaceholderStyle(slot)"
            >
              <span v-if="slot.bonus" class="word-slot-bonus">+{{ slot.bonus }}</span>
              <span v-if="slot.rewardLabel" class="word-slot-reward">{{ slot.rewardLabel }}</span>
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
                'built-tile-disabled-gold': isDisabledGold(slot.tile),
                'built-tile-muted-consonant': isZeroedConsonantSlot(slot.index),
                'built-tile-shimmer': slot.tile.status === 'shimmer',
                'built-tile-rusting': slot.tile.status === 'rustingTile',
                'built-tile-lightning': slot.tile.status === 'lightningTile',
                'built-tile-glass': slot.tile.status === 'glassTile',
                'built-tile-glass-cracked': slot.tile.glassCracked,
                'built-tile-cornucopia': slot.tile.status === 'cornucopiaTile',
                'built-tile-void': slot.tile.status === 'voidTile',
                'built-tile-hourglass': slot.tile.status === 'hourglassTile',
                'built-tile-barricade': slot.tile.status === 'barricadeTile',
                'built-tile-bag': slot.tile.status === 'bagTile',
                'built-tile-bagged': isBaggedTile(slot.tile),
                'built-tile-leecher': slot.tile.status === 'leecherTile',
                'built-tile-leecher-drained': slot.tile.leecherDrained,
                'built-tile-twin': slot.tile.status === 'twinTile',
                'built-tile-twin-active': hasTwinMatch(slot.tile),
                'built-tile-dragging': draggedTileId === slot.tile.id,
                'built-tile-controller-focus': controllerFocusedBuiltTileId === slot.tile.id
              }"
              :style="getTileStyle(slot.tile, slot.index)"
              :data-controller-built="slot.index"
              @pointerdown="handleBuiltPointerDown(slot, $event)"
              @click="handleBuiltTileClick(slot.tile, $event)"
              @mouseenter="showTooltipLater(slot.tile, $event)"
              @mousemove="updateTooltipPosition($event)"
              @mouseleave="hideTooltip"
            >
              <span v-if="slot.tile.status === 'lightningTile'" class="built-tile-lightning-spark spark-left" aria-hidden="true"></span>
              <span v-if="slot.tile.status === 'lightningTile'" class="built-tile-lightning-spark spark-right" aria-hidden="true"></span>
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
      :overrideMessage="overrideMessage"
      :overrideBadge="overrideBadge"
      :visible="canShowTooltip"
      :x="tooltipPosition.x"
      :y="tooltipPosition.y"
    />
    <div
      v-if="dragPreviewTile"
      class="built-drag-afterimage"
      :style="getDragAfterimageStyle(dragPreviewTile)"
      aria-hidden="true"
    >
      <span v-if="!getTileUi(dragPreviewTile).hideBadge && dragPreviewTile.status !== 'normal'" class="tile-modifier" :style="getBadgeStyle(dragPreviewTile)">
        {{ getTileBadge(dragPreviewTile) }}
      </span>
      <span class="tile-score">{{ getBuiltTileScore(dragPreviewTile, dragState.fromIndex) }}</span>
      <span class="tile-letter">{{ dragPreviewTile.letter }}</span>
    </div>
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
  baggedTileIds: {
    type: [Object, Array],
    default: () => new Set()
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

const emit = defineEmits(['undo', 'clear', 'submit', 'remove-specific', 'clear-rack', 'save-letters', 'tile-click', 'reorder']);
const hoveredTile = ref(null);
const isTooltipVisible = ref(false);
const tooltipPosition = ref({ x: 0, y: 0 });
const canShowTooltip = computed(() => isTooltipVisible.value && !props.isMobile);
const dragState = ref(null);
const suppressNextClick = ref(false);
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
const disabledGoldIds = computed(() => {
  // get golds 
  const goldIds = props.selectedTiles
    .filter(t => t.status === 'gold')
    .map(t => t.id);
    // get pairs
  const royalCount = props.selectedTiles
    .filter(t => t.status === 'royalPear')
    .length;
    // 2 pairs all golds disable
  if (royalCount > 1) {
    return goldIds;
  }
  // if more than one gold return all after 1st 
  if (goldIds.length > 1) {
    return goldIds.slice(1);
  }
  return [];

});

const isDisabledGold = (tile) => {
  return disabledGoldIds.value.includes(tile.id);
};

const draggedTileId = computed(() => dragState.value?.tileId || '');
const dragPreviewTile = computed(() => {
  if (!dragState.value?.isDragging) {
    return null;
  }

  return props.selectedTiles[dragState.value.fromIndex] || null;
});

const isDragTarget = (slotIndex) => {
  return dragState.value?.isDragging && dragState.value?.targetIndex === slotIndex;
};

const getDragAfterimageStyle = (tile) => ({
  ...getTileStyle(tile, dragState.value?.fromIndex || 0),
  left: `${(dragState.value?.currentX || 0) + 14}px`,
  top: `${(dragState.value?.currentY || 0) + 14}px`
});

const getSlotIndexFromPointer = (event) => {
  const element = document.elementFromPoint(event.clientX, event.clientY);
  const slotElement = element?.closest?.('[data-word-slot-index]');
  if (!slotElement) {
    return dragState.value?.targetIndex ?? dragState.value?.fromIndex ?? 0;
  }

  const rawIndex = Number(slotElement.dataset.wordSlotIndex);
  return Math.max(0, Math.min(rawIndex, Math.max(0, props.selectedTiles.length - 1)));
};

const updateDragTarget = (event) => {
  if (!dragState.value) {
    return;
  }

  const targetIndex = getSlotIndexFromPointer(event);
  dragState.value = {
    ...dragState.value,
    targetIndex
  };
};

const endBuiltTileDrag = (event) => {
  if (!dragState.value) {
    return;
  }

  updateDragTarget(event);
  const { fromIndex, targetIndex, isDragging } = dragState.value;
  const shouldReorder = isDragging && fromIndex !== targetIndex;
  dragState.value.element?.releasePointerCapture?.(event.pointerId);
  dragState.value = null;
  window.removeEventListener('pointermove', handleBuiltPointerMove);
  window.removeEventListener('pointerup', endBuiltTileDrag);
  window.removeEventListener('pointercancel', cancelBuiltTileDrag);

  if (isDragging) {
    suppressNextClick.value = true;
  }
  if (shouldReorder) {
    emit('reorder', { fromIndex, toIndex: targetIndex });
  }
};

const cancelBuiltTileDrag = (event) => {
  dragState.value?.element?.releasePointerCapture?.(event.pointerId);
  dragState.value = null;
  window.removeEventListener('pointermove', handleBuiltPointerMove);
  window.removeEventListener('pointerup', endBuiltTileDrag);
  window.removeEventListener('pointercancel', cancelBuiltTileDrag);
};

const handleBuiltPointerMove = (event) => {
  if (!dragState.value) {
    return;
  }

  const deltaX = event.clientX - dragState.value.startX;
  const deltaY = event.clientY - dragState.value.startY;
  const isDragging = dragState.value.isDragging || Math.hypot(deltaX, deltaY) > 8;
  dragState.value = {
    ...dragState.value,
    currentX: event.clientX,
    currentY: event.clientY,
    isDragging
  };

  if (isDragging) {
    event.preventDefault();
    hideTooltip();
    updateDragTarget(event);
  }
};

const handleBuiltPointerDown = (slot, event) => {
  if (!slot.tile || event.button !== 0) {
    return;
  }

  dragState.value = {
    tileId: slot.tile.id,
    fromIndex: slot.index,
    targetIndex: slot.index,
    startX: event.clientX,
    startY: event.clientY,
    currentX: event.clientX,
    currentY: event.clientY,
    isDragging: false,
    element: event.currentTarget
  };
  event.currentTarget.setPointerCapture?.(event.pointerId);
  window.addEventListener('pointermove', handleBuiltPointerMove);
  window.addEventListener('pointerup', endBuiltTileDrag);
  window.addEventListener('pointercancel', cancelBuiltTileDrag);
};

const handleBuiltTileClick = (tile, event) => {
  if (suppressNextClick.value) {
    event.preventDefault();
    suppressNextClick.value = false;
    return;
  }

  emit('tile-click', tile);
};

const isBaggedTile = (tile) => {
  if (!tile?.id) {
    return false;
  }

  return typeof props.baggedTileIds?.has === 'function'
    ? props.baggedTileIds.has(tile.id)
    : props.baggedTileIds.includes(tile.id);
};


const overrideBadge = computed(() => {
  if (!hoveredTile.value) return null;

  return isDisabledGold(hoveredTile.value)
    ? 'X1'
    : null;
});
const overrideMessage = computed(() => {
  if (!hoveredTile.value) return null;

  return isDisabledGold(hoveredTile.value)
    ? 'Only 1 multiplier tile modifier per word'
    : null;
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
  if(disabledGoldIds.value.includes(tile.id)){
    return 'X1'
  }

  return getModifierBadge(tile);
};

const getTileStyle = (tile, index = 0) => {
  const ui = getTileUi(tile);

  return {
    '--built-tile-bg': ui.tileBackground,
    '--built-tile-shadow': ui.tileShadow,
    '--built-tile-text-color': ui.textColor,
    '--built-tile-letter-stroke': tile.status === 'yinYang' || tile.status === 'rustingTile' ? '1px rgba(255, 255, 255, 0.92)' : '0 transparent',
    '--built-tile-rust-coverage': `${Math.min(120, (((tile.rustTurns  || 0) + 1) * 20) + 18)}%`,
    '--built-tile-shimmer-cycle': `${tile.shimmerIntervalMs * 2 || 16000}ms`, // idle is slower
    '--built-tile-lightning-cycle': `${tile.lightningIntervalMs || 3000}ms`,
    '--built-tile-lightning-delay': getLightningAnimationDelay(tile),
    '--cornucopia-fill': tile.status === 'cornucopiaTile' ? `${Math.min(100, Math.max(0, index) * 12.5)}%` : '0%',
    '--score-pop-delay': `${index * 110}ms`
  };
};

const getBadgeStyle = (tile) => {
  const ui = getTileUi(tile);

  if(disabledGoldIds.value.includes(tile.id)){
    return {
    background: 'pink',
    color: 'red'
  };
  }

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
    wordTiles: props.selectedTiles,
    ...props.scoreOptions
  });
};
const getTileLetter = (tile) => (tile?.baseLetter || tile?.letter || '').toUpperCase();
const hasTwinMatch = (tile) => {
  if (tile?.status !== 'twinTile') {
    return false;
  }

  const letter = getTileLetter(tile);
  return Boolean(letter) && props.selectedTiles.some((selectedTile) => {
    return selectedTile.id !== tile.id && getTileLetter(selectedTile) === letter;
  });
};
const getLightningAnimationDelay = (tile) => {
  if (Number.isFinite(tile?.lightningAnimationDelayMs)) {
    return `${tile.lightningAnimationDelayMs}ms`;
  }

  const intervalMs = tile.lightningIntervalMs || 3000;
  const strikeAt = tile.lightningStrikeAt || 0;
  if (!strikeAt || !intervalMs) {
    return '0ms';
  }

  const remainingMs = Math.max(0, strikeAt - Date.now());
  return `${remainingMs - intervalMs}ms`;
};
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
      wordTiles: props.selectedTiles,
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
  window.removeEventListener('pointermove', handleBuiltPointerMove);
  window.removeEventListener('pointerup', endBuiltTileDrag);
  window.removeEventListener('pointercancel', cancelBuiltTileDrag);
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
  background: rgba(48, 12, 28, 0.00);
  position: relative;
}

.console-topline {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  position: relative;
  z-index: 58;
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

/*.word-console.overtime {
  background: rgba(72, 11, 21, 0.34);
  border: 1px solid rgba(255, 140, 140, 0.2);
}
*/
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

.word-slot.drag-target::before {
  content: '';
  position: absolute;
  inset: -5px;
  z-index: 4;
  border-radius: 18px;
  pointer-events: none;
  border: 3px solid rgba(117, 246, 222, 0.88);
  box-shadow:
    0 0 0 3px rgba(117, 246, 222, 0.18),
    0 0 18px rgba(117, 246, 222, 0.42);
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
  touch-action: none;
  user-select: none;
}

.built-tile-dragging {
  cursor: grabbing;
  opacity: 0.58;
  transform: translateY(-4px) scale(1.05);
  z-index: 5;
  box-shadow:
    var(--built-tile-shadow, inset 0 -3px 0 rgba(0, 0, 0, 0.16)),
    0 0 0 4px rgba(117, 246, 222, 0.34),
    0 18px 24px rgba(23, 18, 34, 0.28);
}

.built-drag-afterimage {
  position: fixed;
  visibility: hidden;
  z-index: 10000;
  width: 58px;
  height: 58px;
  border-radius: 10px;
  pointer-events: none;
  transform: rotate(4deg) scale(0.92);
  background: var(--built-tile-bg, linear-gradient(180deg, #fffef8 0%, #f2ebe0 70%, #d9cec0 100%));
  color: var(--built-tile-text-color, #1c1930);
  box-shadow:
    var(--built-tile-shadow, inset 0 -3px 0 rgba(0, 0, 0, 0.16)),
    0 0 0 3px rgba(117, 246, 222, 0.34),
    0 12px 20px rgba(17, 12, 28, 0.32);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.78;
}

.built-drag-afterimage .tile-letter {
  position: relative;
  z-index: 3;
  font-size: 1.28rem;
}

.built-drag-afterimage .tile-score {
  position: absolute;
  z-index: 5;
  top: 5px;
  right: 6px;
  font-size: 0.48rem;
}

.built-drag-afterimage .tile-modifier {
  position: absolute;
  z-index: 6;
  top: 4px;
  left: 4px;
  min-width: 18px;
  padding: 2px 4px;
  font-size: 0.34rem;
  border-radius: 999px;
}

.built-tile-shimmer,
.built-tile-rusting,
.built-tile-lightning,
.built-tile-twin,
.built-tile-glass,
.built-tile-cornucopia,
.built-tile-void,
.built-tile-hourglass,
.built-tile-barricade,
.built-tile-bag,
.built-tile-leecher {
  isolation: isolate;
  overflow: hidden;
}

.built-tile-shimmer::before {
  content: '';
  position: absolute;
  inset: -36%;
  z-index: 0;
  border-radius: 14px;
  pointer-events: none;
  background:
    conic-gradient(from 0deg, rgba(86, 255, 235, 0.05), rgba(197, 98, 255, 0.45), rgba(50, 255, 196, 0.36), rgba(10, 20, 36, 0.08), rgba(86, 255, 235, 0.05)),
    radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.5), transparent 18%),
    radial-gradient(circle at 66% 68%, rgba(24, 224, 213, 0.48), transparent 26%);
  filter: blur(0.5px) saturate(1.35);
  mix-blend-mode: screen;
  opacity: 0.8;
  animation: built-shimmer-oil-cycle var(--built-tile-shimmer-cycle, 16000ms) linear infinite;
}

.built-tile-rusting::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: var(--built-tile-rust-coverage, 25%);
  z-index: 0;
  border-radius: 14px;
  pointer-events: none;

  background:
    linear-gradient(45deg, rgba(194, 103, 55, 0.94) 16%, rgba(255, 145, 86, 0.94) 50%, rgba(145, 66, 39, 0.96) 100%);

  box-shadow:
    inset 0 -4px 0 rgba(39, 20, 13, 0.32),
    inset 0 1px 0 rgba(255, 202, 126, 0.22);
  clip-path: polygon(0 0, 100% 0, 100% 72%, 94% 68%, 89% 78%, 82% 70%, 75% 84%, 68% 76%, 60% 86%, 52% 71%, 45% 81%, 36% 70%, 28% 84%, 20% 73%, 12% 80%, 0 70%);
}

.built-tile-lightning::before,
.built-tile-lightning::after {
  content: '';
  position: absolute;
  pointer-events: none;
}

.built-tile-lightning-old::before {
  inset: 0;
  z-index: 0;
  opacity: 0.12;
  animation: built-lightning-charge var(--built-tile-lightning-cycle, 3000ms) linear infinite;
  animation-delay: var(--built-tile-lightning-delay, 0ms);
}

.built-tile-lightning::before {
  top: 8%;
  left: 43%;
  width: 24%;
  height: 80%;
  z-index: 100;
  background: linear-gradient(180deg, #fffdf0 0%, #fff069 48%, #64d8ff 100%);
  clip-path: polygon(44% 0, 86% 0, 61% 38%, 100% 38%, 24% 100%, 43% 54%, 0 54%);
  filter: drop-shadow(0 0 7px rgba(255, 244, 100, 0.86));
  opacity: 0;
  animation: built-lightning-strike var(--built-tile-lightning-cycle, 3000ms) linear infinite;
  animation-delay: var(--built-tile-lightning-delay, 0ms);
}

.built-tile-lightning-spark-old {
  position: absolute;
  bottom: 7%;
  width: 18%;
  aspect-ratio: 1;
  z-index: 4;
  border-radius: 50%;
  pointer-events: none;
  background:
    radial-gradient(circle at 42% 38%, #ffffff 0 18%, #fff57e 28%, #6ee7ff 56%, rgba(68, 101, 255, 0.16) 78%, transparent 100%);
  box-shadow:
    0 0 7px rgba(255, 244, 115, 0.84),
    0 0 13px rgba(89, 220, 255, 0.56);
  opacity: 0;
  transform: scale(0.62);
  animation: built-lightning-spark var(--built-tile-lightning-cycle, 3000ms) linear infinite;
  animation-delay: var(--built-tile-lightning-delay, 0ms);
}

.built-tile-lightning-spark.spark-left-old {
  left: 10%;
}

.built-tile-lightning-spark.spark-right-old {
  right: 10%;
  animation-name: built-lightning-spark-right;
}

.built-tile-twin {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.34) 0%, rgba(255, 255, 255, 0) 42%),
    linear-gradient(90deg, #9df4dc 0 50%, #f4efe5 50% 100%);
}

.built-tile-twin::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 50% 52%, #f4efe5 0 15%, transparent 15.5%),
    linear-gradient(180deg, #d9fff4 0%, #62dfc3 54%, #2f9d94 100%) left / 50% 100% no-repeat,
    linear-gradient(180deg, #fffef8 0%, #f2ebe0 70%, #d9cec0 100%) right / 50% 100% no-repeat;
}

.built-tile-twin::after {
  content: '';
  position: absolute;
  inset: 4px;
  z-index: 1;
  border-radius: 12px;
  pointer-events: none;
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.34),
    inset 0 -4px 0 rgba(14, 76, 75, 0.16);
}

.built-tile-twin-active {
  filter: saturate(1.12) brightness(1.04);
  animation: built-twin-complete-glow 1600ms ease-in-out infinite;
}

.built-tile-twin-active::after {
  background:
    linear-gradient(115deg, transparent 10%, rgba(255, 255, 255, 0.68) 34%, rgba(154, 255, 229, 0.24) 46%, transparent 66%);
  background-size: 230% 100%;
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.38),
    inset 0 -4px 0 rgba(14, 76, 75, 0.16),
    0 0 18px rgba(99, 236, 209, 0.36);
  animation: built-twin-complete-shimmer 1600ms ease-in-out infinite;
}

.built-tile-twin-active::before {
  background:
    linear-gradient(180deg, #d9fff4 0%, #62dfc3 54%, #2f9d94 100%) left / 50% 100% no-repeat,
    linear-gradient(180deg, #d9fff4 0%, #62dfc3 54%, #2f9d94 100%) right / 50% 100% no-repeat;
}

.built-tile-void {
  background: radial-gradient(circle at 50% 50%, #02030a 0%, #050817 44%, #11182d 72%, #02030a 100%);
  box-shadow:
    inset 0 -4px 0 rgba(0, 0, 0, 0.56),
    0 12px 24px rgba(2, 4, 14, 0.34),
    0 0 0 1px rgba(125, 156, 255, 0.22);
}

.built-tile-void::before,
.built-tile-void::after {
  content: '';
  position: absolute;
  pointer-events: none;
}

.built-tile-void::before {
  inset: 8%;
  z-index: 0;
  border-radius: 18px;
  background:
    radial-gradient(circle at 14% 18%, rgba(255, 255, 255, 0.95) 0 1.5px, transparent 2px),
    radial-gradient(circle at 76% 14%, rgba(255, 255, 255, 0.88) 0 1px, transparent 1.7px),
    radial-gradient(circle at 90% 42%, rgba(255, 255, 255, 0.9) 0 1.4px, transparent 2px),
    radial-gradient(circle at 68% 84%, rgba(255, 255, 255, 0.82) 0 1.2px, transparent 1.8px),
    radial-gradient(circle at 22% 78%, rgba(255, 255, 255, 0.9) 0 1.3px, transparent 2px),
    radial-gradient(circle at 8% 52%, rgba(255, 255, 255, 0.72) 0 1px, transparent 1.7px),
    radial-gradient(circle at 47% 8%, rgba(255, 255, 255, 0.78) 0 1px, transparent 1.7px),
    radial-gradient(circle at 54% 94%, rgba(255, 255, 255, 0.82) 0 1.2px, transparent 1.8px),
    radial-gradient(circle at 18% 88%, rgba(255, 255, 255, 0.95) 0 1.5px, transparent 2px),
    radial-gradient(circle at 26% 14%, rgba(255, 255, 255, 0.88) 0 1px, transparent 1.7px),
    radial-gradient(circle at 70% 42%, rgba(255, 255, 255, 0.9) 0 1.4px, transparent 2px),
    radial-gradient(circle at 89% 84%, rgba(255, 255, 255, 0.82) 0 1.2px, transparent 1.8px),
    radial-gradient(circle at 20% 18%, rgba(255, 255, 255, 0.9) 0 1.3px, transparent 2px),
    radial-gradient(circle at 8% 52%, rgba(255, 255, 255, 0.72) 0 1px, transparent 1.7px),
    radial-gradient(circle at 57% 8%, rgba(255, 255, 255, 0.78) 0 1px, transparent 1.7px),
    radial-gradient(circle at 14% 74%, rgba(255, 255, 255, 0.82) 0 1.2px, transparent 1.8px);
  transform-origin: 50% 50%;
  animation: built-void-stars-collapse 3700ms linear infinite;
}

.built-tile-void::after {
  inset: 26%;
  z-index: 1;
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 50%, #000000 0 42%, rgba(1, 2, 8, 0.88) 43% 62%, transparent 64%);
  box-shadow:
    0 0 14px rgba(230, 240, 255, 0.22),
    inset 0 0 16px rgba(0, 0, 0, 0.94);
  animation: built-void-pulse 1400ms ease-in-out infinite;
}


.built-tile-glass::before,
.built-tile-glass::after {
  content: '';
  position: absolute;
  pointer-events: none;
}

.built-tile-glass::before {
  inset: 10%;
  z-index: 0;
  border-radius: 10px;
  background:
    linear-gradient(120deg, transparent 0 44%, rgba(255, 255, 255, 0.52) 45% 48%, transparent 49% 100%),
    radial-gradient(circle at 26% 22%, rgba(255, 255, 255, 0.7) 0 8%, transparent 9% 100%);
  opacity: 0.86;
}

.built-tile-glass::after {
  inset: 16%;
  z-index: 1;
  border-radius: 8px;
  opacity: 0;
  background:
    linear-gradient(34deg, transparent 0 47%, rgba(15, 54, 80, 0.72) 48% 50%, transparent 51% 100%),
    linear-gradient(112deg, transparent 0 42%, rgba(15, 54, 80, 0.58) 43% 45%, transparent 46% 100%),
    linear-gradient(160deg, transparent 0 54%, rgba(255, 255, 255, 0.74) 55% 57%, transparent 58% 100%);
}

.built-tile-glass-cracked {
  filter: grayscale(0.18) brightness(0.82) saturate(0.78);
}

.built-tile-glass-cracked::after {
  opacity: 1;
}

.built-tile-cornucopia {
  border: 4px solid transparent;
  background:
    linear-gradient(180deg, #fff8dd 0%, #e9b65f 54%, #8c5428 100%) padding-box,
    conic-gradient(from 20deg, #ff4f6d, #ffcb4d, #57e66d, #36c7ff, #8d6bff, #ff4f6d) border-box;
  box-shadow:
    inset 0 -3px 0 rgba(94, 52, 23, 0.28),
    0 10px 16px rgba(79, 43, 20, 0.18),
    0 0 0 1px rgba(255, 224, 139, 0.46),
    0 0 16px rgba(255, 211, 89, 0.22);
}

.built-tile-cornucopia::before,
.built-tile-cornucopia::after {
  content: '';
  position: absolute;
  pointer-events: none;
}



.built-tile-cornucopia::before {
  left: 0%;
  right: 0%;
  bottom: 00%;
  height: var(--cornucopia-fill, 0%);
  z-index: 1;

  background:
    radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.7) 0 10%, transparent 11%),
    linear-gradient(190deg, rgba(255, 74, 109, 0.76), rgba(255, 210, 74, 0.8), rgba(73, 226, 118, 0.76), rgba(62, 191, 255, 0.78), rgba(145, 106, 255, 0.78));
  box-shadow: 0 0 12px rgba(255, 235, 133, 0.32);
  opacity: 0.35;
  transition: height 180ms ease;
}

.built-tile-hourglass {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.32), transparent 38%),
    linear-gradient(180deg, #fff7d6 0%, #d9ad54 48%, #6f4d2a 100%);
  box-shadow:
    inset 0 -3px 0 rgba(88, 55, 24, 0.32),
    0 10px 16px rgba(80, 52, 28, 0.18),
    0 0 0 1px rgba(255, 223, 154, 0.46);
}

.built-tile-hourglass::before,
.built-tile-hourglass::after {
  content: '';
  position: absolute;
  pointer-events: none;
}

.built-tile-hourglass::before {
  inset: 14% 27%;
  z-index: 0;
  border-radius: 999px;
  border: 3px solid rgba(71, 42, 19, 0.72);
  background:
    linear-gradient(180deg, transparent 0 45%, rgba(71, 42, 19, 0.58) 46% 54%, transparent 55% 100%),
    linear-gradient(180deg, rgba(255, 244, 194, 0.82) 0 28%, rgba(255, 244, 194, 0.32)  29% 50%, rgba(238, 178, 75, 0.88) 51% 100%);
  clip-path: polygon(14% 0, 86% 0, 62% 50%, 86% 100%, 14% 100%, 38% 50%);
}


.built-tile-bag {
  background:
    repeating-linear-gradient(180deg, rgba(72, 42, 18, 0.24) 0 4px, transparent 4px 13px),
    linear-gradient(180deg, #d9b280 0%, #9a6a37 58%, #5d3418 100%);
  box-shadow:
    inset 0 -3px 0 rgba(58, 31, 11, 0.34),
    0 10px 16px rgba(67, 39, 18, 0.18),
    0 0 0 1px rgba(226, 180, 112, 0.34);
}

.built-tile-bag::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: 10px;
  pointer-events: none;
  background:
    radial-gradient(circle at 18% 44%, rgba(242, 214, 34, 0.72) 0 3px, transparent 4px),
    radial-gradient(circle at 18% 56%, rgba(242, 214, 34, 0.72) 0 3px, transparent 4px),
    radial-gradient(circle at 82% 44%, rgba(242, 214, 34, 0.72) 0 3px, transparent 4px),
    radial-gradient(circle at 82% 56%, rgba(242, 214, 34, 0.72) 0 3px, transparent 4px),
    linear-gradient(90deg, transparent 0 11%, rgba(64, 35, 13, 0.72) 11% 18%, transparent 18% 82%, rgba(64, 35, 13, 0.72) 82% 89%, transparent 89% 100%),
    repeating-linear-gradient(180deg, rgba(80, 45, 18, 0.28) 0 4px, transparent 4px 14px),
    linear-gradient(180deg, rgba(234, 188, 121, 0.2), rgba(90, 51, 22, 0.22));
}

.built-tile-bagged:not(.built-tile-bag)::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 7;
  border-radius: 10px;
  pointer-events: none;
  background:
    repeating-linear-gradient(180deg, rgba(68, 39, 16, 0.32) 0 4px, transparent 4px 13px),
    linear-gradient(90deg, transparent 0 11%, rgba(64, 35, 13, 0.38) 11% 18%, transparent 18% 82%, rgba(64, 35, 13, 0.38) 82% 89%, transparent 89% 100%),
    linear-gradient(180deg, rgba(215, 169, 102, 0.38), rgba(85, 48, 19, 0.34));
  box-shadow:
    inset 0 0 0 2px rgba(79, 47, 20, 0.38),
    inset 8px 0 0 rgba(70, 40, 16, 0.22),
    inset -8px 0 0 rgba(70, 40, 16, 0.22);
}

.built-tile-barricade {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.24), transparent 36%),
    repeating-linear-gradient(135deg, #2a220a 0 12%, #2a220a 12% 22%, #ffd84c 22% 36%, #ffd84c 36% 48%),
    linear-gradient(180deg, #ffe476 0%, #f0b822 58%, #9b5e05 100%);
  box-shadow:
    inset 0 -4px 0 rgba(86, 45, 4, 0.34),
    0 12px 20px rgba(92, 55, 5, 0.22),
    0 0 0 1px rgba(255, 226, 106, 0.42);
}

.built-tile-barricade::before {
  content: '';
  position: absolute;
  inset: 12% 5%;
  z-index: 0;
  border-radius: 10px;
  pointer-events: none;
  background:
    linear-gradient(90deg, transparent 0 8%, rgba(255, 245, 166, 0.76) 8% 12%, transparent 12% 88%, rgba(255, 245, 166, 0.76) 88% 92%, transparent 92% 100%),
    repeating-linear-gradient(135deg, rgba(35, 26, 7, 0.92) 0 10px, rgba(35, 26, 7, 0.92) 10px 18px, rgba(255, 220, 68, 0.96) 18px 32px, rgba(255, 220, 68, 0.96) 32px 42px);
  box-shadow:
    inset 0 0 0 2px rgba(47, 30, 4, 0.78),
    0 3px 0 rgba(80, 47, 5, 0.46);
}

.built-tile-leecher {
  background:
    radial-gradient(circle at 50% 42%, rgba(217, 255, 179, 0.62) 0 11%, transparent 12%),
    linear-gradient(180deg, #e2ffcf 0%, #83d65a 48%, #276c35 100%);
  box-shadow:
    inset 0 -4px 0 rgba(19, 84, 35, 0.34),
    0 12px 22px rgba(23, 84, 46, 0.24),
    0 0 0 1px rgba(184, 255, 150, 0.42);
}

.built-tile-leecher::before {
  content: '';
  position: absolute;
  inset: 12%;
  z-index: 0;
  border-radius: 50%;
  pointer-events: none;
  background:
    radial-gradient(circle at 50% 50%, rgba(31, 105, 48, 0.95) 0 18%, transparent 19%),
    conic-gradient(from 20deg, transparent 0 7%, rgba(35, 93, 42, 0.72) 7% 14%, transparent 14% 24%, rgba(35, 93, 42, 0.72) 24% 31%, transparent 31% 48%, rgba(35, 93, 42, 0.72) 48% 56%, transparent 56% 70%, rgba(35, 93, 42, 0.72) 70% 78%, transparent 78% 100%);
  animation: built-leecher-pulse 1700ms ease-in-out infinite;
}

.built-tile-leecher-drained:not(.built-tile-leecher) {
  filter: grayscale(0.45) brightness(0.74) saturate(0.64);
  box-shadow:
    inset 0 0 0 3px rgba(44, 92, 50, 0.38),
    var(--built-tile-shadow, inset 0 -3px 0 rgba(0, 0, 0, 0.16));
}
.built-tile-leecher-drained:not(.tile-leecher)::before{
  content: '';
  position: absolute;
  left: 70%;
  right: 05%;
  top: 18%;
  height: 5px;
  border-radius: 999px;
  background: rgba(213, 31, 55, 0.94);
  box-shadow: 0 0 0 2px rgba(255, 231, 220, 0.62), 0 6px 12px rgba(88, 5, 18, 0.26);
  pointer-events: none;
  transform: translateY(-85%) rotate(-38deg);
  z-index: 4;
}

.built-tile-shimmer .tile-letter,
.built-tile-rusting .tile-letter,
.built-tile-lightning .tile-letter,
.built-tile-twin .tile-letter,
.built-tile-glass .tile-letter,
.built-tile-cornucopia .tile-letter,
.built-tile-void .tile-letter,
.built-tile-hourglass .tile-letter,
.built-tile-barricade .tile-letter,
.built-tile-bag .tile-letter,
.built-tile-leecher .tile-letter {
  position: relative;
  z-index: 3;
}

.built-tile-barricade .tile-letter {
  text-shadow:
    0 2px 0 rgba(255, 235, 132, 0.5),
    0 0 6px rgba(255, 249, 190, 0.34);
}
.built-tile-rusting{
  --tile-letter-stroke: 1px rgba(255, 255, 255, 0.92);
}
.built-tile-rusting .tile-score{
  color: white;
  --tile-letter-stroke: 1px rgba(0, 0, 0, 0.92);
}


.built-tile-shimmer .tile-score,
.built-tile-rusting .tile-score,
.built-tile-lightning .tile-score,
.built-tile-twin .tile-score,
.built-tile-glass .tile-score,
.built-tile-cornucopia .tile-score,
.built-tile-void .tile-score,
.built-tile-hourglass .tile-score,
.built-tile-barricade .tile-score,
.built-tile-bag .tile-score,
.built-tile-leecher .tile-score {
  z-index: 5;
}

.built-tile-shimmer .tile-modifier,
.built-tile-rusting .tile-modifier,
.built-tile-lightning .tile-modifier,
.built-tile-twin .tile-modifier,
.built-tile-glass .tile-modifier,
.built-tile-cornucopia .tile-modifier,
.built-tile-void .tile-modifier,
.built-tile-hourglass .tile-modifier,
.built-tile-barricade .tile-modifier,
.built-tile-bag .tile-modifier,
.built-tile-leecher .tile-modifier {
  z-index: 6;
}

@keyframes built-lightning-charge {
  0% {
    opacity: 0.08;
    filter: brightness(1) saturate(1);
  }
  74% {
    opacity: 0.28;
    filter: brightness(1.08) saturate(1.2);
  }
  88% {
    opacity: 0.48;
    filter: brightness(1.24) saturate(1.45);
  }
  94% {
    opacity: 0.98;
    filter: brightness(1.72) saturate(1.8);
  }
  100% {
    opacity: 0.1;
    filter: brightness(1) saturate(1);
  }
}

@keyframes built-lightning-spark {
  0%,
  14%,
  100% {
    opacity: 0;
    transform: scale(0.62);
  }
  20% {
    opacity: 1;
    transform: scale(1.05);
    filter: brightness(1.4) saturate(1.35);
  }
  28%,
  96% {
    opacity: 0.72;
    transform: scale(0.92);
    filter: brightness(1.12) saturate(1.15);
  }
  99% {
    opacity: 0.9;
    transform: scale(1);
    filter: brightness(1.36) saturate(1.35);
  }
}

@keyframes built-lightning-spark-right {
  0%,
  42%,
  100% {
    opacity: 0;
    transform: scale(0.62);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
    filter: brightness(1.4) saturate(1.35);
  }
  58%,
  96% {
    opacity: 0.72;
    transform: scale(0.92);
    filter: brightness(1.12) saturate(1.15);
  }
  99% {
    opacity: 0.9;
    transform: scale(1);
    filter: brightness(1.36) saturate(1.35);
  }
}

@keyframes built-lightning-strike {
  0%,
  94% {
    opacity: 0;
    transform: translateY(-5px) scaleY(0.9);
  }
  97% {
    opacity: 0.94;
    transform: translateY(0) scaleY(1.08);
  }
  100% {
    opacity: 0.82;
    transform: translateY(2px) scaleY(1);
  }
}

@keyframes built-twin-complete-glow {
  0%,
  100% {
    box-shadow: var(--built-tile-shadow, inset 0 -3px 0 rgba(0, 0, 0, 0.16));
  }
  50% {
    box-shadow:
      inset 0 0 0 2px rgba(214, 255, 245, 0.52),
      inset 0 -4px 0 rgba(14, 76, 75, 0.16),
      0 0 18px rgba(97, 232, 204, 0.5),
      var(--built-tile-shadow, inset 0 -3px 0 rgba(0, 0, 0, 0.16));
  }
}

@keyframes built-twin-complete-shimmer {
  0%,
  100% {
    background-position: 180% 0;
    opacity: 0.22;
  }
  50% {
    background-position: 10% 0;
    opacity: 0.82;
  }
}

@keyframes built-void-stars-collapse {
  0% {
    opacity: 0;
    transform: scale(1.18) rotate(0deg);
  }
  14% {
    opacity: 0.95;
  }
  72% {
    opacity: 0.78;
    transform: scale(0.24) rotate(28deg);
  }
  100% {
    opacity: 0;
    transform: scale(0.04) rotate(42deg);
  }
}

@keyframes built-void-pulse {
  0%,
  100% {
    transform: scale(0.92);
    opacity: 0.9;
  }
  50% {
    transform: scale(1.08);
    opacity: 1;
  }
}

@keyframes built-hourglass-sand {
  0%,
  100% {
    opacity: 0.64;
    transform: translateY(-2px);
  }
  50% {
    opacity: 1;
    transform: translateY(2px);
  }
}

@keyframes built-leecher-pulse {
  0%,
  100% {
    transform: scale(0.92) rotate(0deg);
    opacity: 0.72;
  }
  50% {
    transform: scale(1.08) rotate(16deg);
    opacity: 0.95;
  }
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

.built-tile-disabled-gold {
  filter: saturate(0.99) brightness(0.94);
  background:  linear-gradient(180deg, #fff7d2 0%, #f4ce67ca 72%, #c68b1dbc 100%);
}
.built-tile-muted-consonant {
  filter: saturate(0.58) brightness(0.92);
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
  z-index: 7;
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

@keyframes built-shimmer-oil-cycle {
  0% {
    transform: rotate(0deg) scale(1);
    filter: blur(0.55px) saturate(1.18);
  }
  100% {
    transform: rotate(360deg) scale(1);
    filter: blur(0.55px) saturate(1.18);
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
  z-index: 58;
  font-size: 2rem;
  font-weight: 900;
  line-height: 1;
  color: rgba(255, 191, 0, 0.997);
  text-shadow: 1px 1px 1px rgba(10, 10, 10, 0.98);
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
    top: -11px;
    left: 12px;
    right: 12px;
    z-index: 58;
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
