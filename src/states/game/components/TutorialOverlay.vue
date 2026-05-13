<template>
  <div class="tutorial-overlay">
    <div class="tutorial-scrim"></div>
    <section ref="tutorialPanel" class="tutorial-panel animated-slide-up">
      <span class="tutorial-kicker">First Match Guide</span>
      <h2>How Wordis Works</h2>
      <p class="tutorial-copy">
        Build words from your tiles, tiles can have special effects that increase or decrease your score.
      </p>

      <div class="tutorial-sections">
        <article class="tutorial-card">
          <strong>Goal</strong>
          <p>Submit words for points. Longer words score more points but take longer to think of. <span v-if="isBotMode" class="tutorial-inline">The Machine gets better the better you do!</span></p>
        </article>

        <article class="tutorial-card">
          <strong>Cards</strong>
          <p>Cards can be played to give you tile modifiers or special abilities. They can even <span class="tutorial-inline">{{isBotMode ? 'affect the machines board':'affect your opponents board'}}</span> as well!</p>
        </article>

        <article class="tutorial-card">
          <strong>Word Value</strong>
          <p>Your word score comes from tile values, extra points for longer words,and modifiers.</p>
          <p v-if="isBotMode"> <span class="tutorial-inline">Watch the cogs!</span>  They will spin with how fast you are thinking and how fast the machine is thinking!</p>
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
          <input ref="dontShowAgainInput" v-model="dontShowAgain" type="checkbox" />
          <span>Don't show this again</span>
        </label>

        <button ref="startPlayingButton" type="button" class="tutorial-button" @click="finishTutorial">
          Start Playing
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
const props = defineProps({isBotMode: Boolean})
import {
  MODIFIER_DEFINITIONS,
  applyModifierToTile,
  getModifierBadge,
  getModifierDescription,
  getModifierUi,
  tileScore
} from '../tile-logic.js';

const emit = defineEmits(['close']);

const dontShowAgain = ref(false);
const startPlayingButton = ref(null);
const dontShowAgainInput = ref(null);
const tutorialPanel = ref(null);
const sampleLettersByStatus = {
  normal: 'A',
  gold: 'M',
  wild: 'O',
  firsttile: 'F',
  royalPear: 'P',
  bloodTile: 'B',
  bankTile: 'N',
  yinYang: 'Y',
  zeroTile: 'E',
  mustuse: 'U',
  locked3: 'L',
  ghostTile: 'R',
  burningTile: 'S',
  gainTrayModifier: 'G',
  gainAttack: 'A',
  gainTactic: 'T'
};
const titleByStatus = {
  firsttile: 'First Tile',
  royalPear: 'Royal Pair Tile',
  bloodTile: 'Blood Tile',
  bankTile: 'Bank Tile',
  yinYang: 'Yin Yang Tile',
  zeroTile: 'Zero Tile',
  mustuse: 'Must Tile',
  locked3: 'Locked Tile',
  ghostTile: 'Ghost Tile',
  burningTile: 'Burn Tile',
  gainTrayModifier: 'Tray Modifier Tile',
  gainAttack: 'Attack Tile',
  gainTactic: 'Tactic Tile'
};

const formatModifierTitle = (status = 'normal') => {
  if (titleByStatus[status]) {
    return titleByStatus[status];
  }

  return `${status
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^\w/, (letter) => letter.toUpperCase())} Tile`;
};
const createTutorialTile = (status) => {
  const letter = sampleLettersByStatus[status] || 'A';
  const baseTile = {
    id: `tutorial-${status}`,
    letter,
    baseLetter: letter,
    score: 1,
    baseScore: 1
  };

  return {
    ...applyModifierToTile(baseTile, status),
    title: formatModifierTitle(status)
  };
};
const tutorialTiles = Object.keys(MODIFIER_DEFINITIONS).map(createTutorialTile);

const getTileStyle = (tile) => {
  const ui = getModifierUi(tile.status);

  return {
    '--tile-bg': ui.tileBackground,
    '--tile-shadow': ui.tileShadow,
    '--tile-hover-shadow': ui.tileHoverShadows || ui.tileShadow,
    '--tile-focus-shadow': ui.tileFocusShadow || ui.tileShadow,
    '--tile-text-color': ui.textColor,
    '--tile-letter-stroke': tile.status === 'yinYang' ? '1px rgba(255, 255, 255, 0.92)' : '0 transparent'
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

const focusTutorialControl = (direction) => {
  if (direction === 'left') {
    dontShowAgainInput.value?.focus();
    return;
  }

  startPlayingButton.value?.focus();
};

const scrollTutorialPanel = (direction) => {
  tutorialPanel.value?.scrollBy({
    top: direction === 'down' ? 120 : -120,
    behavior: 'smooth'
  });
};

const handleTutorialKeydown = (event) => {
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    focusTutorialControl('left');
    return;
  }

  if (event.key === 'ArrowRight') {
    event.preventDefault();
    focusTutorialControl('right');
    return;
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault();
    scrollTutorialPanel('up');
    return;
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    scrollTutorialPanel('down');
  }
};

onMounted(() => {
  nextTick(() => {
    startPlayingButton.value?.focus();
  });
  window.addEventListener('keydown', handleTutorialKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleTutorialKeydown);
});
</script>

<style scoped>
.tutorial-overlay {
  visibility: hidden;
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
    rgba(50, 13, 30, 0.99);
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
  font-family: 'Press Start 2P', cursive;
  flex: 0 0 94px;
  appearance: none;
  border: none;
  min-height: 64px;
  min-width: 64px;
  max-width: 72px;
  width: 100%;
  border-radius: 14px;
  background: var(--tile-bg, linear-gradient(180deg, #fffef8 0%, #f2ebe0 70%, #d9cec0 100%));
  color: var(--tile-text-color, #1c1930);
  box-shadow: var(--tile-shadow, inset 0 -4px 0 rgba(0, 0, 0, 0.12), 0 10px 18px rgba(45, 10, 24, 0.16));
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  transition: transform 140ms ease, box-shadow 140ms ease;
  will-change: transform, opacity;
}

.tutorial-tile-letter {
  font-size: 2.4rem;
  font-weight: 900;
  line-height: 1;
  -webkit-text-stroke: var(--tile-letter-stroke, 0 transparent);
  paint-order: stroke fill;
}

.tutorial-tile-score {
  position: absolute;
  top: 8px;
  right: 10px;
  font-size: 0.95rem;
  font-weight: 800;
}

.tutorial-tile-modifier {
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

.tutorial-tile-copy strong {
  display: block;
  margin-bottom: 6px;
}

.tutorial-footer {
  position: sticky;
  bottom: -28px;
  z-index: 2;
  margin-top: 24px;
  margin-inline: -28px;
  margin-bottom: -28px;
  padding: 16px 28px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: rgba(50, 13, 30, 0.98);
  border-top: 1px solid rgba(255, 202, 103, 0.18);
  box-shadow: 0 -16px 28px rgba(20, 6, 18, 0.22);
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
  color: #dfdfdf;
  font: inherit;
  cursor: pointer;
}

@media (max-width: 1000px) {
  .tutorial-sections{
    grid-template-columns: 1fr;
  }
  .tutorial-card strong{
    font-size: 23px;
  }
  .tutorial-card p{
    font-size: 21px;
  }
  .tutorial-tile-card strong{
    font-size: 21px;
  }
  .tutorial-tile-card p{
    font-size: 21px;
  }

  .tutorial-panel {
    max-height: 90%;
    height: 90%;
    max-width: 90%;
    width: 90%;
    padding: 22px;
  }

  .tutorial-footer {
    bottom: -22px;
    margin-inline: -22px;
    margin-bottom: -22px;
    padding: 14px 22px 16px;
    flex-direction: column;
    align-items: stretch;
  }

  .tutorial-button {
    width: 100%;
  }
}
</style>
