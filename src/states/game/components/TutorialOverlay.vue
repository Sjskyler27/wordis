<template>
  <div class="tutorial-overlay">
    <div class="tutorial-scrim"></div>
    <section class="tutorial-panel animated-slide-up">
      <span class="tutorial-kicker">First Match Guide</span>
      <h2>How Wordis Works</h2>
      <p class="tutorial-copy">
        Build words from your rack, score efficiently, and outpace the other board or the clock.
      </p>

      <div class="tutorial-sections">
        <article class="tutorial-card">
          <strong>Goal</strong>
          <p>Submit words for points. In versus modes, beat the other board. In solo sprint, score as much as you can before time runs out.</p>
        </article>

        <article class="tutorial-card">
          <strong>Building</strong>
          <p>Click tiles to build a word, then press <span class="tutorial-inline">Submit Word</span>. Only the tiles you used get replaced.</p>
        </article>

        <article class="tutorial-card">
          <strong>Word Value</strong>
          <p>Your word score comes from tile values, position bonuses, and modifiers. Some tiles help immediately, some reward waiting, and some punish you if ignored.</p>
        </article>
      </div>

      <div class="tutorial-tiles">
        <div
          v-for="tile in tutorialTiles"
          :key="tile.status"
          class="tutorial-tile-card"
        >
          <div class="tutorial-tile" :style="getTileStyle(tile)">
            <span
              v-if="!getModifierUi(tile.status).hideBadge && tile.status !== 'normal'"
              class="tutorial-tile-modifier"
              :style="getBadgeStyle(tile)"
            >
              {{ getModifierBadge(tile) }}
            </span>
            <span class="tutorial-tile-score">{{ tileScore(tile) }}</span>
            <span class="tutorial-tile-letter">{{ tile.letter }}</span>
          </div>
          <div class="tutorial-tile-copy">
            <strong>{{ tile.title }}</strong>
            <p>{{ getModifierDescription(tile.status) }}</p>
          </div>
        </div>
      </div>

      <div class="tutorial-footer">
        <label class="tutorial-checkbox">
          <input v-model="dontShowAgain" type="checkbox" />
          <span>Don't show this again</span>
        </label>

        <button type="button" class="tutorial-button" @click="finishTutorial">
          Start Playing
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { getModifierBadge, getModifierDescription, getModifierUi, tileScore } from '../tile-logic.js';

const emit = defineEmits(['close']);

const dontShowAgain = ref(true);
const tutorialTiles = [
  { status: 'normal', letter: 'A', score: 1, title: 'Normal Tile' },
  { status: 'gold', letter: 'M', score: 3, title: 'Gold Tile' },
  { status: 'wild', letter: '*', score: 0, title: 'Wild Tile' },
  { status: 'mustuse', letter: 'E', score: 1, title: 'Must Tile' },
  { status: 'bankTile', letter: 'N', score: 1, title: 'Bank Tile' },
  { status: 'ghostTile', letter: 'R', score: 1, title: 'Ghost Tile' },
  { status: 'burningTile', letter: 'S', score: 1, title: 'Burn Tile' },
  { status: 'gainboon', letter: 'O', score: 1, title: 'Boon Tile' }
];

const getTileStyle = (tile) => {
  const ui = getModifierUi(tile.status);

  return {
    '--tutorial-tile-bg': ui.tileBackground,
    '--tutorial-tile-shadow': ui.tileShadow,
    '--tutorial-tile-text-color': ui.textColor
  };
};

const getBadgeStyle = (tile) => {
  const ui = getModifierUi(tile.status);

  return {
    background: ui.badgeBackground,
    color: ui.badgeColor
  };
};

const finishTutorial = () => {
  emit('close', { dontShowAgain: dontShowAgain.value });
};
</script>

<style scoped>
.tutorial-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.tutorial-scrim {
  position: absolute;
  inset: 0;
  background: rgba(14, 5, 14, 0.74);
}

.tutorial-panel {
  position: relative;
  width: min(980px, 100%);
  max-height: min(88vh, 920px);
  overflow: auto;
  padding: 28px;
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.02)),
    rgba(50, 13, 30, 0.96);
  border: 1px solid rgba(255, 202, 103, 0.22);
  box-shadow: 0 28px 60px rgba(0, 0, 0, 0.34);
  color: #f7efe1;
}

.tutorial-kicker {
  display: inline-block;
  margin-bottom: 8px;
  color: rgba(255, 202, 103, 0.95);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.78rem;
}

.tutorial-panel h2 {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3rem);
}

.tutorial-copy {
  margin: 12px 0 0;
  max-width: 700px;
  color: rgba(247, 239, 225, 0.82);
  line-height: 1.55;
}

.tutorial-sections {
  margin-top: 22px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.tutorial-card {
  padding: 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.tutorial-card strong {
  display: block;
  margin-bottom: 8px;
  font-size: 0.95rem;
}

.tutorial-card p,
.tutorial-tile-copy p {
  margin: 0;
  color: rgba(247, 239, 225, 0.78);
  line-height: 1.5;
  font-size: 0.88rem;
}

.tutorial-inline {
  color: #ffca67;
}

.tutorial-tiles {
  margin-top: 22px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.tutorial-tile-card {
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.tutorial-tile {
  flex: 0 0 92px;
  min-height: 92px;
  border-radius: 16px;
  background: var(--tutorial-tile-bg, linear-gradient(180deg, #fffef8 0%, #f2ebe0 70%, #d9cec0 100%));
  color: var(--tutorial-tile-text-color, #1c1930);
  box-shadow: var(--tutorial-tile-shadow, inset 0 -4px 0 rgba(0, 0, 0, 0.12), 0 10px 18px rgba(45, 10, 24, 0.16));
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tutorial-tile-letter {
  font-size: 2.4rem;
  line-height: 1;
}

.tutorial-tile-score {
  position: absolute;
  top: 8px;
  right: 10px;
  font-size: 0.9rem;
}

.tutorial-tile-modifier {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 0.62rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.tutorial-tile-copy strong {
  display: block;
  margin-bottom: 6px;
}

.tutorial-footer {
  margin-top: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.tutorial-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: rgba(247, 239, 225, 0.8);
  font-size: 0.88rem;
}

.tutorial-button {
  border: none;
  border-radius: 999px;
  padding: 12px 18px;
  background: linear-gradient(180deg, #53d8c2, #159780);
  color: #08231f;
  font: inherit;
  cursor: pointer;
}

@media (max-width: 880px) {
  .tutorial-sections,
  .tutorial-tiles {
    grid-template-columns: 1fr;
  }

  .tutorial-panel {
    padding: 22px;
  }

  .tutorial-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .tutorial-button {
    width: 100%;
  }
}
</style>
