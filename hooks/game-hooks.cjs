const games = new Map();
const LETTER_CONFIG = require('../src/states/game/letters.json');
const WORD_BONUSES = require('../src/states/game/word-bonuses.json');
const { validateWord } = require('./word-validator.cjs');
const {
  createSharedTileLogic
} = require('../src/states/game/shared-tile-logic.cjs');

const {
  MIN_WORD_LENGTH,
  getCardDefinition,
  getWordScoreDetails,
  getResourceGrants,
  getSelectedTiles,
  selectedTilesMatchWord,
  isMissingRequiredTile,
  replaceTileWithModifier,
  createCardLogic,
  createTileLogic
} = createSharedTileLogic({
  letterConfig: LETTER_CONFIG,
  wordBonuses: WORD_BONUSES
});

let nextTileId = 1;
let nextCardId = 1;

const { createRack, refillTiles: refillRack } = createTileLogic({
  createTileId: () => `tile-${nextTileId++}`
});
const { drawCard, drawCards } = createCardLogic({
  createCardId: () => `card-${nextCardId++}`
});

const generateRoomCode = () => {
  let roomCode;
  do {
    roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
  } while (roomCode.length === 0 || games.has(roomCode));
  return roomCode;
};

const createGame = (roomCode, hostId) => {
  if (games.has(roomCode)) {
    return { success: false, error: 'Room already exists' };
  }

  const state = {
    host: hostId,
    players: [hostId],
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
    tiles: {
      host: createRack('host', { host: 0, opponent: 0 }),
      opponent: createRack('opponent', { host: 0, opponent: 0 })
    }
  };

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
  state.tiles[side] = createRack(side, state.scores);

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

  const tile = state.tiles[side].find((entry) => entry.id === tileId);
  if (!tile || tile.locked) {
    return { success: false, error: 'That tile cannot take a boon' };
  }

  state.cards[side].boons = state.cards[side].boons.filter((entry) => entry.id !== cardId);

  if (card.effectType === 'delete_tile') {
    state.tiles[side] = refillRack(state.tiles[side], [tileId], side, state.scores);
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

  const side = clientId === state.host ? 'host' : 'opponent';
  const opponentSide = side === 'host' ? 'opponent' : 'host';
  const card = state.cards[side].attacks.find((entry) => entry.id === cardId);
  if (!card) {
    return { success: false, error: 'No attacks remaining' };
  }

  const availableTiles = state.tiles[opponentSide].filter((tile) => !tile.locked);
  if (!availableTiles.length) {
    return { success: false, error: 'No opponent tiles available' };
  }

  const targetTile = availableTiles[Math.floor(Math.random() * availableTiles.length)];
  state.cards[side].attacks = state.cards[side].attacks.filter((entry) => entry.id !== cardId);
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

const submitWord = async (roomCode, clientId, word, tileIds, languageCode = 'en') => {
  const state = games.get(roomCode);
  if (!state) {
    return { success: false, error: 'Room not found' };
  }

  const normalizedWord = (word || '').trim().toUpperCase();
  if (!normalizedWord) {
    return { success: false, error: 'Word required' };
  }

  const side = clientId === state.host ? 'host' : 'opponent';
  if (!state.players.includes(clientId)) {
    return { success: false, error: 'Player not in room' };
  }

  if (!/^[A-Z*]+$/.test(normalizedWord)) {
    return { success: false, error: 'Words must use letters only' };
  }

  if (normalizedWord.length < MIN_WORD_LENGTH) {
    return { success: false, error: `Words must be at least ${MIN_WORD_LENGTH} letters` };
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

  const wordScore = getWordScoreDetails(selectedTiles).total;
  const grantedResources = getResourceGrants(selectedTiles);

  state.words[side] = normalizedWord;
  state.history[side].unshift(normalizedWord);
  state.history[side] = state.history[side].slice(0, 5);
  state.lastWordScores[side] = wordScore;
  state.scores[side] += wordScore;
  state.cards[side].boons.push(...drawCards('boon', grantedResources.boons));
  state.cards[side].attacks.push(...drawCards('attack', grantedResources.attacks));
  state.tiles[side] = refillRack(state.tiles[side], tileIds, side, state.scores);

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
  submitWord,
  clearRack,
  useBoon,
  useAttack,
  removePlayerFromGame
};
