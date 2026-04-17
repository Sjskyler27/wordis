const games = new Map();
const WINNING_SCORE = isTestingMode ? 40 : 250;
const { randomUUID } = require('crypto');
const LETTER_CONFIG = require('../src/states/game/letters.json');
const WORD_BONUSES = require('../src/states/game/word-bonuses.json');
const MILESTONE_REWARDS = require('../src/states/game/word-milestone-rewards.json');
const { validateWord } = require('./word-validator.cjs');
const { isTestingMode, isDevMode } = require('./env.cjs');
const {
  createSharedTileLogic
} = require('../src/states/game/shared-tile-logic.cjs');

const {
  CARD_DEFINITIONS,
  MIN_WORD_LENGTH,
  getCardDefinition,
  getWordScoreDetails,
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
  devLogging: isDevMode
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
  const boonKeys = Object.entries(CARD_DEFINITIONS)
    .filter(([, definition]) => definition.kind === 'boon')
    .map(([key]) => key);
  const attackKeys = Object.entries(CARD_DEFINITIONS)
    .filter(([, definition]) => definition.kind === 'attack')
    .map(([key]) => key);

  return {
    host: {
      boons: createCards(boonKeys),
      attacks: createCards(attackKeys)
    },
    opponent: {
      boons: createCards(boonKeys),
      attacks: createCards(attackKeys)
    }
  };
};

const keepTestingHand = (hand = [], cardId) => {
  return isTestingMode ? hand : hand.filter((entry) => entry.id !== cardId);
};

const generateRoomCode = () => {
  let roomCode;
  do {
    roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
  } while (roomCode.length === 0 || games.has(roomCode));
  return roomCode;
};

const createInitialState = ({ hostId, players = [hostId], isPrivate = true }) => {
  if (isTestingMode) {
    return {
      host: hostId,
      players: [...players],
      isPrivate,
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
        includeAllModifiers: true
      })
    };
  }

  return {
    host: hostId,
    players: [...players],
    isPrivate,
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
        boons: drawCards('boon', 1),
        attacks: drawCards('attack', 1)
      },
      opponent: {
        boons: drawCards('boon', 1),
        attacks: drawCards('attack', 1)
      }
    },
    tiles: createOpeningRackPair({ host: 0, opponent: 0 })
  };
};

const hasOvertimeStarted = (state) => {
  const hostAtGoal = state.scores.host >= WINNING_SCORE;
  const opponentAtGoal = state.scores.opponent >= WINNING_SCORE;
  return hostAtGoal !== opponentAtGoal;
};

const getOvertimeTrailingSide = (state) => {
  if (!hasOvertimeStarted(state)) {
    return null;
  }

  return state.scores.host >= WINNING_SCORE ? 'opponent' : 'host';
};

const createGame = (roomCode, hostId, options = {}) => {
  if (games.has(roomCode)) {
    return { success: false, error: 'Room already exists' };
  }

  const state = createInitialState({
    hostId,
    players: [hostId],
    isPrivate: options.isPrivate ?? true
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
    currentTiles: state.tiles[side]
  });

  return { success: true, state };
};

const useBoon = (roomCode, clientId, cardId, tileId) => {
  const state = games.get(roomCode);
  if (!state) {
    return { success: false, error: 'Room not found' };
  }

  const side = clientId === state.host ? 'host' : 'opponent';
  const card = state.cards[side].boons.find((entry) => entry.id === cardId);
  if (!card) {
    return { success: false, error: 'No boons remaining' };
  }

  if (card.effectType === 'clear_negative_modifiers') {
    state.cards[side].boons = keepTestingHand(state.cards[side].boons, cardId);
    state.tiles[side] = state.tiles[side].map((entry) => {
      if (!['zeroTile', 'mustuse', 'locked3', 'ghostTile', 'burningTile'].includes(entry.status)) {
        return entry;
      }

      return replaceTileWithModifier([entry], entry.id, 'normal')[0];
    });

    return { success: true, state };
  }

  const tile = state.tiles[side].find((entry) => entry.id === tileId);
  if (!tile) {
    return { success: false, error: 'That tile cannot take a boon' };
  }

  if (card.effectType === 'delete_tile') {
    state.cards[side].boons = keepTestingHand(state.cards[side].boons, cardId);
    state.tiles[side] = replaceSingleTile(state.tiles[side], tileId, side, state.scores);
    return { success: true, state };
  }

  if (tile.locked) {
    return { success: false, error: 'That tile cannot take a boon' };
  }

  state.cards[side].boons = keepTestingHand(state.cards[side].boons, cardId);

  if (card.effectType === 'isolate_tile') {
    state.tiles[side] = rerollRackExceptTile(state.tiles[side], tileId, side, state.scores);
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
    return { success: false, error: 'Overtime only allows boons' };
  }

  const side = clientId === state.host ? 'host' : 'opponent';
  const opponentSide = side === 'host' ? 'opponent' : 'host';
  const card = state.cards[side].attacks.find((entry) => entry.id === cardId);
  if (!card) {
    return { success: false, error: 'No attacks remaining' };
  }

  if (card.modifier === 'mustuse' && state.tiles[opponentSide].some((tile) => tile.status === 'mustuse')) {
    return { success: false, error: 'That board already has a MUST tile' };
  }

  const availableTiles = state.tiles[opponentSide].filter((tile) => !tile.locked);
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
    isPrivate: state.isPrivate
  });

  games.set(roomCode, nextState);
  return { success: true, state: nextState, restarted: true };
};

const submitWord = async (roomCode, clientId, word, tileIds, languageCode = 'en') => {
  const state = games.get(roomCode);
  if (!state) {
    return { success: false, error: 'Room not found' };
  }

  if (state.scores.host >= WINNING_SCORE && state.scores.opponent >= WINNING_SCORE) {
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

  const overtimeTrailingSide = getOvertimeTrailingSide(state);
  if (overtimeTrailingSide && overtimeTrailingSide !== side) {
    return { success: false, error: 'Only the trailing player can submit during overtime' };
  }

  if (!/^[A-Z*]+$/.test(normalizedWord)) {
    return { success: false, error: 'Words must use letters only' };
  }

  if (tileIds?.length < MIN_WORD_LENGTH) {
    return { success: false, error: `Words must use at least ${MIN_WORD_LENGTH} tiles` };
  }

  const selectedTiles = getSelectedTiles(state.tiles[side], tileIds);
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
  const grantedResources = getResourceGrants(selectedTiles);

  state.words[side] = resolvedWord;
  state.history[side].unshift({
    word: resolvedWord,
    score: scoreDelta
  });
  state.lastWordScores[side] = scoreDelta;
  state.scores[side] += scoreDelta;
  state.cards[side].boons.push(...drawCards('boon', grantedResources.boons));
  state.cards[side].attacks.push(...drawCards('attack', grantedResources.attacks));
  state.tiles[side] = refillRack(state.tiles[side], tileIds, side, state.scores, {
    phase: 'submit'
  });

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
