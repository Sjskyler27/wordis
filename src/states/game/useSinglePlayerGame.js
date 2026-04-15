import { onBeforeUnmount, watch } from 'vue';
import { getBotWord } from './bot.js';
import {
  createRack,
  getTilesForWord,
  getWordScoreDetails,
  refillTiles
} from './tile-logic.js';

export const useSinglePlayerGame = ({
  isMultiplayer,
  localMessage,
  selectedTilesForCurrentSide,
  clearSelectionForSide,
  playerTiles,
  playerScores,
  lastWordScores,
  rackClears,
  submittedWords,
  wordHistory
}) => {
  let botLoopId = null;

  const ensureSinglePlayerState = () => {
    if (!playerTiles.value.host.length && !playerTiles.value.opponent.length) {
      playerTiles.value = {
        host: createRack('host', playerScores.value),
        opponent: createRack('opponent', playerScores.value)
      };
      rackClears.value = {
        host: 2,
        opponent: 2
      };
    }
  };

  const submitBotWord = () => {
    ensureSinglePlayerState();

    const botTiles = playerTiles.value.opponent || [];
    const botWord = getBotWord(botTiles, [
      ...wordHistory.value.host,
      ...wordHistory.value.opponent
    ]);

    if (!botWord) {
      return;
    }

    const normalizedBotWord = botWord.toUpperCase();
    const selectedBotTiles = getTilesForWord(botTiles, normalizedBotWord);
    if (!selectedBotTiles.length) {
      return;
    }

    submittedWords.value = {
      host: submittedWords.value.host,
      opponent: normalizedBotWord
    };

    wordHistory.value = {
      host: wordHistory.value.host,
      opponent: [normalizedBotWord, ...wordHistory.value.opponent].slice(0, 5)
    };

    const botScoreDetails = getWordScoreDetails(selectedBotTiles);

    playerScores.value = {
      host: playerScores.value.host,
      opponent: playerScores.value.opponent + botScoreDetails.total
    };
    lastWordScores.value = {
      host: lastWordScores.value.host,
      opponent: botScoreDetails.total
    };

    playerTiles.value = {
      host: playerTiles.value.host,
      opponent: refillTiles(botTiles, selectedBotTiles.map((tile) => tile.id), 'opponent', playerScores.value)
    };
  };

  const scheduleBotLoop = () => {
    if (isMultiplayer.value) {
      return;
    }

    window.clearTimeout(botLoopId);
    botLoopId = window.setTimeout(() => {
      submitBotWord();
      scheduleBotLoop();
    }, 8400);
  };

  const stopBotLoop = () => {
    window.clearTimeout(botLoopId);
    botLoopId = null;
  };

  const startBotLoop = () => {
    ensureSinglePlayerState();
    scheduleBotLoop();
  };

  const submitSinglePlayerWord = (word) => {
    ensureSinglePlayerState();
    const selectedTiles = selectedTilesForCurrentSide.value;
    const scoreDetails = getWordScoreDetails(selectedTiles);

    submittedWords.value = {
      host: word,
      opponent: submittedWords.value.opponent
    };

    wordHistory.value = {
      host: [word, ...wordHistory.value.host].slice(0, 5),
      opponent: wordHistory.value.opponent
    };

    playerScores.value = {
      host: playerScores.value.host + scoreDetails.total,
      opponent: playerScores.value.opponent
    };
    lastWordScores.value = {
      host: scoreDetails.total,
      opponent: lastWordScores.value.opponent
    };

    playerTiles.value = {
      host: refillTiles(playerTiles.value.host, selectedTiles.map((tile) => tile.id), 'host', playerScores.value),
      opponent: playerTiles.value.opponent
    };

    clearSelectionForSide('host');
    localMessage.value = `Submitted ${word} for ${scoreDetails.total} pts.`;
  };

  const clearSinglePlayerRack = (side = 'host') => {
    ensureSinglePlayerState();

    if ((rackClears.value[side] || 0) <= 0) {
      localMessage.value = 'No rack clears remaining.';
      return false;
    }

    rackClears.value = {
      ...rackClears.value,
      [side]: rackClears.value[side] - 1
    };

    playerTiles.value = {
      ...playerTiles.value,
      [side]: createRack(side, playerScores.value)
    };

    clearSelectionForSide(side);
    localMessage.value = `Cleared your rack. ${rackClears.value[side]} clears left.`;
    return true;
  };

  ensureSinglePlayerState();
  scheduleBotLoop();

  watch(isMultiplayer, (nextIsMultiplayer) => {
    if (nextIsMultiplayer) {
      stopBotLoop();
      return;
    }

    startBotLoop();
  });

  onBeforeUnmount(() => {
    stopBotLoop();
  });

  return {
    ensureSinglePlayerState,
    startBotLoop,
    stopBotLoop,
    clearSinglePlayerRack,
    submitSinglePlayerWord
  };
};
