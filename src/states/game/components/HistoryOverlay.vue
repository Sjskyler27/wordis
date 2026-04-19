<template>
  <div class="history-overlay">
    <div class="history-scrim"></div>
    <section class="history-panel animated-slide-up">
      <span class="history-kicker">Match Results</span>
      <span class="history-result" :class="resultState">{{ resultTitle }}</span>
      <strong class="history-title">{{ summaryText }}</strong>
      <p class="history-copy">Every scored word from the match lives here.</p>

      <div class="history-columns" :class="{ single: !rightLabel }">
        <section class="history-column">
          <span class="history-label">{{ leftLabel }}</span>
          <div v-if="bestLeftEntry" class="history-best-word">
            <span class="history-best-label">Best Word</span>
            <div class="history-best-main">
              <div class="history-word-tiles">
                <div
                  v-for="(tile, tileIndex) in bestLeftEntry.tiles"
                  :key="`left-best-tile-${tile.id || tileIndex}`"
                  class="history-tile"
                  :style="getTileStyle(tile)"
                >
                  <span
                    v-if="!getModifierUi(tile.status).hideBadge && tile.status !== 'normal'"
                    class="history-tile-modifier"
                    :style="getBadgeStyle(tile)"
                  >
                    {{ getModifierBadge(tile) }}
                  </span>
                  <span class="history-tile-score">{{ getTileScore(tile, tileIndex) }}</span>
                  <span class="history-tile-letter">{{ tile.letter }}</span>
                </div>
              </div>
              <div class="history-best-copy">
                <strong>{{ bestLeftEntry.word }}</strong>
                <span>+{{ bestLeftEntry.score }}</span>
              </div>
            </div>
          </div>
          <ul class="history-list">
            <li
              v-for="(entry, index) in normalizedLeftHistory"
              :key="`left-history-${index}-${entry.word}-${entry.score}`"
              class="history-entry"
            >
              <div class="history-entry-main">
                <div class="history-word-tiles">
                  <div
                    v-for="(tile, tileIndex) in entry.tiles"
                    :key="`left-history-${index}-tile-${tile.id || tileIndex}`"
                    class="history-tile"
                    :style="getTileStyle(tile)"
                  >
                    <span
                      v-if="!getModifierUi(tile.status).hideBadge && tile.status !== 'normal'"
                      class="history-tile-modifier"
                      :style="getBadgeStyle(tile)"
                    >
                      {{ getModifierBadge(tile) }}
                    </span>
                    <span class="history-tile-score">{{ getTileScore(tile, tileIndex) }}</span>
                    <span class="history-tile-letter">{{ tile.letter }}</span>
                  </div>
                </div>
                <span class="history-word">{{ entry.word }}</span>
              </div>
              <span class="history-score">+{{ entry.score }}</span>
            </li>
            <li v-if="!normalizedLeftHistory.length" class="history-empty">No words played.</li>
          </ul>
        </section>

        <section v-if="rightLabel" class="history-column">
          <span class="history-label">{{ rightLabel }}</span>
          <div v-if="bestRightEntry" class="history-best-word">
            <span class="history-best-label">Best Word</span>
            <div class="history-best-main">
              <div class="history-word-tiles">
                <div
                  v-for="(tile, tileIndex) in bestRightEntry.tiles"
                  :key="`right-best-tile-${tile.id || tileIndex}`"
                  class="history-tile"
                  :style="getTileStyle(tile)"
                >
                  <span
                    v-if="!getModifierUi(tile.status).hideBadge && tile.status !== 'normal'"
                    class="history-tile-modifier"
                    :style="getBadgeStyle(tile)"
                  >
                    {{ getModifierBadge(tile) }}
                  </span>
                  <span class="history-tile-score">{{ getTileScore(tile, tileIndex) }}</span>
                  <span class="history-tile-letter">{{ tile.letter }}</span>
                </div>
              </div>
              <div class="history-best-copy">
                <strong>{{ bestRightEntry.word }}</strong>
                <span>+{{ bestRightEntry.score }}</span>
              </div>
            </div>
          </div>
          <ul class="history-list">
            <li
              v-for="(entry, index) in normalizedRightHistory"
              :key="`right-history-${index}-${entry.word}-${entry.score}`"
              class="history-entry"
            >
              <div class="history-entry-main">
                <div class="history-word-tiles">
                  <div
                    v-for="(tile, tileIndex) in entry.tiles"
                    :key="`right-history-${index}-tile-${tile.id || tileIndex}`"
                    class="history-tile"
                    :style="getTileStyle(tile)"
                  >
                    <span
                      v-if="!getModifierUi(tile.status).hideBadge && tile.status !== 'normal'"
                      class="history-tile-modifier"
                      :style="getBadgeStyle(tile)"
                    >
                      {{ getModifierBadge(tile) }}
                    </span>
                    <span class="history-tile-score">{{ getTileScore(tile, tileIndex) }}</span>
                    <span class="history-tile-letter">{{ tile.letter }}</span>
                  </div>
                </div>
                <span class="history-word">{{ entry.word }}</span>
              </div>
              <span class="history-score">+{{ entry.score }}</span>
            </li>
            <li v-if="!normalizedRightHistory.length" class="history-empty">No words played.</li>
          </ul>
        </section>
      </div>

      <div class="history-actions">
        <button
          ref="playAgainButton"
          type="button"
          class="play-again-button"
          :disabled="playAgainDisabled"
          @click="$emit('play-again')"
        >
          {{ playAgainText }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { getModifierBadge, getModifierUi, tileScore } from '../tile-logic.js';

const props = defineProps({
  summaryText: {
    type: String,
    required: true
  },
  resultTitle: {
    type: String,
    default: 'Results'
  },
  resultState: {
    type: String,
    default: 'neutral'
  },
  leftLabel: {
    type: String,
    required: true
  },
  rightLabel: {
    type: String,
    default: ''
  },
  leftHistory: {
    type: Array,
    required: true
  },
  rightHistory: {
    type: Array,
    default: () => []
  },
  playAgainText: {
    type: String,
    default: 'Play Again'
  },
  playAgainDisabled: {
    type: Boolean,
    default: false
  }
});

defineEmits(['play-again']);

const playAgainButton = ref(null);

const normalizeEntry = (entry) => {
  if (typeof entry === 'string') {
    return {
      word: entry,
      score: 0,
      tiles: entry.split('').map((letter, index) => ({
        id: `legacy-${letter}-${index}`,
        letter,
        baseLetter: letter,
        score: 0,
        baseScore: 0,
        bonusScore: 0,
        multiplier: 1,
        wordMultiplier: 1,
        firstTileBonus: 0,
        status: 'normal',
        locked: false,
        lockTurns: 0
      }))
    };
  }

  return {
    word: entry?.word || '',
    score: entry?.score || 0,
    tiles: Array.isArray(entry?.tiles) && entry.tiles.length
      ? entry.tiles
      : (entry?.word || '').split('').map((letter, index) => ({
        id: `fallback-${entry?.word || 'word'}-${index}`,
        letter,
        baseLetter: letter,
        score: 0,
        baseScore: 0,
        bonusScore: 0,
        multiplier: 1,
        wordMultiplier: 1,
        firstTileBonus: 0,
        status: 'normal',
        locked: false,
        lockTurns: 0
      }))
  };
};

const normalizedLeftHistory = computed(() => props.leftHistory.map(normalizeEntry));
const normalizedRightHistory = computed(() => props.rightHistory.map(normalizeEntry));
const getBestEntry = (entries = []) => {
  if (!entries.length) {
    return null;
  }

  return entries.reduce((bestEntry, entry) => {
    if (!bestEntry || entry.score > bestEntry.score) {
      return entry;
    }

    return bestEntry;
  }, null);
};
const bestLeftEntry = computed(() => getBestEntry(normalizedLeftHistory.value));
const bestRightEntry = computed(() => getBestEntry(normalizedRightHistory.value));

const getTileStyle = (tile) => {
  const ui = getModifierUi(tile.status);

  return {
    '--history-tile-bg': ui.tileBackground,
    '--history-tile-shadow': ui.tileShadow,
    '--history-tile-text-color': ui.textColor
  };
};

const getBadgeStyle = (tile) => {
  const ui = getModifierUi(tile.status);

  return {
    background: ui.badgeBackground,
    color: ui.badgeColor
  };
};

const getTileScore = (tile, index) => {
  return tileScore(tile, { positionIndex: index });
};

const focusPlayAgainButton = () => {
  nextTick(() => {
    if (props.playAgainDisabled) {
      return;
    }

    playAgainButton.value?.focus();
  });
};

onMounted(() => {
  focusPlayAgainButton();
});

watch(() => props.playAgainDisabled, (disabled, wasDisabled) => {
  if (disabled || !wasDisabled) {
    return;
  }

  focusPlayAgainButton();
});
</script>

<style scoped>
.history-overlay {
  position: absolute;
  inset: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 8;
}

.history-scrim {
  position: absolute;
  inset: 0;
  border-radius: 30px;
  background: rgba(21, 8, 22, 0.74);
  backdrop-filter: blur(6px);
  max-height: 96%;
}

.history-panel {
  position: relative;
  z-index: 1;
  visibility: hidden;
  width: min(100%, 920px);
  border-radius: 30px;
  padding: 28px;
  background:
    linear-gradient(180deg, rgba(255, 195, 94, 0.16), rgba(255, 255, 255, 0.04)),
    rgba(74, 17, 40, 0.94);
  border: 2px solid rgba(255, 220, 144, 0.22);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 28px 60px rgba(17, 6, 19, 0.34);
}

.history-kicker,
.history-label {
  display: inline-block;
  font-size: 0.72rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  opacity: 0.76;
}

.history-title {
  display: block;
  margin-top: 12px;
  font-size: clamp(1.45rem, 2.6vw, 2.35rem);
  color: var(--gold, #ffd265);
}

.history-result {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 0.8rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 900;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.08);
}

.history-result.victory {
  color: #fef1be;
  background: linear-gradient(180deg, rgba(249, 189, 72, 0.3), rgba(159, 92, 17, 0.42));
  border-color: rgba(255, 219, 120, 0.35);
  box-shadow: 0 0 22px rgba(255, 206, 102, 0.18);
}

.history-result.defeat {
  color: #ffd8d8;
  background: linear-gradient(180deg, rgba(193, 73, 90, 0.3), rgba(95, 25, 43, 0.46));
  border-color: rgba(255, 163, 176, 0.28);
  box-shadow: 0 0 22px rgba(202, 78, 104, 0.16);
}

.history-result.timeout {
  color: #d5f3ff;
  background: linear-gradient(180deg, rgba(82, 153, 213, 0.24), rgba(29, 68, 112, 0.42));
  border-color: rgba(173, 220, 255, 0.24);
}

.history-copy {
  margin: 10px 0 0;
  opacity: 0.82;
}

.history-columns {
  margin-top: 22px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.history-columns.single {
  grid-template-columns: minmax(0, 1fr);
}

.history-column {
  border-radius: 20px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.history-best-word {
  margin-top: 14px;
  padding: 14px;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(255, 210, 101, 0.12), rgba(255, 255, 255, 0.04));
  border: 1px solid rgba(255, 210, 101, 0.18);
}

.history-best-label {
  display: inline-block;
  font-size: 0.64rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #ffd265;
}

.history-best-main {
  display: grid;
  gap: 10px;
  margin-top: 10px;
}

.history-best-copy {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.history-best-copy strong {
  font-size: 1rem;
  color: #fff3c0;
}

.history-best-copy span {
  color: var(--teal, #6ff5dd);
  font-weight: 800;
  white-space: nowrap;
}

.history-list {
  list-style: none;
  margin: 14px 0 0;
  padding: 0;
  display: grid;
  gap: 10px;
  max-height: 300px;
  overflow: auto;
}

.history-entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.06);
}

.history-entry-main {
  min-width: 0;
  display: grid;
  gap: 8px;
}

.history-word-tiles {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.history-tile {
  min-width: 58px;
  min-height: 58px;
  padding: 10px;
  border-radius: 16px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--history-tile-bg, linear-gradient(180deg, #fffef8 0%, #f2ebe0 70%, #d9cec0 100%));
  color: var(--history-tile-text-color, #1c1930);
  box-shadow: var(--history-tile-shadow, inset 0 -4px 0 rgba(0, 0, 0, 0.12), 0 10px 18px rgba(45, 10, 24, 0.16));
  font-family: "Press Start 2P", cursive;
  overflow: hidden;
}

.history-tile-letter {
  font-size: 1.45rem;
  line-height: 1;
  font-weight: 900;
}

.history-tile-score {
  position: absolute;
  top: 7px;
  right: 8px;
  font-size: 0.58rem;
  font-weight: 800;
  line-height: 1;
}

.history-tile-modifier {
  position: absolute;
  top: 7px;
  left: 8px;
  max-width: calc(100% - 16px);
  min-width: 18px;
  padding: 2px 5px;
  border-radius: 999px;
  font-size: 0.42rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0 4px 10px rgba(27, 11, 20, 0.18);
}

.history-word {
  font-size: 0.94rem;
  font-weight: 700;
  word-break: break-word;
  opacity: 0.84;
}

.history-score {
  color: var(--teal, #6ff5dd);
  font-weight: 800;
  white-space: nowrap;
}

.history-empty {
  opacity: 0.64;
}

.history-actions {
  margin-top: 22px;
  display: flex;
  justify-content: center;
}

.play-again-button {
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 13px 22px;
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  font-family: "Press Start 2P", cursive;
  background: linear-gradient(180deg, #5de6cb 0%, #2eb397 100%);
  color: white;
  box-shadow:
    0 0 0 2px rgba(243, 228, 104, 0.9),
    0 14px 22px rgba(21, 12, 28, 0.2);
}

.play-again-button:disabled {
  cursor: default;
  opacity: 0.74;
  filter: saturate(0.7);
}

@media (max-width: 820px) {
  .history-overlay {
    inset: 10px;
  }

  .history-panel {
    padding: 20px;
  }

  .history-columns {
    grid-template-columns: 1fr;
  }

  .history-tile {
    min-width: 50px;
    min-height: 50px;
    padding: 8px;
  }

  .history-tile-letter {
    font-size: 1.2rem;
  }
}
</style>
