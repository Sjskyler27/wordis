import { onBeforeUnmount, watch } from 'vue';
import { getBotWord } from './bot.js';
import {
  createOpeningRackPair,
  createRack,
  drawCards,
  getTilesForWord,
  getResourceGrants,
  replaceTileWithModifier,
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
  playerCards,
  submittedWords,
  wordHistory
}) => {
  let botLoopId = null;

  const ensureSinglePlayerState = () => {
    if (!playerTiles.value.host.length && !playerTiles.value.opponent.length) {
      playerTiles.value = createOpeningRackPair(playerScores.value);
      rackClears.value = {
        host: 2,
        opponent: 2
      };
      playerCards.value = {
        host: {
          boons: drawCards('boon', 1),
          attacks: drawCards('attack', 1)
        },
        opponent: {
          boons: drawCards('boon', 1),
          attacks: drawCards('attack', 1)
        }
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
      if ((rackClears.value.opponent || 0) <= 0) {
        return;
      }

      rackClears.value = {
        ...rackClears.value,
        opponent: rackClears.value.opponent - 1
      };

      playerTiles.value = {
        ...playerTiles.value,
        opponent: createRack('opponent', playerScores.value, {
          mode: 'clear',
          currentTiles: botTiles
        })
      };

      return;
    }

    const normalizedBotWord = botWord.toUpperCase();
    const selectedBotTiles = getTilesForWord(botTiles, normalizedBotWord);
    if (!selectedBotTiles.length) {
      return;
    }

    const botScoreDetails = getWordScoreDetails(selectedBotTiles);
    const grantedResources = getResourceGrants(selectedBotTiles);

    submittedWords.value = {
      host: submittedWords.value.host,
      opponent: normalizedBotWord
    };

    wordHistory.value = {
      host: wordHistory.value.host,
      opponent: [{ word: normalizedBotWord, score: botScoreDetails.total }, ...wordHistory.value.opponent]
    };

    playerScores.value = {
      host: playerScores.value.host,
      opponent: playerScores.value.opponent + botScoreDetails.total
    };
    lastWordScores.value = {
      host: lastWordScores.value.host,
      opponent: botScoreDetails.total
    };
    playerCards.value = {
      host: playerCards.value.host,
      opponent: {
        boons: [
          ...playerCards.value.opponent.boons,
          ...drawCards('boon', grantedResources.boons)
        ],
        attacks: [
          ...playerCards.value.opponent.attacks,
          ...drawCards('attack', grantedResources.attacks)
        ]
      }
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
    }, 9000);
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
    const grantedResources = getResourceGrants(selectedTiles);

    submittedWords.value = {
      host: word,
      opponent: submittedWords.value.opponent
    };

    wordHistory.value = {
      host: [{ word, score: scoreDetails.total }, ...wordHistory.value.host],
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
    playerCards.value = {
      host: {
        boons: [
          ...playerCards.value.host.boons,
          ...drawCards('boon', grantedResources.boons)
        ],
        attacks: [
          ...playerCards.value.host.attacks,
          ...drawCards('attack', grantedResources.attacks)
        ]
      },
      opponent: playerCards.value.opponent
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
      [side]: createRack(side, playerScores.value, {
        mode: 'clear',
        currentTiles: playerTiles.value[side]
      })
    };

    clearSelectionForSide(side);
    localMessage.value = `Cleared your rack. ${rackClears.value[side]} clears left.`;
    return true;
  };

  const useSinglePlayerBoon = (side, cardId, tileId) => {
    const hand = playerCards.value[side]?.boons || [];
    const card = hand.find((entry) => entry.id === cardId);
    if (!card) {
      localMessage.value = 'That boon is no longer available.';
      return false;
    }

    const tile = playerTiles.value[side]?.find((entry) => entry.id === tileId);
    if (!tile || tile.locked) {
      localMessage.value = 'That tile cannot take a boon.';
      return false;
    }

    playerCards.value = {
      ...playerCards.value,
      [side]: {
        ...playerCards.value[side],
        boons: hand.filter((entry) => entry.id !== cardId)
      }
    };

    if (card.effectType === 'delete_tile') {
      const nextTiles = refillTiles(playerTiles.value[side], [tileId], side, playerScores.value);
      const replacementTile = nextTiles.find((entry) => entry.id !== tileId && !playerTiles.value[side].some((tile) => tile.id === entry.id));
      playerTiles.value = {
        ...playerTiles.value,
        [side]: nextTiles
      };
      return {
        success: true,
        replacementTileId: replacementTile?.id || null
      };
    }

    playerTiles.value = {
      ...playerTiles.value,
      [side]: replaceTileWithModifier(playerTiles.value[side], tileId, card.modifier)
    };

    return { success: true };
  };

  const useSinglePlayerAttack = (side, cardId) => {
    const opponentSide = side === 'host' ? 'opponent' : 'host';
    const hand = playerCards.value[side]?.attacks || [];
    const card = hand.find((entry) => entry.id === cardId);
    if (!card) {
      localMessage.value = 'That attack is no longer available.';
      return false;
    }

    if (card.modifier === 'mustuse' && playerTiles.value[opponentSide].some((tile) => tile.status === 'mustuse')) {
      localMessage.value = 'That board already has a MUST tile.';
      return false;
    }

    const targetTiles = playerTiles.value[opponentSide].filter((tile) => !tile.locked);
    if (!targetTiles.length) {
      localMessage.value = 'No target tiles available.';
      return false;
    }

    const targetTile = targetTiles[Math.floor(Math.random() * targetTiles.length)];

    playerCards.value = {
      ...playerCards.value,
      [side]: {
        ...playerCards.value[side],
        attacks: hand.filter((entry) => entry.id !== cardId)
      }
    };

    playerTiles.value = {
      ...playerTiles.value,
      [opponentSide]: replaceTileWithModifier(playerTiles.value[opponentSide], targetTile.id, card.modifier)
    };

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
    useSinglePlayerBoon,
    useSinglePlayerAttack,
    submitSinglePlayerWord
  };
};
