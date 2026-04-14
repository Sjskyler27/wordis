const games = new Map();
const LETTER_CONFIG = require('../src/states/game/letters.json');
const WORD_BONUSES = require('../src/states/game/word-bonuses.json');
const RACK_SIZE = 22;
const LETTER_POOL = Object.entries(LETTER_CONFIG).flatMap(([letter, config]) =>
  Array.from({ length: config.count }, () => letter)
);

const drawLetter = () => LETTER_POOL[Math.floor(Math.random() * LETTER_POOL.length)];

const createRack = () => Array.from({ length: RACK_SIZE }, drawLetter);

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

const canBuildWordFromTiles = (word, tiles) => {
  const availableTiles = [...tiles];

  for (const letter of word) {
    const tileIndex = availableTiles.indexOf(letter);
    if (tileIndex === -1) {
      return false;
    }

    availableTiles.splice(tileIndex, 1);
  }

  return true;
};

const refillRack = (tiles, usedLetters) => {
  const remainingTiles = [...tiles];

  for (const letter of usedLetters) {
    const tileIndex = remainingTiles.indexOf(letter);
    if (tileIndex !== -1) {
      remainingTiles.splice(tileIndex, 1);
    }
  }

  while (remainingTiles.length < RACK_SIZE) {
    remainingTiles.push(drawLetter());
  }

  return remainingTiles;
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

const submitWord = (roomCode, clientId, word) => {
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

  if (!canBuildWordFromTiles(normalizedWord, state.tiles[side])) {
    return { success: false, error: 'Word must be built from your current tiles' };
  }

  state.words[side] = normalizedWord;
  state.history[side].unshift(normalizedWord);
  state.history[side] = state.history[side].slice(0, 5);
  state.scores[side] += getWordScore(normalizedWord);
  state.tiles[side] = refillRack(state.tiles[side], normalizedWord.split(''));

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
