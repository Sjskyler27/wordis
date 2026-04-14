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
        <h2>{{ submittedWords.host || 'Waiting for a word...' }}</h2>
        <p class="panel-subtitle">Left side</p>
        <ul v-if="wordHistory.host.length" class="history-list">
          <li v-for="(word, index) in wordHistory.host" :key="`host-${index}-${word}`">
            {{ word }}
          </li>
        </ul>
      </section>

      <div class="arena-divider">VS</div>

      <section class="player-panel">
        <p class="panel-label">Opponent</p>
        <h2>{{ submittedWords.opponent || 'Waiting for a word...' }}</h2>
        <p class="panel-subtitle">Right side</p>
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
        placeholder="Type a word"
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
import { computed, defineProps, ref } from 'vue';
import {
  roomCode,
  isHost,
  submittedWords,
  wordHistory,
  gameStarted,
  submitWord as submitMultiplayerWord,
  resetGame as resetMultiplayer
} from './multiplayer.js';
import { getBotWord } from './bot.js';

const props = defineProps({
  isMultiplayer: Boolean,
});

const emit = defineEmits(['home']);
const wordInput = ref('');
const localMessage = ref('');

const playerRoleText = computed(() => {
  if (props.isMultiplayer) {
    return isHost.value ? 'You submit to the Host panel on the left.' : 'You submit to the Opponent panel on the right.';
  }

  return 'You submit on the Host side. The bot replies on the Opponent side.';
});

const submitSinglePlayerWord = (word) => {
  submittedWords.value = {
    host: word,
    opponent: submittedWords.value.opponent
  };

  wordHistory.value = {
    host: [word, ...wordHistory.value.host].slice(0, 5),
    opponent: wordHistory.value.opponent
  };

  localMessage.value = 'Your word was submitted.';

  window.setTimeout(() => {
    const botWord = getBotWord([
      ...wordHistory.value.host,
      ...wordHistory.value.opponent
    ]);

    submittedWords.value = {
      host: submittedWords.value.host,
      opponent: botWord
    };

    wordHistory.value = {
      host: wordHistory.value.host,
      opponent: [botWord, ...wordHistory.value.opponent].slice(0, 5)
    };

    localMessage.value = `Bot replied with "${botWord}".`;
  }, 500);
};

const handleSubmit = () => {
  const normalizedWord = wordInput.value.trim();
  if (!normalizedWord) {
    localMessage.value = 'Enter a word first.';
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
  resetMultiplayer();
  localMessage.value = '';
  wordInput.value = '';
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
    min-height: 240px;
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
  .panel-subtitle,
  .local-message,
  .player-role {
    margin: 0;
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
