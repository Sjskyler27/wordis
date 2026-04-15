import { ref, computed } from 'vue';
import socket from '../../websocket.js';

export const roomCode = ref(null);
export const isHost = ref(false);
export const submittedWords = ref({
  host: '',
  opponent: ''
});
export const wordHistory = ref({
  host: [],
  opponent: []
});
export const playerScores = ref({
  host: 0,
  opponent: 0
});
export const lastWordScores = ref({
  host: 0,
  opponent: 0
});
export const playerTiles = ref({
  host: [],
  opponent: []
});
export const rackClears = ref({
  host: 2,
  opponent: 2
});
export const gameStarted = ref(false);
export const message = ref('');
export const isConnecting = ref(false);
export const connectionStatus = ref('connecting');
export const isSocketConnected = computed(() => connectionStatus.value === 'connected');

export const hostGame = () => {
  if (!isSocketConnected.value) {
    message.value = 'Multiplayer server is offline. Please check your connection.';
    return;
  }

  isConnecting.value = true;
  socket.emit('hostGame');
};

const applyGameState = (data = {}) => {
  submittedWords.value = data.words || submittedWords.value;
  wordHistory.value = data.history || wordHistory.value;
  playerScores.value = data.scores || playerScores.value;
  lastWordScores.value = data.lastWordScores || lastWordScores.value;
  playerTiles.value = data.tiles || playerTiles.value;
  rackClears.value = data.rackClears || rackClears.value;
};

export const joinGame = (code) => {
  if (!isSocketConnected.value) {
    message.value = 'Multiplayer server is offline. Please check your connection.';
    return;
  }

  const normalizedCode = (code || '').trim();
  if (!normalizedCode) {
    message.value = 'Room code required.';
    return;
  }

  isConnecting.value = true;
  socket.emit('joinGame', { roomCode: normalizedCode });
};

socket.on('gameHosted', (data) => {
  roomCode.value = data.roomCode;
  isHost.value = true;
  message.value = `Game hosted. Room code: ${data.roomCode}. Waiting for opponent...`;
  isConnecting.value = false;
  applyGameState(data);
});

socket.on('gameJoined', (data) => {
  roomCode.value = data.roomCode;
  isHost.value = false;
  message.value = 'Joined game. Waiting for start...';
  isConnecting.value = false;
  applyGameState(data);
});

socket.on('joinError', (error) => {
  message.value = error;
  isConnecting.value = false;
});

export const submitWord = ({ word, tileIds }) => {
  const normalizedWord = (word || '').trim();
  if (!gameStarted.value || !normalizedWord || !Array.isArray(tileIds) || !tileIds.length) return;
  socket.emit('submitWord', { roomCode: roomCode.value, word: normalizedWord, tileIds });
};

export const clearRack = () => {
  if (!gameStarted.value) return;
  socket.emit('clearRack', { roomCode: roomCode.value });
};

socket.on('startGame', (data) => {
  gameStarted.value = true;
  message.value = '';
  applyGameState(data);
});

socket.on('wordSubmitted', (data) => {
  applyGameState(data);
});

socket.on('rackCleared', (data) => {
  applyGameState(data);
});

socket.onStatusChange((status) => {
  connectionStatus.value = status;
  if (status !== 'connected') {
    isConnecting.value = false;
  }
});

export const resetGame = () => {
  roomCode.value = null;
  isHost.value = false;
  submittedWords.value = {
    host: '',
    opponent: ''
  };
  wordHistory.value = {
    host: [],
    opponent: []
  };
  playerScores.value = {
    host: 0,
    opponent: 0
  };
  lastWordScores.value = {
    host: 0,
    opponent: 0
  };
  playerTiles.value = {
    host: [],
    opponent: []
  };
  rackClears.value = {
    host: 2,
    opponent: 2
  };
  gameStarted.value = false;
  message.value = '';
};
