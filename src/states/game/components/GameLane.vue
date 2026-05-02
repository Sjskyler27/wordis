<template>
  <section
    class="lane"
    :class="{
      'lane-burst-low': burstTier === 'low',
      'lane-burst-medium': burstTier === 'medium',
      'lane-burst-high': burstTier === 'high',
      'lane-burst-epic': burstTier === 'epic',
      'lane-board-timer': boardEffectLabel
    }"
    :data-board-effect="boardEffectLabel"
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

    <div class="rack-grid" :data-board-effect="boardEffectLabel">
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
              'tile-shimmer': tile.status === 'shimmer',
              'tile-shimmer-active': tile.status === 'shimmer' && !selectedTileIds.has(tile.id),
              'tile-shimmer-idle': tile.status === 'shimmer' && selectedTileIds.has(tile.id),
              'tile-rusting': tile.status === 'rustingTile',
              'tile-lightning': tile.status === 'lightningTile',
              'tile-twin': tile.status === 'twinTile',
              'tile-twin-active': hasSelectedTwinMatch(tile),
              'tile-void': tile.status === 'voidTile',
              'tile-barricade': tile.status === 'barricadeTile',
              'tile-must-alert': mustAlertIds.has(tile.id),
              'tile-banned-letter': isBannedLetter(tile),
              'tile-controller-focus': controllerFocusedTileId === tile.id,
              [getShimmerCycleClass(tile)]: !!getShimmerCycleClass(tile),
              [getTileAnimationClass(tile)]: !!getTileAnimationClass(tile)
            }"
            :style="getTileStyle(tile)"
            :data-controller-tile="`${side}-${index}`"
            @click="handleTileClick(tile, $event)"
            @mouseenter="showTooltipLater(tile, $event)"
            @mousemove="updateTooltipPosition($event)"
            @mouseleave="hideTooltip"
          >
            <span v-if="tile.status === 'lightningTile'" class="tile-lightning-spark spark-left" aria-hidden="true"></span>
            <span v-if="tile.status === 'lightningTile'" class="tile-lightning-spark spark-right" aria-hidden="true"></span>
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
        <TileHoverTooltip
          :tile="hoveredTile"
          :visible="canShowTooltip"
          :dismissible="props.isMobile && mobileInspectEnabled"
          @close="hideTooltip"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
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

  setTooltipPositionFromElement(event?.currentTarget);
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

  setTooltipPositionFromElement(event?.currentTarget);
};

const hideTooltip = () => {
  window.clearTimeout(tooltipTimeoutId);
  isTooltipVisible.value = false;
  hoveredTile.value = null;
};

const getLightningAnimationSync = (tile, event) => {
  if (tile?.status !== 'lightningTile') {
    return null;
  }

  const intervalMs = tile.lightningIntervalMs || 3000;
  const animations = event?.currentTarget?.getAnimations?.() || [];
  const lightningAnimation = animations.find((animation) => animation.animationName === 'tile-lightning-charge');
  const currentTime = Number(lightningAnimation?.currentTime || 0);
  if (currentTime > 0 && intervalMs > 0) {
    return {
      lightningAnimationDelayMs: -(currentTime % intervalMs)
    };
  }

  const strikeAt = tile.lightningStrikeAt || 0;
  if (!strikeAt || !intervalMs) {
    return null;
  }

  const remainingMs = Math.max(0, strikeAt - Date.now());
  return {
    lightningAnimationDelayMs: remainingMs - intervalMs
  };
};

const toggleMobileInspect = () => {
  mobileInspectEnabled.value = !mobileInspectEnabled.value;

  if (!mobileInspectEnabled.value) {
    hideTooltip();
  }
};

const handleDocumentClick = (event) => {
  if (!props.isMobile || !mobileInspectEnabled.value) {
    return;
  }

  const target = event.target;
  if (target?.closest?.('.tile') || target?.closest?.('.mobile-inspect-toggle')) {
    return;
  }

  mobileInspectEnabled.value = false;
  hideTooltip();
};

const handleTileClick = (tile, event) => {
  if (props.isMobile && mobileInspectEnabled.value) {
    setTooltipPositionFromElement(event.currentTarget);
    hoveredTile.value = tile;
    isTooltipVisible.value = true;
    return;
  }

  emit('tile-click', {
    tile,
    animationSync: getLightningAnimationSync(tile, event)
  });
};

watch(() => mobileInspectEnabled.value, (isEnabled) => {
  if (props.isMobile && !isEnabled) {
    hideTooltip();
  }
});

onMounted(() => {
  window.addEventListener('click', handleDocumentClick, true);
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
const getRoundModifierCountdownLabel = (modifierKey) => {
  return props.scoreOptions?.roundModifierCountdowns?.[modifierKey]?.label || '';
};
const boardEffectLabel = computed(() => {
  const effects = props.scoreOptions?.roundModifierEffects || {};
  if (effects.chaoticBoardIntervalMs) {
    return getRoundModifierCountdownLabel('chaotic_board') || 'Chaos soon';
  }
  if (effects.shuffleRackIntervalMs) {
    return getRoundModifierCountdownLabel('disorganised') || 'Shuffle soon';
  }
  if (effects.returnBuilderIntervalMs) {
    return getRoundModifierCountdownLabel('loose_letters') || 'Return soon';
  }

  return '';
});
const getRoundTileMarker = (tile) => {
  if (isHotBurnTile(tile)) {
    return 'x2';
  }

  return '';
};

const getShimmerCycleClass = (tile) => {
  if (tile?.status !== 'shimmer') {
    return '';
  }

  return (tile.shimmerCycleIndex || 0) % 2 === 0 ? 'tile-shimmer-cycle-even' : 'tile-shimmer-cycle-odd';
};

const hasSelectedTwinMatch = (tile) => {
  if (tile?.status !== 'twinTile' || !props.selectedTileIds.has(tile.id)) {
    return false;
  }

  const letter = getTileLetter(tile);
  return Boolean(letter) && props.tiles.some((rackTile) => {
    return rackTile.id !== tile.id && props.selectedTileIds.has(rackTile.id) && getTileLetter(rackTile) === letter;
  });
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
    '--tile-rust-coverage': `${Math.min(120, (((tile.rustTurns  || 0) + 1) * 20) + 18)}%`,
    '--tile-shimmer-cycle': `${tile.shimmerIntervalMs || 8000}ms`,
    '--tile-lightning-cycle': `${tile.lightningIntervalMs || 3000}ms`,
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
  'unlock-dissolve': 530,
  'shimmer-shift': 680,
  'rust-spread': 680
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
  window.removeEventListener('click', handleDocumentClick, true);
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

.lane-board-timer .rack-grid::after {
  content: attr(data-board-effect);
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

.tile-shimmer,
.tile-rusting,
.tile-lightning,
.tile-twin,
.tile-void,
.tile-barricade {
  isolation: isolate;
  overflow: hidden;
}

.tile-shimmer::before {
  content: '';
  position: absolute;
  inset: -36%;
  z-index: 0;
  border-radius: 16px;
  pointer-events: none;
  background:
    conic-gradient(from 0deg, rgba(86, 255, 235, 0.05), rgba(197, 98, 255, 0.45), rgba(50, 255, 196, 0.36), rgba(10, 20, 36, 0.08), rgba(86, 255, 235, 0.05)),
    radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.5), transparent 18%),
    radial-gradient(circle at 66% 68%, rgba(24, 224, 213, 0.48), transparent 26%);
  filter: blur(0.5px) saturate(1.35);
  mix-blend-mode: screen;
  opacity: 0.8;
  animation: shimmer-idle-oil-cycle 8000ms linear infinite;
}

.tile-shimmer-active.tile-shimmer-cycle-even::before {
  animation: shimmer-oil-cycle-a var(--tile-shimmer-cycle, 8000ms) linear infinite;
}

.tile-shimmer-active.tile-shimmer-cycle-odd::before {
  animation: shimmer-oil-cycle-b var(--tile-shimmer-cycle, 8000ms) linear infinite;
}

.tile-shimmer-idle::before {
  animation: shimmer-idle-oil-cycle 16000ms linear infinite;
}

.tile-rusting::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: var(--tile-rust-coverage, 25%);
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

.tile-lightning::before,
.tile-lightning::after {
  content: '';
  position: absolute;
  pointer-events: none;
}

.tile-lightning::before {
  inset: 0;
  z-index: 0;
  opacity: 0.12;
  animation: tile-lightning-charge var(--tile-lightning-cycle, 3000ms) linear infinite;
  animation-delay: var(--tile-lightning-delay, 0ms);
}

.tile-lightning::after {
  top: 8%;
  left: 43%;
  width: 24%;
  height: 80%;
  z-index: 100;
  background: linear-gradient(180deg, #fffdf0 0%, #fff069 48%, #64d8ff 100%);
  clip-path: polygon(44% 0, 86% 0, 61% 38%, 100% 38%, 24% 100%, 43% 54%, 0 54%);
  filter: drop-shadow(0 0 7px rgba(255, 244, 100, 0.86));
  opacity: 0;
  animation: tile-lightning-strike var(--tile-lightning-cycle, 3000ms) linear infinite;
  animation-delay: var(--tile-lightning-delay, 0ms);
}

.tile-lightning-spark {
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
  animation: tile-lightning-spark var(--tile-lightning-cycle, 3000ms) linear infinite;
  animation-delay: var(--tile-lightning-delay, 0ms);
}

.tile-lightning-spark.spark-left {
  left: 10%;
}

.tile-lightning-spark.spark-right {
  right: 10%;
  animation-name: tile-lightning-spark-right;
}

.tile-twin {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.34) 0%, rgba(255, 255, 255, 0) 42%),
    linear-gradient(90deg, #9df4dc 0 50%, #f4efe5 50% 100%);
}

.tile-twin::before {
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

.tile-twin::after {
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

.tile-twin-active::before {
  background:
    linear-gradient(180deg, #d9fff4 0%, #62dfc3 54%, #2f9d94 100%) left / 50% 100% no-repeat,
    linear-gradient(180deg, #d9fff4 0%, #62dfc3 54%, #2f9d94 100%) right / 50% 100% no-repeat;
}

.tile-twin-active {
  filter: saturate(1.12) brightness(1.04);
  animation: tile-twin-complete-glow 1600ms ease-in-out infinite;
}

.tile-twin-active::after {
  background:
    linear-gradient(115deg, transparent 10%, rgba(255, 255, 255, 0.68) 34%, rgba(154, 255, 229, 0.24) 46%, transparent 66%);
  background-size: 230% 100%;
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.38),
    inset 0 -4px 0 rgba(14, 76, 75, 0.16),
    0 0 18px rgba(99, 236, 209, 0.36);
  animation: tile-twin-complete-shimmer 1600ms ease-in-out infinite;
}

.tile-void {
  background: radial-gradient(circle at 50% 50%, #02030a 0%, #050817 44%, #11182d 72%, #02030a 100%);
  box-shadow:
    inset 0 -4px 0 rgba(0, 0, 0, 0.56),
    0 12px 24px rgba(2, 4, 14, 0.34),
    0 0 0 1px rgba(125, 156, 255, 0.22);
}

.tile-void::before,
.tile-void::after {
  content: '';
  position: absolute;
  pointer-events: none;
}

.tile-void::before {
  inset: 9%;
  z-index: 0;
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 50%, #000000 0 18%, rgba(8, 10, 28, 0.96) 19% 28%, transparent 29%),
    conic-gradient(from 0deg, rgba(129, 102, 255, 0.08), rgba(77, 234, 255, 0.78), rgba(210, 127, 255, 0.5), rgba(20, 22, 48, 0.18), rgba(129, 102, 255, 0.08));
  filter: saturate(1.35) contrast(1.12);
  animation: tile-void-vortex 2200ms linear infinite;
}

.tile-void::after {
  inset: 25%;
  z-index: 1;
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 50%, #000000 0 34%, rgba(1, 2, 8, 0.78) 35% 54%, transparent 56%);
  box-shadow:
    0 0 18px rgba(92, 221, 255, 0.42),
    inset 0 0 16px rgba(0, 0, 0, 0.94);
  animation: tile-void-pulse 1400ms ease-in-out infinite;
}

.tile-barricade {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.24), transparent 36%),
    repeating-linear-gradient(135deg, #2a220a 0 12%, #2a220a 12% 22%, #ffd84c 22% 36%, #ffd84c 36% 48%),
    linear-gradient(180deg, #ffe476 0%, #f0b822 58%, #9b5e05 100%);
  box-shadow:
    inset 0 -4px 0 rgba(86, 45, 4, 0.34),
    0 12px 20px rgba(92, 55, 5, 0.22),
    0 0 0 1px rgba(255, 226, 106, 0.42);
}

.tile-barricade::before {
  content: '';
  position: absolute;
  inset: 12% 5%;
  z-index: 0;
  border-radius: 10px;
  pointer-events: none;
  background:
    linear-gradient(90deg, transparent 0 8%, rgba(255, 245, 166, 0.76) 8% 12%, transparent 12% 88%, rgba(255, 245, 166, 0.76) 88% 92%, transparent 92% 100%),
    repeating-linear-gradient(135deg, rgba(35, 26, 7, 0.92) 0 10px, rgba(35, 26, 7, 0.92) 10px 18px, rgba(155, 135, 44, 0.96) 18px 32px, rgba(157, 135, 38, 0.96) 32px 42px);
  box-shadow:
    inset 0 0 0 2px rgba(47, 30, 4, 0.78),
    0 3px 0 rgba(80, 47, 5, 0.46);
}

.tile-shimmer .tile-letter,
.tile-rusting .tile-letter,
.tile-lightning .tile-letter,
.tile-twin .tile-letter,
.tile-void .tile-letter,
.tile-barricade .tile-letter {
  position: relative;
  z-index: 3;
}

.tile-barricade .tile-letter {
  text-shadow:
    0 2px 0 rgba(255, 235, 132, 0.5),
    0 0 6px rgba(255, 249, 190, 0.34);
}
.tile-rusting{
  --tile-letter-stroke: 1px rgba(255, 255, 255, 0.92);
}
.tile-rusting .tile-score{
  color: white;
  --tile-letter-stroke: 1px rgba(0, 0, 0, 0.92);
}


.tile-shimmer .tile-score,
.tile-rusting .tile-score,
.tile-lightning .tile-score,
.tile-twin .tile-score,
.tile-void .tile-score,
.tile-barricade .tile-score {
  z-index: 5;
}

.tile-shimmer .tile-modifier,
.tile-rusting .tile-modifier,
.tile-lightning .tile-modifier,
.tile-twin .tile-modifier,
.tile-void .tile-modifier,
.tile-barricade .tile-modifier {
  z-index: 6;
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

.tile-anim-shimmer-shift {
  animation: tile-shimmer-shift var(--tile-animation-duration, 680ms) ease-out;
}

.tile-anim-rust-spread {
  animation: tile-rust-spread var(--tile-animation-duration, 680ms) ease-out;
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

@keyframes shimmer-oil-cycle-a {
  0% {
    transform: rotate(0deg) scale(1);
    filter: blur(0.6px) saturate(1.12) brightness(1);
  }
  58% {
    transform: rotate(90deg) scale(1.02);
    filter: blur(0.54px) saturate(1.22) brightness(1.04);
  }
  84% {
    transform: rotate(240deg) scale(1.06);
    filter: blur(0.46px) saturate(1.52) brightness(1.12);
  }
  100% {
    transform: rotate(360deg) scale(1.08);
    filter: blur(0.42px) saturate(1.72) brightness(1.2);
  }
}

@keyframes shimmer-oil-cycle-b {
  0% {
    transform: rotate(0deg) scale(1);
    filter: blur(0.6px) saturate(1.12) brightness(1);
  }
  58% {
    transform: rotate(90deg) scale(1.02);
    filter: blur(0.54px) saturate(1.22) brightness(1.04);
  }
  84% {
    transform: rotate(240deg) scale(1.06);
    filter: blur(0.46px) saturate(1.52) brightness(1.12);
  }
  100% {
    transform: rotate(360deg) scale(1.08);
    filter: blur(0.42px) saturate(1.72) brightness(1.2);
  }
}

@keyframes shimmer-idle-oil-cycle {
  0% {
    transform: rotate(0deg) scale(1);
    filter: blur(0.55px) saturate(1.18);
  }
  100% {
    transform: rotate(360deg) scale(1);
    filter: blur(0.55px) saturate(1.18);
  }
}

@keyframes tile-lightning-charge {
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

@keyframes tile-lightning-spark {
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

@keyframes tile-lightning-spark-right {
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

@keyframes tile-lightning-strike {
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

@keyframes tile-twin-complete-glow {
  0%,
  100% {
    box-shadow: var(--tile-shadow, inset 0 -4px 0 rgba(0, 0, 0, 0.12), 0 10px 18px rgba(45, 10, 24, 0.16));
  }
  50% {
    box-shadow:
      inset 0 0 0 2px rgba(214, 255, 245, 0.52),
      inset 0 -4px 0 rgba(14, 76, 75, 0.16),
      0 0 18px rgba(97, 232, 204, 0.5),
      var(--tile-shadow, inset 0 -4px 0 rgba(0, 0, 0, 0.12), 0 10px 18px rgba(45, 10, 24, 0.16));
  }
}

@keyframes tile-twin-complete-shimmer {
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

@keyframes tile-void-vortex {
  0% {
    transform: rotate(0deg) scale(1);
  }
  50% {
    transform: rotate(180deg) scale(1.06);
  }
  100% {
    transform: rotate(360deg) scale(1);
  }
}

@keyframes tile-void-pulse {
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

@keyframes tile-shimmer-shift {
  0%,
  100% {
    filter: brightness(1) saturate(1);
  }
  45% {
    filter: brightness(1.26) saturate(1.5);
  }
}

@keyframes tile-rust-spread {
  0%,
  100% {
    filter: brightness(1) saturate(1);
  }
  48% {
    filter: brightness(0.88) saturate(1.28);
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
