<template>
  <div class="game-shell">
    <div id="background-layer">
      <div class="shape-layer layer-far"></div>
      <div class="shape-layer layer-near"></div>
    </div>

    <main class="board-frame" :class="{ paused: isPaused }">
      <aside class="side-stack">
        <div class="bonus-card accent-blue">
          <span class="bonus-kicker">Game mode</span>
          <strong>{{ props.isMultiplayer ? 'Real Time Duel' : 'Bot Pressure' }}</strong>
          <p v-if="props.isMultiplayer">
            <button type="button" class="room-code-button" @click="copyRoomCode">
              Room {{ roomCode }}
            </button>
            · {{ isHost ? 'Host lane' : 'Opponent lane' }}
          </p>
          <p>{{ playerRoleText }}</p>
        </div>


        <div class="bonus-card accent-red">
          <span class="bonus-kicker">Status</span>
          <strong>{{ localMessage || 'Racks are live' }}</strong>
          <p v-if="props.isMultiplayer && !gameStarted">Waiting for opponent to connect</p>
          <p v-else>Only used letters are replaced</p>
        </div>
        <div class="bonus-card accent-purple">
          <span class="bonus-kicker">Cards</span>
          <strong>{{ myCards.boons.length }} Boon · {{ myCards.attacks.length }} Attack</strong>
          <p v-if="activeBoonCard">
            {{ activeBoonCard.label }} is ready. Click one of your tiles to use it.
          </p>
          <p v-else-if="myCards.boons.length || myCards.attacks.length">
            Drawn cards sit here until you spend them.
          </p>
          <p v-else>No cards in hand right now.</p>
          <div class="card-hand">
            <button
              v-for="card in myCards.boons"
              :key="card.id"
              type="button"
              class="action-card boon-card"
              :class="{ armed: activeBoonCardId === card.id }"
              @click="selectBoonCard(card)"
            >
              <span class="action-card-type">Boon</span>
              <strong>{{ card.label }}</strong>
              <span>{{ card.description }}</span>
            </button>
            <button
              v-for="card in myCards.attacks"
              :key="card.id"
              type="button"
              class="action-card attack-card"
              @click="useAttackCard(card)"
            >
              <span class="action-card-type">Attack</span>
              <strong>{{ card.label }}</strong>
              <span>{{ card.description }}</span>
            </button>
          </div>
        </div>
      <button class="pause-button" @click="emit('showSettings')">{{ isPaused ? 'Resume' : 'Pause' }}</button>
      <button class="back-button" @click="resetAndGoHome">Back to Home</button>

      </aside>

      <section class="arena-shell">
        <div class="score-ribbon">
          <div class="score-box host">
            <span>Your Board</span>
            <strong>{{ leftLane.score }}</strong>
          </div>
          <div class="score-divider">VS</div>
          <div class="score-box opponent">
            <span>Their Board</span>
            <strong>{{ rightLane.score }}</strong>
          </div>
        </div>

        <div v-if="props.isMultiplayer ? gameStarted : true" class="arena">
          <GameLane
            :side="leftLane.side"
            :label="leftLane.label"
            :submitted-word="leftLane.submittedWord"
            :score="leftLane.score"
            :last-word-score="leftLane.lastWordScore"
            :tiles="leftLane.tiles"
            :is-active="leftLane.isActive"
            :selected-tile-ids="leftLane.selectedTileIds"
            :saved-tile-ids="leftLane.savedTileIds"
            @tile-click="handleTileClickWithCards($event, leftLane.side)"
          />

          <GameLane
            :side="rightLane.side"
            :label="rightLane.label"
            :submitted-word="rightLane.submittedWord"
            :score="rightLane.score"
            :last-word-score="rightLane.lastWordScore"
            :tiles="rightLane.tiles"
            :is-active="rightLane.isActive"
            :selected-tile-ids="rightLane.selectedTileIds"
            :saved-tile-ids="rightLane.savedTileIds"
            @tile-click="handleTileClickWithCards($event, rightLane.side)"
          />
        </div>

        <div v-else class="waiting-card">
          <strong>Waiting for opponent...</strong>
          <p>The arena will light up as soon as both players are in.</p>
        </div>

        <WordBuilder
          v-if="(props.isMultiplayer ? gameStarted : true) && !gameEnded"
          :selected-tiles="selectedTilesForCurrentSide"
          :current-word-length="currentWordLength"
          :current-word-score="currentWordScore"
          :current-letter-total="currentLetterTotal"
          :current-length-bonus="currentLengthBonus"
          :current-first-tile-bonus="currentFirstTileBonus"
          :current-word-multiplier="currentWordMultiplier"
          :clear-count="rackClears[mySide]"
          :length-bonus-steps="lengthBonusSteps"
          @undo="removeLastLetter"
          @clear="clearWord"
          @save-letters="handleSaveLetters"
          @clear-rack="handleClearRack"
          @submit="handleSubmit"
          @remove-specific="removeSpecificTile"
          @tile-click="handleBuiltTileClick"
        />

      </section>

      <HistoryOverlay
        v-if="gameEnded"
        :winner-label="winnerLabel"
        :winning-score="winningScore"
        left-label="Your History"
        right-label="Their History"
        :left-history="leftLaneHistory"
        :right-history="rightLaneHistory"
        @play-again="handlePlayAgain"
      />
    </main>
  </div>
</template>

<script setup>
import { computed, defineProps, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  roomCode,
  isHost,
  submittedWords,
  wordHistory,
  playerScores,
  lastWordScores,
  playerTiles,
  rackClears,
  playerCards,
  gameStarted,
  submitWord as submitMultiplayerWord,
  clearRack as clearMultiplayerRack,
  useBoon as useMultiplayerBoon,
  useAttack as useMultiplayerAttack,
  playAgain as playMultiplayerAgain,
  resetGame as resetMultiplayer
} from './multiplayer.js';
import { MIN_WORD_LENGTH, getWordScoreDetails, isMissingRequiredTile, selectedTilesMatchWord } from './tile-logic.js';
import { getPreferredLanguage } from './language.js';
import { useWordBuilder } from './useWordBuilder.js';
import { useSinglePlayerGame } from './useSinglePlayerGame.js';
import { validateWord } from './word-validator.js';
import GameLane from './components/GameLane.vue';
import HistoryOverlay from './components/HistoryOverlay.vue';
import WordBuilder from './components/WordBuilder.vue';

const props = defineProps({
  isMultiplayer: Boolean
});

const emit = defineEmits(['home', 'showSettings', 'playAgain']);
const localMessage = ref('');
const isPaused = ref(false);
const activeBoonCardId = ref(null);
const isMultiplayerRef = computed(() => props.isMultiplayer);
const preferredLanguage = getPreferredLanguage();

const mySide = computed(() => {
  if (props.isMultiplayer) {
    return isHost.value ? 'host' : 'opponent';
  }

  return 'host';
});

const myTiles = computed(() => playerTiles.value[mySide.value] || []);
const opponentSide = computed(() => (mySide.value === 'host' ? 'opponent' : 'host'));
const buildLane = (side, label) => ({
  side,
  label,
  submittedWord: submittedWords.value[side],
  score: playerScores.value[side],
  lastWordScore: lastWordScores.value[side],
  tiles: playerTiles.value[side],
  isActive: mySide.value === side,
  selectedTileIds: selectedTileIds.value[side],
  savedTileIds: savedTileIds.value[side]
});

const {
  selectedTileIds,
  savedTileIds,
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
  replaceSelectedTileId,
  clearWord,
  clearSelectionForSide,
  saveSelectionForSide
} = useWordBuilder({
  mySide,
  myTiles
});

const leftLane = computed(() => buildLane(mySide.value, 'Your Board'));
const rightLane = computed(() => buildLane(opponentSide.value, 'Their Board'));
const leftLaneHistory = computed(() => wordHistory.value[mySide.value] || []);
const rightLaneHistory = computed(() => wordHistory.value[opponentSide.value] || []);

const {
  startBotLoop,
  stopBotLoop,
  clearSinglePlayerRack,
  useSinglePlayerBoon,
  useSinglePlayerAttack,
  submitSinglePlayerWord
} = useSinglePlayerGame({
  isMultiplayer: isMultiplayerRef,
  localMessage,
  selectedTilesForCurrentSide,
  clearSelectionForSide,
  playerTiles,
  playerScores,
  lastWordScores,
  rackClears,
  playerCards,
  submittedWords,
  wordHistory
});

const myCards = computed(() => playerCards.value[mySide.value] || { boons: [], attacks: [] });
const activeBoonCard = computed(() => {
  return myCards.value.boons.find((card) => card.id === activeBoonCardId.value) || null;
});
const WINNING_SCORE = 250;
const winningSide = computed(() => {
  if (playerScores.value.host >= WINNING_SCORE && playerScores.value.host >= playerScores.value.opponent) {
    return 'host';
  }

  if (playerScores.value.opponent >= WINNING_SCORE) {
    return 'opponent';
  }

  return null;
});
const gameEnded = computed(() => Boolean(winningSide.value));
const winningScore = computed(() => winningSide.value ? playerScores.value[winningSide.value] : 0);
const winnerLabel = computed(() => {
  if (winningSide.value === mySide.value) {
    return 'Your board';
  }

  if (winningSide.value === opponentSide.value) {
    return 'Their board';
  }

  return 'No one';
});

watch(myCards, () => {
  if (activeBoonCardId.value && !activeBoonCard.value) {
    resetActionMode();
  }
}, { deep: true });

const playerRoleText = computed(() => {
  if (props.isMultiplayer) {
    return 'Build on your board and race the other board in real time.';
  }

  return 'You and the bot are both constantly feeding the board with fresh tiles.';
});

const handleSubmit = async () => {
  if (gameEnded.value) {
    localMessage.value = 'The match is already over.';
    return;
  }

  const normalizedWord = currentWordDisplay.value;
  if (!normalizedWord) {
    localMessage.value = 'Pick at least one tile first.';
    return;
  }

  if (normalizedWord.length < MIN_WORD_LENGTH) {
    localMessage.value = `Words must be at least ${MIN_WORD_LENGTH} letters.`;
    return;
  }

  const selectedTiles = selectedTilesForCurrentSide.value;
  if (!selectedTiles.length || !selectedTilesMatchWord(selectedTiles, normalizedWord)) {
    localMessage.value = 'That word cannot be made from your current tiles.';
    return;
  }

  if (isMissingRequiredTile(myTiles.value, selectedTiles)) {
    localMessage.value = 'You have to use every MUST tile in your rack.';
    return;
  }

  localMessage.value = 'Checking word...';
  const validationResult = await validateWord(normalizedWord, preferredLanguage.code);
  if (!validationResult.valid) {
    localMessage.value = `${normalizedWord} is not a valid ${preferredLanguage.label.toLowerCase()} word.`;
    return;
  }
  const resolvedWord = (validationResult.resolvedWord || normalizedWord).toUpperCase();

  if (props.isMultiplayer) {
    const scoreDetails = getWordScoreDetails(selectedTiles);
    submitMultiplayerWord({
      word: normalizedWord,
      tileIds: selectedTiles.map((tile) => tile.id)
    });
    localMessage.value = `Sent ${resolvedWord} for ${scoreDetails.total} pts.`;
    clearSelectionForSide(mySide.value);
    return;
  }

  submitSinglePlayerWord(resolvedWord);
};

const resetActionMode = () => {
  activeBoonCardId.value = null;
};

const selectBoonCard = (card) => {
  if (activeBoonCardId.value === card.id) {
    resetActionMode();
    localMessage.value = 'Boon selection cleared.';
    return;
  }

  activeBoonCardId.value = card.id;
  localMessage.value = `Ready ${card.label}. Click one of your tiles to use it.`;
};

const useAttackCard = (card) => {
  if (props.isMultiplayer) {
    useMultiplayerAttack({ cardId: card.id });
    localMessage.value = `Played ${card.label} on a random enemy tile.`;
    resetActionMode();
    return;
  }

  if (useSinglePlayerAttack(mySide.value, card.id)) {
    localMessage.value = `Played ${card.label} on a random enemy tile.`;
    resetActionMode();
  }
};

const handleClearRack = () => {
  if (gameEnded.value) {
    localMessage.value = 'The match is already over.';
    return;
  }

  if (props.isMultiplayer) {
    if ((rackClears.value[mySide.value] || 0) <= 0) {
      localMessage.value = 'No rack clears remaining.';
      return;
    }

    clearMultiplayerRack();
    clearSelectionForSide(mySide.value);
    resetActionMode();
    localMessage.value = `Clearing rack... ${rackClears.value[mySide.value] - 1} clears left after this one.`;
    return;
  }

  resetActionMode();
  clearSinglePlayerRack(mySide.value);
};

const handleSaveLetters = () => {
  if (gameEnded.value) {
    localMessage.value = 'The match is already over.';
    return;
  }

  if (!selectedTilesForCurrentSide.value.length) {
    localMessage.value = 'Pick tiles first if you want to save them for later.';
    return;
  }

  if (saveSelectionForSide(mySide.value)) {
    localMessage.value = 'Saved those letters on your rack.';
  }
};

const handleTileClickWithCards = (tile, side) => {
  if (gameEnded.value) {
    return;
  }

  if (activeBoonCard.value) {
    if (side !== mySide.value) {
      localMessage.value = 'Boons can only target your own tiles.';
      return;
    }

    if (props.isMultiplayer) {
      useMultiplayerBoon({ cardId: activeBoonCard.value.id, tileId: tile.id });
      localMessage.value = `Played ${activeBoonCard.value.label} on your tile.`;
      resetActionMode();
      return;
    }

    if (useSinglePlayerBoon(mySide.value, activeBoonCard.value.id, tile.id)) {
      localMessage.value = `Played ${activeBoonCard.value.label} on your tile.`;
      resetActionMode();
    }
    return;
  }

  handleTileClick(tile);
};

const handleBuiltTileClick = (tile) => {
  if (gameEnded.value) {
    return;
  }

  if (activeBoonCard.value) {
    if (props.isMultiplayer) {
      useMultiplayerBoon({ cardId: activeBoonCard.value.id, tileId: tile.id });
      localMessage.value = `Played ${activeBoonCard.value.label} on your tile.`;
      resetActionMode();
      return;
    }

    const result = useSinglePlayerBoon(mySide.value, activeBoonCard.value.id, tile.id);
    if (result?.success) {
      if (result.replacementTileId) {
        replaceSelectedTileId(mySide.value, tile.id, result.replacementTileId);
      }
      localMessage.value = `Played ${activeBoonCard.value.label} on your tile.`;
      resetActionMode();
    }
    return;
  }

  removeSpecificTile(tile.id);
};

const copyRoomCode = async () => {
  if (!props.isMultiplayer || !roomCode.value) {
    return;
  }

  try {
    await navigator.clipboard.writeText(roomCode.value);
    localMessage.value = `Copied room code ${roomCode.value}.`;
  } catch (error) {
    localMessage.value = `Room code: ${roomCode.value}`;
  }
};

const setPauseState = (nextPaused) => {
  isPaused.value = nextPaused;

  if (props.isMultiplayer) {
    return;
  }

  if (nextPaused) {
    stopBotLoop();
    localMessage.value = 'Game paused.';
    return;
  }

  startBotLoop();
  localMessage.value = 'Racks are live';
};

const togglePause = () => {
  setPauseState(!isPaused.value);
};

const handlePlayAgain = () => {
  resetActionMode();
  clearSelectionForSide(mySide.value);

  if (props.isMultiplayer) {
    playMultiplayerAgain();
    localMessage.value = 'Resetting the match...';
    return;
  }

  stopBotLoop();
  emit('playAgain');
};

watch(gameEnded, (ended) => {
  if (ended) {
    stopBotLoop();
  }
});

const handleKeydown = (event) => {
  if (event.key !== 'Escape') {
    return;
  }

  event.preventDefault();
  togglePause();
};

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown);
});

const resetAndGoHome = () => {
  isPaused.value = false;
  stopBotLoop();
  resetMultiplayer();
  resetActionMode();
  localMessage.value = '';
  emit('home');
};
</script>

<style scoped>
body {
  background: #2a0719;
}

.game-shell {
  --bg-top: #ca6937;
  --bg-mid: #b63e3b;
  --bg-bottom: #341137;
  --bg-corner: #f39a54;
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
    radial-gradient(circle at 14% 18%, rgba(255, 228, 168, 0.2) 0, rgba(255, 228, 168, 0.2) 12%, transparent 30%),
    radial-gradient(circle at 82% 14%, rgba(255, 255, 255, 0.09) 0, rgba(255, 255, 255, 0.09) 8%, transparent 24%),
    linear-gradient(135deg, var(--bg-corner) 0%, var(--bg-top) 24%, var(--bg-mid) 58%, var(--bg-bottom) 100%);
  filter: saturate(1.08);
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
  opacity: 0.24;
  background-position: 0 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='280' viewBox='0 0 280 280'%3E%3Cg fill='none' stroke='%23fff4dc' stroke-width='2.6' stroke-opacity='.34'%3E%3Cpolygon points='40,24 68,74 12,74'/%3E%3Crect x='106' y='18' width='46' height='46' rx='4'/%3E%3Cpolygon points='217,22 245,38 245,70 217,86 189,70 189,38'/%3E%3Cpolygon points='44,118 72,134 72,166 44,182 16,166 16,134'/%3E%3Crect x='108' y='110' width='54' height='54' rx='6'/%3E%3Cpolygon points='214,110 246,164 182,164'/%3E%3Crect x='28' y='204' width='50' height='50' rx='5'/%3E%3Cpolygon points='136,198 164,214 164,246 136,262 108,246 108,214'/%3E%3Cpolygon points='220,198 248,248 192,248'/%3E%3C/g%3E%3C/svg%3E");
  animation: driftLayerFar 25s linear infinite;
}

.layer-near {
  inset: -6%;
  opacity: 0.18;
  background-size: 190px 190px;
  background-position: 28px 40px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='190' height='190' viewBox='0 0 190 190'%3E%3Cg fill='rgba(255,244,220,.14)' stroke='rgba(255,255,255,.16)' stroke-width='1.8'%3E%3Cpolygon points='26,20 52,64 0,64'/%3E%3Crect x='74' y='20' width='34' height='34' rx='3'/%3E%3Cpolygon points='150,18 170,30 170,54 150,66 130,54 130,30'/%3E%3Crect x='18' y='92' width='38' height='38' rx='4'/%3E%3Cpolygon points='96,88 118,126 74,126'/%3E%3Cpolygon points='152,86 174,98 174,124 152,136 130,124 130,98'/%3E%3Ccircle cx='42' cy='156' r='12'/%3E%3Crect x='82' y='144' width='28' height='28' rx='4'/%3E%3Cpolygon points='152,142 174,180 130,180'/%3E%3C/g%3E%3C/svg%3E");
  animation: driftLayerNear 30s linear infinite;
}

@keyframes driftLayerFar {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 280px -140px;
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


.board-frame {
  justify-content: center;
  display: flex;
  grid-template-columns: 250px minmax(0, 1fr);
  gap: 22px;
  flex: 1;
  min-height: 0;
}

.board-frame.paused {
  filter: blur(4px) saturate(0.82);
  pointer-events: none;
  user-select: none;
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

.room-code-button {
  appearance: none;
  border: none;
  background: rgba(255, 255, 255, 0.12);
  color: inherit;
  cursor: pointer;
  border-radius: 999px;
  padding: 5px 10px;
  font: inherit;
  font-weight: 700;
  margin-right: 6px;
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

.accent-purple {
  background: linear-gradient(180deg, rgba(112, 70, 182, 0.95), rgba(66, 33, 118, 0.9));
}

.card-hand {
  display: grid;
  gap: 10px;
  margin-top: 12px;
  position: relative;
  z-index: 1;
}

.action-card {
  --card-glow: rgba(255, 255, 255, 0.16);
  --card-edge: rgba(255, 255, 255, 0.22);
  --card-pattern: rgba(255, 255, 255, 0.08);
  --card-ink: #fff7ee;
  appearance: none;
  border: 1px solid var(--card-edge);
  cursor: pointer;
  width: 100%;
  text-align: left;
  display: grid;
  gap: 8px;
  padding: 14px 14px 15px;
  border-radius: 22px;
  color: var(--card-ink);
  font: inherit;
  position: relative;
  overflow: hidden;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    inset 0 -3px 0 rgba(39, 11, 25, 0.28),
    0 10px 18px rgba(30, 8, 34, 0.18);
  transition: transform 140ms ease, box-shadow 140ms ease, filter 140ms ease, border-color 140ms ease;
}

.action-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 18% 20%, var(--card-glow) 0, transparent 36%),
    linear-gradient(135deg, var(--card-pattern) 0%, transparent 35%, var(--card-pattern) 100%);
  opacity: 0.9;
  pointer-events: none;
}

.action-card::after {
  content: '';
  position: absolute;
  inset: 7px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.01));
  pointer-events: none;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    inset 0 -3px 0 rgba(39, 11, 25, 0.32),
    0 14px 22px rgba(30, 8, 34, 0.24);
  border-color: rgba(255, 236, 187, 0.38);
}

.action-card:focus-visible {
  outline: 3px solid rgba(255, 227, 141, 0.88);
  outline-offset: 2px;
}

.action-card strong {
  position: relative;
  z-index: 1;
  font-size: 1.2rem;
  line-height: 1.05;
  text-shadow: 0 1px 0 rgba(48, 18, 8, 0.28);
}

.action-card span:last-child {
  position: relative;
  z-index: 1;
  font-size: 0.99rem;
  line-height: 1.35;
  color: rgba(255, 248, 236, 0.84);
}

.action-card-type {
  position: relative;
  z-index: 1;
  justify-self: start;
  padding: 4px 8px 3px;
  border-radius: 999px;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: rgba(255, 248, 236, 0.92);
  background: rgba(24, 8, 22, 0.26);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.boon-card {
  --card-glow: rgba(189, 255, 195, 0.22);
  --card-edge: rgba(196, 255, 204, 0.3);
  --card-pattern: rgba(224, 255, 198, 0.08);
  background:
    linear-gradient(180deg, rgba(119, 206, 113, 0.96), rgba(63, 129, 84, 0.96));
}

.attack-card {
  --card-glow: rgba(255, 190, 154, 0.22);
  --card-edge: rgba(255, 194, 162, 0.3);
  --card-pattern: rgba(255, 222, 199, 0.08);
  background:
    linear-gradient(180deg, rgba(226, 118, 77, 0.98), rgba(145, 39, 51, 0.96));
}

.boon-card .action-card-type {
  background: rgba(18, 63, 42, 0.34);
}

.attack-card .action-card-type {
  background: rgba(78, 19, 28, 0.34);
}

.action-card.armed {
  transform: translateY(-2px);
  box-shadow:
    inset 0 0 0 2px rgba(255, 232, 160, 0.8),
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    inset 0 -3px 0 rgba(39, 11, 25, 0.32),
    0 16px 24px rgba(30, 8, 34, 0.28);
  border-color: rgba(255, 236, 187, 0.78);
}

.arena-shell {
  position: relative;
  min-width: 0;
  max-width: 1250px;
  max-height: 1000px;
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

.pause-button {
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
  background: linear-gradient(180deg, #6356d9 0%, #41359c 100%);
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
