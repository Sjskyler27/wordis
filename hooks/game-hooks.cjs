const games = new Map();
const LETTER_CONFIG = require('../src/states/game/letters.json');
const WORD_BONUSES = require('../src/states/game/word-bonuses.json');
const RACK_SIZE = 22;
const LETTER_POOL = Object.entries(LETTER_CONFIG).flatMap(([letter, config]) =>
  Array.from({ length: config.count }, () => letter)
);
const DUPLICATE_PENALTY = 0.38;
const MIN_DUPLICATE_WEIGHT = 0.18;
let nextTileId = 1;

const getRackLetterCounts = (tiles = []) => tiles.reduce((counts, tile) => {
  if (!tile?.letter) {
    return counts;
  }

  counts[tile.letter] = (counts[tile.letter] || 0) + 1;
  return counts;
}, {});

const getWeightedLetterPool = (tiles = []) => {
  const rackCounts = getRackLetterCounts(tiles);

  return LETTER_POOL.map((letter) => {
    const duplicateCount = rackCounts[letter] || 0;
    const weight = Math.max(MIN_DUPLICATE_WEIGHT, 1 - (duplicateCount * DUPLICATE_PENALTY));

    return {
      letter,
      weight
    };
  });
};

const drawLetter = (tiles = []) => {
  const weightedPool = getWeightedLetterPool(tiles);
  const totalWeight = weightedPool.reduce((sum, entry) => sum + entry.weight, 0);

  if (!totalWeight) {
    return LETTER_POOL[Math.floor(Math.random() * LETTER_POOL.length)];
  }

  let roll = Math.random() * totalWeight;
  for (const entry of weightedPool) {
    roll -= entry.weight;
    if (roll <= 0) {
      return entry.letter;
    }
  }

  return weightedPool[weightedPool.length - 1]?.letter || 'E';
};

const createTile = (letter = drawLetter()) => ({
  id: `tile-${nextTileId++}`,
  letter,
  score: LETTER_CONFIG[letter]?.score || 0,
  multiplier: 1,
  locked: false,
  status: 'normal'
});

const createRack = () => {
  const rack = [];
  while (rack.length < RACK_SIZE) {
    rack.push(createTile(drawLetter(rack)));
  }
  return rack;
};

const getLengthBonus = (length) => {
  if (WORD_BONUSES[length]) {
    return WORD_BONUSES[length];
  }

  if (length > 8) {
    return WORD_BONUSES[8] + ((length - 8) * 5);
  }

  return 0;
};

const getWordScore = (word) => {
  const letterScore = word
    .split('')
    .reduce((total, letter) => total + (LETTER_CONFIG[letter]?.score || 0), 0);

  return letterScore + getLengthBonus(word.length);
};

const getWordScoreFromTiles = (selectedTiles) => {
  const letterScore = selectedTiles.reduce((total, tile) => {
    return total + ((tile.score || 0) * (tile.multiplier || 1));
  }, 0);

  return letterScore + getLengthBonus(selectedTiles.length);
};

const getSelectedTiles = (tiles, tileIds) => {
  if (!Array.isArray(tileIds) || !tileIds.length) {
    return [];
  }

  const selectedTiles = [];
  for (const tileId of tileIds) {
    const tile = tiles.find((entry) => entry.id === tileId);
    if (!tile) {
      return null;
    }
    selectedTiles.push(tile);
  }

  return selectedTiles;
};

const refillRack = (tiles, usedTileIds) => {
  const usedIds = new Set(usedTileIds);
  const nextTiles = [...tiles];

  nextTiles.forEach((tile, index) => {
    if (!usedIds.has(tile.id)) {
      return;
    }

    const remainingTiles = nextTiles.filter((entry, entryIndex) => {
      return entryIndex !== index && !usedIds.has(entry.id);
    });

    nextTiles[index] = createTile(drawLetter(remainingTiles));
  });

  return nextTiles;
};

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
    tiles: {
      host: createRack(),
      opponent: createRack()
    }
  };

  games.set(roomCode, state);
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

const submitWord = (roomCode, clientId, word, tileIds) => {
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

  if (!/^[A-Z]+$/.test(normalizedWord)) {
    return { success: false, error: 'Words must use letters only' };
  }

  const selectedTiles = getSelectedTiles(state.tiles[side], tileIds);
  if (!selectedTiles || selectedTiles.length !== normalizedWord.length) {
    return { success: false, error: 'Word must be built from your selected tiles' };
  }

  if (selectedTiles.some((tile) => tile.locked)) {
    return { success: false, error: 'Locked tiles cannot be used' };
  }

  const selectedWord = selectedTiles.map((tile) => tile.letter).join('');
  if (selectedWord !== normalizedWord) {
    return { success: false, error: 'Selected tiles do not match the submitted word' };
  }

  state.words[side] = normalizedWord;
  state.history[side].unshift(normalizedWord);
  state.history[side] = state.history[side].slice(0, 5);
  state.scores[side] += getWordScoreFromTiles(selectedTiles);
  state.tiles[side] = refillRack(state.tiles[side], tileIds);

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
  removePlayerFromGame
};
