<template>
  <div class="game-shell">
    <div id="background-layer"></div>

    <header class="hud">
      <div class="hud-chip">
        <span class="hud-label">Mode</span>
        <strong>{{ props.isMultiplayer ? 'Multiplayer Clash' : 'Solo Speed Run' }}</strong>
      </div>

      <div class="hud-center">
        <h1>Wordis</h1>
        <p v-if="props.isMultiplayer">
          Room {{ roomCode }} · {{ isHost ? 'Host lane' : 'Opponent lane' }}
        </p>
        <p v-else>
          Build fast words from your live rack
        </p>
      </div>

      <div class="hud-chip score-chip">
        <span class="hud-label">Rack</span>
        <strong>{{ RACK_SIZE }} tiles</strong>
      </div>
    </header>

    <main class="board-frame">
      <aside class="side-stack">
        <div class="bonus-card accent-blue">
          <span class="bonus-kicker">Tempo</span>
          <strong>{{ props.isMultiplayer ? 'Real Time Duel' : 'Bot Pressure' }}</strong>
          <p>{{ playerRoleText }}</p>
        </div>

        <div class="bonus-card accent-gold">
          <span class="bonus-kicker">Current Build</span>
          <strong>{{ wordInput || 'Type a word' }}</strong>
          <p>{{ currentWordScore }} pts potential</p>
        </div>

        <div class="bonus-card accent-red">
          <span class="bonus-kicker">Status</span>
          <strong>{{ localMessage || 'Racks are live' }}</strong>
          <p v-if="props.isMultiplayer && !gameStarted">Waiting for opponent to connect</p>
          <p v-else>Only used letters are replaced</p>
        </div>
      </aside>

      <section class="arena-shell">
        <div class="score-ribbon">
          <div class="score-box host">
            <span>Host</span>
            <strong>{{ playerScores.host }}</strong>
          </div>
          <div class="score-divider">VS</div>
          <div class="score-box opponent">
            <span>Opponent</span>
            <strong>{{ playerScores.opponent }}</strong>
          </div>
        </div>

        <div v-if="isMultiplayer ? gameStarted : true" class="arena">
          <section class="lane host-lane">
            <div class="lane-header">
              <div>
                <p class="lane-label">Host</p>
                <h2>{{ submittedWords.host || 'Waiting for a word...' }}</h2>
              </div>
              <div class="lane-score">
                <span>Points</span>
                <strong>{{ playerScores.host }}</strong>
              </div>
            </div>

            <div class="rack-grid">
              <button
                v-for="(tile, index) in playerTiles.host"
                :key="`host-tile-${index}-${tile}`"
                type="button"
                class="tile"
                :class="{ active: mySide === 'host' }"
                @click="handleTileClick(tile)"
              >
                <span class="tile-score">{{ getLetterScore(tile) }}</span>
                <span class="tile-letter">{{ tile }}</span>
              </button>
            </div>

            <ul v-if="wordHistory.host.length" class="history-list">
              <li v-for="(word, index) in wordHistory.host" :key="`host-${index}-${word}`">
                <span>{{ word }}</span>
                <strong>{{ getWordScore(word) }}</strong>
              </li>
            </ul>
          </section>

          <section class="lane opponent-lane">
            <div class="lane-header">
              <div>
                <p class="lane-label">Opponent</p>
                <h2>{{ submittedWords.opponent || 'Waiting for a word...' }}</h2>
              </div>
              <div class="lane-score">
                <span>Points</span>
                <strong>{{ playerScores.opponent }}</strong>
              </div>
            </div>

            <div class="rack-grid">
              <button
                v-for="(tile, index) in playerTiles.opponent"
                :key="`opponent-tile-${index}-${tile}`"
                type="button"
                class="tile opponent"
                :class="{ active: mySide === 'opponent' }"
                @click="handleTileClick(tile)"
              >
                <span class="tile-score">{{ getLetterScore(tile) }}</span>
                <span class="tile-letter">{{ tile }}</span>
              </button>
            </div>

            <ul v-if="wordHistory.opponent.length" class="history-list">
              <li v-for="(word, index) in wordHistory.opponent" :key="`opponent-${index}-${word}`">
                <span>{{ word }}</span>
                <strong>{{ getWordScore(word) }}</strong>
              </li>
            </ul>
          </section>
        </div>

        <div v-else class="waiting-card">
          <strong>Waiting for opponent...</strong>
          <p>The arena will light up as soon as both players are in.</p>
        </div>

        <form v-if="isMultiplayer ? gameStarted : true" class="word-console" @submit.prevent="handleSubmit">
          <div class="word-input-shell">
            <span class="console-label">Build</span>
            <input
              v-model="wordInput"
              type="text"
              maxlength="24"
              placeholder="Type a word from your tiles"
              autocomplete="off"
            />
            <span class="console-score">{{ currentWordScore }} pts</span>
          </div>

          <div class="console-actions">
            <button type="button" class="ghost-button" @click="removeLastLetter">
              Undo
            </button>
            <button type="button" class="ghost-button" @click="clearWord">
              Clear
            </button>
            <button type="submit" class="submit-button">
              Drop Word
            </button>
          </div>
        </form>
      </section>
    </main>

    <footer class="bottom-bar">
      <p>{{ props.isMultiplayer ? 'Shared server scoring is live' : 'Singleplayer scoring mirrors multiplayer rules' }}</p>
      <button class="back-button" @click="resetAndGoHome">Back to Home</button>
    </footer>
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

const getLetterScore = (letter) => letterConfig[letter]?.score || 0;

const getWordScore = (word) => word
  .split('')
  .reduce((total, letter) => total + getLetterScore(letter), 0);

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
const currentWordScore = computed(() => getWordScore(wordInput.value.trim().toUpperCase()));

const playerRoleText = computed(() => {
  if (props.isMultiplayer) {
    return isHost.value
      ? 'Build from the host rack and score before the other lane catches up.'
      : 'Build from the opponent rack and race the board in real time.';
  }

  return 'You and the bot are both constantly feeding the board with fresh tiles.';
});

const handleTileClick = (tile) => {
  wordInput.value = `${wordInput.value}${tile}`;
};

const removeLastLetter = () => {
  wordInput.value = wordInput.value.slice(0, -1);
};

const clearWord = () => {
  wordInput.value = '';
};

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

  localMessage.value = `Submitted ${word} for ${getWordScore(word)} pts.`;
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
    localMessage.value = `Sent ${normalizedWord} for ${getWordScore(normalizedWord)} pts.`;
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
  body {
    background: #2a0719;
  }

  .game-shell {
    --bg-top: #b54f21;
    --bg-mid: #d0522e;
    --bg-bottom: #4c0f33;
    --panel: rgba(94, 28, 43, 0.72);
    --panel-deep: rgba(73, 18, 34, 0.9);
    --cream: #f7efe1;
    --ink: #1c1930;
    --gold: #ffca67;
    --orange: #ff7f3c;
    --teal: #4bc7b0;
    --red: #ff596f;
    min-height: 100vh;
    position: relative;
    overflow: hidden;
    color: var(--cream);
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  #background-layer {
    position: absolute;
    inset: 0;
    z-index: -2;
    background:
      radial-gradient(circle at 20% 20%, rgba(255, 198, 109, 0.14) 0, rgba(255, 198, 109, 0.14) 14px, transparent 15px) 0 0 / 120px 120px,
      radial-gradient(circle at 80% 12%, rgba(255, 255, 255, 0.06) 0, rgba(255, 255, 255, 0.06) 8px, transparent 9px) 0 0 / 80px 80px,
      linear-gradient(180deg, var(--bg-top) 0%, var(--bg-mid) 42%, var(--bg-bottom) 100%);
  }

  .game-shell::before {
    content: '';
    position: absolute;
    inset: 72px 24px 24px;
    z-index: -1;
    border-radius: 30px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.01));
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16);
  }

  .hud {
    display: grid;
    grid-template-columns: 220px 1fr 220px;
    gap: 16px;
    align-items: center;
  }

  .hud-center {
    text-align: center;
  }

  .hud-center h1 {
    margin: 0;
    font-size: clamp(2.3rem, 5vw, 4.2rem);
    line-height: 0.92;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    text-shadow: 0 5px 18px rgba(55, 8, 23, 0.35);
  }

  .hud-center p {
    margin: 8px 0 0;
    opacity: 0.88;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-size: 0.82rem;
  }

  .hud-chip {
    min-height: 84px;
    padding: 18px 20px;
    border-radius: 22px;
    background: rgba(95, 29, 44, 0.78);
    border: 2px solid rgba(255, 255, 255, 0.14);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 6px;
  }

  .hud-chip strong {
    font-size: 1.2rem;
  }

  .hud-label {
    font-size: 0.76rem;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    opacity: 0.7;
  }

  .score-chip {
    text-align: right;
  }

  .board-frame {
    display: grid;
    grid-template-columns: 250px minmax(0, 1fr);
    gap: 22px;
    flex: 1;
    min-height: 0;
  }

  .side-stack {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .bonus-card {
    border-radius: 28px;
    padding: 22px 18px;
    min-height: 156px;
    background: rgba(68, 20, 46, 0.9);
    border: 2px solid rgba(255, 255, 255, 0.12);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
    position: relative;
    overflow: hidden;
  }

  .bonus-card::after {
    content: '';
    position: absolute;
    inset: auto -30px -30px auto;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
  }

  .bonus-kicker {
    display: inline-block;
    margin-bottom: 10px;
    font-size: 0.74rem;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    opacity: 0.7;
  }

  .bonus-card strong,
  .bonus-card p {
    display: block;
    position: relative;
    z-index: 1;
  }

  .bonus-card strong {
    font-size: 1.35rem;
    line-height: 1.1;
  }

  .bonus-card p {
    margin: 10px 0 0;
    opacity: 0.85;
  }

  .accent-blue {
    background: linear-gradient(180deg, rgba(58, 111, 208, 0.9), rgba(49, 78, 170, 0.82));
  }

  .accent-gold {
    background: linear-gradient(180deg, rgba(231, 124, 47, 0.92), rgba(179, 82, 28, 0.88));
  }

  .accent-red {
    background: linear-gradient(180deg, rgba(164, 38, 68, 0.95), rgba(105, 22, 54, 0.88));
  }

  .arena-shell {
    min-width: 0;
    border-radius: 34px;
    background: rgba(90, 23, 35, 0.72);
    border: 2px solid rgba(255, 255, 255, 0.12);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.12),
      0 20px 50px rgba(38, 7, 22, 0.28);
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .score-ribbon {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 16px;
    align-items: center;
  }

  .score-box {
    border-radius: 22px;
    padding: 16px 20px;
    background: var(--panel-deep);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .score-box span {
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-size: 0.76rem;
    opacity: 0.75;
  }

  .score-box strong {
    font-size: 2rem;
    line-height: 1;
  }

  .score-box.host strong {
    color: var(--gold);
  }

  .score-box.opponent strong {
    color: var(--teal);
  }

  .score-divider {
    font-size: 1rem;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    opacity: 0.8;
  }

  .arena {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
  }

  .lane {
    border-radius: 28px;
    padding: 20px;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02)),
      rgba(72, 17, 38, 0.75);
    border: 2px solid rgba(255, 255, 255, 0.08);
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .lane-header {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
  }

  .lane-label {
    margin: 0 0 6px;
    font-size: 0.76rem;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    opacity: 0.72;
  }

  .lane-header h2 {
    margin: 0;
    font-size: clamp(1.45rem, 2.8vw, 2.4rem);
    line-height: 1;
    word-break: break-word;
  }

  .lane-score {
    min-width: 92px;
    padding: 10px 12px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.06);
    text-align: right;
  }

  .lane-score span {
    display: block;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    opacity: 0.68;
  }

  .lane-score strong {
    display: block;
    font-size: 1.4rem;
    margin-top: 4px;
  }

  .rack-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(62px, 1fr));
    gap: 10px;
  }

  .tile {
    appearance: none;
    border: none;
    cursor: pointer;
    min-height: 74px;
    width: 100%;
    border-radius: 16px;
    background:
      linear-gradient(180deg, #fffef8 0%, #f2ebe0 70%, #d9cec0 100%);
    color: var(--ink);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow:
      inset 0 -4px 0 rgba(0, 0, 0, 0.12),
      0 10px 18px rgba(45, 10, 24, 0.16);
    transition: transform 140ms ease, box-shadow 140ms ease;
    padding: 0;
  }

  .tile:hover {
    transform: translateY(-2px);
    box-shadow:
      inset 0 -4px 0 rgba(0, 0, 0, 0.12),
      0 14px 20px rgba(45, 10, 24, 0.24);
  }

  .tile.active {
    outline: 3px solid rgba(255, 202, 103, 0.55);
  }

  .tile.opponent.active {
    outline-color: rgba(75, 199, 176, 0.5);
  }

  .tile-letter {
    font-size: 2.4rem;
    font-weight: 900;
    line-height: 1;
  }

  .tile-score {
    position: absolute;
    top: 8px;
    right: 10px;
    font-size: 0.95rem;
    font-weight: 800;
  }

  .history-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .history-list li {
    padding: 12px 14px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.06);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .history-list strong {
    color: var(--gold);
  }

  .waiting-card {
    border-radius: 26px;
    background: rgba(255, 255, 255, 0.06);
    padding: 34px 24px;
    text-align: center;
  }

  .waiting-card strong {
    display: block;
    font-size: 1.4rem;
  }

  .waiting-card p {
    margin: 10px 0 0;
    opacity: 0.78;
  }

  .word-console {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-radius: 24px;
    background: rgba(48, 12, 28, 0.8);
  }

  .word-input-shell {
    min-width: 0;
    flex: 1;
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 12px;
    align-items: center;
    padding: 10px 14px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.08);
  }

  .console-label,
  .console-score {
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-size: 0.78rem;
    opacity: 0.82;
  }

  .word-input-shell input {
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    color: var(--cream);
    font-size: 1.15rem;
    font-weight: 700;
  }

  .console-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .ghost-button,
  .submit-button,
  .back-button {
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    padding: 12px 18px;
    font-size: 0.95rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    font-family: "Press Start 2P", cursive;
  }

  .ghost-button {
    background: rgba(255, 255, 255, 0.08);
    color: var(--cream);
  }

  .submit-button {
    background: linear-gradient(180deg, #2cbf9d 0%, #1d987e 100%);
    color: #effff9;
    min-width: 130px;
  }

  .bottom-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    padding: 0 8px;
  }

  .bottom-bar p {
    margin: 0;
    opacity: 0.78;
  }

  .back-button {
    background: linear-gradient(180deg, #ff965b 0%, #e05e2a 100%);
    color: white;
  }

  @media (max-width: 1180px) {
    .board-frame {
      grid-template-columns: 1fr;
    }

    .side-stack {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 920px) {
    .hud {
      grid-template-columns: 1fr;
    }

    .score-chip {
      text-align: left;
    }

    .arena {
      grid-template-columns: 1fr;
    }

    .score-ribbon {
      grid-template-columns: 1fr;
    }

    .score-divider {
      text-align: center;
    }

    .bottom-bar {
      flex-direction: column;
      align-items: stretch;
    }
  }

  @media (max-width: 720px) {
    .game-shell {
      padding: 16px;
    }

    .side-stack {
      grid-template-columns: 1fr;
    }

    .word-console {
      flex-direction: column;
      align-items: stretch;
    }

    .word-input-shell {
      grid-template-columns: 1fr;
    }

    .console-actions {
      width: 100%;
      justify-content: stretch;
    }

    .console-actions button {
      flex: 1;
    }
  }
</style>
