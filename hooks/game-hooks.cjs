const games = new Map();

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

  const normalizedWord = (word || '').trim();
  if (!normalizedWord) {
    return { success: false, error: 'Word required' };
  }

  const side = clientId === state.host ? 'host' : 'opponent';
  if (!state.players.includes(clientId)) {
    return { success: false, error: 'Player not in room' };
  }

  state.words[side] = normalizedWord;
  state.history[side].unshift(normalizedWord);
  state.history[side] = state.history[side].slice(0, 5);

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
