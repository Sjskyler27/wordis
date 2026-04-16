<template>
  <div class="history-overlay">
    <div class="history-scrim"></div>
    <section class="history-panel">
      <span class="history-kicker">Match Results</span>
      <strong class="history-title">{{ summaryText }}</strong>
      <p class="history-copy">Every scored word from the match lives here.</p>

      <div class="history-columns" :class="{ single: !rightLabel }">
        <section class="history-column">
          <span class="history-label">{{ leftLabel }}</span>
          <ul class="history-list">
            <li
              v-for="(entry, index) in normalizedLeftHistory"
              :key="`left-history-${index}-${entry.word}-${entry.score}`"
              class="history-entry"
            >
              <span class="history-word">{{ entry.word }}</span>
              <span class="history-score">+{{ entry.score }}</span>
            </li>
            <li v-if="!normalizedLeftHistory.length" class="history-empty">No words played.</li>
          </ul>
        </section>

        <section v-if="rightLabel" class="history-column">
          <span class="history-label">{{ rightLabel }}</span>
          <ul class="history-list">
            <li
              v-for="(entry, index) in normalizedRightHistory"
              :key="`right-history-${index}-${entry.word}-${entry.score}`"
              class="history-entry"
            >
              <span class="history-word">{{ entry.word }}</span>
              <span class="history-score">+{{ entry.score }}</span>
            </li>
            <li v-if="!normalizedRightHistory.length" class="history-empty">No words played.</li>
          </ul>
        </section>
      </div>

      <div class="history-actions">
        <button
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
import { computed } from 'vue';

const props = defineProps({
  summaryText: {
    type: String,
    required: true
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

const normalizeEntry = (entry) => {
  if (typeof entry === 'string') {
    return { word: entry, score: 0 };
  }

  return {
    word: entry?.word || '',
    score: entry?.score || 0
  };
};

const normalizedLeftHistory = computed(() => props.leftHistory.map(normalizeEntry));
const normalizedRightHistory = computed(() => props.rightHistory.map(normalizeEntry));
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

.history-word {
  font-size: 0.94rem;
  font-weight: 700;
  word-break: break-word;
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
}
</style>
