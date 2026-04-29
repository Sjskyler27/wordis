<template>
  <div id="background-layer">
    <div class="shape-layer layer-far"></div>
    <div class="shape-layer layer-near"></div>
    <div v-if="isBotMode" class="machine-game-cogs" aria-hidden="true">
      <span class="machine-cog cog machine-cog-large" :style="botCogStyle"></span>
      <span class="machine-cog cog machine-cog-small" :style="playerCogStyle"></span>
    </div>
  </div>
</template>

<script setup>
defineProps({
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
</script>

<style scoped lang="scss">
#background-layer {
  position: absolute;
  inset: 0;
  z-index: -2;
  background:
    radial-gradient(circle at 14% 18%, rgba(255, 228, 168, var(--bg-glow-alpha)) 0, rgba(255, 228, 168, var(--bg-glow-alpha)) 12%, transparent 30%),
    radial-gradient(circle at 82% 14%, rgba(255, 255, 255, 0.09) 0, rgba(255, 255, 255, 0.09) 8%, transparent 24%),
    linear-gradient(135deg, var(--bg-corner) 0%, var(--bg-top) 24%, var(--bg-mid) 58%, var(--bg-bottom) 100%);
  filter: saturate(var(--bg-saturate));
  overflow: hidden;
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
  opacity: var(--bg-shape-far-opacity);
  background-position: 0 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='280' viewBox='0 0 280 280'%3E%3Cg fill='none' stroke='%23fff4dc' stroke-width='2.6' stroke-opacity='.34'%3E%3Cpolygon points='40,24 68,74 12,74'/%3E%3Crect x='106' y='18' width='46' height='46' rx='4'/%3E%3Cpolygon points='217,22 245,38 245,70 217,86 189,70 189,38'/%3E%3Cpolygon points='44,118 72,134 72,166 44,182 16,166 16,134'/%3E%3Crect x='108' y='110' width='54' height='54' rx='6'/%3E%3Cpolygon points='214,110 246,164 182,164'/%3E%3Crect x='28' y='204' width='50' height='50' rx='5'/%3E%3Cpolygon points='136,198 164,214 164,246 136,262 108,246 108,214'/%3E%3Cpolygon points='220,198 248,248 192,248'/%3E%3C/g%3E%3C/svg%3E");
  animation: driftLayerFar 25s linear infinite;
}

.layer-near {
  inset: -6%;
  opacity: var(--bg-shape-near-opacity);
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
