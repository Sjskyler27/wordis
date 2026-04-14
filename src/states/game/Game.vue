<template>
  <div id="background-layer"></div>
  <div class="game-container">
    <h1>Word Game</h1>
    <div v-if="isMultiplayer">
      <p>Room: {{ roomCode }} | {{ isHost ? 'You are Host' : 'You are Opponent' }}</p>
      <div v-if="!gameStarted" class="waiting">
        Waiting for opponent...
      </div>
    </div>
    <div v-else>
      <p>Playing vs Bot</p>
    </div>

    <div v-if="isMultiplayer ? gameStarted : true" class="arena">
      <section class="player-panel">
        <p class="panel-label">Host</p>
        <p class="panel-score">{{ playerScores.host }} pts</p>
        <h2>{{ submittedWords.host || 'Waiting for a word...' }}</h2>
        <p class="panel-subtitle">Left side</p>
        <div class="tile-row">
          <span v-for="(tile, index) in playerTiles.host" :key="`host-tile-${index}-${tile}`" class="tile">
            {{ tile }}
          </span>
        </div>
        <ul v-if="wordHistory.host.length" class="history-list">
          <li v-for="(word, index) in wordHistory.host" :key="`host-${index}-${word}`">
            {{ word }}
          </li>
        </ul>
      </section>

      <div class="arena-divider">VS</div>

      <section class="player-panel">
        <p class="panel-label">Opponent</p>
        <p class="panel-score">{{ playerScores.opponent }} pts</p>
        <h2>{{ submittedWords.opponent || 'Waiting for a word...' }}</h2>
        <p class="panel-subtitle">Right side</p>
        <div class="tile-row">
          <span v-for="(tile, index) in playerTiles.opponent" :key="`opponent-tile-${index}-${tile}`" class="tile">
            {{ tile }}
          </span>
        </div>
        <ul v-if="wordHistory.opponent.length" class="history-list">
          <li v-for="(word, index) in wordHistory.opponent" :key="`opponent-${index}-${word}`">
            {{ word }}
          </li>
        </ul>
      </section>
    </div>

    <form v-if="isMultiplayer ? gameStarted : true" class="word-form" @submit.prevent="handleSubmit">
      <input
        v-model="wordInput"
        type="text"
        maxlength="24"
        placeholder="Type a word from your tiles"
        autocomplete="off"
      />
      <button type="submit">Submit Word</button>
    </form>

    <p v-if="localMessage" class="local-message">
      {{ localMessage }}
    </p>

    <p v-if="isMultiplayer ? gameStarted : true" class="player-role">
      {{ playerRoleText }}
    </p>

    <button @click="resetAndGoHome">Back to Home</button>
  </div>
</template>

<script setup>
import { computed, defineProps, onBeforeUnmount, ref, watch } from 'vue';
import {
  roomCode,
  isHost,
  submittedWords,
  wordHistory,
  playerScores,
  playerTiles,
  gameStarted,
  submitWord as submitMultiplayerWord,
  resetGame as resetMultiplayer
} from './multiplayer.js';
import { getBotWord } from './bot.js';
import letterConfig from './letters.json';

const props = defineProps({
  isMultiplayer: Boolean,
});

const emit = defineEmits(['home']);
const wordInput = ref('');
const localMessage = ref('');
const LETTER_POOL = Object.entries(letterConfig).flatMap(([letter, config]) =>
  Array.from({ length: config.count }, () => letter)
);
const RACK_SIZE = 22;
let botLoopId = null;

const drawLetter = () => LETTER_POOL[Math.floor(Math.random() * LETTER_POOL.length)];

const createRack = () => Array.from({ length: RACK_SIZE }, drawLetter);

const getWordScore = (word) => word
  .split('')
  .reduce((total, letter) => total + (letterConfig[letter]?.score || 0), 0);

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

const refillTiles = (tiles, usedLetters) => {
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

const ensureSinglePlayerState = () => {
  if (!playerTiles.value.host.length && !playerTiles.value.opponent.length) {
    playerTiles.value = {
      host: createRack(),
      opponent: createRack()
    };
  }
};

ensureSinglePlayerState();

const mySide = computed(() => {
  if (props.isMultiplayer) {
    return isHost.value ? 'host' : 'opponent';
  }

  return 'host';
});

const myTiles = computed(() => playerTiles.value[mySide.value] || []);

const playerRoleText = computed(() => {
  if (props.isMultiplayer) {
    return isHost.value
      ? 'Real time play: build words from the Host tiles on the left.'
      : 'Real time play: build words from the Opponent tiles on the right.';
  }

  return 'Real time play: you and the bot both keep submitting from your own tile racks.';
});

const submitBotWord = () => {
  ensureSinglePlayerState();

  const botWord = getBotWord(playerTiles.value.opponent, [
    ...wordHistory.value.host,
    ...wordHistory.value.opponent
  ]);

  if (!botWord) {
    return;
  }

  const normalizedBotWord = botWord.toUpperCase();

  submittedWords.value = {
    host: submittedWords.value.host,
    opponent: normalizedBotWord
  };

  wordHistory.value = {
    host: wordHistory.value.host,
    opponent: [normalizedBotWord, ...wordHistory.value.opponent].slice(0, 5)
  };

  playerScores.value = {
    host: playerScores.value.host,
    opponent: playerScores.value.opponent + getWordScore(normalizedBotWord)
  };

  playerTiles.value = {
    host: playerTiles.value.host,
    opponent: refillTiles(playerTiles.value.opponent, normalizedBotWord.split(''))
  };
};

const scheduleBotLoop = () => {
  if (props.isMultiplayer) return;
  window.clearTimeout(botLoopId);

  botLoopId = window.setTimeout(() => {
    submitBotWord();
    scheduleBotLoop();
  }, 4400);
};
scheduleBotLoop();


const stopBotLoop = () => {
  window.clearTimeout(botLoopId);
  botLoopId = null;
};

const submitSinglePlayerWord = (word) => {
  ensureSinglePlayerState();

  submittedWords.value = {
    host: word,
    opponent: submittedWords.value.opponent
  };

  wordHistory.value = {
    host: [word, ...wordHistory.value.host].slice(0, 5),
    opponent: wordHistory.value.opponent
  };

  playerScores.value = {
    host: playerScores.value.host + getWordScore(word),
    opponent: playerScores.value.opponent
  };

  playerTiles.value = {
    host: refillTiles(playerTiles.value.host, word.split('')),
    opponent: playerTiles.value.opponent
  };

  localMessage.value = 'Your word was submitted.';
};

const handleSubmit = () => {
  const normalizedWord = wordInput.value.trim().toUpperCase();
  if (!normalizedWord) {
    localMessage.value = 'Enter a word first.';
    return;
  }

  if (!/^[A-Z]+$/.test(normalizedWord)) {
    localMessage.value = 'Use letters only.';
    return;
  }

  if (!canBuildWordFromTiles(normalizedWord, myTiles.value)) {
    localMessage.value = 'That word cannot be made from your current tiles.';
    return;
  }

  if (props.isMultiplayer) {
    submitMultiplayerWord(normalizedWord);
    localMessage.value = 'Word sent to the room.';
  } else {
    submitSinglePlayerWord(normalizedWord);
  }

  wordInput.value = '';
};

const resetAndGoHome = () => {
  stopBotLoop();
  resetMultiplayer();
  localMessage.value = '';
  wordInput.value = '';
  emit('home');
};

watch(() => props.isMultiplayer, (isMultiplayer) => {
  if (isMultiplayer) {
    stopBotLoop();
    return;
  }

  ensureSinglePlayerState();
  scheduleBotLoop();
});

onBeforeUnmount(() => {
  stopBotLoop();
});
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
    min-height: 100vh;
    padding: 32px 20px;
    color: white;
    text-align: center;
  }

  .waiting {
    font-size: 18px;
    margin: 20px 0;
  }

  .arena {
    display: grid;
    grid-template-columns: minmax(0, 280px) auto minmax(0, 280px);
    gap: 20px;
    align-items: center;
    margin: 24px 0;
    width: min(100%, 900px);
  }

  .player-panel {
    min-height: 280px;
    padding: 24px;
    border: 2px solid rgba(255, 255, 255, 0.5);
    background: rgba(10, 10, 10, 0.45);
    border-radius: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .player-panel h2 {
    margin: 0;
    font-size: clamp(1.8rem, 4vw, 2.6rem);
    word-break: break-word;
  }

  .panel-label,
  .panel-score,
  .panel-subtitle,
  .local-message,
  .player-role {
    margin: 0;
  }

  .panel-score {
    font-weight: 700;
    color: #f1deb0;
  }

  .panel-label {
    font-size: 0.9rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    opacity: 0.8;
  }

  .panel-subtitle {
    opacity: 0.7;
  }

  .arena-divider {
    font-size: 1.6rem;
    font-weight: 700;
    letter-spacing: 0.2em;
  }

  .tile-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    margin-top: 4px;
  }

  .tile {
    min-width: 42px;
    padding: 10px 0;
    border-radius: 10px;
    background: linear-gradient(180deg, #f1deb0 0%, #d8b772 100%);
    color: #29190a;
    font-weight: 800;
    box-shadow: inset 0 -3px 0 rgba(0, 0, 0, 0.18);
  }

  .history-list {
    list-style: none;
    padding: 0;
    margin: 12px 0 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .history-list li {
    padding: 10px 12px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.08);
  }

  .word-form {
    display: flex;
    gap: 12px;
    width: min(100%, 520px);
    margin-bottom: 14px;
  }

  .word-form input {
    flex: 1;
    padding: 12px 14px;
    font-size: 1rem;
    border-radius: 12px;
    border: none;
  }

  button {
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
    margin-top: 20px;
  }

  .word-form button {
    margin-top: 0;
  }

  @media (max-width: 800px) {
    .arena {
      grid-template-columns: 1fr;
    }

    .arena-divider {
      display: none;
    }

    .word-form {
      flex-direction: column;
    }
  }
</style>
