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
    board: Array(9).fill(''),
    currentPlayer: 'X',
    winner: null
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

const makeMove = (roomCode, index, player) => {
  const state = games.get(roomCode);
  if (!state) {
    return { success: false, error: 'Room not found' };
  }

  if (typeof index !== 'number' || index < 0 || index > 8) {
    return { success: false, error: 'Invalid move index' };
  }

  if (state.winner) {
    return { success: false, error: 'Game already finished' };
  }

  if (state.board[index]) {
    return { success: false, error: 'Cell already taken' };
  }

  if (state.currentPlayer !== player) {
    return { success: false, error: 'Not your turn' };
  }

  state.board[index] = player;
  state.winner = checkWinner(state.board);
  state.currentPlayer = player === 'X' ? 'O' : 'X';

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

const checkWinner = (board) => {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];

  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  return null;
};

module.exports = {
  games,
  generateRoomCode,
  createGame,
  joinGame,
  makeMove,
  removePlayerFromGame
};
