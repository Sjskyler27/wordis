<template>
  <div id="background-layer">
    <div class="background-scene" :style="displayMoodStyle">
      <div class="shape-layer layer-far"></div>
      <div class="shape-layer layer-near"></div>
      <div v-if="isBotMode" class="machine-game-cogs" aria-hidden="true">
        <span class="machine-cog cog machine-cog-large" :style="botCogStyle"></span>
        <span class="machine-cog cog machine-cog-small" :style="playerCogStyle"></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref, watch } from 'vue';

const props = defineProps({
  moodStyle: {
    type: Object,
    default: () => ({})
  },
  transitionKey: {
    type: String,
    default: 'default'
  },
  isBotMode: Boolean,
  botCogStyle: {
    type: Object,
    default: () => ({})
  },
  playerCogStyle: {
    type: Object,
    default: () => ({})
  }
});

const BACKGROUND_TRANSITION_MS = 2000;
const COLOR_KEYS = ['--bg-corner', '--bg-top', '--bg-mid', '--bg-bottom'];
const NUMBER_KEYS = ['--bg-glow-alpha', '--bg-shape-far-opacity', '--bg-shape-near-opacity', '--bg-saturate'];
const DEFAULT_MOOD_STYLE = {
  '--bg-corner': '#f39a54',
  '--bg-top': '#ca6937',
  '--bg-mid': '#b63e3b',
  '--bg-bottom': '#341137',
  '--bg-glow-alpha': '0.2',
  '--bg-shape-far-opacity': '0.24',
  '--bg-shape-near-opacity': '0.18',
  '--bg-saturate': '1.08'
};

const clamp01 = (value) => Math.max(0, Math.min(1, value));
const displayMoodStyle = ref({ ...DEFAULT_MOOD_STYLE, ...(props.moodStyle || {}) });

let animationFrameId = null;
let lastTransitionKey = props.transitionKey || 'default';

const parseHexColor = (value, fallback) => {
  const normalizedValue = typeof value === 'string' ? value.trim() : '';
  const normalizedFallback = typeof fallback === 'string' ? fallback.trim() : '#000000';
  const source = /^#([0-9a-f]{6})$/i.test(normalizedValue) ? normalizedValue : normalizedFallback;
  return [
    Number.parseInt(source.slice(1, 3), 16),
    Number.parseInt(source.slice(3, 5), 16),
    Number.parseInt(source.slice(5, 7), 16)
  ];
};

const mixHexColor = (startColor, endColor, progress) => {
  const startChannels = parseHexColor(startColor, '#000000');
  const endChannels = parseHexColor(endColor, '#000000');

  return `#${startChannels.map((channel, index) => {
    const mixedChannel = Math.round(channel + ((endChannels[index] - channel) * progress));
    return mixedChannel.toString(16).padStart(2, '0');
  }).join('')}`;
};

const mixNumber = (startValue, endValue, progress) => {
  const from = Number.parseFloat(startValue);
  const to = Number.parseFloat(endValue);
  if (!Number.isFinite(from) || !Number.isFinite(to)) {
    return `${Number.isFinite(to) ? to : from}`;
  }

  return `${from + ((to - from) * progress)}`;
};

const normalizeMoodStyle = (style = {}) => {
  const normalized = { ...DEFAULT_MOOD_STYLE };

  for (const key of COLOR_KEYS) {
    normalized[key] = typeof style[key] === 'string' ? style[key] : normalized[key];
  }

  for (const key of NUMBER_KEYS) {
    normalized[key] = style[key] != null ? `${style[key]}` : normalized[key];
  }

  return normalized;
};

const serializeMoodStyle = (style) => JSON.stringify(normalizeMoodStyle(style));

const clearAnimationFrame = () => {
  if (animationFrameId !== null) {
    window.cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
};

const applyMoodStyleImmediately = (nextMoodStyle, reason, meta = {}) => {
  clearAnimationFrame();
  displayMoodStyle.value = normalizeMoodStyle(nextMoodStyle);
  console.log('background:global-apply-no-transition', {
    reason,
    ...meta,
    appliedMoodStyle: displayMoodStyle.value
  });
};

const transitionMoodStyle = (fromMoodStyle, toMoodStyle, transitionMeta) => {
  clearAnimationFrame();
  const normalizedFrom = normalizeMoodStyle(fromMoodStyle);
  const normalizedTo = normalizeMoodStyle(toMoodStyle);

  if (serializeMoodStyle(normalizedFrom) === serializeMoodStyle(normalizedTo)) {
    applyMoodStyleImmediately(normalizedTo, 'transition-target-matched-current', transitionMeta);
    return;
  }

  console.log('background:global-transition-start', {
    ...transitionMeta,
    durationMs: BACKGROUND_TRANSITION_MS,
    fromMoodStyle: normalizedFrom,
    toMoodStyle: normalizedTo
  });

  const startedAt = performance.now();

  const step = (now) => {
    const progress = clamp01((now - startedAt) / BACKGROUND_TRANSITION_MS);
    const interpolatedMoodStyle = {};

    for (const key of COLOR_KEYS) {
      interpolatedMoodStyle[key] = mixHexColor(normalizedFrom[key], normalizedTo[key], progress);
    }

    for (const key of NUMBER_KEYS) {
      interpolatedMoodStyle[key] = mixNumber(normalizedFrom[key], normalizedTo[key], progress);
    }

    displayMoodStyle.value = interpolatedMoodStyle;

    if (progress >= 1) {
      displayMoodStyle.value = normalizedTo;
      animationFrameId = null;
      console.log('background:global-transition-end', {
        ...transitionMeta,
        durationMs: BACKGROUND_TRANSITION_MS,
        finalMoodStyle: normalizedTo
      });
      return;
    }

    animationFrameId = window.requestAnimationFrame(step);
  };

  animationFrameId = window.requestAnimationFrame(step);
};

watch(
  () => [
    props.transitionKey,
    props.moodStyle,
    props.isBotMode,
    props.botCogStyle,
    props.playerCogStyle
  ],
  () => {
    const nextTransitionKey = props.transitionKey || 'default';
    const nextMoodStyle = normalizeMoodStyle(props.moodStyle);
    const currentMoodStyle = normalizeMoodStyle(displayMoodStyle.value);
    const visualChanged = serializeMoodStyle(nextMoodStyle) !== serializeMoodStyle(currentMoodStyle);
    const transitionKeyChanged = nextTransitionKey !== lastTransitionKey;
    const previousTransitionKey = lastTransitionKey;

    console.log('background:global-watch', {
      previousTransitionKey,
      nextTransitionKey,
      visualChanged,
      transitionKeyChanged,
      previousMoodStyle: currentMoodStyle,
      nextMoodStyle
    });

    if (!visualChanged && !transitionKeyChanged) {
      console.log('background:global-skip-no-change', {
        transitionKey: nextTransitionKey
      });
      return;
    }

    if (transitionKeyChanged && visualChanged) {
      transitionMoodStyle(currentMoodStyle, nextMoodStyle, {
        previousTransitionKey,
        nextTransitionKey
      });
    } else {
      applyMoodStyleImmediately(nextMoodStyle, 'same-scene-update', {
        previousTransitionKey,
        nextTransitionKey,
        visualChanged,
        transitionKeyChanged
      });
    }

    lastTransitionKey = nextTransitionKey;
  },
  { deep: true }
);

onBeforeUnmount(() => {
  clearAnimationFrame();
});
</script>

<style scoped lang="scss">
#background-layer {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
}

.background-scene {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 14% 18%, rgba(255, 228, 168, var(--bg-glow-alpha, 0.2)) 0, rgba(255, 228, 168, var(--bg-glow-alpha, 0.2)) 12%, transparent 30%),
    radial-gradient(circle at 82% 14%, rgba(255, 255, 255, 0.09) 0, rgba(255, 255, 255, 0.09) 8%, transparent 24%),
    linear-gradient(135deg, var(--bg-corner, #f39a54) 0%, var(--bg-top, #ca6937) 24%, var(--bg-mid, #b63e3b) 58%, var(--bg-bottom, #341137) 100%);
  filter: saturate(var(--bg-saturate, 1.08));
}

.shape-layer {
  content: '';
  position: absolute;
  inset: -10%;
  pointer-events: none;
  mix-blend-mode: screen;
}

.shape-layer {
  background-repeat: repeat;
  background-size: 280px 280px;
}

.layer-far {
  opacity: var(--bg-shape-far-opacity, 0.24);
  background-position: 0 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='280' viewBox='0 0 280 280'%3E%3Cg fill='none' stroke='%23fff4dc' stroke-width='2.6' stroke-opacity='.34'%3E%3Cpolygon points='40,24 68,74 12,74'/%3E%3Crect x='106' y='18' width='46' height='46' rx='4'/%3E%3Cpolygon points='217,22 245,38 245,70 217,86 189,70 189,38'/%3E%3Cpolygon points='44,118 72,134 72,166 44,182 16,166 16,134'/%3E%3Crect x='108' y='110' width='54' height='54' rx='6'/%3E%3Cpolygon points='214,110 246,164 182,164'/%3E%3Crect x='28' y='204' width='50' height='50' rx='5'/%3E%3Cpolygon points='136,198 164,214 164,246 136,262 108,246 108,214'/%3E%3Cpolygon points='220,198 248,248 192,248'/%3E%3C/g%3E%3C/svg%3E");
  animation: driftLayerFar 25s linear infinite;
}

.layer-near {
  inset: -6%;
  opacity: var(--bg-shape-near-opacity, 0.18);
  background-size: 190px 190px;
  background-position: 28px 40px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='190' height='190' viewBox='0 0 190 190'%3E%3Cg fill='rgba(255,244,220,.14)' stroke='rgba(255,255,255,.16)' stroke-width='1.8'%3E%3Cpolygon points='26,20 52,64 0,64'/%3E%3Crect x='74' y='20' width='34' height='34' rx='3'/%3E%3Cpolygon points='150,18 170,30 170,54 150,66 130,54 130,30'/%3E%3Crect x='18' y='92' width='38' height='38' rx='4'/%3E%3Cpolygon points='96,88 118,126 74,126'/%3E%3Cpolygon points='152,86 174,98 174,124 152,136 130,124 130,98'/%3E%3Ccircle cx='42' cy='156' r='12'/%3E%3Crect x='82' y='144' width='28' height='28' rx='4'/%3E%3Cpolygon points='152,142 174,180 130,180'/%3E%3C/g%3E%3C/svg%3E");
  animation: driftLayerNear 30s linear infinite;
}

.machine-game-cogs {
  position: absolute;
  inset: 0;
  opacity: 0.76;
  pointer-events: none;
}

.machine-cog {
  position: absolute;
  border-radius: 50%;
}

.cog {
  position: absolute;
  border-radius: 50%;
}

.machine-game-cogs .cog::before,
.machine-game-cogs .cog::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
}

.machine-game-cogs .cog::before {
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
  background-image: var(--cog-image);
  filter:
    invert(84%)
    sepia(9%)
    saturate(369%)
    hue-rotate(169deg)
    brightness(1.12)
    contrast(1.18);
}

.machine-game-cogs .cog::after {
  background: var(--cog-image) center / contain no-repeat;
  filter: brightness(0) blur(2px);
  opacity: 0.24;
  transform: translate(-12px, 14px) scale(0.94);
  z-index: -1;
}

.machine-cog-large {
  --cog-image: url('/src/assets/images/big-cog.png');
  width: min(44vw, 440px);
  height: min(44vw, 440px);
  right: 4vw;
  bottom: 4vh;
  opacity: 0.76;
}

.machine-cog-large::before {
  animation: machineCogSpin var(--machine-cog-duration, 18s) linear infinite;
}

.machine-cog-large::after {
  animation: machineCogShadowSpin var(--machine-cog-duration, 18s) linear infinite;
}

.machine-cog-small {
  --cog-image: url('/src/assets/images/small-cog.png');
  width: min(22vw, 210px);
  height: min(22vw, 210px);
  left: 6vw;
  top: 12vh;
  opacity: 0.92;
}

.machine-cog-small::before {
  animation: machineCogSpinReverse var(--machine-cog-duration, 11s) linear infinite;
}

.machine-cog-small::after {
  animation: machineCogShadowSpinReverse var(--machine-cog-duration, 11s) linear infinite;
}

@keyframes driftLayerFar {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 280px -280px;
  }
}

@keyframes driftLayerNear {
  0% {
    background-position: 28px 40px;
  }
  100% {
    background-position: -67px 420px;
  }
}

@keyframes machineCogSpin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes machineCogSpinReverse {
  to {
    transform: rotate(-360deg);
  }
}

@keyframes machineCogShadowSpin {
  from {
    transform: translate(-12px, 14px) scale(0.94) rotate(0deg);
  }
  to {
    transform: translate(-12px, 14px) scale(0.94) rotate(360deg);
  }
}

@keyframes machineCogShadowSpinReverse {
  from {
    transform: translate(-12px, 14px) scale(0.94) rotate(0deg);
  }
  to {
    transform: translate(-12px, 14px) scale(0.94) rotate(-360deg);
  }
}

</style>
