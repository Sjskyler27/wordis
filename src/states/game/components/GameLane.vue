<template>
  <section
    class="lane"
    :class="{
      'lane-burst-low': burstTier === 'low',
      'lane-burst-medium': burstTier === 'medium',
      'lane-burst-high': burstTier === 'high',
      'lane-burst-epic': burstTier === 'epic',
      'lane-loose-rack': hasShuffleOnSubmit
    }"
  >
    <div class="lane-header">
      <div>
        <p class="lane-label">{{ label }} </p>
        <h2>
          {{ submittedWord || 'Waiting for a word...' }}
          <strong v-if="submittedWord">+ {{ displayWordScore }}</strong>
        </h2>
        <p v-if="submittedWord && displayBurnPenalty > 0" class="lane-burn-penalty">
          - {{ displayBurnPenalty }} burn
        </p>
      </div>
      <button
        v-if="props.isMobile"
        type="button"
        class="mobile-inspect-toggle"
        :class="{ active: mobileInspectEnabled }"
        :aria-pressed="mobileInspectEnabled"
        :title="mobileInspectEnabled ? 'Disable tile descriptions' : 'Enable tile descriptions'"
        @click="toggleMobileInspect"
      >
        <span aria-hidden="true">🔍</span>
      </button>
    </div>

    <div class="rack-grid">
      <div v-for="(tile, index) in tiles" :key="`${side}-slot-${index}`" class="rack-slot">
        <Transition :name="getTileTransitionName(tile)" mode="out-in">
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
              'tile-banned-letter': isBannedLetter(tile),
              'tile-round-fleeting': isFleetingRoundTile(tile),
              'tile-round-rusting': isRustingIdleTile(tile),
              'tile-controller-focus': controllerFocusedTileId === tile.id,
              [getTileAnimationClass(tile)]: !!getTileAnimationClass(tile)
            }"
            :style="getTileStyle(tile)"
            :data-controller-tile="`${side}-${index}`"
            @click="handleTileClick(tile, $event)"
            @mouseenter="showTooltipLater(tile, $event)"
            @mousemove="updateTooltipPosition($event)"
            @mouseleave="hideTooltip"
          >
            <span v-if="!getTileUi(tile).hideBadge && tile.status !== 'normal'" class="tile-modifier" :style="getBadgeStyle(tile)">
              {{ getTileBadge(tile) }}
            </span>
            <span v-if="getRoundTileMarker(tile)" class="tile-round-marker">
              {{ getRoundTileMarker(tile) }}
            </span>
            <span class="tile-score">{{ getTileScore(tile) }}</span>
            <span class="tile-letter">{{ tile.letter }}</span>
          </button>
        </Transition>
      </div>
    </div>
    <TileHoverTooltip
      :tile="hoveredTile"
      :visible="canShowTooltip"
      :x="tooltipPosition.x"
      :y="tooltipPosition.y"
      :dismissible="props.isMobile && mobileInspectEnabled"
      @close="hideTooltip"
    />
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { getModifierBadge, getModifierUi, tileScore } from '../tile-logic.js';
import TileHoverTooltip from './TileHoverTooltip.vue';

const props = defineProps({
  isMobile: Boolean,
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
  currentPlayerScores: {
    type: Object,
    default: () => ({})
  },
  scoreOptions: {
    type: Object,
    default: () => ({})
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
  lastWordBreakdown: {
    type: Object,
    default: () => ({
      wordScore: 0,
      burnPenalty: 0,
      netScore: 0
    })
  },
  burstPulse: {
    type: Number,
    default: 0
  },
  clearPulse: {
    type: Number,
    default: 0
  },
  controllerFocusedTileId: {
    type: String,
    default: ''
  }
});

const hoveredTile = ref(null);
const isTooltipVisible = ref(false);
const tooltipPosition = ref({ x: 0, y: 0 });
const mobileInspectEnabled = ref(false);
let tooltipTimeoutId = null;

const emit = defineEmits(['tile-click']);
const canShowTooltip = computed(() => isTooltipVisible.value && (!props.isMobile || mobileInspectEnabled.value));

const setTooltipPositionFromElement = (element) => {
  const rect = element.getBoundingClientRect();
  const tooltipWidth = Math.min(280, window.innerWidth - 24);
  const centeredX = rect.left + (rect.width / 2) - (tooltipWidth / 2);
  const preferredY = rect.top - 16;

  tooltipPosition.value = {
    x: Math.max(12, Math.min(centeredX, window.innerWidth - tooltipWidth - 12)),
    y: Math.max(12, preferredY)
  };
};

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
  if (props.isMobile && !mobileInspectEnabled.value) {
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

const toggleMobileInspect = () => {
  mobileInspectEnabled.value = !mobileInspectEnabled.value;

  if (!mobileInspectEnabled.value) {
    hideTooltip();
  }
};

const handleTileClick = (tile, event) => {
  if (props.isMobile && mobileInspectEnabled.value) {
    setTooltipPositionFromElement(event.currentTarget);
    hoveredTile.value = tile;
    isTooltipVisible.value = true;
    return;
  }

  emit('tile-click', tile);
};

watch(() => mobileInspectEnabled.value, (isEnabled) => {
  if (props.isMobile && !isEnabled) {
    hideTooltip();
  }
});

const displayWordScore = computed(() => {
  return props.lastWordBreakdown?.wordScore ?? props.lastWordScore ?? 0;
});

const displayBurnPenalty = computed(() => {
  return props.lastWordBreakdown?.burnPenalty ?? 0;
});

const getYinYangState = (tile) => {
  if (tile?.status !== 'yinYang') {
    return '';
  }

  const opponentSide = props.side === 'host' ? 'opponent' : 'host';
  const scoreDelta = (props.currentPlayerScores?.[props.side] || 0) - (props.currentPlayerScores?.[opponentSide] || 0);
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
    return 'YNG';
  }

  return getModifierBadge(tile);
};

const getTileScore = (tile) => tileScore(tile, {
  side: props.side,
  scores: props.currentPlayerScores,
  ...props.scoreOptions
});
const getTileLetter = (tile) => (tile?.baseLetter || tile?.letter || '').toUpperCase();
const isBannedLetter = (tile) => {
  const bannedLetters = new Set(props.scoreOptions?.roundModifierEffects?.bannedLetters || []);
  return bannedLetters.has(getTileLetter(tile));
};
const isHotBurnTile = (tile) => {
  return tile.status === 'burningTile' && (props.scoreOptions?.roundModifierEffects?.idlePenaltyMultiplier || 1) > 1;
};
const isFleetingRoundTile = (tile) => {
  return Boolean(props.scoreOptions?.roundModifierEffects?.fleetingAllTiles) && tile.status !== 'normal';
};
const isRustingIdleTile = (tile) => {
  return (props.scoreOptions?.roundModifierEffects?.idleScoreDelta || 0) < 0 && !selectedTileIds.value.has(tile.id);
};
const hasShuffleOnSubmit = computed(() => Boolean(props.scoreOptions?.roundModifierEffects?.shuffleOnSubmit));
const getRoundTileMarker = (tile) => {
  if (isHotBurnTile(tile)) {
    return 'x2';
  }
  if (isFleetingRoundTile(tile)) {
    return 'clear';
  }
  if (isRustingIdleTile(tile)) {
    return '-1';
  }

  return '';
};

const getTileStyle = (tile) => {
  const ui = getTileUi(tile);

  return {
    '--tile-bg': ui.tileBackground,
    '--tile-shadow': ui.tileShadow,
    '--tile-hover-shadow': ui.tileHoverShadows || ui.tileShadow,
    '--tile-focus-shadow': ui.tileFocusShadow || ui.tileShadow,
    '--tile-text-color': ui.textColor,
    '--tile-letter-stroke': tile.status === 'yinYang' ? '1px rgba(255, 255, 255, 0.92)' : '0 transparent',
    '--tile-enter-delay': `${tileEnterDelays.value[tile.id] || 0}ms`,
    '--tile-animation-duration': `${getTileAnimationDuration(tile)}ms`
  };
};

const getBadgeStyle = (tile) => {
  const ui = getTileUi(tile);

  return {
    background: ui.badgeBackground,
    color: ui.badgeColor
  };
};

const activeTileAnimations = ref({});
const seenTileAnimationKeys = ref({});
const tileEnterDelays = ref({});
const isRackClearAnimating = ref(false);
const tileAnimationTimeoutIds = new Map();
const tileAnimationDelayTimeoutIds = new Map();
const tileEnterDelayTimeoutIds = new Map();
let rackClearAnimationTimeoutId = null;
const TILE_ANIMATION_STAGGER_MS = 50;
const RACK_CLEAR_STAGGER_MS = 16;
const TILE_ANIMATION_DURATIONS = {
  blaze: 580,
  emerald: 580,
  'gold-shine': 580,
  'unlock-dissolve': 530
};

const getTileAnimationDuration = (tile) => {
  const animationName = tile?.animationState?.name;
  return TILE_ANIMATION_DURATIONS[animationName] || 900;
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

const startTileAnimation = (tile, options = {}) => {
  const animationState = tile?.animationState;
  if (!tile?.id || !animationState?.name || !animationState?.key) {
    return;
  }

  if (!options.alreadySeen && seenTileAnimationKeys.value[tile.id] === animationState.key) {
    return;
  }

  if (!options.alreadySeen) {
    seenTileAnimationKeys.value = {
      ...seenTileAnimationKeys.value,
      [tile.id]: animationState.key
    };
  }
  activeTileAnimations.value = {
    ...activeTileAnimations.value,
    [tile.id]: animationState.key
  };

  window.clearTimeout(tileAnimationTimeoutIds.get(tile.id));
  tileAnimationTimeoutIds.set(tile.id, window.setTimeout(() => {
    stopTileAnimation(tile.id);
  }, getTileAnimationDuration(tile)));
};

const scheduleTileAnimation = (tile, index = 0) => {
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

  window.clearTimeout(tileAnimationDelayTimeoutIds.get(tile.id));

  const staggerMs = isRackClearAnimating.value ? RACK_CLEAR_STAGGER_MS : TILE_ANIMATION_STAGGER_MS;
  const delay = index * staggerMs;
  if (!delay) {
    startTileAnimation(tile, { alreadySeen: true });
    return;
  }

  tileAnimationDelayTimeoutIds.set(tile.id, window.setTimeout(() => {
    tileAnimationDelayTimeoutIds.delete(tile.id);
    startTileAnimation(tile, { alreadySeen: true });
  }, delay));
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

const getTileTransitionName = (tile) => {
  if (isRackClearAnimating.value) {
    return 'rack-clear-tile';
  }

  return tile?.status === 'ghostTile' ? 'ghost-tile' : 'rack-tile';
};

const scheduleTileEnterDelays = (nextTiles = [], previousTiles = []) => {
  const previousIds = new Set(previousTiles.map((tile) => tile?.id).filter(Boolean));
  const enteringTiles = nextTiles.filter((tile) => tile?.id && !previousIds.has(tile.id));

  if (!enteringTiles.length) {
    return;
  }

  const nextDelays = { ...tileEnterDelays.value };
  const staggerMs = isRackClearAnimating.value ? RACK_CLEAR_STAGGER_MS : TILE_ANIMATION_STAGGER_MS;
  const enterDurationMs = isRackClearAnimating.value ? 150 : 260;

  enteringTiles.forEach((tile, enterIndex) => {
    nextDelays[tile.id] = enterIndex * staggerMs;

    window.clearTimeout(tileEnterDelayTimeoutIds.get(tile.id));
    tileEnterDelayTimeoutIds.set(tile.id, window.setTimeout(() => {
      tileEnterDelayTimeoutIds.delete(tile.id);
      const delays = { ...tileEnterDelays.value };
      delete delays[tile.id];
      tileEnterDelays.value = delays;
    }, nextDelays[tile.id] + enterDurationMs));
  });

  tileEnterDelays.value = nextDelays;
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

watch(() => props.clearPulse, (nextPulse) => {
  if (!nextPulse) {
    return;
  }

  window.clearTimeout(rackClearAnimationTimeoutId);
  isRackClearAnimating.value = true;
  rackClearAnimationTimeoutId = window.setTimeout(() => {
    isRackClearAnimating.value = false;
  }, 2500);
});

watch(() => props.tiles, (nextTiles, previousTiles = []) => {
  scheduleTileEnterDelays(nextTiles, previousTiles);
  nextTiles
    .filter((tile) => {
      const animationState = tile?.animationState;
      return tile?.id
        && animationState?.name
        && animationState?.key
        && seenTileAnimationKeys.value[tile.id] !== animationState.key;
    })
    .forEach((tile, animationIndex) => scheduleTileAnimation(tile, animationIndex));
}, {
  immediate: true,
  deep: true
});

watch(() => props.isMobile, (isMobile) => {
  if (!isMobile) {
    mobileInspectEnabled.value = false;
    hideTooltip();
  }
});

onBeforeUnmount(() => {
  window.clearTimeout(burstTimeoutId);
  window.clearTimeout(tooltipTimeoutId);
  window.clearTimeout(rackClearAnimationTimeoutId);
  tileAnimationTimeoutIds.forEach((timeoutId) => {
    window.clearTimeout(timeoutId);
  });
  tileAnimationTimeoutIds.clear();
  tileAnimationDelayTimeoutIds.forEach((timeoutId) => {
    window.clearTimeout(timeoutId);
  });
  tileAnimationDelayTimeoutIds.clear();
  tileEnterDelayTimeoutIds.forEach((timeoutId) => {
    window.clearTimeout(timeoutId);
  });
  tileEnterDelayTimeoutIds.clear();
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

.mobile-inspect-toggle {
  flex-shrink: 0;
  width: 46px;
  height: 46px;
  border: 1px solid rgba(255, 202, 103, 0.28);
  border-radius: 14px;
  background: rgba(34, 9, 24, 0.72);
  color: #ffe0a5;
  font-size: 1.1rem;
  box-shadow: 0 10px 20px rgba(16, 4, 11, 0.22);
}

.mobile-inspect-toggle.active {
  background: rgba(255, 202, 103, 0.18);
  border-color: rgba(255, 202, 103, 0.65);
  box-shadow: 0 0 0 3px rgba(255, 202, 103, 0.16);
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

.lane-burn-penalty {
  margin: 6px 0 0;
  font-size: 0.82rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 167, 134, 0.95);
}



.rack-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  max-width: 530px;
  position: relative;
}

.rack-slot {
  min-height: 94px;
}

.lane-loose-rack .rack-grid::after {
  content: 'SHUFFLE';
  position: absolute;
  right: 8px;
  top: -18px;
  padding: 4px 9px;
  border: 1px solid rgba(206, 235, 255, 0.42);
  border-radius: 999px;
  background: rgba(27, 37, 62, 0.78);
  color: #d8f0ff;
  font-size: 0.6rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  box-shadow: 0 8px 14px rgba(20, 13, 38, 0.2);
  pointer-events: none;
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
  outline: 5px solid rgba(130, 253, 238, 0.85);

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

.tile-banned-letter::before {
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

.tile-round-fleeting {
  box-shadow:
    inset 0 0 0 3px rgba(237, 244, 255, 0.5),
    inset 0 -18px 22px rgba(30, 23, 41, 0.18),
    var(--tile-shadow, inset 0 -4px 0 rgba(0, 0, 0, 0.12), 0 10px 18px rgba(45, 10, 24, 0.16));
  filter: saturate(0.86) brightness(0.98);
}

.tile-round-rusting {
  box-shadow:
    inset 0 0 0 3px rgba(158, 185, 187, 0.58),
    inset 0 -18px 24px rgba(24, 46, 45, 0.22),
    var(--tile-shadow, inset 0 -4px 0 rgba(0, 0, 0, 0.12), 0 10px 18px rgba(45, 10, 24, 0.16));
  filter: saturate(0.7) brightness(0.95);
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
  animation: tile-blaze var(--tile-animation-duration, 1080ms) ease-out;
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
  animation: tile-blaze-flare var(--tile-animation-duration, 1080ms) ease-out;
}

.tile-anim-emerald {
  animation: tile-emerald var(--tile-animation-duration, 1180ms) ease-out;
}

.tile-anim-emerald::after {
  content: '';
  position: absolute;
  inset: -10px;
  border-radius: 24px;
  pointer-events: none;
  background:
    radial-gradient(circle at 50% 50%, rgba(215, 255, 230, 0.95) 0%, rgba(82, 239, 171, 0.58) 26%, rgba(0, 170, 118, 0.22) 52%, rgba(0, 170, 118, 0) 74%),
    conic-gradient(from 20deg, rgba(214, 255, 228, 0), rgba(214, 255, 228, 0.82), rgba(41, 211, 148, 0), rgba(214, 255, 228, 0.64), rgba(214, 255, 228, 0));
  mix-blend-mode: screen;
  animation: tile-emerald-flare var(--tile-animation-duration, 1180ms) ease-out;
}

.tile-anim-gold-shine {
  animation: tile-gold-shine var(--tile-animation-duration, 680ms) ease-out;
}

.tile-anim-gold-shine::after {
  content: '';
  position: absolute;
  inset: -6px;
  border-radius: 22px;
  pointer-events: none;
  background:
    linear-gradient(115deg, rgba(255, 255, 255, 0) 12%, rgba(255, 255, 255, 0.92) 34%, rgba(255, 220, 104, 0.52) 46%, rgba(255, 255, 255, 0) 66%),
    radial-gradient(circle at 50% 50%, rgba(255, 230, 132, 0.52), rgba(255, 190, 45, 0) 70%);
  mix-blend-mode: screen;
  animation: tile-gold-shine-flare var(--tile-animation-duration, 680ms) ease-out forwards;
}

.tile-anim-unlock-dissolve {
  animation: tile-unlock-dissolve var(--tile-animation-duration, 1320ms) ease-out;
}

.tile-anim-unlock-dissolve::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 16px;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(17, 11, 21, 0.9), rgba(0, 0, 0, 0.74));
  animation: tile-lock-overlay-dissolve var(--tile-animation-duration, 1320ms) ease-out forwards;
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

@keyframes tile-emerald {
  0%,
  100% {
    transform: translateY(0) scale(1);
    filter: saturate(1) brightness(1);
  }
  26% {
    transform: translateY(-2px) scale(1.035);
    filter: saturate(1.35) brightness(1.16);
  }
  52% {
    transform: translateY(0) scale(1.01);
    filter: saturate(1.2) brightness(1.08);
  }
}

@keyframes tile-emerald-flare {
  0% {
    opacity: 0;
    transform: scale(0.78) rotate(0deg);
  }
  24% {
    opacity: 1;
    transform: scale(1.08) rotate(18deg);
  }
  100% {
    opacity: 0;
    transform: scale(1.28) rotate(72deg);
  }
}

@keyframes tile-gold-shine {
  0% {
    transform: translateY(5px) scale(0.94);
    filter: saturate(1.04) brightness(0.94);
  }
  36% {
    transform: translateY(-4px) scale(1.045);
    filter: saturate(1.28) brightness(1.18);
  }
  68% {
    transform: translateY(0) scale(1.01);
    filter: saturate(1.14) brightness(1.08);
  }
  100% {
    transform: translateY(0) scale(1);
    filter: saturate(1) brightness(1);
  }
}

@keyframes tile-gold-shine-flare {
  0% {
    opacity: 0;
    transform: translateX(-42%) scale(0.9);
  }
  22% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateX(42%) scale(1.08);
  }
}

@keyframes tile-unlock-dissolve {
  0% {
    color: #f6efe1;
    filter: brightness(0.52) saturate(0.7);
  }
  58% {
    color: #8d817a;
    filter: brightness(0.9) saturate(0.94);
  }
  100% {
    color: #1c1930;
    filter: none;
  }
}

@keyframes tile-lock-overlay-dissolve {
  0% {
    opacity: 1;
    filter: blur(0);
  }
  55% {
    opacity: 0.48;
    filter: blur(1px);
  }
  100% {
    opacity: 0;
    filter: blur(4px);
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
  -webkit-text-stroke: var(--tile-letter-stroke, 0 transparent);
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

.tile-round-marker {
  position: absolute;
  bottom: 7px;
  left: 50%;
  z-index: 3;
  min-width: 34px;
  padding: 3px 9px;
  border-radius: 999px;
  background: rgba(32, 9, 12, 0.88);
  color: #ffd673;
  font-size: 0.72rem;
  font-weight: 950;
  line-height: 1;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  box-shadow:
    0 0 0 2px rgba(255, 212, 115, 0.42),
    0 7px 13px rgba(63, 16, 13, 0.28);
  pointer-events: none;
  transform: translateX(-50%);
}

.rack-tile-enter-active {
  animation: rackTileIn 180ms cubic-bezier(0.2, 0.9, 0.3, 1.05);
  animation-delay: var(--tile-enter-delay, 0ms);
  animation-fill-mode: both;
}

.rack-tile-leave-active {
  animation: rackTileOut 140ms ease-in forwards;
  pointer-events: none;
}

.rack-clear-tile-enter-active {
  animation: rackTileIn 130ms cubic-bezier(0.2, 0.9, 0.3, 1.05);
  animation-delay: var(--tile-enter-delay, 0ms);
  animation-fill-mode: both;
}

.rack-clear-tile-leave-active {
  display: none;
}

.ghost-tile-enter-active {
  animation: rackTileIn 180ms cubic-bezier(0.2, 0.9, 0.3, 1.05);
  animation-delay: var(--tile-enter-delay, 0ms);
  animation-fill-mode: both;
}

.ghost-tile-leave-active {
  animation: ghostTileFadeOut 680ms ease-in forwards;
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

@keyframes ghostTileFadeOut {
  0% {
    opacity: 1;
    transform: scale(1);
    filter: blur(0) saturate(1.05);
  }
  45% {
    opacity: 0.58;
    transform: translateY(-5px) scale(1.04);
    filter: blur(1px) saturate(0.85);
  }
  100% {
    opacity: 0;
    transform: translateY(-16px) scale(0.76);
    filter: blur(7px) saturate(0.45);
  }
}

@media (max-width: 560px) {
  .rack-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
