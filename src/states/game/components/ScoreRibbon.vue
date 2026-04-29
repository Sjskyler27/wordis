<template>
  <div class="score-ribbon">
    <div class="score-box host" :class="hostScoreClass">
      <span>Your Board</span>
      <strong>{{ scoreRibbonScoreLabel }}</strong>
    </div>
    <div class="score-divider">VS</div>
    <div class="score-box opponent" :class="opponentScoreClass">
      <span>{{ showClock ? 'Time Left' : 'Their Board' }}</span>
      <strong>{{ showClock ? clockScoreRibbonLabel : rightScore }}</strong>
    </div>
  </div>
</template>

<script setup>
defineProps({
  scoreRibbonScoreLabel: {
    type: [String, Number],
    required: true
  },
  clockScoreRibbonLabel: {
    type: [String, Number],
    required: true
  },
  rightScore: {
    type: [String, Number],
    required: true
  },
  showClock: {
    type: Boolean,
    default: false
  },
  hostScoreClass: {
    type: [String, Array, Object],
    default: null
  },
  opponentScoreClass: {
    type: [String, Array, Object],
    default: null
  }
});
</script>

<style scoped lang="scss">
.score-ribbon {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  align-items: center;
}

.score-box {
  border-radius: 22px;
  padding: 16px 20px;
  background: var(--panel-deep);
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: transform 180ms ease, box-shadow 180ms ease, filter 180ms ease;
}

.score-box span {
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.76rem;
  opacity: 0.75;
}

.score-box strong {
  font-size: 2rem;
  line-height: 1;
}

.score-box.host strong {
  color: var(--gold);
}

.score-box.opponent strong {
  color: var(--teal);
}

.score-box.timer strong {
  color: var(--gold);
}

.score-box-leading {
  box-shadow:
    inset 0 0 0 1px rgba(255, 228, 176, 0.18),
    0 0 0 1px rgba(255, 228, 176, 0.08);
}

.score-box-trailing {
  filter: saturate(0.9);
}

.score-gap-low.score-box-leading {
  animation: score-gap-pulse-low 2.6s ease-in-out infinite;
}

.score-gap-medium.score-box-leading {
  animation: score-gap-pulse-medium 2s ease-in-out infinite;
}

.score-gap-high.score-box-leading {
  animation: score-gap-pulse-high 1.5s ease-in-out infinite;
}

.score-gap-epic.score-box-leading {
  animation: score-gap-pulse-epic 1s ease-in-out infinite;
}

@keyframes score-gap-pulse-low {
  0%,
  100% {
    transform: translateY(0);
    box-shadow: 0 0 0 0 rgba(255, 204, 111, 0.12);
  }
  50% {
    transform: translateY(-1px);
    box-shadow: 0 0 18px rgba(255, 204, 111, 0.16);
  }
}

@keyframes score-gap-pulse-medium {
  0%,
  100% {
    transform: translateY(0) scale(1);
    box-shadow: 0 0 0 0 rgba(255, 204, 111, 0.16);
  }
  50% {
    transform: translateY(-2px) scale(1.01);
    box-shadow: 0 0 26px rgba(255, 204, 111, 0.24);
  }
}

@keyframes score-gap-pulse-high {
  0%,
  100% {
    transform: translateY(0) scale(1);
    box-shadow: 0 0 0 0 rgba(255, 204, 111, 0.18);
  }
  50% {
    transform: translateY(-3px) scale(1.018);
    box-shadow: 0 0 34px rgba(255, 204, 111, 0.3);
  }
}

@keyframes score-gap-pulse-epic {
  0%,
  100% {
    transform: translateY(0) scale(1);
    box-shadow: 0 0 0 0 rgba(255, 204, 111, 0.2);
  }
  50% {
    transform: translateY(-4px) scale(1.03);
    box-shadow: 0 0 44px rgba(255, 204, 111, 0.36);
  }
}

.score-divider {
  font-size: 1rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  opacity: 0.8;
}

@media (max-width: 1400px) {
  .score-ribbon {
    position: fixed;
    top: 18px;
    left: 18px;
    right: 18px;
    display: block;
    pointer-events: none;
    z-index: 9;
  }

  .score-divider {
    display: none;
  }

  .score-box {
    position: absolute;
    top: 0;
    min-width: 220px;
    max-width: min(32vw, 280px);
    pointer-events: auto;
  }

  .score-box.host {
    left: 0;
  }

  .score-box.opponent {
    right: 0;
  }
}

@media (max-width: 680px) {
  .score-ribbon {
    position: fixed;
    top: 18px;
    left: 18px;
    right: 18px;
    display: block;
    pointer-events: none;
    z-index: 9;
  }

  .score-divider {
    display: none;
  }

  .score-box {
    position: absolute;
    top: 0;
    min-width: 220px;
    max-width: min(32vw, 280px);
    pointer-events: auto;
  }

  .score-box.host {
    left: 0;
  }

  .score-box.opponent {
    right: 0;
  }
}
</style>
