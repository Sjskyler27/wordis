const games = new Map();
const { randomUUID } = require('crypto');
const LETTER_CONFIG = require('../src/states/game/letters.json');
const WORD_BONUSES = require('../src/states/game/word-bonuses.json');
const MILESTONE_REWARDS = require('../src/states/game/word-milestone-rewards.json');
const { validateWord } = require('./word-validator.cjs');
const { isTestingMode, isDevMode } = require('./env.cjs');
const WINNING_SCORE = isTestingMode ? 40 : 250;
const sharedTileLogic = require('../src/states/game/shared-tile-logic.cjs');
const {
  createSharedTileLogic,
  BAD_TILES
} = sharedTileLogic;

const {
  CARD_DEFINITIONS,
  MIN_WORD_LENGTH,
  getCardDefinition,
  getWordScoreDetails,
  applyRackManipulationEffects,
  getIdleScorePenalty,
  getResourceGrants,
  getSelectedTiles,
  selectedTilesMatchWord,
  isMissingRequiredTile,
  replaceTileWithModifier,
  createCardLogic,
  createTileLogic
} = createSharedTileLogic({
  letterConfig: LETTER_CONFIG,
  wordBonuses: WORD_BONUSES,
  milestoneRewards: MILESTONE_REWARDS,
  devLogging: isDevMode,
  testing: isTestingMode
});

const serverIdState = {
  tileSession: randomUUID(),
  cardSession: randomUUID(),
  nextTileId: 1,
  nextCardId: 1
};

const {
  createRack,
  createOpeningRackPair,
  refillTiles: refillRack,
  replaceSingleTile,
  rerollRackExceptTile,
  createTestingOpeningRackPair
} = createTileLogic({
  createTileId: () => {
    const id = `tile-${serverIdState.tileSession}-${serverIdState.nextTileId}`;
    serverIdState.nextTileId += 1;
    return id;
  }
});
const { createCards, drawCard, drawCards } = createCardLogic({
  createCardId: () => {
    const id = `card-${serverIdState.cardSession}-${serverIdState.nextCardId}`;
    serverIdState.nextCardId += 1;
    return id;
  }
});

const createTestingHands = () => {
  const trayModifierKeys = Object.entries(CARD_DEFINITIONS)
    .filter(([, definition]) => definition.kind === 'trayModifier')
    .map(([key]) => key);
  const attackKeys = Object.entries(CARD_DEFINITIONS)
    .filter(([, definition]) => definition.kind === 'attack')
    .map(([key]) => key);

  return {
    host: {
      trayModifiers: createCards(trayModifierKeys),
      attacks: createCards(attackKeys),
      tactics: []
    },
    opponent: {
      trayModifiers: createCards(trayModifierKeys),
      attacks: createCards(attackKeys),
      tactics: []
    }
  };
};

const keepTestingHand = (hand = [], cardId) => {
  return isTestingMode ? hand : hand.filter((entry) => entry.id !== cardId);
};

const devLog = (...args) => {
  console.log('devlog')
  if (isDevMode) {
    console.log(...args);
  }
};

const normalizeMultiplayerSettings = (settings = {}) => {
  const victoryScore = Math.max(25, Math.min(1000, Math.round(Number(settings.victoryScore) || WINNING_SCORE)));
  return {
    victoryScore,
    disabledTileModifiers: Array.isArray(settings.disabledTileModifiers)
      ? [...new Set(settings.disabledTileModifiers.filter(Boolean))]
      : [],
    disabledCards: Array.isArray(settings.disabledCards)
      ? [...new Set(settings.disabledCards.filter(Boolean))]
      : []
  };
};

const getWinningScore = (state) => state?.settings?.victoryScore || WINNING_SCORE;
const getDisabledTileModifierEffects = (state) => ({
  blockedModifiers: state?.settings?.disabledTileModifiers || []
});
const getDisabledCardOptions = (state) => ({
  disabledCards: state?.settings?.disabledCards || []
});

const createHistoryTiles = (tiles = []) => {
  // Preserve the exact submitted tiles so post-game history matches what players actually used.
  return tiles.map((tile) => ({
    id: tile.id,
    letter: tile.letter,
    baseLetter: tile.baseLetter,
    score: tile.score,
    baseScore: tile.baseScore,
    bonusScore: tile.bonusScore,
    multiplier: tile.multiplier,
    wordMultiplier: tile.wordMultiplier,
    firstTileBonus: tile.firstTileBonus,
    status: tile.status,
    locked: tile.locked,
    lockTurns: tile.lockTurns
  }));
};

const getTurnCount = (state) => {
  return (state?.history?.host?.length || 0) + (state?.history?.opponent?.length || 0);
};

const generateRoomCode = () => {
  let roomCode;
  do {
    roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
  } while (roomCode.length === 0 || games.has(roomCode));
  return roomCode;
};

const createInitialState = ({ hostId, players = [hostId], isPrivate = true, overtimeEnabled = true, settings = {} }) => {
  const multiplayerSettings = normalizeMultiplayerSettings(settings);
  const tileModifierOptions = {
    personalModifierEffects: {
      blockedModifiers: multiplayerSettings.disabledTileModifiers
    }
  };
  const cardOptions = {
    disabledCards: multiplayerSettings.disabledCards
  };

  if (isTestingMode) {
    return {
      host: hostId,
      players: [...players],
      isPrivate,
      overtimeEnabled,
      settings: multiplayerSettings,
      overtimePendingSide: null,
      overtimeFinalWordSubmitted: false,
      submissionPauseOwner: null,
      words: {
        host: '',
        opponent: ''
      },
      history: {
        host: [],
        opponent: []
      },
      scores: {
        host: 0,
        opponent: 0
      },
      lastWordScores: {
        host: 0,
        opponent: 0
      },
      lastWordBreakdowns: {
        host: {
          wordScore: 0,
          burnPenalty: 0,
          netScore: 0
        },
        opponent: {
          wordScore: 0,
          burnPenalty: 0,
          netScore: 0
        }
      },
      playAgainVotes: {
        host: false,
        opponent: false
      },
      rackClears: {
        host: 100,
        opponent: 100
      },
      cards: createTestingHands(),
      tiles: createTestingOpeningRackPair({ host: 0, opponent: 0 }, {
        includeAllModifiers: true,
        ...tileModifierOptions
      })
    };
  }

  return {
    host: hostId,
    players: [...players],
    isPrivate,
    overtimeEnabled,
    settings: multiplayerSettings,
    overtimePendingSide: null,
    overtimeFinalWordSubmitted: false,
    submissionPauseOwner: null,
    words: {
      host: '',
      opponent: ''
    },
    history: {
      host: [],
      opponent: []
    },
    scores: {
      host: 0,
      opponent: 0
    },
    lastWordScores: {
      host: 0,
      opponent: 0
    },
    lastWordBreakdowns: {
      host: {
        wordScore: 0,
        burnPenalty: 0,
        netScore: 0
      },
      opponent: {
        wordScore: 0,
        burnPenalty: 0,
        netScore: 0
      }
    },
    playAgainVotes: {
      host: false,
      opponent: false
    },
    rackClears: {
      host: 2,
      opponent: 2
    },
    cards: {
      host: {
        trayModifiers: drawCards('trayModifier', 1, cardOptions),
        attacks: drawCards('attack', 1, {
          side: 'host',
          scores: { host: 0, opponent: 0 },
          ...cardOptions
        }),
        tactics: []
      },
      opponent: {
        trayModifiers: drawCards('trayModifier', 1, cardOptions),
        attacks: drawCards('attack', 1, {
          side: 'opponent',
          scores: { host: 0, opponent: 0 },
          ...cardOptions
        }),
        tactics: []
      }
    },
    tiles: createOpeningRackPair({ host: 0, opponent: 0 }, tileModifierOptions)
  };
};

const hasOvertimeStarted = (state) => {
  if (!state.overtimeEnabled || state.overtimeFinalWordSubmitted) {
    return false;
  }

  const winningScore = getWinningScore(state);
  const hostAtGoal = state.scores.host >= winningScore;
  const opponentAtGoal = state.scores.opponent >= winningScore;
  return hostAtGoal !== opponentAtGoal;
};

const getOvertimeTrailingSide = (state) => {
  if (state.overtimePendingSide) {
    return state.overtimePendingSide;
  }

  if (!hasOvertimeStarted(state)) {
    return null;
  }

  return state.scores.host >= getWinningScore(state) ? 'opponent' : 'host';
};

const updateOvertimeStateAfterSubmit = (state, side) => {
  if (!state.overtimeEnabled || state.overtimeFinalWordSubmitted) {
    return;
  }

  if (state.overtimePendingSide) {
    if (state.overtimePendingSide === side) {
      state.overtimeFinalWordSubmitted = true;
    }
    return;
  }

  const winningScore = getWinningScore(state);
  const hostAtGoal = state.scores.host >= winningScore;
  const opponentAtGoal = state.scores.opponent >= winningScore;
  if (hostAtGoal === opponentAtGoal) {
    return;
  }

  state.overtimePendingSide = hostAtGoal ? 'opponent' : 'host';
};

const createGame = (roomCode, hostId, options = {}) => {
  if (games.has(roomCode)) {
    return { success: false, error: 'Room already exists' };
  }

  const state = createInitialState({
    hostId,
    players: [hostId],
    isPrivate: options.isPrivate ?? true,
    overtimeEnabled: options.overtimeEnabled ?? true,
    settings: options.settings || {}
  });
  devLog('[multiplayer-room-rules]', {
    roomCode,
    isPrivate: state.isPrivate,
    overtimeEnabled: state.overtimeEnabled,
    settings: state.settings
  });

  games.set(roomCode, state);
  return { success: true, state };
};

const clearRack = (roomCode, clientId) => {
  const state = games.get(roomCode);
  if (!state) {
    return { success: false, error: 'Room not found' };
  }

  const side = clientId === state.host ? 'host' : 'opponent';
  if (!state.players.includes(clientId)) {
    return { success: false, error: 'Player not in room' };
  }

  if ((state.rackClears[side] || 0) <= 0) {
    return { success: false, error: 'No rack clears remaining' };
  }

  state.rackClears[side] -= 1;
  state.tiles[side] = createRack(side, state.scores, {
    mode: 'clear',
    currentTiles: state.tiles[side],
    personalModifierEffects: getDisabledTileModifierEffects(state),
    turnCount: getTurnCount(state)
  });

  return { success: true, state };
};

const useBoon = (roomCode, clientId, cardId, tileId) => {
  const state = games.get(roomCode);
  if (!state) {
    return { success: false, error: 'Room not found' };
  }

  const side = clientId === state.host ? 'host' : 'opponent';
  const card = state.cards[side].trayModifiers.find((entry) => entry.id === cardId);
  if (!card) {
    return { success: false, error: 'No tray modifiers remaining' };
  }
  if ((state.settings?.disabledCards || []).includes(card.key)) {
    return { success: false, error: 'That tray modifier is disabled in this room' };
  }

  if (card.effectType === 'clear_negative_modifiers') {
    state.cards[side].trayModifiers = keepTestingHand(state.cards[side].trayModifiers, cardId);
    state.tiles[side] = state.tiles[side].map((entry) => {
      if (!BAD_TILES.includes(entry.status)) {
        return entry;
      }

      return replaceTileWithModifier([entry], entry.id, 'normal')[0];
    });

    return { success: true, state };
  }

  const tile = state.tiles[side].find((entry) => entry.id === tileId);
  if (!tile) {
    return { success: false, error: 'That tile cannot take a tray modifier' };
  }

  if (card.effectType === 'delete_tile') {
    state.cards[side].trayModifiers = keepTestingHand(state.cards[side].trayModifiers, cardId);
    state.tiles[side] = replaceSingleTile(state.tiles[side], tileId, side, state.scores, {
      personalModifierEffects: getDisabledTileModifierEffects(state),
      turnCount: getTurnCount(state)
    });
    return { success: true, state };
  }

  if (tile.locked) {
    return { success: false, error: 'That tile cannot take a tray modifier' };
  }
  if (tile.mustuse) {
    return { success: false, error: 'That tile cannot take a tray modifier' };
  }

  state.cards[side].trayModifiers = keepTestingHand(state.cards[side].trayModifiers, cardId);

  if (card.effectType === 'isolate_tile') {
    state.tiles[side] = rerollRackExceptTile(state.tiles[side], tileId, side, state.scores, {
      personalModifierEffects: getDisabledTileModifierEffects(state),
      turnCount: getTurnCount(state)
    });
    return { success: true, state };
  }

  if (card.effectType === 'change_letter') {
    const replacementTile = replaceSingleTile(state.tiles[side], tileId, side, state.scores, {
      personalModifierEffects: getDisabledTileModifierEffects(state),
      turnCount: getTurnCount(state)
    }).find((entry) => (
      entry.id !== tileId &&
      !state.tiles[side].some((existingTile) => existingTile.id === entry.id)
    ));

    state.tiles[side] = state.tiles[side].map((tile) => {
      if (tile.id !== tileId) return tile;

      return {
        ...tile,
        letter: replacementTile?.letter || tile.letter
      };
    });

    return { success: true, state };
  }

  state.tiles[side] = replaceTileWithModifier(state.tiles[side], tileId, card.modifier);
  return { success: true, state };
};

const useAttack = (roomCode, clientId, cardId) => {
  const state = games.get(roomCode);
  if (!state) {
    return { success: false, error: 'Room not found' };
  }

  if (hasOvertimeStarted(state)) {
    return { success: false, error: 'Overtime only allows tray modifiers' };
  }

  const side = clientId === state.host ? 'host' : 'opponent';
  const opponentSide = side === 'host' ? 'opponent' : 'host';
  const card = state.cards[side].attacks.find((entry) => entry.id === cardId);
  if (!card) {
    return { success: false, error: 'No attacks remaining' };
  }
  if ((state.settings?.disabledCards || []).includes(card.key)) {
    return { success: false, error: 'That attack is disabled in this room' };
  }

  if (card.effectType === 'pause_submissions') {
    if (state.submissionPauseOwner) {
      return { success: false, error: 'A submission pause is already active' };
    }

    state.cards[side].attacks = keepTestingHand(state.cards[side].attacks, cardId);
    state.submissionPauseOwner = side;
    return { success: true, state };
  }

  if (card.modifier === 'mustuse' && state.tiles[opponentSide].some((tile) => tile.status === 'mustuse')) {
    return { success: false, error: 'That board already has a MUST tile' };
  }

  // Random attacks should only hit clean tiles so modifiers do not stack unpredictably.
  const availableTiles = state.tiles[opponentSide].filter((tile) => !tile.locked && tile.status === 'normal');
  if (!availableTiles.length) {
    return { success: false, error: 'No opponent tiles available' };
  }

  const targetTile = availableTiles[Math.floor(Math.random() * availableTiles.length)];
  state.cards[side].attacks = keepTestingHand(state.cards[side].attacks, cardId);
  state.tiles[opponentSide] = replaceTileWithModifier(state.tiles[opponentSide], targetTile.id, card.modifier);
  return { success: true, state };
};

const joinGame = (roomCode, clientId) => {
  const state = games.get(roomCode);
  if (!state || state.players.length >= 2) {
    return { success: false, error: 'Room not found or full' };
  }

  if (!state.players.includes(clientId)) {
    state.players.push(clientId);
  }

  return { success: true, state };
};

const listOpenGames = () => {
  return Array.from(games.entries())
    .filter(([, state]) => !state.isPrivate && state.players.length < 2)
    .map(([roomCode, state]) => ({
      roomCode,
      players: state.players.length,
      isPrivate: state.isPrivate
    }));
};

const playAgain = (roomCode, clientId) => {
  const state = games.get(roomCode);
  if (!state) {
    return { success: false, error: 'Room not found' };
  }

  if (!state.players.includes(clientId)) {
    return { success: false, error: 'Player not in room' };
  }

  const side = clientId === state.host ? 'host' : 'opponent';
  state.playAgainVotes[side] = true;

  const bothPlayersPresent = state.players.length >= 2;
  const everyoneReady = bothPlayersPresent && state.playAgainVotes.host && state.playAgainVotes.opponent;

  if (!everyoneReady) {
    return { success: true, state, restarted: false };
  }

  const nextState = createInitialState({
    hostId: state.host,
    players: state.players,
    isPrivate: state.isPrivate,
    overtimeEnabled: state.overtimeEnabled,
    settings: state.settings || {}
  });

  games.set(roomCode, nextState);
  return { success: true, state: nextState, restarted: true };
};

const submitWord = async (roomCode, clientId, word, tileIds, languageCode = 'en') => {
  const state = games.get(roomCode);
  if (!state) {
    return { success: false, error: 'Room not found' };
  }

  const winningScore = getWinningScore(state);
  if (state.overtimeFinalWordSubmitted || (!state.overtimeEnabled && (state.scores.host >= winningScore || state.scores.opponent >= winningScore))) {
    return { success: false, error: 'Game is already over' };
  }

  const normalizedWord = (word || '').trim().toUpperCase();
  if (!normalizedWord) {
    return { success: false, error: 'Word required' };
  }

  const side = clientId === state.host ? 'host' : 'opponent';
  if (!state.players.includes(clientId)) {
    return { success: false, error: 'Player not in room' };
  }

  if (state.submissionPauseOwner && state.submissionPauseOwner !== side) {
    return { success: false, error: 'Your submissions are paused until your opponent submits' };
  }

  if (!/^[A-Z*]+$/.test(normalizedWord)) {
    return { success: false, error: 'Words must use letters only' };
  }

  if (tileIds?.length < MIN_WORD_LENGTH) {
    return { success: false, error: `Words must use at least ${MIN_WORD_LENGTH} tiles` };
  }

  const rackTilesForScoring = applyRackManipulationEffects(state.tiles[side], {
    side,
    scores: state.scores
  });
  const selectedTiles = getSelectedTiles(rackTilesForScoring, tileIds);
  if (!selectedTiles || !selectedTiles.length) {
    return { success: false, error: 'Word must be built from your selected tiles' };
  }

  if (selectedTiles.some((tile) => tile.locked)) {
    return { success: false, error: 'Locked tiles cannot be used' };
  }

  if (isMissingRequiredTile(state.tiles[side], selectedTiles)) {
    return { success: false, error: 'You must use every MUST tile in your rack' };
  }

  if (!selectedTilesMatchWord(selectedTiles, normalizedWord)) {
    return { success: false, error: 'Selected tiles do not match the submitted word' };
  }

  const validationResult = await validateWord(normalizedWord, languageCode);
  if (!validationResult.valid) {
    return { success: false, error: 'That is not a valid word' };
  }
  const resolvedWord = (validationResult.resolvedWord || normalizedWord).toUpperCase();

  const wordScore = getWordScoreDetails(selectedTiles, {
    side,
    scores: state.scores
  }).total;
  const idlePenalty = getIdleScorePenalty(state.tiles[side], tileIds);
  const scoreDelta = wordScore - idlePenalty;
  const grantedResources = getResourceGrants(selectedTiles, {
    includeAttacks: true,
    includeTactics: false
  });

  state.words[side] = resolvedWord;
  state.history[side].unshift({
    word: resolvedWord,
    score: scoreDelta,
    tiles: createHistoryTiles(selectedTiles)
  });
  state.lastWordScores[side] = scoreDelta;
  state.lastWordBreakdowns[side] = {
    wordScore,
    burnPenalty: idlePenalty,
    netScore: scoreDelta
  };
  state.scores[side] += scoreDelta;
  state.cards[side].trayModifiers.push(...drawCards('trayModifier', grantedResources.trayModifiers, getDisabledCardOptions(state)));
  state.cards[side].attacks.push(...drawCards('attack', grantedResources.attacks, {
    side,
    scores: state.scores,
    ...getDisabledCardOptions(state)
  }));
  state.tiles[side] = refillRack(state.tiles[side], tileIds, side, state.scores, {
    phase: 'submit',
    personalModifierEffects: getDisabledTileModifierEffects(state),
    turnCount: getTurnCount(state)
  });
  if (state.submissionPauseOwner === side) {
    state.submissionPauseOwner = null;
  }
  updateOvertimeStateAfterSubmit(state, side);

  return { success: true, state };
};

const removePlayerFromGame = (roomCode, clientId) => {
  const state = games.get(roomCode);
  if (!state) return;

  state.players = state.players.filter((id) => id !== clientId);
  if (state.players.length === 0) {
    games.delete(roomCode);
  }
};

module.exports = {
  games,
  generateRoomCode,
  createGame,
  joinGame,
  listOpenGames,
  playAgain,
  submitWord,
  clearRack,
  useBoon,
  useAttack,
  removePlayerFromGame
};
