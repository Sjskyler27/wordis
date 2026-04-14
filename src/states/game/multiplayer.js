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
});

socket.on('gameJoined', (data) => {
  roomCode.value = data.roomCode;
  isHost.value = false;
  message.value = 'Joined game. Waiting for start...';
  isConnecting.value = false;
});

socket.on('joinError', (error) => {
  message.value = error;
  isConnecting.value = false;
});

export const submitWord = (word) => {
  const normalizedWord = (word || '').trim();
  if (!gameStarted.value || !normalizedWord) return;
  socket.emit('submitWord', { roomCode: roomCode.value, word: normalizedWord });
};

socket.on('startGame', () => {
  gameStarted.value = true;
  message.value = '';
});

socket.on('wordSubmitted', (data) => {
  submittedWords.value = data.words;
  wordHistory.value = data.history;
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
  gameStarted.value = false;
  message.value = '';
};
