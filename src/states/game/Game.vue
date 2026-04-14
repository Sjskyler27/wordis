<template>
  <div id="background-layer"></div>
  <div class="game-container">
    <h1>Tic-Tac-Toe</h1>
    <div v-if="isMultiplayer">
      <p>Room: {{ roomCode }} | {{ isHost ? 'Host (X)' : 'Player (O)' }}</p>
      <div v-if="!gameStarted" class="waiting">
        Waiting for opponent...
      </div>
    </div>
    <div v-else>
      <p>Playing vs Bot (You are X, Bot is O)</p>
    </div>

    <div v-if="isMultiplayer ? gameStarted : true" class="board">
      <div v-for="(cell, index) in board" :key="index" class="cell" @click="handleMove(index)">
        {{ cell }}
      </div>
    </div>

    <p v-if="winner">Winner: {{ winner }}</p>
    <p v-else-if="isBoardFull">Draw!</p>
    <p v-else>Turn: {{ currentPlayer }}</p>

    <button @click="resetAndGoHome">Back to Home</button>
  </div>
</template>

<script setup>
import { defineProps, ref, computed, onMounted } from 'vue';
import { 
  roomCode, 
  isHost, 
  board, 
  currentPlayer, 
  winner, 
  gameStarted, 
  makeMove as multiplayerMakeMove,
  resetGame as resetMultiplayer
} from './multiplayer.js';
import { getBotMove } from './bot.js';

  const props = defineProps({
   isMultiplayer:Boolean,
  });

const emit = defineEmits(['home']);
const isSingleplayer = computed(() => !props.isMultiplayer);
const isBoardFull = computed(() => board.value.every(cell => cell !== ''));


const handleMove = (index) => {
  if (board.value[index] || winner.value) return;

  if (props.isMultiplayer) {
    multiplayerMakeMove(index);
  } else {
    // Singleplayer mode
    if (currentPlayer.value !== 'X') return;
    
    board.value[index] = 'X';
    if (checkWinner(board.value) || isBoardFull.value) {
      // Game over
      return;
    }
    currentPlayer.value = 'O';

    // Bot move
    setTimeout(() => {
      const botIndex = getBotMove(board.value);
      if (botIndex !== -1) {
        board.value[botIndex] = 'O';
        winner.value = checkWinner(board.value);
        if (!winner.value && !isBoardFull.value) {
          currentPlayer.value = 'X';
        }
      }
    }, 500);
  }
};

const checkWinner = (boardState) => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  for (let line of lines) {
    if (boardState[line[0]] && boardState[line[0]] === boardState[line[1]] && boardState[line[0]] === boardState[line[2]]) {
      return boardState[line[0]];
    }
  }
  return null;
};

const resetAndGoHome = () => {
  if (props.isMultiplayer) {
    resetMultiplayer();
  } else {
    board.value = Array(9).fill('');
    currentPlayer.value = 'X';
    winner.value = null;
  }
  emit('home');
};
</script>

<style scoped>
  #background-layer {
    position: absolute;
    inset: 0;
    z-index: -1;
    background-image: url('/src/assets/images/homeScreen.png');
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
    pointer-events: none;
  }

  .game-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    color: white;
  }

  .waiting {
    font-size: 18px;
    margin: 20px 0;
  }

  .board {
    display: grid;
    grid-template-columns: repeat(3, 100px);
    grid-template-rows: repeat(3, 100px);
    gap: 5px;
    margin: 20px 0;
  }

  .cell {
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid white;
    font-size: 2rem;
    cursor: pointer;
  }

  .cell:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  button {
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
    margin-top: 20px;
  }
</style>