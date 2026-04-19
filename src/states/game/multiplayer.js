import { ref, computed } from 'vue';
import socket from '../../websocket.js';
import { getPreferredLanguageCode } from './language.js';

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
export const playAgainVotes = ref({
  host: false,
  opponent: false
});
export const playerTiles = ref({
  host: [],
  opponent: []
});
export const rackClears = ref({
  host: 2,
  opponent: 2
});
export const playerCards = ref({
  host: { boons: [], attacks: [] },
  opponent: { boons: [], attacks: [] }
});
export const isPrivateRoom = ref(true);
export const availableLobbies = ref([]);
export const gameStarted = ref(false);
export const message = ref('');
export const isConnecting = ref(false);
export const connectionStatus = ref('connecting');
export const isSocketConnected = computed(() => connectionStatus.value === 'connected');
export const multiplayerOvertimeEnabled = ref(true);
export const multiplayerOvertimePendingSide = ref(null);
export const multiplayerOvertimeFinalWordSubmitted = ref(false);

export const hostGame = ({ isPrivate = true, overtimeEnabled = true } = {}) => {
  if (!isSocketConnected.value) {
    message.value = 'Multiplayer server is offline. Please check your connection.';
    return;
  }

  isConnecting.value = true;
  socket.emit('hostGame', { isPrivate, overtimeEnabled });
};

const applyGameState = (data = {}) => {
  submittedWords.value = data.words || submittedWords.value;
  wordHistory.value = data.history || wordHistory.value;
  playerScores.value = data.scores || playerScores.value;
  lastWordScores.value = data.lastWordScores || lastWordScores.value;
  playAgainVotes.value = data.playAgainVotes || playAgainVotes.value;
  playerTiles.value = data.tiles || playerTiles.value;
  rackClears.value = data.rackClears || rackClears.value;
  playerCards.value = data.cards || playerCards.value;
  isPrivateRoom.value = data.isPrivate ?? isPrivateRoom.value;
  multiplayerOvertimeEnabled.value = data.overtimeEnabled ?? multiplayerOvertimeEnabled.value;
  multiplayerOvertimePendingSide.value = data.overtimePendingSide ?? null;
  multiplayerOvertimeFinalWordSubmitted.value = Boolean(data.overtimeFinalWordSubmitted);
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

export const requestLobbyList = () => {
  socket.emit('listLobbies');
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

socket.on('lobbyList', (data) => {
  availableLobbies.value = data?.lobbies || [];
});

export const submitWord = ({ word, tileIds }) => {
  const normalizedWord = (word || '').trim();
  if (!gameStarted.value || !normalizedWord || !Array.isArray(tileIds) || !tileIds.length) return;
  socket.emit('submitWord', {
    roomCode: roomCode.value,
    word: normalizedWord,
    tileIds,
    languageCode: getPreferredLanguageCode()
  });
};

export const clearRack = () => {
  if (!gameStarted.value) return;
  socket.emit('clearRack', { roomCode: roomCode.value });
};

export const playAgain = () => {
  if (!roomCode.value) return;
  socket.emit('playAgain', { roomCode: roomCode.value });
};

export const useBoon = ({ cardId, tileId }) => {
  if (!gameStarted.value) return;
  socket.emit('useBoon', { roomCode: roomCode.value, cardId, tileId });
};

export const useAttack = ({ cardId }) => {
  if (!gameStarted.value) return;
  socket.emit('useAttack', { roomCode: roomCode.value, cardId });
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

socket.on('boonUsed', (data) => {
  applyGameState(data);
});

socket.on('attackUsed', (data) => {
  applyGameState(data);
});

socket.on('gameRestarted', (data) => {
  gameStarted.value = true;
  message.value = '';
  applyGameState(data);
});

socket.on('playAgainUpdated', (data) => {
  applyGameState(data);
});

socket.onStatusChange((status) => {
  connectionStatus.value = status;
  if (status !== 'connected') {
    isConnecting.value = false;
    if (status === 'disconnected' || status === 'error') {
      availableLobbies.value = [];
    }
    return;
  }

  requestLobbyList();
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
  playAgainVotes.value = {
    host: false,
    opponent: false
  };
  playerTiles.value = {
    host: [],
    opponent: []
  };
  rackClears.value = {
    host: 2,
    opponent: 2
  };
  playerCards.value = {
    host: { boons: [], attacks: [] },
    opponent: { boons: [], attacks: [] }
  };
  isPrivateRoom.value = true;
  availableLobbies.value = [];
  gameStarted.value = false;
  message.value = '';
  multiplayerOvertimeEnabled.value = true;
  multiplayerOvertimePendingSide.value = null;
  multiplayerOvertimeFinalWordSubmitted.value = false;
};
