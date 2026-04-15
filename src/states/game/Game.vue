<template>
  <div class="game-shell">
    <div id="background-layer"></div>

    <main class="board-frame">
      <aside class="side-stack">
        <div class="bonus-card accent-blue">
          <span class="bonus-kicker">Tempo</span>
          <strong>{{ props.isMultiplayer ? 'Real Time Duel' : 'Bot Pressure' }}</strong>
          <p v-if="props.isMultiplayer">
            Room {{ roomCode }} · {{ isHost ? 'Host lane' : 'Opponent lane' }}
          </p>
          <p>{{ playerRoleText }}</p>
        </div>

        <div class="bonus-card accent-gold">
          <span class="bonus-kicker">Current Build</span>
          <strong>{{ currentWordDisplay || 'Pick tiles below' }}</strong>
          <p>{{ currentWordScore }} pts potential</p>
        </div>

        <div class="bonus-card accent-red">
          <span class="bonus-kicker">Status</span>
          <strong>{{ localMessage || 'Racks are live' }}</strong>
          <p v-if="props.isMultiplayer && !gameStarted">Waiting for opponent to connect</p>
          <p v-else>Only used letters are replaced</p>
        </div>
      </aside>

      <section class="arena-shell">
        <div class="score-ribbon">
          <div class="score-box host">
            <span>Host</span>
            <strong>{{ playerScores.host }}</strong>
          </div>
          <div class="score-divider">VS</div>
          <div class="score-box opponent">
            <span>Opponent</span>
            <strong>{{ playerScores.opponent }}</strong>
          </div>
        </div>

        <div v-if="props.isMultiplayer ? gameStarted : true" class="arena">
          <GameLane
            side="host"
            label="Host"
            :submitted-word="submittedWords.host"
            :score="playerScores.host"
            :tiles="playerTiles.host"
            :is-active="mySide === 'host'"
            :selected-tile-ids="selectedTileIds.host"
            @tile-click="handleTileClick"
          />

          <GameLane
            side="opponent"
            label="Opponent"
            :submitted-word="submittedWords.opponent"
            :score="playerScores.opponent"
            :tiles="playerTiles.opponent"
            :is-active="mySide === 'opponent'"
            :selected-tile-ids="selectedTileIds.opponent"
            @tile-click="handleTileClick"
          />
        </div>

        <div v-else class="waiting-card">
          <strong>Waiting for opponent...</strong>
          <p>The arena will light up as soon as both players are in.</p>
        </div>

        <WordBuilder
          v-if="props.isMultiplayer ? gameStarted : true"
          :selected-tiles="selectedTilesForCurrentSide"
          :current-word-length="currentWordLength"
          :current-word-score="currentWordScore"
          :current-letter-total="currentLetterTotal"
          :current-length-bonus="currentLengthBonus"
          :current-first-tile-bonus="currentFirstTileBonus"
          :current-word-multiplier="currentWordMultiplier"
          :length-bonus-steps="lengthBonusSteps"
          @undo="removeLastLetter"
          @clear="clearWord"
          @submit="handleSubmit"
          @remove-specific="removeSpecificTile"
        />
      </section>
    </main>

    <footer class="bottom-bar">
      <button class="back-button" @click="resetAndGoHome">Back to Home</button>
    </footer>
  </div>
</template>

<script setup>
import { computed, defineProps, ref } from 'vue';
import {
  roomCode,
  isHost,
  submittedWords,
  wordHistory,
  playerScores,
  playerTiles,
  gameStarted,
  submitWord as submitMultiplayerWord,
  resetGame as resetMultiplayer
} from './multiplayer.js';
import { getWordScoreDetails } from './tile-logic.js';
import { useWordBuilder } from './useWordBuilder.js';
import { useSinglePlayerGame } from './useSinglePlayerGame.js';
import GameLane from './components/GameLane.vue';
import WordBuilder from './components/WordBuilder.vue';

const props = defineProps({
  isMultiplayer: Boolean
});

const emit = defineEmits(['home']);
const localMessage = ref('');
const isMultiplayerRef = computed(() => props.isMultiplayer);

const mySide = computed(() => {
  if (props.isMultiplayer) {
    return isHost.value ? 'host' : 'opponent';
  }

  return 'host';
});

const myTiles = computed(() => playerTiles.value[mySide.value] || []);

const {
  selectedTileIds,
  selectedTilesForCurrentSide,
  currentWordDisplay,
  currentWordLength,
  currentLengthBonus,
  currentFirstTileBonus,
  currentLetterTotal,
  currentWordMultiplier,
  currentWordScore,
  lengthBonusSteps,
  handleTileClick,
  removeLastLetter,
  removeSpecificTile,
  clearWord,
  clearSelectionForSide
} = useWordBuilder({
  mySide,
  myTiles
});

const {
  stopBotLoop,
  submitSinglePlayerWord
} = useSinglePlayerGame({
  isMultiplayer: isMultiplayerRef,
  localMessage,
  selectedTilesForCurrentSide,
  clearSelectionForSide,
  playerTiles,
  playerScores,
  submittedWords,
  wordHistory
});

const playerRoleText = computed(() => {
  if (props.isMultiplayer) {
    return isHost.value
      ? 'Build from the host rack and score before the other lane catches up.'
      : 'Build from the opponent rack and race the board in real time.';
  }

  return 'You and the bot are both constantly feeding the board with fresh tiles.';
});

const handleSubmit = () => {
  const normalizedWord = currentWordDisplay.value;
  if (!normalizedWord) {
    localMessage.value = 'Pick at least one tile first.';
    return;
  }

  const selectedTiles = selectedTilesForCurrentSide.value;
  if (!selectedTiles.length || selectedTiles.map((tile) => tile.letter).join('') !== normalizedWord) {
    localMessage.value = 'That word cannot be made from your current tiles.';
    return;
  }

  if (props.isMultiplayer) {
    const scoreDetails = getWordScoreDetails(selectedTiles);
    submitMultiplayerWord({
      word: normalizedWord,
      tileIds: selectedTiles.map((tile) => tile.id)
    });
    localMessage.value = `Sent ${normalizedWord} for ${scoreDetails.total} pts.`;
    clearSelectionForSide(mySide.value);
    return;
  }

  submitSinglePlayerWord(normalizedWord);
};

const resetAndGoHome = () => {
  stopBotLoop();
  resetMultiplayer();
  localMessage.value = '';
  emit('home');
};
</script>

<style scoped>
body {
  background: #2a0719;
}

.game-shell {
  --bg-top: #b54f21;
  --bg-mid: #d0522e;
  --bg-bottom: #4c0f33;
  --panel-deep: rgba(73, 18, 34, 0.9);
  --cream: #f7efe1;
  --gold: #ffca67;
  --teal: #4bc7b0;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  color: var(--cream);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

#background-layer {
  position: absolute;
  inset: 0;
  z-index: -2;
  background:
    radial-gradient(circle at 20% 20%, rgba(255, 198, 109, 0.14) 0, rgba(255, 198, 109, 0.14) 14px, transparent 15px) 0 0 / 120px 120px,
    radial-gradient(circle at 80% 12%, rgba(255, 255, 255, 0.06) 0, rgba(255, 255, 255, 0.06) 8px, transparent 9px) 0 0 / 80px 80px,
    linear-gradient(180deg, var(--bg-top) 0%, var(--bg-mid) 42%, var(--bg-bottom) 100%);
}

.game-shell::before {
  content: '';
  position: absolute;
  inset: 72px 24px 24px;
  z-index: -1;
  border-radius: 30px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.01));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16);
}

.board-frame {
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr);
  gap: 22px;
  flex: 1;
  min-height: 0;
}

.side-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bonus-card {
  border-radius: 28px;
  padding: 22px 18px;
  min-height: 156px;
  background: rgba(68, 20, 46, 0.9);
  border: 2px solid rgba(255, 255, 255, 0.12);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  position: relative;
  overflow: hidden;
}

.bonus-card::after {
  content: '';
  position: absolute;
  inset: auto -30px -30px auto;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
}

.bonus-kicker {
  display: inline-block;
  margin-bottom: 10px;
  font-size: 0.74rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  opacity: 0.7;
}

.bonus-card strong,
.bonus-card p {
  display: block;
  position: relative;
  z-index: 1;
}

.bonus-card strong {
  font-size: 1.35rem;
  line-height: 1.1;
}

.bonus-card p {
  margin: 10px 0 0;
  opacity: 0.85;
}

.accent-blue {
  background: linear-gradient(180deg, rgba(58, 111, 208, 0.9), rgba(49, 78, 170, 0.82));
}

.accent-gold {
  background: linear-gradient(180deg, rgba(231, 124, 47, 0.92), rgba(179, 82, 28, 0.88));
}

.accent-red {
  background: linear-gradient(180deg, rgba(164, 38, 68, 0.95), rgba(105, 22, 54, 0.88));
}

.arena-shell {
  min-width: 0;
  border-radius: 34px;
  background: rgba(90, 23, 35, 0.72);
  border: 2px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 20px 50px rgba(38, 7, 22, 0.28);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

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

.score-divider {
  font-size: 1rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  opacity: 0.8;
}

.arena {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.waiting-card {
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.06);
  padding: 34px 24px;
  text-align: center;
}

.waiting-card strong {
  display: block;
  font-size: 1.4rem;
}

.waiting-card p {
  margin: 10px 0 0;
  opacity: 0.78;
}

.bottom-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 0 8px;
}

.back-button {
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
  background: linear-gradient(180deg, #ff965b 0%, #e05e2a 100%);
  color: white;
}

@media (max-width: 1180px) {
  .board-frame {
    grid-template-columns: 1fr;
  }

  .side-stack {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 920px) {
  .arena {
    grid-template-columns: 1fr;
  }

  .score-ribbon {
    grid-template-columns: 1fr;
  }

  .score-divider {
    text-align: center;
  }

  .bottom-bar {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 720px) {
  .game-shell {
    padding: 16px;
  }

  .side-stack {
    grid-template-columns: 1fr;
  }
}
</style>
