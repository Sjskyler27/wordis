import { onBeforeUnmount, watch } from 'vue';
import { getBotWord } from './bot.js';
import {
  CARD_DEFINITIONS,
  MIN_WORD_LENGTH,
  createCards,
  createOpeningRackPair,
  createTestingOpeningRackPair,
  createRack,
  drawCards,
  getTilesForWord,
  getResourceGrants,
  replaceTileWithModifier,
  replaceSingleTile,
  getWordScoreDetails,
  refillTiles,
  rerollRackExceptTile
} from './tile-logic.js';
import { isTestingMode } from './testing.js';

export const useSinglePlayerGame = ({
  isMultiplayer,
  botEnabled,
  isTimedSoloMode,
  botDifficulty,
  localMessage,
  selectedTilesForCurrentSide,
  clearSelectionForSide,
  playerTiles,
  playerScores,
  lastWordScores,
  rackClears,
  playerCards,
  submittedWords,
  wordHistory,
  onTimedSoloPauseTime,
  onTimedSoloGainTime
}) => {
  let botLoopId = null;
  const WINNING_SCORE = isTestingMode ? 40 : 250;
  const BOT_DELAYS = {
    easy: 12000,
    normal: 9000,
    hard: 6500
  };
  const modifierProfile = () => isTimedSoloMode.value ? 'solo' : 'duel';
  const attackDeck = () => isTimedSoloMode.value ? 'timed_solo' : 'duel';
  const shouldDrawAttacks = () => isTimedSoloMode.value || botEnabled.value;
  const createTestingHands = () => {
    const boonKeys = Object.entries(CARD_DEFINITIONS)
      .filter(([, definition]) => definition.kind === 'boon')
      .map(([key]) => key);
    const attackKeys = Object.entries(CARD_DEFINITIONS)
      .filter(([, definition]) => definition.kind === 'attack')
      .map(([key]) => key);

    return {
      host: {
        boons: createCards(boonKeys),
        attacks: createCards(attackKeys)
      },
      opponent: {
        boons: createCards(boonKeys),
        attacks: createCards(attackKeys)
      }
    };
  };

  const bothSidesReachedWinningScore = () => {
    return playerScores.value.host >= WINNING_SCORE && playerScores.value.opponent >= WINNING_SCORE;
  };

  const overtimeTrailingSide = () => {
    const hostAtGoal = playerScores.value.host >= WINNING_SCORE;
    const opponentAtGoal = playerScores.value.opponent >= WINNING_SCORE;

    if (isTimedSoloMode.value || hostAtGoal === opponentAtGoal) {
      return null;
    }

    return hostAtGoal ? 'opponent' : 'host';
  };

  const gameEnded = () => {
    if (isTimedSoloMode.value) {
      return playerScores.value.host >= WINNING_SCORE || playerScores.value.opponent >= WINNING_SCORE;
    }

    return bothSidesReachedWinningScore();
  };

  const ensureSinglePlayerState = () => {
    if (!playerTiles.value.host.length && !playerTiles.value.opponent.length) {
      if (isTestingMode) {
        playerTiles.value = createTestingOpeningRackPair(playerScores.value);
        rackClears.value = {
          host: 100,
          opponent: 100
        };
        playerCards.value = createTestingHands();
        return;
      }

      playerTiles.value = createOpeningRackPair(playerScores.value, {
        modifierProfile: modifierProfile()
      });
      rackClears.value = {
        host: 2,
        opponent: 2
      };
      playerCards.value = {
        host: {
          boons: drawCards('boon', 1),
          attacks: shouldDrawAttacks() ? drawCards('attack', 1, { deck: attackDeck() }) : []
        },
        opponent: {
          boons: drawCards('boon', 1),
          attacks: botEnabled.value ? drawCards('attack', 1, { deck: attackDeck() }) : []
        }
      };
    }
  };

  const clearBotRack = (botTiles) => {
    if ((rackClears.value.opponent || 0) <= 0) {
      return false;
    }

    rackClears.value = {
      ...rackClears.value,
      opponent: rackClears.value.opponent - 1
    };

    playerTiles.value = {
      ...playerTiles.value,
      opponent: createRack('opponent', playerScores.value, {
        mode: 'clear',
        currentTiles: botTiles,
        modifierProfile: modifierProfile()
      })
    };

    return true;
  };

  const submitBotWord = () => {
    if (gameEnded()) {
      stopBotLoop();
      return;
    }

    if (overtimeTrailingSide() && overtimeTrailingSide() !== 'opponent') {
      stopBotLoop();
      return;
    }

    ensureSinglePlayerState();

    const botTiles = playerTiles.value.opponent || [];
    const botWord = getBotWord(botTiles, [
      ...wordHistory.value.host,
      ...wordHistory.value.opponent
    ], botDifficulty.value);

    if (!botWord) {
      clearBotRack(botTiles);
      return;
    }

    const normalizedBotWord = botWord.toUpperCase();
    const selectedBotTiles = getTilesForWord(botTiles, normalizedBotWord);
    if (!selectedBotTiles.length || selectedBotTiles.length < MIN_WORD_LENGTH) {
      clearBotRack(botTiles);
      return;
    }

    const botScoreDetails = getWordScoreDetails(selectedBotTiles);
    const grantedResources = getResourceGrants(selectedBotTiles, {
      includeAttacks: shouldDrawAttacks()
    });

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
          ...drawCards('attack', grantedResources.attacks, { deck: attackDeck() })
        ]
      }
    };

    playerTiles.value = {
      host: playerTiles.value.host,
      opponent: refillTiles(botTiles, selectedBotTiles.map((tile) => tile.id), 'opponent', playerScores.value, {
        modifierProfile: modifierProfile()
      })
    };
  };

  const scheduleBotLoop = () => {
    if (isMultiplayer.value || !botEnabled.value || gameEnded()) {
      return;
    }

    window.clearTimeout(botLoopId);
    botLoopId = window.setTimeout(() => {
      submitBotWord();
      scheduleBotLoop();
    }, BOT_DELAYS[botDifficulty.value] || BOT_DELAYS.normal);
  };

  const stopBotLoop = () => {
    window.clearTimeout(botLoopId);
    botLoopId = null;
  };

  const startBotLoop = () => {
    if (!botEnabled.value || gameEnded()) {
      stopBotLoop();
      return;
    }

    ensureSinglePlayerState();
    scheduleBotLoop();
  };

  const submitSinglePlayerWord = (word) => {
    ensureSinglePlayerState();
    const selectedTiles = selectedTilesForCurrentSide.value;
    const scoreDetails = getWordScoreDetails(selectedTiles);
    const grantedResources = getResourceGrants(selectedTiles, {
      includeAttacks: shouldDrawAttacks()
    });

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
          ...drawCards('attack', grantedResources.attacks, { deck: attackDeck() })
        ]
      },
      opponent: playerCards.value.opponent
    };

    playerTiles.value = {
      host: refillTiles(playerTiles.value.host, selectedTiles.map((tile) => tile.id), 'host', playerScores.value, {
        modifierProfile: modifierProfile()
      }),
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
        currentTiles: playerTiles.value[side],
        modifierProfile: modifierProfile()
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

    if (card.effectType === 'clear_negative_modifiers') {
      playerCards.value = {
        ...playerCards.value,
        [side]: {
          ...playerCards.value[side],
          boons: hand.filter((entry) => entry.id !== cardId)
        }
      };

      playerTiles.value = {
        ...playerTiles.value,
        [side]: playerTiles.value[side].map((entry) => {
          if (!CARD_DEFINITIONS[entry.status] || !['zeroTile', 'mustuse', 'locked3', 'ghostTile'].includes(entry.status)) {
            return entry;
          }

          return replaceTileWithModifier([entry], entry.id, 'normal')[0];
        })
      };

      return { success: true };
    }

    const tile = playerTiles.value[side]?.find((entry) => entry.id === tileId);
    if (!tile) {
      localMessage.value = 'That tile cannot take a boon.';
      return false;
    }

    if (card.effectType === 'delete_tile') {
      playerCards.value = {
        ...playerCards.value,
        [side]: {
          ...playerCards.value[side],
          boons: hand.filter((entry) => entry.id !== cardId)
        }
      };
      const nextTiles = replaceSingleTile(playerTiles.value[side], tileId, side, playerScores.value, {
        modifierProfile: modifierProfile()
      });
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

    if (tile.locked) {
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

    if (card.effectType === 'isolate_tile') {
      playerTiles.value = {
        ...playerTiles.value,
        [side]: rerollRackExceptTile(playerTiles.value[side], tileId, side, playerScores.value, {
          modifierProfile: modifierProfile()
        })
      };

      return { success: true };
    }

    playerTiles.value = {
      ...playerTiles.value,
      [side]: replaceTileWithModifier(playerTiles.value[side], tileId, card.modifier)
    };

    return { success: true };
  };

  const useSinglePlayerAttack = (side, cardId) => {
    if (overtimeTrailingSide()) {
      localMessage.value = 'Overtime only allows boons.';
      return false;
    }

    const opponentSide = side === 'host' ? 'opponent' : 'host';
    const hand = playerCards.value[side]?.attacks || [];
    const card = hand.find((entry) => entry.id === cardId);
    if (!card) {
      localMessage.value = 'That attack is no longer available.';
      return false;
    }

    playerCards.value = {
      ...playerCards.value,
      [side]: {
        ...playerCards.value[side],
        attacks: hand.filter((entry) => entry.id !== cardId)
      }
    };

    if (card.effectType === 'pause_time') {
      onTimedSoloPauseTime?.();
      return {
        success: true,
        message: 'Paused the timer until your next word.'
      };
    }

    if (card.effectType === 'gain_time') {
      onTimedSoloGainTime?.(card.amount || 10);
      return {
        success: true,
        message: `Added ${card.amount || 10} seconds to the clock.`
      };
    }

    if (card.modifier === 'mustuse' && playerTiles.value[opponentSide].some((tile) => tile.status === 'mustuse')) {
      localMessage.value = 'That board already has a MUST tile.';
      playerCards.value = {
        ...playerCards.value,
        [side]: {
          ...playerCards.value[side],
          attacks: hand
        }
      };
      return false;
    }

    const targetTiles = playerTiles.value[opponentSide].filter((tile) => !tile.locked);
    if (!targetTiles.length) {
      localMessage.value = 'No target tiles available.';
      playerCards.value = {
        ...playerCards.value,
        [side]: {
          ...playerCards.value[side],
          attacks: hand
        }
      };
      return false;
    }

    const targetTile = targetTiles[Math.floor(Math.random() * targetTiles.length)];

    playerTiles.value = {
      ...playerTiles.value,
      [opponentSide]: replaceTileWithModifier(playerTiles.value[opponentSide], targetTile.id, card.modifier)
    };

    return {
      success: true,
      message: `Played ${card.label} on a random enemy tile.`
    };
  };

  ensureSinglePlayerState();
  scheduleBotLoop();

  watch([isMultiplayer, botEnabled, botDifficulty], ([nextIsMultiplayer, nextBotEnabled]) => {
    if (nextIsMultiplayer || !nextBotEnabled) {
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
