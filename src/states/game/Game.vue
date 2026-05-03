<template>
  <div class="game-shell" :class="{ 'machine-game-shell': isBotMode }">
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
        <GameStatusCards
          :is-mobile="isMobile"
          :is-multiplayer="props.isMultiplayer"
          :room-code="roomCode"
          :is-host="isHost"
          :mode-title="modeTitle"
          :mode-subtitle="modeSubtitle"
          :is-bot-mode="isBotMode"
          :is-multi-round-mode="isMultiRoundMode"
          :active-round-modifiers="activeRoundModifiersWithCountdowns"
          :local-message="localMessage"
          :status-headline="statusHeadline"
          :game-started="gameStarted"
          :is-timed-solo-mode="isTimedSoloMode"
          @copy-room-code="copyRoomCode"
        />
        <GameCardsPanel
          :is-mobile="isMobile"
          :card-summary="cardSummary"
          :active-boon-card="activeBoonCard"
          :grouped-boon-cards="groupedBoonCards"
          :grouped-attack-cards="groupedAttackCards"
          :attacks-enabled="attacksEnabled"
          :card-controls-disabled="cardControlsDisabled"
          :active-boon-card-id="activeBoonCardId"
          :controller-region="controllerRegion"
          :controller-card-cursor-index="controllerCardCursorIndex"
          @select-boon="selectBoonCard"
          @use-attack="useAttackCard"
        />
      <button class="pause-button" @click="emit('showSettings')">{{ isPaused ? 'Resume' : 'Pause' }}</button>
      <!-- <button class="back-button" @click="resetAndGoHome">Back to Home</button> -->

      </aside>

      <section class="arena-shell">
        <MultiRoundProgress
          v-if="isMultiRoundMode"
          :rounds="multiRoundProgressRounds"
          :controller-focused-round-index="controllerRegion === 'rounds' ? controllerRoundCursorIndex : -1"
        />

        <ScoreRibbon
          :score-ribbon-score-label="scoreRibbonScoreLabel"
          :clock-score-ribbon-label="clockScoreRibbonLabel"
          :right-score="rightLane.score"
          :show-clock="isTimedSoloMode || isMultiRoundMode"
          :host-score-class="scoreBoxClass('host')"
          :opponent-score-class="[{ timer: isTimedSoloMode || isMultiRoundMode }, scoreBoxClass('opponent')]"
        />

        <div v-if="props.isMultiplayer ? gameStarted : true" class="arena" :class="{ 'arena-solo': !showOpponentLane }">
          <GameLane
            :isMobile="props.isMobile"
            :side="leftLane.side"
            :label="leftLane.label"
            :submitted-word="leftLane.submittedWord"
            :score="leftLane.score"
            :current-player-scores="playerScores"
            :score-options="multiRoundScoreOptions"
            :last-word-score="leftLane.lastWordScore"
            :last-word-breakdown="leftLane.lastWordBreakdown"
            :tiles="leftLane.tiles"
            :is-active="leftLane.isActive"
            :selected-tile-ids="leftLane.selectedTileIds"
            :saved-tile-ids="leftLane.savedTileIds"
            :must-alert-ids="leftLane.mustAlertIds"
            :burst-pulse="laneBurstPulse[leftLane.side]"
            :clear-pulse="rackClearPulse[leftLane.side]"
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
            :current-player-scores="playerScores"
            :score-options="multiRoundScoreOptions"
            :last-word-score="rightLane.lastWordScore"
            :last-word-breakdown="rightLane.lastWordBreakdown"
            :tiles="rightLane.tiles"
            :is-active="rightLane.isActive"
            :selected-tile-ids="rightLane.selectedTileIds"
            :saved-tile-ids="rightLane.savedTileIds"
            :must-alert-ids="rightLane.mustAlertIds"
            :burst-pulse="laneBurstPulse[rightLane.side]"
            :clear-pulse="rackClearPulse[rightLane.side]"
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
          :score-options="multiRoundScoreOptions"
          :clear-count="rackClears[mySide]"
          :length-bonus-steps="lengthBonusSteps"
          :controller-focused-built-tile-id="controllerRegion === 'builder' ? controllerFocusedBuiltTileId : ''"
          :controller-focused-action-index="controllerRegion === 'actions' ? controllerActionCursorIndex : -1"
          :is-overtime-active="wordBuilderBannerActive"
          :overtime-label="wordBuilderBannerLabel"
          @undo="handleUndo"
          @clear="handleClearWord"
          @save-letters="handleSaveLetters"
          @clear-rack="handleClearRack"
          @submit="handleSubmit"
          @remove-specific="removeSpecificTile"
          @tile-click="handleBuiltTileClick"
        />

      </section>

      <PersonalModifiersDrawer
        v-if="isMultiRoundMode"
        ref="personalModifiersDrawerRef"
        :modifiers="personalModifiersForDrawer"
      />

      <MultiRoundRewardChoice
        v-if="isMultiRoundMode && isMultiRoundRewardChoiceOpen"
        :rewards="multiRoundRewardChoices"
        :upcoming-round="upcomingMultiRoundPreview"
        :controller-focused-reward-index="controllerRegion === 'reward' ? controllerRewardCursorIndex : -1"
        @choose="handleMultiRoundRewardChoice"
      />

      <HistoryOverlay
        v-if="showHistoryOverlay"
        :result-title="historyResultTitle"
        :result-state="historyResultState"
        :summary-text="historySummaryText"
        left-label="Your History"
        :right-label="showOpponentLane ? 'Their History' : ''"
        :left-history="leftLaneHistory"
        :right-history="showOpponentLane ? rightLaneHistory : []"
        :multi-round-summary="multiRoundHistorySummary"
        :play-again-text="playAgainButtonText"
        :play-again-disabled="props.isMultiplayer && myReplayVote"
        @play-again="handlePlayAgain"
      />

      <TutorialOverlay
        v-if="showTutorialOverlay"
        :isBotMode="isBotMode"
        @close="handleCloseTutorial"
      />
    </main>
  </div>
</template>

<script setup>
import { computed, defineProps, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import gameMusicUrl from '/public/audio/gameMusic.mp3';
import tilePickupSoundUrl from '/public/audio/blank.mp3';
import tilePutBackSoundUrl from '/public/audio/tile_put_back.mp3';
import tileReplaceSoundUrl from '/public/audio/blank.mp3';
import scoreBuiltTileSoundUrl from '/public/audio/blank.mp3';
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
import { MIN_WORD_LENGTH, applyRackManipulationEffects, drawCards, getWordScoreDetails, isMissingRequiredTile, selectedTilesMatchWord, tickLightningTiles, tickShimmerTiles } from './tile-logic.js';
import { getPreferredLanguage } from './language.js';
import { useWordBuilder } from './useWordBuilder.js';
import { useSinglePlayerGame } from './useSinglePlayerGame.js';
import { useMultiRoundRun } from './multiround/useMultiRoundRun.js';
import { useCardPanelState } from './composables/useCardPanelState.js';
import { useScoreRibbonState } from './composables/useScoreRibbonState.js';
import { useSideDrawerState } from './composables/useSideDrawerState.js';
import { validateWord } from './word-validator.js';
import { isTestingMode } from './testing.js';
import GameCardsPanel from './components/GameCardsPanel.vue';
import GameStatusCards from './components/GameStatusCards.vue';
import GameLane from './components/GameLane.vue';
import HistoryOverlay from './components/HistoryOverlay.vue';
import MultiRoundProgress from './components/MultiRoundProgress.vue';
import MultiRoundRewardChoice from './components/MultiRoundRewardChoice.vue';
import ScoreRibbon from './components/ScoreRibbon.vue';
import { getMultiRoundRounds } from './multiround/multi-round-difficulties.js';
import PersonalModifiersDrawer from './components/PersonalModifiersDrawer.vue';
import {
  SAVE_MODES,
  SAVE_ON_WORD_SUBMIT,
  clearCloudGameSave,
  clearLocalGameSave,
  packCommonGameState,
  packBotMatchSave,
  packMultiRoundSave,
  saveCloudGame,
  saveLocalGame,
  unpackSave
} from './save-state.js';
import TutorialOverlay from './components/TutorialOverlay.vue';
import WordBuilder from './components/WordBuilder.vue';
import { getMultiRoundBackgroundPalette } from './multiround/multi-round-background-palettes.js';
import { botDifficulty } from './play-config.js';
import {
  PAST_GAME_MODES,
  buildBestWordSummary,
  makePastGameId,
  savePastGame
} from '../../userstate/pastGames.js';

const props = defineProps({
  isMobile: Boolean,
  isMultiplayer: Boolean,
  playMode: {
    type: String,
    default: 'timed_solo'
  },
  continueSave: {
    type: Object,
    default: null
  },
  initialMultiRoundBackgroundPaletteKey: {
    type: String,
    default: ''
  },
  botDifficulty: {
    type: String,
    default: 'normal'
  },
  multiRoundDifficulty: {
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
  'effectsVolumeChange',
  'update:botDifficulty',
  'backgroundState'
]);
const localMessage = ref('');
const gameStartedAt = Date.now();
const savedPastGameIds = ref(new Set());
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
const controllerRoundCursorIndex = ref(0);
const controllerRewardCursorIndex = ref(0);
const isControllerNavigationActive = ref(false);
const laneBurstPulse = ref({
  host: 0,
  opponent: 0
});
const rackClearPulse = ref({
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
const isMultiRoundMode = computed(() => !props.isMultiplayer && props.playMode === 'multi_round');
const isBotMode = computed(() => !props.isMultiplayer && props.playMode === 'bot_match');
const botCogSpeed = ref(1);
const playerCogSpeed = ref(1);
const playerCogTargetSpeed = ref(1);
const playerCogDuration = computed(() => `${Math.max(3.2, 11 / playerCogSpeed.value).toFixed(2)}s`);
const botCogDuration = computed(() => `${Math.max(2.2, 18 / botCogSpeed.value).toFixed(2)}s`);
const playerCogStyle = computed(() => ({ '--machine-cog-duration': playerCogDuration.value }));
const botCogStyle = computed(() => ({ '--machine-cog-duration': botCogDuration.value }));
const rampPlayerCogSpeed = () => {
  window.cancelAnimationFrame(playerCogRampFrameId);
  const step = () => {
    const difference = playerCogTargetSpeed.value - playerCogSpeed.value;
    if (Math.abs(difference) < 0.02) {
      playerCogSpeed.value = playerCogTargetSpeed.value;
      playerCogRampFrameId = null;
      return;
    }

    playerCogSpeed.value += difference * 0.08;
    playerCogRampFrameId = window.requestAnimationFrame(step);
  };

  playerCogRampFrameId = window.requestAnimationFrame(step);
};
const triggerBotCogBoost = () => {
  if (!isBotMode.value) {
    return;
  }

  botCogSpeed.value = 3.5;
  window.clearTimeout(botCogBoostTimeoutId);
  botCogBoostTimeoutId = window.setTimeout(() => {
    botCogSpeed.value = 1;
  }, 1600);
};
const matchOvertimeEnabled = computed(() => {
  return props.isMultiplayer ? multiplayerOvertimeEnabled.value : props.overtimeEnabled;
});
const attacksEnabled = computed(() => {
  return !isOvertimeActive.value && (isTestingMode || isTimedSoloMode.value || isMultiRoundMode.value || isBotMode.value || props.isMultiplayer);
});
const showOpponentLane = computed(() => props.isMultiplayer || isBotMode.value);
const isSideDrawerMode = computed(() => windowWidth.value < 1250);
const preferredLanguage = getPreferredLanguage();
const SOLO_TIMER_SECONDS = isTestingMode ? 25 : 180;
const timerRemainingSeconds = ref(SOLO_TIMER_SECONDS);
const isSoloTimerPausedByAttack = ref(false);
const isMultiRoundTimerPausedByAttack = ref(false);
const timedModeTimerStarted = ref(false);
const timedSoloFinalWordSpent = ref(false);
const multiRoundFinalWordSpent = ref(false);
const pendingMultiRoundStartingScore = ref(0);
const speedyWordStartedAt = ref(Date.now());
const speedyWordClockNow = ref(Date.now());
const gameMusic = new Audio(gameMusicUrl);
gameMusic.loop = true;
const tilePickupSound = new Audio(tilePickupSoundUrl);
const tilePutBackSound = new Audio(tilePutBackSoundUrl);
const tileReplaceSound = new Audio(tileReplaceSoundUrl);
const scoreBuiltTileSound = new Audio(scoreBuiltTileSoundUrl);
const victorySound = new Audio(victorySoundUrl);
const defeatSound = new Audio(defeatSoundUrl);
victorySound.loop = true;
defeatSound.loop = true;
let soloTimerId = null;
let multiRoundTimerId = null;
let scorePopTimeoutIds = [];
let activeScorePopAudios = [];
let historyOverlayTimeoutId = null;
let multiRoundRewardTimeoutId = null;
let botCogBoostTimeoutId = null;
let playerCogDecayIntervalId = null;
let playerCogRampFrameId = null;
let roundModifierTickIntervalId = null;
let speedyWordClockIntervalId = null;
let lastPlayerCogScoreAt = Date.now();
const GAME_TUTORIAL_STORAGE_KEY = 'hasSeenWordisGameTutorial';
const hasSeenGameTutorial = () => typeof localStorage !== 'undefined' && localStorage.getItem(GAME_TUTORIAL_STORAGE_KEY);
const showHistoryOverlay = ref(false);
const showTutorialOverlay = ref(!hasSeenGameTutorial());
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1440);
const roundModifierCountdowns = ref({});
const {
  isSideDrawerOpen,
  closeSideDrawer,
  toggleSideDrawer
} = useSideDrawerState({
  isSideDrawerMode,
  isMobile: () => props.isMobile,
  controllerRegion,
  isControllerNavigationActive
});
const personalModifiersDrawerRef = ref(null);
const multiRoundRun = useMultiRoundRun({
  rounds: getMultiRoundRounds(props.multiRoundDifficulty)
});

const mySide = computed(() => {
  if (props.isMultiplayer) {
    return isHost.value ? 'host' : 'opponent';
  }

  return 'host';
});

const personalModifierEffects = computed(() => isMultiRoundMode.value ? multiRoundRun.activePersonalModifierEffects.value : {});
const rackManipulatedPlayerTiles = computed(() => ({
  host: applyRackManipulationEffects(playerTiles.value.host || [], {
    side: 'host',
    scores: playerScores.value,
    personalModifierEffects: personalModifierEffects.value
  }),
  opponent: applyRackManipulationEffects(playerTiles.value.opponent || [], {
    side: 'opponent',
    scores: playerScores.value,
    personalModifierEffects: personalModifierEffects.value
  })
}));
const myTiles = computed(() => rackManipulatedPlayerTiles.value[mySide.value] || []);
const controllerFocusedTileId = computed(() => myTiles.value[controllerTileCursorIndex.value]?.id || '');
const controllerFocusedBuiltTileId = computed(() => selectedTilesForCurrentSide.value[controllerBuilderCursorIndex.value]?.id || '');
const opponentSide = computed(() => (mySide.value === 'host' ? 'opponent' : 'host'));
const activeRoundModifiers = computed(() => isMultiRoundMode.value ? multiRoundRun.activeRoundModifiers.value : []);
const activeRoundModifiersWithCountdowns = computed(() => {
  return activeRoundModifiers.value.map((modifier) => ({
    ...modifier,
    countdownLabel: roundModifierCountdowns.value[modifier.key]?.label || ''
  }));
});

const buildCommonSaveState = () => packCommonGameState({
  scores: playerScores.value,
  tiles: playerTiles.value,
  cards: playerCards.value,
  wordHistory: wordHistory.value,
  submittedWords: submittedWords.value,
  rackClears: rackClears.value
});

const buildMultiRoundSaveState = ({ includeInRound = true, includeHistory = true } = {}) => packMultiRoundSave({
  difficulty: props.multiRoundDifficulty,
  common: buildCommonSaveState(),
  includeInRound,
  includeHistory,
  multiRound: {
    currentRoundIndex: multiRoundRun.currentRoundIndex.value,
    timerRemainingSeconds: multiRoundRun.timerRemainingSeconds.value,
    resolvedRounds: multiRoundRun.resolvedRounds.value,
    completedRounds: multiRoundRun.completedRounds.value,
    personalModifiers: multiRoundRun.personalModifiers.value,
    rewardChoices: multiRoundRun.rewardChoices.value,
    pendingStartingScore: pendingMultiRoundStartingScore.value,
    runEnded: multiRoundRun.runEnded.value,
    failureSummary: multiRoundRun.failureSummary.value,
    finalWordSpent: multiRoundFinalWordSpent.value,
    timedModeTimerStarted: timedModeTimerStarted.value
  }
});

const saveCurrentMultiRoundLocal = () => {
  if (!isMultiRoundMode.value || props.isMultiplayer || multiRoundRun.runEnded.value) {
    return false;
  }

  return saveLocalGame(SAVE_MODES.MULTI_ROUND, buildMultiRoundSaveState());
};

const saveCurrentMultiRoundCheckpoint = () => {
  if (!isMultiRoundMode.value || props.isMultiplayer || multiRoundRun.runEnded.value) {
    return false;
  }

  const localSave = buildMultiRoundSaveState();
  const cloudSave = buildMultiRoundSaveState({
    includeInRound: false,
    includeHistory: false
  });
  saveLocalGame(SAVE_MODES.MULTI_ROUND, localSave);
  void saveCloudGame(SAVE_MODES.MULTI_ROUND, cloudSave);
  return true;
};

const clearMultiRoundSaves = () => {
  clearLocalGameSave(SAVE_MODES.MULTI_ROUND);
  void clearCloudGameSave(SAVE_MODES.MULTI_ROUND);
};

const buildBotMatchSaveState = () => packBotMatchSave({
  difficulty: props.botDifficulty,
  common: buildCommonSaveState(),
  overtime: {
    e: matchOvertimeEnabled.value,
    p: singlePlayerOvertimePendingSide.value,
    f: singlePlayerOvertimeFinalWordSubmitted.value
  }
});

const saveCurrentBotMatchLocal = () => {
  if (!isBotMode.value || props.isMultiplayer || effectiveGameEnded.value) {
    return false;
  }

  return saveLocalGame(SAVE_MODES.BOT_MATCH, buildBotMatchSaveState());
};

const clearBotMatchSave = () => {
  clearLocalGameSave(SAVE_MODES.BOT_MATCH);
};
const roundModifierEffects = computed(() => {
  return activeRoundModifiers.value.reduce((effects, modifier) => {
    const rules = modifier.rules || {};
    const scoreEffects = modifier.scoreEffects || {};
    const tileEffects = modifier.tileEffects || {};
    const chanceEffects = modifier.chanceEffects || {};
    const cardRules = modifier.cardRules || {};
    const roundEffects = modifier.roundEffects || {};

    effects.minimumWordLength = Math.max(effects.minimumWordLength, rules.minimumWordLength || 0);
    effects.bannedLetters = [
      ...new Set([
        ...effects.bannedLetters,
        ...(rules.bannedLetters || [])
      ])
    ];
    effects.zeroHighestConsonant = effects.zeroHighestConsonant || Boolean(scoreEffects.zeroHighestConsonant);
    effects.idlePenaltyMultiplier = Math.max(effects.idlePenaltyMultiplier, scoreEffects.idlePenaltyMultiplier || 1);
    effects.minimumVowels = Math.max(effects.minimumVowels, rules.minimumVowels || 0);
    effects.idleScoreDelta += tileEffects.idleScoreDelta || 0;
    effects.fleetingAllTiles = effects.fleetingAllTiles || Boolean(tileEffects.fleetingAllTiles);
    effects.returnBuilderIntervalMs = effects.returnBuilderIntervalMs || tileEffects.returnBuilderIntervalMs || 0;
    effects.shuffleRackIntervalMs = effects.shuffleRackIntervalMs || tileEffects.shuffleRackIntervalMs || 0;
    effects.chaoticBoardIntervalMs = effects.chaoticBoardIntervalMs || tileEffects.chaoticBoardIntervalMs || 0;
    effects.lockNextColumn = effects.lockNextColumn || Boolean(tileEffects.lockNextColumn);
    effects.mustTileEachTurn = effects.mustTileEachTurn || Boolean(tileEffects.mustTileEachTurn);
    effects.goodChanceBonus += chanceEffects.goodChanceBonus || 0;
    effects.badChanceBonus += chanceEffects.badChanceBonus || 0;
    effects.neutralChanceBonus += chanceEffects.neutralChanceBonus || 0;
    effects.goodChanceCapDelta += chanceEffects.goodChanceCapDelta || 0;
    effects.badChanceCapDelta += chanceEffects.badChanceCapDelta || 0;
    effects.neutralChanceCapDelta += chanceEffects.neutralChanceCapDelta || 0;
    effects.cardsDisabled = effects.cardsDisabled || Boolean(cardRules.cardsDisabled);
    Object.entries(roundEffects.lengthTimePenalty || {}).forEach(([length, seconds]) => {
      effects.lengthTimePenalty[length] = (effects.lengthTimePenalty[length] || 0) + (seconds || 0);
    });
    return effects;
  }, {
    minimumWordLength: 0,
    minimumVowels: 0,
    bannedLetters: [],
    zeroHighestConsonant: false,
    idlePenaltyMultiplier: 1,
    idleScoreDelta: 0,
    fleetingAllTiles: false,
    returnBuilderIntervalMs: 0,
    shuffleRackIntervalMs: 0,
    chaoticBoardIntervalMs: 0,
    lockNextColumn: false,
    mustTileEachTurn: false,
    goodChanceBonus: 0,
    badChanceBonus: 0,
    neutralChanceBonus: 0,
    goodChanceCapDelta: 0,
    badChanceCapDelta: 0,
    neutralChanceCapDelta: 0,
    cardsDisabled: false,
    lengthTimePenalty: {}
  });
});
const multiRoundScoreOptions = computed(() => ({
  personalModifierEffects: personalModifierEffects.value,
  roundModifierEffects: roundModifierEffects.value,
  roundModifierCountdowns: roundModifierCountdowns.value,
  wordElapsedSeconds: Math.max(0, (speedyWordClockNow.value - speedyWordStartedAt.value) / 1000)
}));
const buildLane = (side, label) => ({
  side,
  label,
  submittedWord: submittedWords.value[side],
  score: playerScores.value[side],
  lastWordScore: lastWordScores.value[side],
  lastWordBreakdown: lastWordBreakdowns.value[side] || createEmptyLastWordBreakdown(),
  tiles: rackManipulatedPlayerTiles.value[side] || [],
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
  currentWordElapsedSeconds,
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
  playerScores,
  scoreOptions: multiRoundScoreOptions
});

const leftLane = computed(() => buildLane(mySide.value, 'Your Board'));
const rightLane = computed(() => buildLane(opponentSide.value, isBotMode.value ? 'Bot Board' : 'Their Board'));
const leftLaneHistory = computed(() => wordHistory.value[mySide.value] || []);
const rightLaneHistory = computed(() => wordHistory.value[opponentSide.value] || []);
const multiRoundProgressRounds = computed(() => multiRoundRun.visibleProgressRounds.value);
const personalModifiersForDrawer = computed(() => multiRoundRun.personalModifiers.value);
const multiRoundRewardChoices = computed(() => multiRoundRun.rewardChoices.value);
const isMultiRoundRewardChoiceOpen = computed(() => multiRoundRun.rewardChoiceOpen.value);
const upcomingMultiRoundPreview = computed(() => {
  if (!isMultiRoundMode.value) {
    return null;
  }

  return multiRoundRun.visibleProgressRounds.value[multiRoundRun.currentRoundIndex.value + 1] || null;
});
const BOT_WINNING_SCORES = {
  easy: 100,
  normal: 150,
  hard: 200
};

const scoreRibbonScoreLabel = computed(() => {
  if (isMultiRoundMode.value) {
    return `${leftLane.value.score} / ${multiRoundRun.currentTargetScore.value}`;
  }
  if (isBotMode.value) {
    return `${leftLane.value.score} / ${BOT_WINNING_SCORES[props.botDifficulty] ?? WINNING_SCORE}`;
  }

  return leftLane.value.score;
});

const {
  startBotLoop,
  stopBotLoop,
  checkBotWin,
  clearSinglePlayerRack,
  resetSinglePlayerRound,
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
  isMultiRoundMode,
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
    isMultiRoundTimerPausedByAttack.value = true;
  },
  onTimedSoloGainTime: (seconds) => {
    const wasOutOfTime = timerRemainingSeconds.value <= 0 || multiRoundRun.timerRemainingSeconds <= 0;
    timerRemainingSeconds.value += seconds;
    multiRoundRun.timerRemainingSeconds.value += seconds;
    if (wasOutOfTime && timerRemainingSeconds.value > 0) {
      // Recovering from timeout should fully return solo sprint to live play.
      timedSoloFinalWordSpent.value = false;
      isSoloTimerPausedByAttack.value = false;
      isMultiRoundTimerPausedByAttack.value = false;
      if (!isPaused.value) {
        startBotLoopAfterTutorial();
        startMultiRoundTimer()
        startSoloTimer();
      }
    }
  },
  onMultiRoundRerollNextRoundModifiers: () => multiRoundRun.rerollNextRoundModifiers(),
  onMultiRoundReduceTargetScore: (amount) => multiRoundRun.reduceCurrentTargetScore(amount),
  onBotPreparing: triggerBotCogBoost,
  personalModifierEffects,
  roundModifierEffects
});

const startBotLoopAfterTutorial = () => {
  if (showTutorialOverlay.value) {
    stopBotLoop();
    return;
  }

  startBotLoop();
};

const overtimeTrailingSide = computed(() => {
  if (isTimedSoloMode.value || isMultiRoundMode.value || !matchOvertimeEnabled.value) {
    return null;
  }

  return props.isMultiplayer
    ? multiplayerOvertimePendingSide.value
    : singlePlayerOvertimePendingSide.value;
});
const overtimeFinalWordSubmitted = computed(() => {
  if (isTimedSoloMode.value || isMultiRoundMode.value || !matchOvertimeEnabled.value) {
    return false;
  }

  return props.isMultiplayer
    ? multiplayerOvertimeFinalWordSubmitted.value
    : singlePlayerOvertimeFinalWordSubmitted.value;
});
const isOvertimeActive = computed(() => Boolean(overtimeTrailingSide.value) && !overtimeFinalWordSubmitted.value);
const finalWordPointsRemaining = computed(() => {
  if (isMultiRoundMode.value && finalWordWindowActive.value) {
    return Math.max(0, multiRoundRun.currentTargetScore.value - (playerScores.value.host || 0));
  }

  if (isTimedSoloMode.value && finalWordWindowActive.value) {
    return Math.max(0, WINNING_SCORE - (playerScores.value.host || 0));
  }

  if (isOvertimeActive.value && overtimeTrailingSide.value === mySide.value) {
    return Math.max(0, (playerScores.value[opponentSide.value] || 0) + 1 - (playerScores.value[mySide.value] || 0));
  }

  return 0;
});
const formatFinalWordLabel = (label) => `${label} ${finalWordPointsRemaining.value} points to go!`;
const overtimeLabel = computed(() => {
  if (!isOvertimeActive.value) {
    return '';
  }

  return overtimeTrailingSide.value === mySide.value ? formatFinalWordLabel('Final Word!') : 'Keep playing words!';
});
const finalWordWindowLabel = computed(() => {
  if (!finalWordWindowActive.value) {
    return '';
  }

  return formatFinalWordLabel('Final Word!');
});
const wordBuilderBannerActive = computed(() => isOvertimeActive.value || (finalWordWindowActive.value && !isMultiRoundRewardChoiceOpen.value === true));
const wordBuilderBannerLabel = computed(() => finalWordWindowLabel.value || overtimeLabel.value);
const submissionPauseOwner = computed(() => {
  return props.isMultiplayer
    ? multiplayerSubmissionPauseOwner.value
    : singlePlayerSubmissionPauseOwner.value;
});
const isMySubmissionPaused = computed(() => Boolean(submissionPauseOwner.value) && submissionPauseOwner.value !== mySide.value);
const isSubmissionPauseActive = computed(() => Boolean(submissionPauseOwner.value));

const myCards = computed(() => playerCards.value[mySide.value] || { boons: [], attacks: [] });
const hasBarricadeTileInRack = computed(() => myTiles.value.some((tile) => tile?.status === 'barricadeTile'));
const cardDisabledReason = computed(() => {
  if (hasBarricadeTileInRack.value) {
    return 'Barricade is blocking your cards.';
  }
  if (isMultiRoundMode.value && roundModifierEffects.value.cardsDisabled) {
    return 'Cards cannot be played this round.';
  }

  return '';
});
const cardControlsDisabled = computed(() => Boolean(cardDisabledReason.value));
const {
  groupedBoonCards,
  groupedAttackCards,
  controllerCards,
  activeBoonCard,
  visibleAttackCount,
  cardSummary,
  hasCardsInHand
} = useCardPanelState({
  myCards,
  attacksEnabled,
  activeBoonCardId,
  cardControlsDisabled
});
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
const multiRoundHistorySummary = computed(() => {
  if (!isMultiRoundMode.value) {
    return null;
  }

  return {
    completedRounds: multiRoundRun.completedRounds.value,
    failedRound: multiRoundRun.failureSummary.value,
    personalModifiers: multiRoundRun.personalModifiers.value
  };
});

const getSecondsUsed = (timeSeconds = 0, secondsRemaining = 0) => {
  return Math.max(0, Math.round(Number(timeSeconds || 0) - Number(secondsRemaining || 0)));
};

const packPastGameRound = (round = {}) => ({
  rn: round.roundNumber || 0,
  id: round.roundId || '',
  lb: round.roundLabel || '',
  trg: round.targetScore || 0,
  sc: round.score || 0,
  ts: round.timeSeconds || 0,
  sr: Math.max(0, Math.round(Number(round.secondsRemaining || 0))),
  su: getSecondsUsed(round.timeSeconds, round.secondsRemaining),
  sb: round.startingScoreBonus || 0,
  mods: round.activeRoundModifierKeys || [],
  rw: round.selectedRewardKey || null,
  rwl: round.selectedRewardLabel || ''
});

const packPastGameRewards = (rounds = []) => rounds
  .filter((round) => round.selectedRewardKey)
  .map((round) => ({
    rn: round.roundNumber || 0,
    k: round.selectedRewardKey,
    lb: round.selectedRewardLabel || ''
  }));

const markPastGameSaved = (id) => {
  savedPastGameIds.value = new Set([...savedPastGameIds.value, id]);
};

const saveMultiRoundPastGame = (result) => {
  const saveKey = `${PAST_GAME_MODES.MULTI_ROUND}:${result}`;
  const id = makePastGameId(PAST_GAME_MODES.MULTI_ROUND);
  if (savedPastGameIds.value.has(saveKey)) {
    return;
  }

  const completedRounds = multiRoundRun.completedRounds.value || [];
  const failedRound = multiRoundRun.failureSummary.value;
  const bestWord = buildBestWordSummary(wordHistory.value.host || []);
  const createdAt = Date.now();

  markPastGameSaved(saveKey);
  void savePastGame({
    v: 1,
    id,
    m: PAST_GAME_MODES.MULTI_ROUND,
    d: props.multiRoundDifficulty,
    rs: result,
    ca: createdAt,
    uat: createdAt,
    dur: Math.max(0, Math.round((createdAt - gameStartedAt) / 1000)),
    sc: result === 'failed' ? (failedRound?.score || 0) : (completedRounds.at(-1)?.score || 0),
    bw: bestWord,
    rds: completedRounds.map(packPastGameRound),
    fr: failedRound ? packPastGameRound(failedRound) : null,
    rwds: packPastGameRewards(completedRounds)
  });
};

const saveBotMatchPastGame = () => {
  const saveKey = PAST_GAME_MODES.BOT_MATCH;
  const id = makePastGameId(PAST_GAME_MODES.BOT_MATCH);
  if (savedPastGameIds.value.has(saveKey)) {
    return;
  }

  const createdAt = Date.now();
  const hostScore = playerScores.value.host || 0;
  const opponentScore = playerScores.value.opponent || 0;

  markPastGameSaved(saveKey);
  void savePastGame({
    v: 1,
    id,
    m: PAST_GAME_MODES.BOT_MATCH,
    d: props.botDifficulty,
    rs: hostScore > opponentScore ? 'won' : 'lost',
    ca: createdAt,
    uat: createdAt,
    dur: Math.max(0, Math.round((createdAt - gameStartedAt) / 1000)),
    sc: hostScore,
    os: opponentScore,
    bw: buildBestWordSummary(wordHistory.value.host || []),
    obw: buildBestWordSummary(wordHistory.value.opponent || [])
  });
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
  if (isMultiRoundMode.value) {
    return multiRoundRun.runEnded.value;
  }

  if (isTimedSoloMode.value) {
    return Boolean(winningSide.value);
  }

  if (matchOvertimeEnabled.value) {
    return overtimeFinalWordSubmitted.value;
  }

  return Boolean(winningSide.value);
});
const timedSoloTimeExpired = computed(() => isTimedSoloMode.value && timerRemainingSeconds.value <= 0);
const multiRoundTimeExpired = computed(() => isMultiRoundMode.value && multiRoundRun.timerRemainingSeconds.value <= 0);
const timeExpired = computed(() => timedSoloTimeExpired.value || multiRoundTimeExpired.value);
const finalWordWindowActive = computed(() => (
  (isTimedSoloMode.value && timedSoloTimeExpired.value && !timedSoloFinalWordSpent.value)
  || (isMultiRoundMode.value && multiRoundTimeExpired.value && !multiRoundFinalWordSpent.value)
));
const effectiveGameEnded = computed(() => {
  if (isMultiRoundMode.value) {
    return gameEnded.value;
  }

  return gameEnded.value || (timedSoloTimeExpired.value && timedSoloFinalWordSpent.value);
});
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
  if (isMultiRoundMode.value) {
    if (multiRoundRun.runWon.value) {
      return `Run complete. Cleared ${multiRoundRun.completedRounds.value.length} rounds.`;
    }

    const failedRound = multiRoundRun.failureSummary.value;
    if (failedRound) {
      return `${failedRound.roundLabel} ended at ${failedRound.score}/${failedRound.targetScore} points.`;
    }

    return `Round ${multiRoundRun.currentRoundNumber.value} ended at ${playerScores.value.host}/${multiRoundRun.currentTargetScore.value} points.`;
  }

  if (timeExpired.value) {
    return `Time is up. Final score: ${playerScores.value.host}.`;
  }

  if (showOpponentLane.value) {
    return `${winnerLabel.value} wins. Final score: ${playerScores.value.host} to ${playerScores.value.opponent}.`;
  }

  return `${winnerLabel.value} wins at ${winningScore.value} points. Final score: ${playerScores.value.host}.`;
});
const historyResultState = computed(() => {
  if (isMultiRoundMode.value) {
    return multiRoundRun.runWon.value ? 'victory' : 'defeat';
  }

  if (timeExpired.value) {
    return 'timeout';
  }

  if (props.isMultiplayer || isBotMode.value) {
    return winningSide.value === mySide.value ? 'victory' : 'defeat';
  }

  return 'victory';
});
const historyResultTitle = computed(() => {
  if (isMultiRoundMode.value) {
    return multiRoundRun.runWon.value ? 'Run Complete' : 'Run Failed';
  }

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
const formattedMultiRoundTimeRemaining = computed(() => {
  const safeSeconds = Math.max(0, multiRoundRun.timerRemainingSeconds.value);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
});
const clockScoreRibbonLabel = computed(() => {
  if (finalWordWindowActive.value) {
    return 'Play your last word!';
  }

  if (isMultiRoundMode.value) {
    return formattedMultiRoundTimeRemaining.value;
  }

  return formattedTimeRemaining.value;
});
const modeTitle = computed(() => {
  if (props.isMultiplayer) {
    return 'Real Time Duel';
  }

  if (isMultiRoundMode.value) {
    return `Multi-Round · ${multiRoundRun.currentRound.value?.label || 'Round 1'}`;
  }

  return isTimedSoloMode.value ? 'Solo Sprint' : `Machine Learning · ${props.botDifficulty}`;
});
const modeSubtitle = computed(() => {
  if (props.isMultiplayer) {
    return 'Build on your board and race the other board in real time.';
  }

  if (isMultiRoundMode.value) {
    return `Reach ${multiRoundRun.currentTargetScore.value} points before the round clock runs out.`;
  }

  if (isTimedSoloMode.value) {
    return 'Play alone against the clock and squeeze out the highest score before time expires.';
  }

  return `Beat the Machine by spelling words fast and using different tiles to get high scoring words. The first to reach the required score wins. Use your attacks to slow the Machine down and your boons to give yourself an advantage!`;
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

  if (isMultiRoundMode.value) {
    return `Round ${multiRoundRun.currentRoundNumber.value}/${multiRoundRun.totalRounds.value} · ${formattedMultiRoundTimeRemaining.value} · ${multiRoundRun.currentTargetScore.value} point target`;
  }

  return 'Start Playing Words';
});
const boardFrameStyle = computed(() => ({
  zoom: props.gameZoom || 1
}));
const { scoreBoxClass } = useScoreRibbonState({
  showOpponentLane,
  isTimedSoloMode,
  leftLane,
  rightLane
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

  if (isMultiRoundMode.value) {
    const roundTimeLimit = Math.max(1, multiRoundRun.currentRoundTimeLimit.value || 1);
    return clamp01(1 - (multiRoundRun.timerRemainingSeconds.value / roundTimeLimit));
  }

  const highestScore = Math.max(playerScores.value.host || 0, playerScores.value.opponent || 0);
  return clamp01(highestScore / WINNING_SCORE);
});
const createBackgroundPaletteStyle = (palette, intensity, progress) => {
  return {
    '--bg-corner': mixHexColor(palette.corner[0], palette.corner[1], intensity),
    '--bg-top': mixHexColor(palette.top[0], palette.top[1], intensity),
    '--bg-mid': mixHexColor(palette.mid[0], palette.mid[1], intensity),
    '--bg-bottom': mixHexColor(palette.bottom[0], palette.bottom[1], intensity),
    '--bg-glow-alpha': `${palette.glowAlpha[0] + ((palette.glowAlpha[1] - palette.glowAlpha[0]) * intensity)}`,
    '--bg-shape-far-opacity': `${palette.shapeFarOpacity[0] + ((palette.shapeFarOpacity[1] - palette.shapeFarOpacity[0]) * progress)}`,
    '--bg-shape-near-opacity': `${palette.shapeNearOpacity[0] + ((palette.shapeNearOpacity[1] - palette.shapeNearOpacity[0]) * progress)}`,
    '--bg-saturate': `${palette.saturate[0] + ((palette.saturate[1] - palette.saturate[0]) * progress)}`
  };
};
const backgroundMoodStyle = computed(() => {
  const progress = backgroundProgress.value;
  const intensity = progress * progress;

  if (isMultiRoundMode.value) {
    const isFirstRound = multiRoundRun.currentRoundIndex.value === 0;
    const paletteKey = (isFirstRound && props.initialMultiRoundBackgroundPaletteKey)
      || multiRoundRun.currentRound.value?.resolvedBackgroundPaletteKey
      || 'main';
    return createBackgroundPaletteStyle(getMultiRoundBackgroundPalette(paletteKey), intensity, progress);
  }

  if (isBotMode.value) {
    return createBackgroundPaletteStyle(getMultiRoundBackgroundPalette('bot'), intensity, progress);
  }

  return createBackgroundPaletteStyle(getMultiRoundBackgroundPalette('main'), intensity, progress);
});
const backgroundTransitionKey = computed(() => {
  if (isMultiRoundMode.value) {
    const isFirstRound = multiRoundRun.currentRoundIndex.value === 0;
    const paletteKey = (isFirstRound && props.initialMultiRoundBackgroundPaletteKey)
      || multiRoundRun.currentRound.value?.resolvedBackgroundPaletteKey
      || 'main';
    const roundIdentity = multiRoundRun.currentRoundIndex.value + 1;
    return `multi-round:${roundIdentity}:${paletteKey}`;
  }

  if (props.isMultiplayer) {
    return 'multiplayer';
  }

  if (isBotMode.value) {
    return 'bot-match';
  }

  return `solo:${props.playMode || 'timed_solo'}`;
});
const backgroundState = computed(() => ({
  transitionKey: backgroundTransitionKey.value,
  moodStyle: backgroundMoodStyle.value,
  isBotMode: isBotMode.value,
  botCogStyle: botCogStyle.value,
  playerCogStyle: playerCogStyle.value
}));
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
  tileReplaceSound.volume = effectsLevel;
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

const triggerRackClearAnimation = (side) => {
  rackClearPulse.value = {
    ...rackClearPulse.value,
    [side]: rackClearPulse.value[side] + 1
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

const getMultiRoundStartingScoreBonus = () => {
  const multiplier = multiRoundRun.currentRound.value?.startingScoreBonusMultiplier ?? 0.5;
  return Math.max(0, Math.floor(multiRoundRun.timerRemainingSeconds.value * multiplier));
};

const resetSpeedyWordClock = () => {
  const now = Date.now();
  speedyWordStartedAt.value = now;
  speedyWordClockNow.value = now;
};

const resetMultiRoundBoardForNextRound = (startingScore = 0) => {
  window.clearTimeout(multiRoundRewardTimeoutId);
  resetSpeedyWordClock();
  playerScores.value = {
    host: startingScore,
    opponent: 0
  };
  submittedWords.value = {
    host: '',
    opponent: ''
  };
  lastWordScores.value = {
    host: 0,
    opponent: 0
  };
  lastWordBreakdowns.value = {
    host: createEmptyLastWordBreakdown(),
    opponent: createEmptyLastWordBreakdown()
  };
  clearSelectionForSide('host');
  resetActionMode();
  resetSinglePlayerRound('host');
  timedModeTimerStarted.value = false;
  multiRoundFinalWordSpent.value = false;
};

const completeMultiRoundRound = () => {
  stopMultiRoundTimer();
  const score = playerScores.value.host || 0;
  const secondsRemaining = Math.max(0, multiRoundRun.timerRemainingSeconds.value);
  const startingScore = getMultiRoundStartingScoreBonus();

  multiRoundRun.recordCompletedRound({
    score,
    secondsRemaining,
    selectedRewardKey: null
  });

  pendingMultiRoundStartingScore.value = startingScore;
  const rewardChoices = multiRoundRun.generateRewardChoices();
  saveCurrentMultiRoundCheckpoint();
  playUiSound(tileReplaceSound);
  localMessage.value = 'Round complete.';
  window.clearTimeout(multiRoundRewardTimeoutId);
  multiRoundRewardTimeoutId = window.setTimeout(() => {
    if (!rewardChoices.length) {
      const advanced = multiRoundRun.goToNextRound({ startingScore });
      pendingMultiRoundStartingScore.value = 0;
      if (!advanced) {
        saveMultiRoundPastGame('won');
        clearMultiRoundSaves();
        localMessage.value = 'Run complete!';
        return;
      }

      resetMultiRoundBoardForNextRound(startingScore);
      saveCurrentMultiRoundLocal();
      localMessage.value = `Next round starts with ${startingScore} points from saved time.`;
      return;
    }

    localMessage.value = 'Choose a modifier.';
  }, 1000);
};

const failMultiRoundRun = () => {
  multiRoundFinalWordSpent.value = true;
  multiRoundRun.endRun({
    score: playerScores.value.host || 0,
    secondsRemaining: Math.max(0, multiRoundRun.timerRemainingSeconds.value)
  });
  saveMultiRoundPastGame('failed');
  clearMultiRoundSaves();
  localMessage.value = 'Run failed.';
};

const applyImmediatePersonalModifierEffects = (modifier) => {
  const immediateBoons = modifier?.effects?.immediateBoons || 0;
  const immediateAttacks = modifier?.effects?.immediateAttacks || 0;
  if (!immediateBoons && !immediateAttacks) {
    return;
  }

  playerCards.value = {
    ...playerCards.value,
    host: {
      ...playerCards.value.host,
      boons: [
        ...(playerCards.value.host?.boons || []),
        ...drawCards('boon', immediateBoons, {
          side: 'host',
          heldCards: playerCards.value.host?.boons || []
        })
      ],
      attacks: [
        ...(playerCards.value.host?.attacks || []),
        ...drawCards('attack', immediateAttacks, {
          deck: (isTimedSoloMode.value || isMultiRoundMode.value) ? 'timed_solo' : 'duel',
          side: 'host',
          scores: playerScores.value,
          heldCards: playerCards.value.host?.attacks || []
        })
      ]
    }
  };
};

const applyMultiRoundWordTimeBonus = (tileCount = 0) => {
  if (!isMultiRoundMode.value) {
    return 0;
  }

  const timeBonusByLength = personalModifierEffects.value.lengthTimeBonus || {};
  const seconds = timeBonusByLength[tileCount] || timeBonusByLength[String(tileCount)] || 0;
  if (!seconds) {
    return 0;
  }

  const wasOutOfTime = multiRoundRun.timerRemainingSeconds.value <= 0;
  multiRoundRun.setTimerRemainingSeconds(multiRoundRun.timerRemainingSeconds.value + seconds);
  if (wasOutOfTime && multiRoundRun.timerRemainingSeconds.value > 0) {
    multiRoundFinalWordSpent.value = false;
    startMultiRoundTimer();
  }

  return seconds;
};

const applyMultiRoundWordTimePenalty = (tileCount = 0) => {
  if (!isMultiRoundMode.value) {
    return 0;
  }

  const timePenaltyByLength = roundModifierEffects.value.lengthTimePenalty || {};
  const seconds = timePenaltyByLength[tileCount] || timePenaltyByLength[String(tileCount)] || 0;
  if (!seconds) {
    return 0;
  }

  multiRoundRun.setTimerRemainingSeconds(multiRoundRun.timerRemainingSeconds.value - seconds);
  return seconds;
};

const handleMultiRoundRewardChoice = (rewardKey) => {
  const selectedModifier = multiRoundRun.selectRewardChoice(rewardKey);
  if (!selectedModifier) {
    return;
  }

  applyImmediatePersonalModifierEffects(selectedModifier);
  const startingScore = pendingMultiRoundStartingScore.value;
  const advanced = multiRoundRun.goToNextRound({ startingScore });
  pendingMultiRoundStartingScore.value = 0;

  if (!advanced) {
    saveMultiRoundPastGame('won');
    clearMultiRoundSaves();
    playUiSound(tileReplaceSound);
    localMessage.value = 'Run complete!';
    return;
  }

  resetMultiRoundBoardForNextRound(startingScore);
  saveCurrentMultiRoundLocal();
  focusControllerTile(0);
  localMessage.value = `Next round starts with ${startingScore} points from saved time.`;
};

const validateActiveRoundModifiers = (selectedTiles = []) => {
  if (!isMultiRoundMode.value) {
    return { valid: true };
  }

  const minimumWordLength = roundModifierEffects.value.minimumWordLength || 0;
  if (minimumWordLength && selectedTiles.length < minimumWordLength) {
    return {
      valid: false,
      message: `This round requires at least ${minimumWordLength} tiles.`
    };
  }

  const bannedLetters = new Set(roundModifierEffects.value.bannedLetters || []);
  const bannedTile = selectedTiles.find((tile) => bannedLetters.has((tile.baseLetter || tile.letter || '').toUpperCase()));
  if (bannedTile) {
    return {
      valid: false,
      message: `This round blocks ${bannedTile.baseLetter || bannedTile.letter}.`
    };
  }

  const minimumVowels = roundModifierEffects.value.minimumVowels || 0;
  if (minimumVowels) {
    const vowelCount = selectedTiles.filter((tile) => {
      return /^[AEIOU]$/.test((tile.baseLetter || tile.letter || '').toUpperCase());
    }).length;

    if (vowelCount < minimumVowels) {
      return {
        valid: false,
        message: `This round requires at least ${minimumVowels} vowels.`
      };
    }
  }

  return { valid: true };
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

watch(() => playerScores.value.host, (nextScore, previousScore = nextScore) => {
  if (!isBotMode.value || nextScore <= previousScore) {
    return;
  }

  const now = Date.now();
  const elapsedSeconds = Math.max(0.5, (now - lastPlayerCogScoreAt) / 1000);
  const pointsPerSecond = (nextScore - previousScore) / elapsedSeconds;
  playerCogTargetSpeed.value = Math.min(3.4, Math.max(1.05, 1 + (pointsPerSecond * 0.18)));
  rampPlayerCogSpeed();
  lastPlayerCogScoreAt = now;
});

watch(isBotMode, (enabled) => {
  if (enabled) {
    lastPlayerCogScoreAt = Date.now();
    return;
  }

  botCogSpeed.value = 1;
  playerCogTargetSpeed.value = 1;
  playerCogSpeed.value = 1;
});

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

  const roundModifierValidation = validateActiveRoundModifiers(selectedTiles);
  if (!roundModifierValidation.valid) {
    localMessage.value = roundModifierValidation.message;
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
  isMultiRoundTimerPausedByAttack.value = false;
  const wasFinalWordWindowActive = finalWordWindowActive.value;

  const submitted = submitSinglePlayerWord(resolvedWord, {
    wordElapsedSeconds: currentWordElapsedSeconds.value
  });
  if (!submitted) {
    return;
  }
  resetSpeedyWordClock();
  const secondsRestored = applyMultiRoundWordTimeBonus(selectedTiles.length);
  if (secondsRestored) {
    localMessage.value = `${localMessage.value} Restored ${secondsRestored} seconds.`;
  }
  const secondsSapped = applyMultiRoundWordTimePenalty(selectedTiles.length);
  if (secondsSapped) {
    localMessage.value = `${localMessage.value} Lost ${secondsSapped} seconds.`;
  }

  if (isMultiRoundMode.value) {
    if (wordHistory.value.host?.[0]) {
      wordHistory.value = {
        ...wordHistory.value,
        host: [
          {
            ...wordHistory.value.host[0],
            rn: multiRoundRun.currentRoundNumber.value
          },
          ...wordHistory.value.host.slice(1)
        ]
      };
    }

    if (SAVE_ON_WORD_SUBMIT) {
      saveCurrentMultiRoundLocal();
    }

    if (playerScores.value.host >= multiRoundRun.currentTargetScore.value) {
      completeMultiRoundRound();
      return;
    }

    if (wasFinalWordWindowActive) {
      failMultiRoundRun();
    }
    return;
  }

  if (isBotMode.value && SAVE_ON_WORD_SUBMIT) {
    saveCurrentBotMatchLocal();
  }

  if (finalWordWindowActive.value) {
    timedSoloFinalWordSpent.value = true;
  }
};

const resetActionMode = () => {
  activeBoonCardId.value = null;
};

const selectBoonCard = (card) => {
  if (cardControlsDisabled.value) {
    localMessage.value = cardDisabledReason.value;
    return;
  }

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
  localMessage.value = `Ready ${card.label}. Select a tile!`;
  focusControllerTile(controllerTileCursorIndex.value);
};

const useAttackCard = (card) => {
  if (cardControlsDisabled.value) {
    localMessage.value = cardDisabledReason.value;
    return;
  }

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
    if (isMultiRoundMode.value && card.effectType === 'reduce_round_target' && playerScores.value.host >= multiRoundRun.currentTargetScore.value) {
      completeMultiRoundRound();
    }
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
    triggerRackClearAnimation(mySide.value);
    clearSelectionForSide(mySide.value);
    resetActionMode();
    localMessage.value = `Clearing rack... ${rackClears.value[mySide.value] - 1} clears left after this one.`;
    return;
  }

  if ((rackClears.value[mySide.value] || 0) <= 0) {
    localMessage.value = 'No rack clears remaining.';
    return;
  }

  resetActionMode();
  triggerRackClearAnimation(mySide.value);
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

const roundModifierTimerState = {};
const getTimedRoundModifierActions = () => {
  const effects = roundModifierEffects.value;
  return [
    {
      key: 'loose_letters',
      intervalMs: effects.returnBuilderIntervalMs && !effects.chaoticBoardIntervalMs ? effects.returnBuilderIntervalMs : 0,
      label: 'Return',
      run: () => returnBuiltLettersToRack('Loose Letters returned your built letters.')
    },
    {
      key: 'disorganised',
      intervalMs: effects.shuffleRackIntervalMs && !effects.chaoticBoardIntervalMs ? effects.shuffleRackIntervalMs : 0,
      label: 'Shuffle',
      run: () => shuffleRackTiles({ includeSelected: false, message: 'Disorganised shuffled your rack.' })
    },
    {
      key: 'chaotic_board',
      intervalMs: effects.chaoticBoardIntervalMs || 0,
      label: 'Chaos',
      run: () => {
        returnBuiltLettersToRack('');
        shuffleRackTiles({ includeSelected: true, message: 'Chaotic Board reset your word and shuffled your rack.' });
      }
    }
  ].filter((entry) => entry.intervalMs > 0);
};

const canRunTimedRoundModifiers = () => {
  return isMultiRoundMode.value
    && !isPaused.value
    && !effectiveGameEnded.value
    && !showTutorialOverlay.value
    && !isMultiRoundRewardChoiceOpen.value;
};

const canRunTimedTileModifiers = () => {
  return !isPaused.value
    && !effectiveGameEnded.value
    && !showTutorialOverlay.value
    && !isMultiRoundRewardChoiceOpen.value;
};

const returnBuiltLettersToRack = (message) => {
  if (!selectedTilesForCurrentSide.value.length) {
    return false;
  }

  clearSelectionForSide('host');
  if (message) {
    localMessage.value = message;
  }
  return true;
};

const shuffleRackTiles = ({ includeSelected = false, message = '' } = {}) => {
  const rackTiles = playerTiles.value.host || [];
  if (rackTiles.length < 2) {
    return false;
  }

  const selectedIds = selectedTileIds.value.host || new Set();
  const shuffleIndexes = rackTiles
    .map((tile, index) => ({ tile, index }))
    .filter(({ tile }) => includeSelected || !selectedIds.has(tile.id))
    .map(({ index }) => index);

  if (shuffleIndexes.length < 2) {
    return false;
  }

  const shuffledTiles = [...rackTiles];
  const shuffledEntries = shuffleIndexes.map((index) => shuffledTiles[index]);
  for (let index = shuffledEntries.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffledEntries[index], shuffledEntries[swapIndex]] = [shuffledEntries[swapIndex], shuffledEntries[index]];
  }

  shuffleIndexes.forEach((tileIndex, entryIndex) => {
    shuffledTiles[tileIndex] = shuffledEntries[entryIndex];
  });
  playerTiles.value = {
    ...playerTiles.value,
    host: shuffledTiles
  };
  if (message) {
    localMessage.value = message;
  }
  return true;
};

const resetTimedRoundModifierIndicators = () => {
  Object.keys(roundModifierTimerState).forEach((key) => {
    delete roundModifierTimerState[key];
  });
  roundModifierCountdowns.value = {};
};

const tickTimedRoundModifiers = () => {
  if (
    !canRunTimedRoundModifiers()
  ) {
    return;
  }

  const now = Date.now();
  const nextCountdowns = {};
  getTimedRoundModifierActions().forEach((action) => {
    if (!roundModifierTimerState[action.key]) {
      roundModifierTimerState[action.key] = now + action.intervalMs;
    }

    if (now >= roundModifierTimerState[action.key]) {
      action.run();
      roundModifierTimerState[action.key] = now + action.intervalMs;
    }

    const seconds = Math.max(0, Math.ceil((roundModifierTimerState[action.key] - now) / 1000));
    nextCountdowns[action.key] = {
      seconds,
      label: `${action.label} in ${seconds}s`
    };
  });
  roundModifierCountdowns.value = nextCountdowns;
};

const tickTimedTileModifiers = () => {
  if (!canRunTimedTileModifiers()) {
    return;
  }

  const now = Date.now();
  const nextTilesBySide = { ...playerTiles.value };
  let changed = false;

  Object.keys(nextTilesBySide).forEach((side) => {
    const tiles = nextTilesBySide[side] || [];
    const shimmerTiles = tickShimmerTiles(tiles, {
      now,
      frozenTileIds: selectedTileIds.value[side] || new Set()
    });
    const lightningResult = tickLightningTiles(shimmerTiles, { now });
    const nextTiles = lightningResult.tiles;

    if (nextTiles !== tiles) {
      nextTilesBySide[side] = nextTiles;
      changed = true;
    }

    if (lightningResult.scorePenalty > 0) {
      playerScores.value = {
        ...playerScores.value,
        [side]: Math.max(0, (playerScores.value[side] || 0) - lightningResult.scorePenalty)
      };
    }
  });

  if (changed) {
    playerTiles.value = nextTilesBySide;
  }
};

const tickTimedGameEffects = () => {
  tickTimedRoundModifiers();
  tickTimedTileModifiers();
};

const refocusControllerSelection = () => {
  if (showTutorialOverlay.value) {
    return;
  }

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

  if (controllerRegion.value === 'rounds') {
    focusControllerRound(controllerRoundCursorIndex.value);
    return;
  }

  if (controllerRegion.value === 'reward') {
    focusControllerReward(controllerRewardCursorIndex.value);
    return;
  }

  focusControllerTile(controllerTileCursorIndex.value);
};

const togglePersonalModifiersDrawer = () => {
  if (!isMultiRoundMode.value) {
    return;
  }

  personalModifiersDrawerRef.value?.toggleDrawer?.();
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

const focusControllerRound = (index = controllerRoundCursorIndex.value) => {
  if (!isMultiRoundMode.value || !multiRoundProgressRounds.value.length) {
    return;
  }

  isControllerNavigationActive.value = true;
  controllerRegion.value = 'rounds';
  const boundedIndex = Math.max(0, Math.min(index, multiRoundProgressRounds.value.length - 1));
  controllerRoundCursorIndex.value = boundedIndex;

  nextTick(() => {
    const roundButton = document.querySelector(`[data-controller-round="${boundedIndex}"]`);
    if (roundButton && typeof roundButton.focus === 'function') {
      roundButton.focus();
    }
  });
};

const focusControllerReward = (index = controllerRewardCursorIndex.value) => {
  if (!isMultiRoundRewardChoiceOpen.value || !multiRoundRewardChoices.value.length) {
    return;
  }

  isControllerNavigationActive.value = true;
  controllerRegion.value = 'reward';
  const rewardCount = multiRoundRewardChoices.value.length;
  const boundedIndex = ((index % rewardCount) + rewardCount) % rewardCount;
  controllerRewardCursorIndex.value = boundedIndex;

  nextTick(() => {
    const rewardButton = document.querySelector(`[data-controller-reward="${boundedIndex}"]`);
    if (rewardButton && typeof rewardButton.focus === 'function') {
      rewardButton.focus();
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
    if (isMultiRoundMode.value && currentIndex < columns) {
      focusControllerRound(0);
      return;
    }
    nextIndex = Math.max(0, currentIndex - columns);
  } else if (direction === 'down') {
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

const handleTileClickWithCards = (payload, side) => {
  const tile = payload?.tile || payload;
  const animationSync = payload?.animationSync || null;
  // start timer as soon as user starts playing
  startTimedModeTimerAfterFirstTileClicked()
  if (effectiveGameEnded.value) {
    return;
  }

  if (activeBoonCard.value) {
    if (cardControlsDisabled.value) {
      localMessage.value = cardDisabledReason.value;
      resetActionMode();
      return;
    }

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

  const result = handleTileClick(tile, { animationSync });
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
    if (cardControlsDisabled.value) {
      localMessage.value = cardDisabledReason.value;
      resetActionMode();
      return;
    }

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
    stopMultiRoundTimer();
    gameMusic.pause();
    localMessage.value = 'Game paused.';
    return;
  }

  startBotLoopAfterTutorial();
  startSoloTimer();
  startMultiRoundTimer();
  startGameMusic();
  localMessage.value = 'Start Playing Words';
};

const syncTutorialPauseState = (visible) => {
  if (props.isMultiplayer) {
    return;
  }

  if (visible) {
    stopBotLoop();
    stopSoloTimer();
    stopMultiRoundTimer();
    return;
  }

  if (!props.settingsShowing && !effectiveGameEnded.value) {
    startBotLoopAfterTutorial();
    startSoloTimer();
    startMultiRoundTimer();
    startGameMusic();
  }
};

const handleCloseTutorial = ({ dontShowAgain } = {}) => {
  if (dontShowAgain) {
    localStorage.setItem(GAME_TUTORIAL_STORAGE_KEY, 'true');
  }

  showTutorialOverlay.value = false;
  nextTick(() => {
    focusControllerTile(0);
  });
};

const togglePause = () => {
  setPauseState(!isPaused.value);
};

const handlePlayAgain = () => {
  resetSpeedyWordClock();
  resetActionMode();
  clearSelectionForSide(mySide.value);
  isSoloTimerPausedByAttack.value = false;
  isMultiRoundTimerPausedByAttack.value = false;
  timedModeTimerStarted.value = false;
  timedSoloFinalWordSpent.value = false;
  pendingMultiRoundStartingScore.value = 0;
  window.clearTimeout(multiRoundRewardTimeoutId);

  if (props.isMultiplayer) {
    playMultiplayerAgain();
    localMessage.value = myReplayVote.value
      ? `Waiting for the other player. ${replayVoteCount.value}/2 votes in.`
      : 'Replay vote locked in. Waiting for the other player.';
    return;
  }

  if (isMultiRoundMode.value) {
    multiRoundRun.resetRun();
  }

  stopBotLoop();
  stopSoloTimer();
  stopMultiRoundTimer();
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
    // dont play victory sound if multiround 
    if(multiRoundRun && historyResultState.value === 'victory' ) return
    await audio.play();
  } catch (error) {
    // Ignore autoplay failures; the overlay state still updates correctly.
  }
});

const stopSoloTimer = () => {
  window.clearInterval(soloTimerId);
  soloTimerId = null;
};

const stopMultiRoundTimer = () => {
  window.clearInterval(multiRoundTimerId);
  multiRoundTimerId = null;
};

const canRunTimedModeTimer = () => {
  return timedModeTimerStarted.value && !isPaused.value && !props.settingsShowing && !showTutorialOverlay.value;
};

const startSoloTimer = () => {
  if (!isTimedSoloMode.value || effectiveGameEnded.value || !canRunTimedModeTimer()) {
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

const startMultiRoundTimer = () => {
  if (!isMultiRoundMode.value || effectiveGameEnded.value || multiRoundRun.rewardChoiceOpen.value || !canRunTimedModeTimer()) {
    stopMultiRoundTimer();
    return;
  }

  window.clearInterval(multiRoundTimerId);
  multiRoundTimerId = window.setInterval(() => {
    if (isMultiRoundTimerPausedByAttack.value) {
      return;
    }
    
    multiRoundRun.setTimerRemainingSeconds(multiRoundRun.timerRemainingSeconds.value - 1);
    if (multiRoundRun.timerRemainingSeconds.value <= 0) {
      stopMultiRoundTimer();
      localMessage.value = 'Final word ready';
    }
  }, 1000);
};

const startTimedModeTimerAfterFirstTileClicked = () => {
  if (!isTimedSoloMode.value && !isMultiRoundMode.value) {
    return;
  }

  if (timedModeTimerStarted.value) {
    return;
  }

  timedModeTimerStarted.value = true;
  startSoloTimer();
  startMultiRoundTimer();
};

const restoreCommonSaveState = (common = {}) => {
  resetSpeedyWordClock();
  playerScores.value = common.scores || { host: 0, opponent: 0 };
  playerTiles.value = common.tiles || { host: [], opponent: [] };
  playerCards.value = common.cards || {
    host: { boons: [], attacks: [] },
    opponent: { boons: [], attacks: [] }
  };
  wordHistory.value = common.wordHistory || { host: [], opponent: [] };
  submittedWords.value = common.submittedWords || { host: '', opponent: '' };
  rackClears.value = common.rackClears || { host: 0, opponent: 0 };

  const hostScore = wordHistory.value.host?.[0]?.score || 0;
  const opponentScore = wordHistory.value.opponent?.[0]?.score || 0;
  lastWordScores.value = {
    host: hostScore,
    opponent: opponentScore
  };
  lastWordBreakdowns.value = {
    host: {
      wordScore: hostScore,
      burnPenalty: 0,
      netScore: hostScore
    },
    opponent: {
      wordScore: opponentScore,
      burnPenalty: 0,
      netScore: opponentScore
    }
  };
  clearSelectionForSide('host');
  clearSelectionForSide('opponent');
  resetActionMode();
};

const restoreContinueSave = (rawSave) => {
  const save = unpackSave(rawSave);
  if (!save) {
    return;
  }

  restoreCommonSaveState(save.common);

  if (save.m === SAVE_MODES.MULTI_ROUND) {
    const multiRoundSave = save.mr || {};
    multiRoundRun.restoreRunState({
      resolvedRounds: multiRoundSave.rr,
      currentRoundIndex: multiRoundSave.i,
      timerRemainingSeconds: multiRoundSave.t,
      completedRounds: multiRoundSave.cr,
      personalModifiers: multiRoundSave.pm,
      rewardChoices: multiRoundSave.rc,
      startingScoreBonus: multiRoundSave.pe,
      runEnded: multiRoundSave.end,
      failureSummary: multiRoundSave.fs
    });
    pendingMultiRoundStartingScore.value = multiRoundSave.pe || 0;
    multiRoundFinalWordSpent.value = Boolean(multiRoundSave.fw);
    timedModeTimerStarted.value = Boolean(multiRoundSave.ts);
    isMultiRoundTimerPausedByAttack.value = false;
    localMessage.value = 'Multi-round save restored.';
    if (multiRoundRun.rewardChoiceOpen.value) {
      stopMultiRoundTimer();
    } else {
      startMultiRoundTimer();
    }
    return;
  }

  if (save.m === SAVE_MODES.BOT_MATCH) {
    const overtime = save.bt?.o || {};
    singlePlayerOvertimePendingSide.value = overtime.p || null;
    singlePlayerOvertimeFinalWordSubmitted.value = Boolean(overtime.f);
    timedModeTimerStarted.value = false;
    localMessage.value = 'Bot match save restored.';
    stopBotLoop();
    startBotLoopAfterTutorial();
  }
};

watch(() => props.playMode, (nextMode) => {
  resetSpeedyWordClock();
  if (nextMode === 'multi_round') {
    multiRoundRun.resetRun();
    multiRoundFinalWordSpent.value = false;
    timedModeTimerStarted.value = false;
    pendingMultiRoundStartingScore.value = 0;
    isMultiRoundTimerPausedByAttack.value = false;
    window.clearTimeout(multiRoundRewardTimeoutId);
    startMultiRoundTimer();
  } else {
    stopMultiRoundTimer();
    window.clearTimeout(multiRoundRewardTimeoutId);
  }

  timerRemainingSeconds.value = nextMode === 'timed_solo' ? SOLO_TIMER_SECONDS : 0;
  isSoloTimerPausedByAttack.value = false;
  timedSoloFinalWordSpent.value = false;
  timedModeTimerStarted.value = false;

  if (nextMode === 'timed_solo') {
    startSoloTimer();
    return;
  }

  stopSoloTimer();
}, { immediate: true });

watch(() => props.continueSave, (save) => {
  restoreContinueSave(save);
}, { immediate: true });

watch(effectiveGameEnded, (ended) => {
  if (ended) {
    if (isBotMode.value) {
      saveBotMatchPastGame();
      clearBotMatchSave();
    }

    stopBotLoop();
    const nextDifficulty = checkBotWin(leftLane.value.score, rightLane.value.score, isBotMode, props.botDifficulty);
    emit('update:botDifficulty', nextDifficulty);
    stopSoloTimer();
    stopMultiRoundTimer();
    return;
  }

  if (isTimedSoloMode.value) {
    startSoloTimer();
  }

  if (isMultiRoundMode.value) {
    startMultiRoundTimer();
  }
}, { immediate: true });

watch(() => props.settingsShowing, (showingSettings) => {
  // Keep the solo timer and bot loop in sync with the visible pause/settings state.
  setPauseState(showingSettings);
}, { immediate: true });

watch(showTutorialOverlay, (visible) => {
  syncTutorialPauseState(visible);
});

watch(() => multiRoundRun.activeRoundModifierKeys.value.join('|'), () => {
  resetTimedRoundModifierIndicators();
});

const handleKeydown = (event) => {
  if (props.settingsShowing) {
    return;
  }

  if (showTutorialOverlay.value) {
    return;
  }

  if (isMultiRoundRewardChoiceOpen.value) {
    if (!multiRoundRewardChoices.value.length) {
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      if (controllerRegion.value === 'rounds') {
        focusControllerRound(Math.max(0, controllerRoundCursorIndex.value - 1));
        return;
      }

      focusControllerReward(controllerRewardCursorIndex.value - 1);
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      if (controllerRegion.value === 'rounds') {
        focusControllerRound(Math.min(controllerRoundCursorIndex.value + 1, multiRoundProgressRounds.value.length - 1));
        return;
      }

      focusControllerReward(controllerRewardCursorIndex.value + 1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (controllerRegion.value === 'reward') {
        focusControllerRound(Math.min(controllerRewardCursorIndex.value, multiRoundProgressRounds.value.length - 1));
        return;
      }

      focusControllerRound(controllerRoundCursorIndex.value);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (controllerRegion.value === 'rounds') {
        focusControllerReward(Math.min(controllerRoundCursorIndex.value, multiRoundRewardChoices.value.length - 1));
        return;
      }

      focusControllerReward(controllerRewardCursorIndex.value);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ' || event.key === 'x') {
      event.preventDefault();
      if (controllerRegion.value === 'rounds') {
        focusControllerRound(controllerRoundCursorIndex.value);
        return;
      }

      const reward = multiRoundRewardChoices.value[controllerRewardCursorIndex.value];
      if (reward) {
        handleMultiRoundRewardChoice(reward.key);
      }
      return;
    }

    if (event.key !== 'Escape') {
      event.preventDefault();
      return;
    }
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
      } else if (controllerRegion.value === 'rounds') {
        focusControllerRound(Math.max(0, controllerRoundCursorIndex.value - 1));
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
      } else if (controllerRegion.value === 'rounds') {
        focusControllerRound(Math.min(controllerRoundCursorIndex.value + 1, multiRoundProgressRounds.value.length - 1));
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
      } else if (controllerRegion.value === 'rounds') {
        focusControllerRound(controllerRoundCursorIndex.value);
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
      } else if (controllerRegion.value === 'rounds') {
        focusControllerTile(Math.min(controllerRoundCursorIndex.value, 4));
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
    if (event.key === 'lt') {
      event.preventDefault();
      toggleSideDrawer();
      return;
    }
    if (event.key === 'rt') {
      event.preventDefault();
      togglePersonalModifiersDrawer();
      return;
    }

    return;
  }

  event.preventDefault();
};

watch([myTiles, mySide], () => {
  refocusControllerSelection();
}, { deep: true });

watch(isMultiRoundRewardChoiceOpen, (isOpen) => {
  if (!isOpen) {
    if (controllerRegion.value === 'reward') {
      focusControllerTile(0);
    }
    return;
  }

  controllerRewardCursorIndex.value = 0;
  nextTick(() => {
    focusControllerReward(0);
  });
});

watch(backgroundState, (state) => {
  emit('backgroundState', state);
}, { immediate: true, deep: true });

const syncWindowWidth = () => {
  windowWidth.value = window.innerWidth;
};

const showTutorialFromSettings = () => {
  showHistoryOverlay.value = false;
  showTutorialOverlay.value = true;
};

onMounted(() => {
  if (!localStorage.getItem(GAME_TUTORIAL_STORAGE_KEY)) {
    showTutorialOverlay.value = true;
  }
  syncWindowWidth();
  speedyWordClockIntervalId = window.setInterval(() => {
    speedyWordClockNow.value = Date.now();
  }, 250);
  playerCogDecayIntervalId = window.setInterval(() => {
    if (!isBotMode.value || Date.now() - lastPlayerCogScoreAt < 1800) {
      return;
    }

    playerCogTargetSpeed.value = Math.max(1, playerCogTargetSpeed.value - 0.12);
    rampPlayerCogSpeed();
  }, 500);
  roundModifierTickIntervalId = window.setInterval(tickTimedGameEffects, 100);
  window.addEventListener('resize', syncWindowWidth);
  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('wordis:show-tutorial', showTutorialFromSettings);
  startGameMusic({ restart: true });
});

onBeforeUnmount(() => {
  saveCurrentMultiRoundLocal();
  saveCurrentBotMatchLocal();
  window.removeEventListener('resize', syncWindowWidth);
  window.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('wordis:show-tutorial', showTutorialFromSettings);
  stopSoloTimer();
  stopMultiRoundTimer();
  stopGameMusic();
  window.clearTimeout(historyOverlayTimeoutId);
  window.clearTimeout(multiRoundRewardTimeoutId);
  window.clearTimeout(botCogBoostTimeoutId);
  window.cancelAnimationFrame(playerCogRampFrameId);
  window.clearInterval(playerCogDecayIntervalId);
  window.clearInterval(roundModifierTickIntervalId);
  window.clearInterval(speedyWordClockIntervalId);
  tilePickupSound.pause();
  tilePutBackSound.pause();
  tileReplaceSound.pause();
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
  resetSpeedyWordClock();
  saveCurrentMultiRoundLocal();
  saveCurrentBotMatchLocal();
  isPaused.value = false;
  stopBotLoop();
  stopSoloTimer();
  stopMultiRoundTimer();
  closeSideDrawer();
  showHistoryOverlay.value = false;
  window.clearTimeout(historyOverlayTimeoutId);
  isSoloTimerPausedByAttack.value = false;
  isMultiRoundTimerPausedByAttack.value = false;
  timedSoloFinalWordSpent.value = false;
  pendingMultiRoundStartingScore.value = 0;
  window.clearTimeout(multiRoundRewardTimeoutId);
  multiRoundRun.resetRun();
  stopGameMusic();
  stopResultAudio();
  resetMultiplayer();
  resetActionMode();
  localMessage.value = '';
  emit('home');
};
</script>

<style scoped lang="scss" src="./Game.scss"></style>
