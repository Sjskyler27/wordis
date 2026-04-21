<template>
  <div class="game-shell" :style="backgroundMoodStyle">
    <div id="background-layer">
      <div class="shape-layer layer-far"></div>
      <div class="shape-layer layer-near"></div>
    </div>

    <main class="board-frame" :class="{ paused: isPaused }" :style="boardFrameStyle">
      <button
        v-if="isSideDrawerMode"
        type="button"
        class="side-drawer-handle"
        :class="{ open: isSideDrawerOpen }"
        @click="toggleSideDrawer"
      >
        <span class="side-drawer-handle-grip"></span>
      </button>
      <button
        v-if="isSideDrawerMode && isSideDrawerOpen"
        type="button"
        class="side-drawer-scrim"
        aria-label="Close side drawer"
        @click="closeSideDrawer"
      ></button>
      <aside class="side-stack" :class="{ 'side-stack-drawer': isSideDrawerMode, open: isSideDrawerOpen }">
        <div class="bonus-card accent-blue">
          <span class="bonus-kicker">Game mode</span>
          <strong>{{ modeTitle }}</strong>
          <p v-if="props.isMultiplayer">
            <button type="button" class="room-code-button" @click="copyRoomCode">
              Room {{ roomCode }}
            </button>
            · {{ isHost ? 'Host lane' : 'Opponent lane' }}
          </p>
          <p>{{ modeSubtitle }}</p>
        </div>


        <div class="bonus-card accent-red">
          <span class="bonus-kicker">Status</span>
          <strong>{{ localMessage || statusHeadline }}</strong>
          <p v-if="props.isMultiplayer && !gameStarted">Waiting for opponent to connect</p>
          <p v-else-if="isTimedSoloMode">Timer ends the run, so play fast and bank points.</p>
          <p v-else>Only used letters are replaced</p>
        </div>
        <div class="bonus-card accent-purple">
          <span class="bonus-kicker">Cards</span>
          <strong>{{ cardSummary }}</strong>
          <p v-if="activeBoonCard">
            {{ activeBoonCard.label }} is ready. Click one of your tiles to use it.
          </p>
          <p v-else-if="hasCardsInHand">
            Drawn cards sit here until you spend them.
          </p>
          <p v-else>No cards in hand right now.</p>
          <div class="card-hand">
            <button
              v-for="(card, index) in myCards.boons"
              :key="card.id"
              type="button"
              class="action-card"
              :style="getCardStyle(card)"
              :class="{
                armed: activeBoonCardId === card.id,
                'action-card-controller-focus': controllerRegion === 'cards' && controllerCardCursorIndex === index
              }"
              :data-controller-card="index"
              @click="selectBoonCard(card)"
            >
              <span class="action-card-type">Boon</span>
              <strong>{{ card.label }}</strong>
              <span>{{ card.description }}</span>
            </button>
            <button
              v-if="attacksEnabled"
              v-for="(card, attackIndex) in myCards.attacks"
              :key="card.id"
              type="button"
              class="action-card"
              :style="getCardStyle(card)"
              :class="{
                'action-card-controller-focus': controllerRegion === 'cards' && controllerCardCursorIndex === myCards.boons.length + attackIndex
              }"
              :data-controller-card="myCards.boons.length + attackIndex"
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
          <div class="score-box host" :class="scoreBoxClass('host')">
            <span>Your Board</span>
            <strong>{{ leftLane.score }}</strong>
          </div>
          <div class="score-divider">VS</div>
          <div class="score-box opponent" :class="[{ timer: isTimedSoloMode }, scoreBoxClass('opponent')]">
            <span>{{ isTimedSoloMode ? 'Time Left' : 'Their Board' }}</span>
            <strong>{{ isTimedSoloMode ? timedSoloScoreRibbonLabel : rightLane.score }}</strong>
          </div>
        </div>

        <div v-if="props.isMultiplayer ? gameStarted : true" class="arena" :class="{ 'arena-solo': !showOpponentLane }">
          <GameLane
            :isMobile="props.isMobile"
            :side="leftLane.side"
            :label="leftLane.label"
            :submitted-word="leftLane.submittedWord"
            :score="leftLane.score"
            :last-word-score="leftLane.lastWordScore"
            :last-word-breakdown="leftLane.lastWordBreakdown"
            :tiles="leftLane.tiles"
            :is-active="leftLane.isActive"
            :selected-tile-ids="leftLane.selectedTileIds"
            :saved-tile-ids="leftLane.savedTileIds"
            :must-alert-ids="leftLane.mustAlertIds"
            :burst-pulse="laneBurstPulse[leftLane.side]"
            :controller-focused-tile-id="leftLane.side === mySide ? controllerFocusedTileId : ''"
            @tile-click="handleTileClickWithCards($event, leftLane.side)"
          />

          <GameLane
            v-if="showOpponentLane"
            :isMobile="props.isMobile"
            :side="rightLane.side"
            :label="rightLane.label"
            :submitted-word="rightLane.submittedWord"
            :score="rightLane.score"
            :last-word-score="rightLane.lastWordScore"
            :last-word-breakdown="rightLane.lastWordBreakdown"
            :tiles="rightLane.tiles"
            :is-active="rightLane.isActive"
            :selected-tile-ids="rightLane.selectedTileIds"
            :saved-tile-ids="rightLane.savedTileIds"
            :must-alert-ids="rightLane.mustAlertIds"
            :burst-pulse="laneBurstPulse[rightLane.side]"
            :controller-focused-tile-id="rightLane.side === mySide ? controllerFocusedTileId : ''"
            @tile-click="handleTileClickWithCards($event, rightLane.side)"
          />
        </div>

        <div v-else class="waiting-card">
          <strong>Waiting for opponent...</strong>
          <p>The arena will light up as soon as both players are in.</p>
        </div>

        <WordBuilder
          v-if="(props.isMultiplayer ? gameStarted : true)"
          :isMobile="props.isMobile"
          :selected-tiles="selectedTilesForCurrentSide"
          :invalid-pulse="invalidWordPulse"
          :score-pop-pulse="scorePopPulse"
          :score-pop-tiles="scorePopTiles"
          :current-word-length="currentWordLength"
          :current-word-score="currentWordScore"
          :current-letter-total="currentLetterTotal"
          :current-length-bonus="currentLengthBonus"
          :current-first-tile-bonus="currentFirstTileBonus"
          :current-word-multiplier="currentWordMultiplier"
          :current-word-side="mySide"
          :current-player-scores="playerScores"
          :clear-count="rackClears[mySide]"
          :length-bonus-steps="lengthBonusSteps"
          :controller-focused-built-tile-id="controllerRegion === 'builder' ? controllerFocusedBuiltTileId : ''"
          :controller-focused-action-index="controllerRegion === 'actions' ? controllerActionCursorIndex : -1"
          :is-overtime-active="isOvertimeActive"
          :overtime-label="overtimeLabel"
          @undo="handleUndo"
          @clear="handleClearWord"
          @save-letters="handleSaveLetters"
          @clear-rack="handleClearRack"
          @submit="handleSubmit"
          @remove-specific="removeSpecificTile"
          @tile-click="handleBuiltTileClick"
        />

      </section>

      <HistoryOverlay
        v-if="showHistoryOverlay"
        :result-title="historyResultTitle"
        :result-state="historyResultState"
        :summary-text="historySummaryText"
        left-label="Your History"
        :right-label="showOpponentLane ? 'Their History' : ''"
        :left-history="leftLaneHistory"
        :right-history="showOpponentLane ? rightLaneHistory : []"
        :play-again-text="playAgainButtonText"
        :play-again-disabled="props.isMultiplayer && myReplayVote"
        @play-again="handlePlayAgain"
      />

      <TutorialOverlay
        v-if="showTutorialOverlay"
        @close="handleCloseTutorial"
      />
    </main>
  </div>
</template>

<script setup>
import { computed, defineProps, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import gameMusicUrl from '/public/audio/gameMusic.mp3';
import tilePickupSoundUrl from '/public/audio/tile_pick_up.mp3';
import tilePutBackSoundUrl from '/public/audio/tile_put_back.mp3';
import scoreBuiltTileSoundUrl from '/public/audio/score_built_tile.mp3';
import victorySoundUrl from '/public/audio/victory.mp3';
import defeatSoundUrl from '/public/audio/defeat.mp3';
import {
  roomCode,
  isHost,
  submittedWords,
  wordHistory,
  playerScores,
  lastWordScores,
  lastWordBreakdowns,
  playAgainVotes,
  playerTiles,
  rackClears,
  playerCards,
  gameStarted,
  submitWord as submitMultiplayerWord,
  clearRack as clearMultiplayerRack,
  useBoon as useMultiplayerBoon,
  useAttack as useMultiplayerAttack,
  playAgain as playMultiplayerAgain,
  resetGame as resetMultiplayer,
  multiplayerOvertimeEnabled,
  multiplayerOvertimePendingSide,
  multiplayerOvertimeFinalWordSubmitted,
  multiplayerSubmissionPauseOwner
} from './multiplayer.js';
import { MIN_WORD_LENGTH, getWordScoreDetails, isMissingRequiredTile, selectedTilesMatchWord } from './tile-logic.js';
import { getPreferredLanguage } from './language.js';
import { useWordBuilder } from './useWordBuilder.js';
import { useSinglePlayerGame } from './useSinglePlayerGame.js';
import { validateWord } from './word-validator.js';
import { isTestingMode } from './testing.js';
import GameLane from './components/GameLane.vue';
import HistoryOverlay from './components/HistoryOverlay.vue';
import TutorialOverlay from './components/TutorialOverlay.vue';
import WordBuilder from './components/WordBuilder.vue';

const props = defineProps({
  isMobile: Boolean,
  isMultiplayer: Boolean,
  playMode: {
    type: String,
    default: 'timed_solo'
  },
  botDifficulty: {
    type: String,
    default: 'normal'
  },
  volume: Number,
  musicVolume: Number,
  effectsVolume: Number,
  gameZoom: {
    type: Number,
    default: 1
  },
  isControllerConnected: Boolean,
  settingsShowing: Boolean,
  overtimeEnabled: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits([
  'home',
  'showSettings',
  'playAgain',
  'volumeChange',
  'musicVolumeChange',
  'effectsVolumeChange'
]);
const localMessage = ref('');
const isPaused = ref(false);
const activeBoonCardId = ref(null);
const invalidWordPulse = ref(0);
const scorePopPulse = ref(0);
const scorePopTiles = ref([]);
const controllerRegion = ref('rack');
const controllerTileCursorIndex = ref(0);
const controllerCardCursorIndex = ref(0);
const controllerBuilderCursorIndex = ref(0);
const controllerActionCursorIndex = ref(0);
const isControllerNavigationActive = ref(false);
const laneBurstPulse = ref({
  host: 0,
  opponent: 0
});
const mustAlertTileIds = ref({
  host: new Set(),
  opponent: new Set()
});
const createEmptyLastWordBreakdown = () => ({
  wordScore: 0,
  burnPenalty: 0,
  netScore: 0
});
const isMultiplayerRef = computed(() => props.isMultiplayer);
const isTimedSoloMode = computed(() => !props.isMultiplayer && props.playMode === 'timed_solo');
const isBotMode = computed(() => !props.isMultiplayer && props.playMode === 'bot_match');
const matchOvertimeEnabled = computed(() => {
  return props.isMultiplayer ? multiplayerOvertimeEnabled.value : props.overtimeEnabled;
});
const attacksEnabled = computed(() => {
  return !isOvertimeActive.value && (isTestingMode || isTimedSoloMode.value || isBotMode.value || props.isMultiplayer);
});
const showOpponentLane = computed(() => props.isMultiplayer || isBotMode.value);
const isSideDrawerMode = computed(() => windowWidth.value < 1250);
const preferredLanguage = getPreferredLanguage();
const SOLO_TIMER_SECONDS = isTestingMode ? 25 : 180;
const timerRemainingSeconds = ref(SOLO_TIMER_SECONDS);
const isSoloTimerPausedByAttack = ref(false);
const timedSoloFinalWordSpent = ref(false);
const gameMusic = new Audio(gameMusicUrl);
gameMusic.loop = true;
const tilePickupSound = new Audio(tilePickupSoundUrl);
const tilePutBackSound = new Audio(tilePutBackSoundUrl);
const scoreBuiltTileSound = new Audio(scoreBuiltTileSoundUrl);
const victorySound = new Audio(victorySoundUrl);
const defeatSound = new Audio(defeatSoundUrl);
victorySound.loop = true;
defeatSound.loop = true;
let soloTimerId = null;
let scorePopTimeoutIds = [];
let activeScorePopAudios = [];
let historyOverlayTimeoutId = null;
const showHistoryOverlay = ref(false);
const showTutorialOverlay = ref(false);
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1440);
const isSideDrawerOpen = ref(false);
const sideDrawerAutoOpen = ref(false);
const GAME_TUTORIAL_STORAGE_KEY = 'hasSeenWordisGameTutorial';

const mySide = computed(() => {
  if (props.isMultiplayer) {
    return isHost.value ? 'host' : 'opponent';
  }

  return 'host';
});

const myTiles = computed(() => playerTiles.value[mySide.value] || []);
const controllerFocusedTileId = computed(() => myTiles.value[controllerTileCursorIndex.value]?.id || '');
const controllerFocusedBuiltTileId = computed(() => selectedTilesForCurrentSide.value[controllerBuilderCursorIndex.value]?.id || '');
const opponentSide = computed(() => (mySide.value === 'host' ? 'opponent' : 'host'));
const buildLane = (side, label) => ({
  side,
  label,
  submittedWord: submittedWords.value[side],
  score: playerScores.value[side],
  lastWordScore: lastWordScores.value[side],
  lastWordBreakdown: lastWordBreakdowns.value[side] || createEmptyLastWordBreakdown(),
  tiles: playerTiles.value[side],
  isActive: mySide.value === side,
  selectedTileIds: selectedTileIds.value[side],
  savedTileIds: savedTileIds.value[side],
  mustAlertIds: mustAlertTileIds.value[side]
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
  myTiles,
  playerScores
});

const leftLane = computed(() => buildLane(mySide.value, 'Your Board'));
const rightLane = computed(() => buildLane(opponentSide.value, isBotMode.value ? 'Bot Board' : 'Their Board'));
const leftLaneHistory = computed(() => wordHistory.value[mySide.value] || []);
const rightLaneHistory = computed(() => wordHistory.value[opponentSide.value] || []);

const {
  startBotLoop,
  stopBotLoop,
  clearSinglePlayerRack,
  useSinglePlayerBoon,
  useSinglePlayerAttack,
  submitSinglePlayerWord,
  submissionPauseOwner: singlePlayerSubmissionPauseOwner,
  overtimePendingSide: singlePlayerOvertimePendingSide,
  overtimeFinalWordSubmitted: singlePlayerOvertimeFinalWordSubmitted
} = useSinglePlayerGame({
  isMultiplayer: isMultiplayerRef,
  botEnabled: isBotMode,
  isTimedSoloMode,
  overtimeEnabled: matchOvertimeEnabled,
  botDifficulty: computed(() => props.botDifficulty),
  localMessage,
  selectedTilesForCurrentSide,
  clearSelectionForSide,
  playerTiles,
  playerScores,
  lastWordScores,
  lastWordBreakdowns,
  rackClears,
  playerCards,
  submittedWords,
  wordHistory,
  onTimedSoloPauseTime: () => {
    isSoloTimerPausedByAttack.value = true;
  },
  onTimedSoloGainTime: (seconds) => {
    const wasOutOfTime = timerRemainingSeconds.value <= 0;
    timerRemainingSeconds.value += seconds;
    if (wasOutOfTime && timerRemainingSeconds.value > 0) {
      // Recovering from timeout should fully return solo sprint to live play.
      timedSoloFinalWordSpent.value = false;
      isSoloTimerPausedByAttack.value = false;
      if (!isPaused.value) {
        startBotLoop();
        startSoloTimer();
      }
    }
  }
});

const overtimeTrailingSide = computed(() => {
  if (isTimedSoloMode.value || !matchOvertimeEnabled.value) {
    return null;
  }

  return props.isMultiplayer
    ? multiplayerOvertimePendingSide.value
    : singlePlayerOvertimePendingSide.value;
});
const overtimeFinalWordSubmitted = computed(() => {
  if (isTimedSoloMode.value || !matchOvertimeEnabled.value) {
    return false;
  }

  return props.isMultiplayer
    ? multiplayerOvertimeFinalWordSubmitted.value
    : singlePlayerOvertimeFinalWordSubmitted.value;
});
const isOvertimeActive = computed(() => Boolean(overtimeTrailingSide.value) && !overtimeFinalWordSubmitted.value);
const overtimeLabel = computed(() => {
  if (!isOvertimeActive.value) {
    return '';
  }

  return overtimeTrailingSide.value === mySide.value ? 'Final Word!' : 'Keep playing words!';
});
const submissionPauseOwner = computed(() => {
  return props.isMultiplayer
    ? multiplayerSubmissionPauseOwner.value
    : singlePlayerSubmissionPauseOwner.value;
});
const isMySubmissionPaused = computed(() => Boolean(submissionPauseOwner.value) && submissionPauseOwner.value !== mySide.value);
const isSubmissionPauseActive = computed(() => Boolean(submissionPauseOwner.value));

const myCards = computed(() => playerCards.value[mySide.value] || { boons: [], attacks: [] });
const controllerCards = computed(() => {
  return [
    ...myCards.value.boons,
    ...(attacksEnabled.value ? myCards.value.attacks : [])
  ];
});
const activeBoonCard = computed(() => {
  return myCards.value.boons.find((card) => card.id === activeBoonCardId.value) || null;
});
const visibleAttackCount = computed(() => attacksEnabled.value ? myCards.value.attacks.length : 0);
const myReplayVote = computed(() => playAgainVotes.value[mySide.value]);
const replayVoteCount = computed(() => Object.values(playAgainVotes.value).filter(Boolean).length);
const playAgainButtonText = computed(() => {
  if (!props.isMultiplayer) {
    return 'Play Again';
  }

  return myReplayVote.value
    ? `Waiting for Vote ${replayVoteCount.value}/2`
    : `Vote to Play Again ${replayVoteCount.value}/2`;
});
const cardSummary = computed(() => {
  return attacksEnabled.value
    ? `${myCards.value.boons.length} Boon · ${visibleAttackCount.value} Attack`
    : `${myCards.value.boons.length} Boon`;
});
const hasCardsInHand = computed(() => myCards.value.boons.length > 0 || visibleAttackCount.value > 0);
const getCardStyle = (card) => {
  const ui = card?.ui || {};
  return {
    '--card-glow': ui.cardGlow || 'rgba(255, 255, 255, 0.16)',
    '--card-edge': ui.cardEdge || 'rgba(255, 255, 255, 0.24)',
    '--card-pattern': ui.cardPattern || 'rgba(255, 255, 255, 0.08)',
    '--card-background': ui.cardBackground || 'linear-gradient(180deg, rgba(119, 206, 113, 0.96), rgba(63, 129, 84, 0.96))',
    '--card-badge-background': ui.cardBadgeBackground || 'rgba(24, 8, 22, 0.26)'
  };
};
const WINNING_SCORE = isTestingMode ? 40 : 250;
const winningSide = computed(() => {
  if (isOvertimeActive.value) {
    return null;
  }

  if (overtimeFinalWordSubmitted.value) {
    if (playerScores.value.host > playerScores.value.opponent) {
      return 'host';
    }

    if (playerScores.value.opponent > playerScores.value.host) {
      return 'opponent';
    }

    return null;
  }

  if (playerScores.value.host >= WINNING_SCORE && playerScores.value.host >= playerScores.value.opponent) {
    return 'host';
  }

  if (playerScores.value.opponent >= WINNING_SCORE) {
    return 'opponent';
  }

  return null;
});
const gameEnded = computed(() => {
  if (isTimedSoloMode.value) {
    return Boolean(winningSide.value);
  }

  if (matchOvertimeEnabled.value) {
    return overtimeFinalWordSubmitted.value;
  }

  return Boolean(winningSide.value);
});
const timeExpired = computed(() => isTimedSoloMode.value && timerRemainingSeconds.value <= 0);
const finalWordWindowActive = computed(() => isTimedSoloMode.value && timeExpired.value && !timedSoloFinalWordSpent.value);
const effectiveGameEnded = computed(() => gameEnded.value || (timeExpired.value && timedSoloFinalWordSpent.value));
const winningScore = computed(() => {
  if (timeExpired.value) {
    return playerScores.value.host;
  }

  return winningSide.value ? playerScores.value[winningSide.value] : 0;
});
const winnerLabel = computed(() => {
  if (timeExpired.value) {
    return 'Time is up';
  }

  if (winningSide.value === mySide.value) {
    return 'Your board';
  }

  if (winningSide.value === opponentSide.value) {
    return 'Their board';
  }

  return 'No one';
});
const historySummaryText = computed(() => {
  if (timeExpired.value) {
    return `Time is up. Final score: ${playerScores.value.host}.`;
  }

  if (showOpponentLane.value) {
    return `${winnerLabel.value} wins. Final score: ${playerScores.value.host} to ${playerScores.value.opponent}.`;
  }

  return `${winnerLabel.value} wins at ${winningScore.value} points. Final score: ${playerScores.value.host}.`;
});
const historyResultState = computed(() => {
  if (timeExpired.value) {
    return 'timeout';
  }

  if (props.isMultiplayer || isBotMode.value) {
    return winningSide.value === mySide.value ? 'victory' : 'defeat';
  }

  return 'victory';
});
const historyResultTitle = computed(() => {
  if (timeExpired.value) {
    return 'Time Up';
  }

  return historyResultState.value === 'victory' ? 'Victory' : 'Defeat';
});
const formattedTimeRemaining = computed(() => {
  const safeSeconds = Math.max(0, timerRemainingSeconds.value);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
});
const timedSoloScoreRibbonLabel = computed(() => {
  if (finalWordWindowActive.value) {
    return 'Play your last word!';
  }

  return formattedTimeRemaining.value;
});
const modeTitle = computed(() => {
  if (props.isMultiplayer) {
    return 'Real Time Duel';
  }

  return isTimedSoloMode.value ? 'Solo Sprint' : `Bot Pressure · ${props.botDifficulty}`;
});
const modeSubtitle = computed(() => {
  if (props.isMultiplayer) {
    return 'Build on your board and race the other board in real time.';
  }

  if (isTimedSoloMode.value) {
    return 'Play alone against the clock and squeeze out the highest score before time expires.';
  }

  return `Fight the bot on ${props.botDifficulty} difficulty in the same live rack format.`;
});
const statusHeadline = computed(() => {
  if (showTutorialOverlay.value) {
    return 'Tutorial open';
  }

  if (finalWordWindowActive.value) {
    return 'Final word ready';
  }

  if (isOvertimeActive.value) {
    return 'Overtime showdown';
  }

  if (isTimedSoloMode.value) {
    return `${formattedTimeRemaining.value} remaining`;
  }

  return 'Racks are live';
});
const boardFrameStyle = computed(() => ({
  zoom: props.gameZoom || 1
}));
const scoreGap = computed(() => {
  if (!showOpponentLane.value) {
    return 0;
  }

  return Math.abs(leftLane.value.score - rightLane.value.score);
});
const scoreGapTier = computed(() => {
  if (scoreGap.value >= 120) {
    return 'epic';
  }

  if (scoreGap.value >= 60) {
    return 'high';
  }

  if (scoreGap.value >= 25) {
    return 'medium';
  }

  if (scoreGap.value >= 10) {
    return 'low';
  }

  return 'none';
});

const clamp01 = (value) => Math.max(0, Math.min(1, value));
const mixHexColor = (start, end, amount) => {
  const mixChannel = (startChannel, endChannel) => {
    return Math.round(startChannel + ((endChannel - startChannel) * amount));
  };
  const startColor = start.replace('#', '');
  const endColor = end.replace('#', '');
  const startChannels = [
    Number.parseInt(startColor.slice(0, 2), 16),
    Number.parseInt(startColor.slice(2, 4), 16),
    Number.parseInt(startColor.slice(4, 6), 16)
  ];
  const endChannels = [
    Number.parseInt(endColor.slice(0, 2), 16),
    Number.parseInt(endColor.slice(2, 4), 16),
    Number.parseInt(endColor.slice(4, 6), 16)
  ];

  return `#${startChannels.map((channel, index) => {
    return mixChannel(channel, endChannels[index]).toString(16).padStart(2, '0');
  }).join('')}`;
};
const backgroundProgress = computed(() => {
  if (isTimedSoloMode.value) {
    return clamp01(1 - (timerRemainingSeconds.value / SOLO_TIMER_SECONDS));
  }

  const highestScore = Math.max(playerScores.value.host || 0, playerScores.value.opponent || 0);
  return clamp01(highestScore / WINNING_SCORE);
});
const backgroundMoodStyle = computed(() => {
  const progress = backgroundProgress.value;
  const intensity = progress * progress;

  return {
    '--bg-corner': mixHexColor('#e9b248', '#ff7b5c', intensity),
    '--bg-top': mixHexColor('#c79129', '#d25b3f', intensity),
    '--bg-mid': mixHexColor('#ff8658', '#a53149', intensity),
    '--bg-bottom': mixHexColor('#76347c', '#24061f', intensity),
    '--bg-glow-alpha': `${0.26 - (intensity * 0.1)}`,
    '--bg-shape-far-opacity': `${0.18 + (progress * 0.1)}`,
    '--bg-shape-near-opacity': `${0.14 + (progress * 0.1)}`,
    '--bg-saturate': `${1.03 + (progress * 0.16)}`
  };
});
const scoreBoxClass = (side) => {
  if (!showOpponentLane.value || isTimedSoloMode.value || scoreGapTier.value === 'none') {
    return {};
  }

  const sideScore = side === 'host' ? leftLane.value.score : rightLane.value.score;
  const otherScore = side === 'host' ? rightLane.value.score : leftLane.value.score;

  return {
    'score-gap-low': scoreGapTier.value === 'low',
    'score-gap-medium': scoreGapTier.value === 'medium',
    'score-gap-high': scoreGapTier.value === 'high',
    'score-gap-epic': scoreGapTier.value === 'epic',
    'score-box-leading': sideScore > otherScore,
    'score-box-trailing': sideScore < otherScore
  };
};

const triggerInvalidWordShake = () => {
  invalidWordPulse.value += 1;
};

const playUiSound = (audio) => {
  if (!audio) {
    return;
  }

  try {
    audio.currentTime = 0;
    if(props.effectsVolume > 0)
    audio.play();
  } catch (error) {
    // Ignore UI sound playback failures.
  }
};

const syncAudioLevels = () => {
  const musicLevel = (props.volume || 0) * (props.musicVolume || 0) / 100;
  const effectsLevel = (props.volume || 0) * (props.effectsVolume || 0) / 100;
  gameMusic.volume = musicLevel;
  tilePickupSound.volume = effectsLevel;
  tilePutBackSound.volume = effectsLevel;
  scoreBuiltTileSound.volume = effectsLevel;
  victorySound.volume = effectsLevel;
  defeatSound.volume = effectsLevel;
};

const stopResultAudio = () => {
  victorySound.pause();
  defeatSound.pause();
  victorySound.currentTime = 0;
  defeatSound.currentTime = 0;
};

const stopGameMusic = () => {
  gameMusic.pause();
  gameMusic.currentTime = 0;
};

const startGameMusic = async ({ restart = false } = {}) => {
  syncAudioLevels();
  if (restart) {
    gameMusic.currentTime = 0;
  }

  if (gameMusic.volume <= 0 || effectiveGameEnded.value) {
    return;
  }

  try {
    await gameMusic.play();
  } catch (error) {
    // Ignore autoplay failures until the user interacts again.
  }
};

const playScoreAnimation = async (tileCount) => {
  scorePopTimeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
  scorePopTimeoutIds = [];
  activeScorePopAudios.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
  activeScorePopAudios = [];

  if (!tileCount) {
    scorePopTiles.value = [];
    return;
  }

  scorePopPulse.value += 1;
  const effectsLevel = (props.volume || 0) * (props.effectsVolume || 0) / 100;
  if (effectsLevel > 0) {
    Array.from({ length: tileCount }, (_, index) => {
      const timeoutId = window.setTimeout(() => {
        const audio = new Audio(scoreBuiltTileSound.src);
        audio.volume = effectsLevel;
        audio.playbackRate = Math.min(1.55, 0.9 + (index * 0.08));
        activeScorePopAudios.push(audio);
        audio.play().catch(() => {
          // Ignore burst audio playback failures.
        }).finally(() => {
          activeScorePopAudios = activeScorePopAudios.filter((entry) => entry !== audio);
        });
      }, index * 110);

      scorePopTimeoutIds.push(timeoutId);
      return timeoutId;
    });
  }

  const totalDuration = Math.max(420, (tileCount * 110) + 260);
  const cleanupTimeoutId = window.setTimeout(() => {
    scorePopTiles.value = [];
  }, totalDuration);
  scorePopTimeoutIds.push(cleanupTimeoutId);
};

const triggerLaneBurst = (side, score) => {
  if (!score || score < 6) {
    return;
  }

  laneBurstPulse.value = {
    ...laneBurstPulse.value,
    [side]: laneBurstPulse.value[side] + 1
  };
};

const triggerMustTileAlert = (side, tileIds) => {
  if (!tileIds?.length) {
    return;
  }

  mustAlertTileIds.value = {
    ...mustAlertTileIds.value,
    [side]: new Set(tileIds)
  };

  window.setTimeout(() => {
    mustAlertTileIds.value = {
      ...mustAlertTileIds.value,
      [side]: new Set()
    };
  }, 1100);
};

const autoSwapMatchingMustTiles = () => {
  const selectedTiles = [...selectedTilesForCurrentSide.value];
  const selectedTileIdsSet = new Set(selectedTiles.map((tile) => tile.id));
  const missingMustTiles = myTiles.value.filter((tile) => {
    return tile.status === 'mustuse' && !tile.locked && !selectedTileIdsSet.has(tile.id);
  });
  let swappedAnyTile = false;

  for (const mustTile of missingMustTiles) {
    const mustLetter = mustTile.baseLetter || mustTile.letter;
    const replacementTile = selectedTiles.find((tile) => {
      return tile.status !== 'mustuse'
        && !tile.locked
        && (tile.baseLetter || tile.letter) === mustLetter;
    });

    if (!replacementTile) {
      continue;
    }

    replaceSelectedTileId(mySide.value, replacementTile.id, mustTile.id);
    const replacementIndex = selectedTiles.findIndex((tile) => tile.id === replacementTile.id);
    if (replacementIndex !== -1) {
      selectedTiles[replacementIndex] = mustTile;
    }
    swappedAnyTile = true;
  }

  return swappedAnyTile;
};

watch(myCards, () => {
  if (activeBoonCardId.value && !activeBoonCard.value) {
    resetActionMode();
  }
}, { deep: true });

watch(lastWordScores, (nextScores, previousScores = { host: 0, opponent: 0 }) => {
  for (const side of ['host', 'opponent']) {
    if ((nextScores?.[side] || 0) > (previousScores?.[side] || 0)) {
      triggerLaneBurst(side, nextScores[side]);
    }
  }
}, { deep: true });

watch(() => [props.volume, props.musicVolume, props.effectsVolume], () => {
  syncAudioLevels();

  if (gameMusic.volume <= 0) {
    gameMusic.pause();
    return;
  }

  if (!effectiveGameEnded.value && !isPaused.value) {
    startGameMusic();
  }
}, { immediate: true });

const handleSubmit = async () => {
  if (effectiveGameEnded.value) {
    localMessage.value = 'The match is already over.';
    return;
  }

  if (isMySubmissionPaused.value) {
    localMessage.value = 'Your submissions are paused until your opponent submits.';
    return;
  }

  const normalizedWord = currentWordDisplay.value;
  const swappedInMustTile = autoSwapMatchingMustTiles();
  const selectedTiles = selectedTilesForCurrentSide.value;
  if (!normalizedWord) {
    localMessage.value = 'Pick at least one tile first.';
    return;
  }

  if (selectedTiles.length < MIN_WORD_LENGTH) {
    localMessage.value = `Words must use at least ${MIN_WORD_LENGTH} tiles.`;
    triggerInvalidWordShake();
    return;
  }

  if (!selectedTiles.length || !selectedTilesMatchWord(selectedTiles, normalizedWord)) {
    localMessage.value = 'That word cannot be made from your current tiles.';
    triggerInvalidWordShake();
    return;
  }

  if (isMissingRequiredTile(myTiles.value, selectedTiles)) {
    localMessage.value = 'You have to use every MUST tile in your rack.';
    triggerMustTileAlert(mySide.value, myTiles.value
      .filter((tile) => tile.status === 'mustuse' && !tile.locked)
      .map((tile) => tile.id));
    return;
  }

  if (swappedInMustTile) {
    localMessage.value = 'Swapped in your MUST tile automatically.';
  }

  localMessage.value = 'Checking word...';
  const validationResult = await validateWord(normalizedWord, preferredLanguage.code);
  if (!validationResult.valid) {
    localMessage.value = `${normalizedWord} is not a valid ${preferredLanguage.label.toLowerCase()} word.`;
    triggerInvalidWordShake();
    return;
  }
  const resolvedWord = (validationResult.resolvedWord || normalizedWord).toUpperCase();
  scorePopTiles.value = selectedTiles.map((tile) => ({ ...tile }));
  playScoreAnimation(selectedTiles.length);

  if (props.isMultiplayer) {
    const scoreDetails = getWordScoreDetails(selectedTiles, {
      side: mySide.value,
      scores: playerScores.value
    });
    // 
    submitMultiplayerWord({
      word: normalizedWord,
      tileIds: selectedTiles.map((tile) => tile.id)
    });
    localMessage.value = `Sent ${resolvedWord} for ${scoreDetails.total} pts.`;
    clearSelectionForSide(mySide.value);
    return;
  }

  if (isTimedSoloMode.value) {
    isSoloTimerPausedByAttack.value = false;
  }

  submitSinglePlayerWord(resolvedWord);

  if (finalWordWindowActive.value) {
    timedSoloFinalWordSpent.value = true;
  }
};

const resetActionMode = () => {
  activeBoonCardId.value = null;
};

const selectBoonCard = (card) => {
  if (card.effectType === 'clear_negative_modifiers') {
    if (props.isMultiplayer) {
      useMultiplayerBoon({ cardId: card.id, tileId: null });
      localMessage.value = `Played ${card.label}.`;
      resetActionMode();
      return;
    }

    const result = useSinglePlayerBoon(mySide.value, card.id, null);
    if (result?.success) {
      localMessage.value = `Played ${card.label}.`;
      resetActionMode();
    }
    return;
  }

  if (activeBoonCardId.value === card.id) {
    resetActionMode();
    localMessage.value = 'Boon selection cleared.';
    return;
  }

  activeBoonCardId.value = card.id;
  localMessage.value = `Ready ${card.label}. Click one of your tiles to use it.`;
  focusControllerTile(controllerTileCursorIndex.value);
};

const useAttackCard = (card) => {
  if (!attacksEnabled.value) {
    localMessage.value = isOvertimeActive.value ? 'Overtime only allows boons.' : 'Solo sprint does not use attacks.';
    return;
  }

  if (card.effectType === 'pause_submissions' && isSubmissionPauseActive.value) {
    localMessage.value = 'A submission pause is already active.';
    return;
  }

  if (props.isMultiplayer) {
    useMultiplayerAttack({ cardId: card.id });
    localMessage.value = card.effectType === 'pause_submissions'
      ? 'Paused enemy submissions until your next word.'
      : `Played ${card.label} on a random enemy tile.`;
    resetActionMode();
    return;
  }

  const result = useSinglePlayerAttack(mySide.value, card.id);
  if (result?.success) {
    localMessage.value = result.message || `Played ${card.label}.`;
    resetActionMode();
  }
};

const handleClearRack = () => {
  if (effectiveGameEnded.value) {
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
  if (effectiveGameEnded.value) {
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

const handleUndo = () => {
  if (removeLastLetter()) {
    playUiSound(tilePutBackSound);
  }
};

const handleClearWord = () => {
  if (clearWord()) {
    playUiSound(tilePutBackSound);
  }
};

const refocusControllerSelection = () => {
  if (!isControllerNavigationActive.value) {
    return;
  }

  if (controllerRegion.value === 'cards') {
    focusControllerCard(controllerCardCursorIndex.value);
    return;
  }

  if (controllerRegion.value === 'builder') {
    focusControllerBuilder(controllerBuilderCursorIndex.value);
    return;
  }

  if (controllerRegion.value === 'actions') {
    focusControllerAction(controllerActionCursorIndex.value);
    return;
  }

  focusControllerTile(controllerTileCursorIndex.value);
};

const openSideDrawer = ({ auto = false } = {}) => {
  if (!isSideDrawerMode.value) {
    return;
  }

  isSideDrawerOpen.value = true;
  sideDrawerAutoOpen.value = auto;
};

const closeSideDrawer = () => {
  isSideDrawerOpen.value = false;
  sideDrawerAutoOpen.value = false;
};

const toggleSideDrawer = () => {
  if (isSideDrawerOpen.value) {
    closeSideDrawer();
    return;
  }

  openSideDrawer({ auto: false });
};

const focusControllerTile = (index = controllerTileCursorIndex.value) => {
  if (!myTiles.value.length) {
    return;
  }

  isControllerNavigationActive.value = true;
  controllerRegion.value = 'rack';
  const boundedIndex = Math.max(0, Math.min(index, myTiles.value.length - 1));
  controllerTileCursorIndex.value = boundedIndex;

  nextTick(() => {
    const tileButton = document.querySelector(`[data-controller-tile="${mySide.value}-${boundedIndex}"]`);
    if (tileButton && typeof tileButton.focus === 'function') {
      tileButton.focus();
    }
  });
};

const focusControllerCard = (index = controllerCardCursorIndex.value) => {
  if (!controllerCards.value.length) {
    return;
  }

  isControllerNavigationActive.value = true;
  controllerRegion.value = 'cards';
  const boundedIndex = Math.max(0, Math.min(index, controllerCards.value.length - 1));
  controllerCardCursorIndex.value = boundedIndex;

  nextTick(() => {
    const cardButton = document.querySelector(`[data-controller-card="${boundedIndex}"]`);
    if (cardButton && typeof cardButton.focus === 'function') {
      cardButton.focus();
    }
  });
};

const focusControllerBuilder = (index = controllerBuilderCursorIndex.value) => {
  if (!selectedTilesForCurrentSide.value.length) {
    return;
  }

  isControllerNavigationActive.value = true;
  controllerRegion.value = 'builder';
  const boundedIndex = Math.max(0, Math.min(index, selectedTilesForCurrentSide.value.length - 1));
  controllerBuilderCursorIndex.value = boundedIndex;

  nextTick(() => {
    const builtTileButton = document.querySelector(`[data-controller-built="${boundedIndex}"]`);
    if (builtTileButton && typeof builtTileButton.focus === 'function') {
      builtTileButton.focus();
    }
  });
};

const focusControllerAction = (index = controllerActionCursorIndex.value) => {
  const actionCount = 5;
  isControllerNavigationActive.value = true;
  controllerRegion.value = 'actions';
  const boundedIndex = Math.max(0, Math.min(index, actionCount - 1));
  controllerActionCursorIndex.value = boundedIndex;

  nextTick(() => {
    const actionButton = document.querySelector(`[data-controller-action="${boundedIndex}"]`);
    if (actionButton && typeof actionButton.focus === 'function') {
      actionButton.focus();
    }
  });
};

const moveControllerTileFocus = (direction) => {
  if (!myTiles.value.length) {
    return;
  }

  const columns = 5;
  const currentIndex = Math.max(0, Math.min(controllerTileCursorIndex.value, myTiles.value.length - 1));
  let nextIndex = currentIndex;

  if (direction === 'left') {
    if (currentIndex % columns === 0 && controllerCards.value.length) {
      focusControllerCard(0);
      return;
    }
    nextIndex = Math.max(0, currentIndex - 1);
  } else if (direction === 'right') {
    nextIndex = Math.min(myTiles.value.length - 1, currentIndex + 1);
  } else if (direction === 'up') {
    nextIndex = Math.max(0, currentIndex - columns);
  } else if (direction === 'down') {
    console.log('test')
    if (currentIndex + columns >= myTiles.value.length && selectedTilesForCurrentSide.value.length) {
      focusControllerBuilder(Math.min(currentIndex % columns, selectedTilesForCurrentSide.value.length - 1));
      return;
    } else if (currentIndex + columns >= myTiles.value.length && !selectedTilesForCurrentSide.value.length) {
      focusControllerAction(Math.min(controllerBuilderCursorIndex.value, 4));
      return;
    }
    nextIndex = Math.min(myTiles.value.length - 1, currentIndex + columns);
  }

  focusControllerTile(nextIndex);
};

const handleTileClickWithCards = (tile, side) => {
  if (effectiveGameEnded.value) {
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

  const result = handleTileClick(tile);
  if (result === 'added') {
    playUiSound(tilePickupSound);
  } else if (result === 'removed') {
    playUiSound(tilePutBackSound);
  }
};

const handleBuiltTileClick = (tile) => {
  if (effectiveGameEnded.value) {
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

  if (removeSpecificTile(tile.id)) {
    playUiSound(tilePutBackSound);
  }
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
    stopSoloTimer();
    gameMusic.pause();
    localMessage.value = 'Game paused.';
    return;
  }

  startBotLoop();
  startSoloTimer();
  startGameMusic();
  localMessage.value = 'Racks are live';
};

const syncTutorialPauseState = (visible) => {
  if (props.isMultiplayer) {
    return;
  }

  if (visible) {
    stopBotLoop();
    stopSoloTimer();
    gameMusic.pause();
    return;
  }

  if (!props.settingsShowing && !effectiveGameEnded.value) {
    startBotLoop();
    startSoloTimer();
    startGameMusic();
  }
};

const handleCloseTutorial = ({ dontShowAgain } = {}) => {
  if (dontShowAgain) {
    localStorage.setItem(GAME_TUTORIAL_STORAGE_KEY, 'true');
  }

  showTutorialOverlay.value = false;
};

const togglePause = () => {
  setPauseState(!isPaused.value);
};

const handlePlayAgain = () => {
  resetActionMode();
  clearSelectionForSide(mySide.value);
  isSoloTimerPausedByAttack.value = false;
  timedSoloFinalWordSpent.value = false;

  if (props.isMultiplayer) {
    playMultiplayerAgain();
    localMessage.value = myReplayVote.value
      ? `Waiting for the other player. ${replayVoteCount.value}/2 votes in.`
      : 'Replay vote locked in. Waiting for the other player.';
    return;
  }

  stopBotLoop();
  stopSoloTimer();
  stopResultAudio();
  emit('playAgain');
};

watch(effectiveGameEnded, (ended) => {
  if (ended) {
    stopBotLoop();
    stopSoloTimer();
    gameMusic.pause();
    showHistoryOverlay.value = false;
    window.clearTimeout(historyOverlayTimeoutId);
    // Let the final word resolve on screen before the results overlay appears.
    historyOverlayTimeoutId = window.setTimeout(() => {
      showHistoryOverlay.value = true;
    }, 1500);
    return;
  }

  showHistoryOverlay.value = false;
  window.clearTimeout(historyOverlayTimeoutId);
  if (!isPaused.value) {
    stopResultAudio();
    startGameMusic({ restart: true });
  }
});

watch(effectiveGameEnded, async (ended, wasEnded) => {
  if (!ended || wasEnded) {
    return;
  }

  const audio = historyResultState.value === 'defeat' ? defeatSound : victorySound;
  gameMusic.pause();
  syncAudioLevels();
  stopResultAudio();

  try {
    await audio.play();
  } catch (error) {
    // Ignore autoplay failures; the overlay state still updates correctly.
  }
});

const stopSoloTimer = () => {
  window.clearInterval(soloTimerId);
  soloTimerId = null;
};

const startSoloTimer = () => {
  if (!isTimedSoloMode.value || effectiveGameEnded.value) {
    stopSoloTimer();
    return;
  }

  window.clearInterval(soloTimerId);
  soloTimerId = window.setInterval(() => {
    if (isSoloTimerPausedByAttack.value) {
      return;
    }

    timerRemainingSeconds.value = Math.max(0, timerRemainingSeconds.value - 1);
    if (timerRemainingSeconds.value <= 0) {
      stopSoloTimer();
      stopBotLoop();
    }
  }, 1000);
};

watch(() => props.playMode, (nextMode) => {
  timerRemainingSeconds.value = nextMode === 'timed_solo' ? SOLO_TIMER_SECONDS : 0;
  isSoloTimerPausedByAttack.value = false;
  timedSoloFinalWordSpent.value = false;

  if (nextMode === 'timed_solo') {
    startSoloTimer();
    return;
  }

  stopSoloTimer();
}, { immediate: true });

watch(effectiveGameEnded, (ended) => {
  if (ended) {
    stopBotLoop();
    stopSoloTimer();
    return;
  }

  if (isTimedSoloMode.value) {
    startSoloTimer();
  }
}, { immediate: true });

watch(() => props.settingsShowing, (showingSettings) => {
  // Keep the solo timer and bot loop in sync with the visible pause/settings state.
  setPauseState(showingSettings);
}, { immediate: true });

watch(showTutorialOverlay, (visible) => {
  syncTutorialPauseState(visible);
});

const handleKeydown = (event) => {
  if (props.settingsShowing) {
    return;
  }

  if (event.key !== 'Escape') {
    if (!myTiles.value.length) {
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      if (controllerRegion.value === 'cards') {
        focusControllerCard(Math.max(0, controllerCardCursorIndex.value - 1));
      } else if (controllerRegion.value === 'builder') {
        focusControllerBuilder(Math.max(0, controllerBuilderCursorIndex.value - 1));
      } else if (controllerRegion.value === 'actions') {
        focusControllerAction(Math.max(0, controllerActionCursorIndex.value - 1));
      } else {
        moveControllerTileFocus('left');
      }
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      if (controllerRegion.value === 'cards') {
        focusControllerTile(0);
      } else if (controllerRegion.value === 'builder') {
        focusControllerBuilder(Math.min(controllerBuilderCursorIndex.value + 1, selectedTilesForCurrentSide.value.length - 1));
      } else if (controllerRegion.value === 'actions') {
        focusControllerAction(Math.min(controllerActionCursorIndex.value + 1, 4));
      } else {
        moveControllerTileFocus('right');
      }
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (controllerRegion.value === 'cards') {
        if (controllerCardCursorIndex.value === 0) {
          focusControllerCard(controllerCards.value.length);
        } else {
          focusControllerCard(controllerCardCursorIndex.value - 1);
        }
      } else if (controllerRegion.value === 'builder') {
        const bottomRowStart = Math.max(0, myTiles.value.length - 5);
        focusControllerTile(Math.min(bottomRowStart + controllerBuilderCursorIndex.value, myTiles.value.length - 1));
      } else if (controllerRegion.value === 'actions' && !selectedTilesForCurrentSide.value.length ) {
        const bottomRowStart = Math.max(0, myTiles.value.length - 5);
        focusControllerTile(Math.min(bottomRowStart + controllerBuilderCursorIndex.value, myTiles.value.length - 1));
      } else if (controllerRegion.value === 'actions' && selectedTilesForCurrentSide.value.length) {
        focusControllerBuilder(Math.min(controllerActionCursorIndex.value, selectedTilesForCurrentSide.value.length - 1));
      } else {
        moveControllerTileFocus('up');
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (controllerRegion.value === 'cards') {
        if (controllerCardCursorIndex.value >= controllerCards.value.length - 1) {
          focusControllerCard(0);
        } else {
          focusControllerCard(controllerCardCursorIndex.value + 1);
        }
      } else if (controllerRegion.value === 'builder') {
        focusControllerAction(Math.min(controllerBuilderCursorIndex.value, 4));
      } else if (controllerRegion.value === 'actions') {
        focusControllerAction(controllerActionCursorIndex.value);
      } else {
        moveControllerTileFocus('down');
      }
      return;
    }

    if (event.key === 'b') {
      event.preventDefault();
      handleUndo();
      return;
    }

    if (event.key === 'y') {
      event.preventDefault();
      handleClearWord();
      return;
    }

    if (event.key === 'x') {
      event.preventDefault();
      handleSubmit();
      return;
    }
    if (event.key === 'lb') {
      event.preventDefault();
      handleSaveLetters();
      return;
    }
    if (event.key === 'rb') {
      event.preventDefault();
      handleClearRack();
      return;
    }

    return;
  }

  event.preventDefault();
};

watch([myTiles, mySide], () => {
  refocusControllerSelection();
}, { deep: true });

watch(isSideDrawerMode, (isDrawerMode) => {
  if (!isDrawerMode) {
    closeSideDrawer();
  }
});

watch(controllerRegion, (nextRegion, previousRegion) => {
  if (!isSideDrawerMode.value || !isControllerNavigationActive.value) {
    return;
  }

  if (nextRegion === 'cards') {
    openSideDrawer({ auto: true });
    return;
  }

  if (previousRegion === 'cards' && sideDrawerAutoOpen.value) {
    closeSideDrawer();
  }
});

const syncWindowWidth = () => {
  windowWidth.value = window.innerWidth;
};

onMounted(() => {
  if (!localStorage.getItem(GAME_TUTORIAL_STORAGE_KEY)) {
    showTutorialOverlay.value = true;
  }
  syncWindowWidth();
  window.addEventListener('resize', syncWindowWidth);
  window.addEventListener('keydown', handleKeydown);
  startGameMusic({ restart: true });
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncWindowWidth);
  window.removeEventListener('keydown', handleKeydown);
  stopSoloTimer();
  stopGameMusic();
  window.clearTimeout(historyOverlayTimeoutId);
  tilePickupSound.pause();
  tilePutBackSound.pause();
  scoreBuiltTileSound.pause();
  scorePopTimeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
  activeScorePopAudios.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
  scorePopTimeoutIds = [];
  activeScorePopAudios = [];
  stopResultAudio();
});

const resetAndGoHome = () => {
  isPaused.value = false;
  stopBotLoop();
  stopSoloTimer();
  closeSideDrawer();
  showHistoryOverlay.value = false;
  window.clearTimeout(historyOverlayTimeoutId);
  isSoloTimerPausedByAttack.value = false;
  timedSoloFinalWordSpent.value = false;
  stopGameMusic();
  stopResultAudio();
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
  --bg-glow-alpha: 0.2;
  --bg-shape-far-opacity: 0.24;
  --bg-shape-near-opacity: 0.18;
  --bg-saturate: 1.08;
  --panel-deep: rgba(73, 18, 34, 0.6);
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

.side-drawer-handle {
  display: none;
}

.side-drawer-scrim {
  display: none;
}

.side-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 350px;
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
  max-height: 300px;
  overflow-y: auto;
}

.action-card {
  --card-glow: rgba(255, 255, 255, 0.16);
  --card-edge: rgba(255, 255, 255, 0.22);
  --card-pattern: rgba(255, 255, 255, 0.08);
  --card-background: linear-gradient(180deg, rgba(119, 206, 113, 0.96), rgba(63, 129, 84, 0.96));
  --card-badge-background: rgba(24, 8, 22, 0.26);
  --card-ink: #fff7ee;
  appearance: none;
  border: 1px solid var(--card-edge);
  cursor: pointer;
  width: 100%;
  max-width: 280px;
  text-align: left;
  display: grid;
  gap: 8px;
  padding: 14px 14px 15px;
  border-radius: 22px;
  color: var(--card-ink);
  font: inherit;
  position: relative;
  overflow: hidden;
  background: var(--card-background);
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

.action-card:focus,
.action-card:focus-visible {
  outline: 3px solid rgba(255, 227, 141, 0.88);
  outline-offset: 2px;
}

.action-card-controller-focus {
  outline: 3px solid rgba(255, 227, 141, 0.88);
  outline-offset: 2px;
  transform: translateY(-2px);
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
  background: var(--card-badge-background);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
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
  background: rgba(90, 23, 35, 0.22);
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

.arena {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.arena.arena-solo {
  grid-template-columns: minmax(0, 1fr);
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
  .arena {
    grid-template-columns: 1fr;
  }

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

  .bottom-bar {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 1000px) {
  .accent-blue {
    height: 0px;
    display: none;
  }
  .game-shell {

  }
}

@media (max-width: 1249px) {
  .board-frame {
    position: relative;
  }

  .side-drawer-handle {
    position: fixed;
    top: 50%;
    left: 0;
    z-index: 7;
    transform: translateY(-50%);
    border: 1px solid rgba(255, 238, 214, 0.16);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 10px 10px 8px;
    border-radius: 0 14px 14px 0;
    background: rgba(55, 13, 31, 0.94);
    color: rgba(255, 244, 228, 0.86);
    font-family: inherit;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    box-shadow: 0 12px 28px rgba(30, 8, 22, 0.22);
    transition: transform 180ms ease, background 180ms ease, color 180ms ease;
  }

  .side-drawer-handle.open {
    left: min(340px, calc(100vw - 80px));
  }

  .side-drawer-handle-grip {
    width: 3px;
    height: 28px;
    border-radius: 999px;
    background: rgba(255, 214, 157, 0.82);
    flex: 0 0 auto;
  }

  .side-drawer-handle-grip::before {
    content: none;
  }

  .side-drawer-scrim {
    position: fixed;
    inset: 0;
    display: block;
    z-index: 5;
    border: none;
    background: rgba(18, 6, 17, 0.28);
  }

  .side-stack.side-stack-drawer {
    position: fixed;
    top: 18px;
    left: 0;
    bottom: 18px;
    z-index: 6;
    width: min(360px, calc(100vw - 52px));
    max-width: none;
    padding: 18px 16px 22px;
    background: linear-gradient(180deg, rgba(80, 16, 42, 0.94), rgba(50, 10, 28, 0.96));
    border-right: 2px solid rgba(255, 255, 255, 0.12);
    box-shadow: 24px 0 42px rgba(18, 6, 17, 0.24);
    overflow-y: auto;
    transform: translateX(calc(-100% - 16px));
    transition: transform 220ms ease;
  }

  .side-stack.side-stack-drawer.open {
    transform: translateX(0);
  }

  .side-stack.side-stack-drawer .action-card {
    max-width: none;
  }
}
</style>
