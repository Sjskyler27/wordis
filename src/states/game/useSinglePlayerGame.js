import { onBeforeUnmount, ref, watch } from 'vue';
import { getBotWord } from './bot.js';
import {
  CARD_DEFINITIONS,
  MIN_WORD_LENGTH,
  createCards,
  createOpeningRackPair,
  createTestingRack,
  createTestingOpeningRackPair,
  createRack,
  drawCards,
  getTilesForWord,
  getResourceGrants,
  replaceTileWithModifier,
  replaceSingleTile,
  getWordScoreDetails,
  getIdleScorePenalty,
  refillTiles,
  rerollRackExceptTile
} from './tile-logic.js';
import { isTestingMode } from './testing.js';
import { BOT_DIFFICULTIES } from './play-config.js';

export const useSinglePlayerGame = ({
  isMultiplayer,
  botEnabled,
  isTimedSoloMode,
  isMultiRoundMode,
  overtimeEnabled,
  botDifficulty,
  localMessage,
  selectedTilesForCurrentSide,
  clearSelectionForSide,
  playerTiles,
  playerScores,
  lastWordScores,
  lastWordBreakdowns,
  rackClears,
  playerCards,
  submittedWords,
  wordHistory,
  onTimedSoloPauseTime,
  onTimedSoloGainTime,
  onBotPreparing,
  personalModifierEffects,
  roundModifierEffects
}) => {
  let botLoopId = null;
  let botSubmitDelayId = null;
  const submissionPauseOwner = ref(null);
  const createHistoryTiles = (tiles = []) => {
    // Keep a frozen copy of played tiles so results can render the exact word later.
    return tiles.map((tile) => ({
      id: tile.id,
      letter: tile.letter,
      baseLetter: tile.baseLetter,
      score: tile.score,
      baseScore: tile.baseScore,
      bonusScore: tile.bonusScore,
      multiplier: tile.multiplier,
      wordMultiplier: tile.wordMultiplier,
      firstTileBonus: tile.firstTileBonus,
      status: tile.status,
      locked: tile.locked,
      lockTurns: tile.lockTurns
    }));
  };
  const WINNING_SCORE = isTestingMode ? 40 : 250;
  // determine how much time between thinking
  const BOT_DELAYS = {
    easy: 14000,
    normal: 16500,
    hard: 13250
  };
  const modifierProfile = () => (isTimedSoloMode.value || isMultiRoundMode?.value) ? 'solo' : 'bot';
  const attackDeck = () => isTimedSoloMode.value ? 'timed_solo' : 'duel';
  const shouldDrawAttacks = () => isTimedSoloMode.value || botEnabled.value;
  const getHeldCards = (side, kind) => {
    const handKey = kind === 'boon' ? 'boons' : 'attacks';
    return playerCards.value[side]?.[handKey] || [];
  };
  const drawCardsForSide = (kind, count, side, options = {}) => {
    return drawCards(kind, count, {
      ...options,
      side,
      heldCards: getHeldCards(side, kind)
    });
  };
  const keepTestingHand = (hand = [], cardId) => {
    return isTestingMode ? hand : hand.filter((entry) => entry.id !== cardId);
  };
  const getTurnCount = () => {
    return (wordHistory.value.host?.length || 0) + (wordHistory.value.opponent?.length || 0);
  };
  const cardModifierEffects = ref({
    badChanceBonus: 0
  });
  const getPersonalModifierEffects = () => {
    const baseEffects = personalModifierEffects?.value || {};

    // console.log(cardModifierEffects.value.badChanceBonus)
    return {
      ...baseEffects,
      badChanceBonus: (baseEffects.badChanceBonus || 0) + (cardModifierEffects.value.badChanceBonus || 0)
    };
  };
  const getRoundModifierEffects = () => roundModifierEffects?.value || {};
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
  const overtimePendingSide = ref(null);
  const overtimeFinalWordSubmitted = ref(false);

  const overtimeTrailingSide = () => {
    const hostAtGoal = playerScores.value.host >= WINNING_SCORE;
    const opponentAtGoal = playerScores.value.opponent >= WINNING_SCORE;

    if (!overtimeEnabled.value || isTimedSoloMode.value || isMultiRoundMode?.value || overtimeFinalWordSubmitted.value) {
      return null;
    }

    if (overtimePendingSide.value) {
      return overtimePendingSide.value;
    }

    if (hostAtGoal === opponentAtGoal) {
      return null;
    }

    return hostAtGoal ? 'opponent' : 'host';
  };

  const updateOvertimeStateAfterSubmit = (side) => {
    if (!overtimeEnabled.value || isTimedSoloMode.value || isMultiRoundMode?.value || overtimeFinalWordSubmitted.value) {
      return;
    }

    if (overtimePendingSide.value) {
      if (overtimePendingSide.value === side) {
        overtimeFinalWordSubmitted.value = true;
      }
      return;
    }

    const hostAtGoal = playerScores.value.host >= WINNING_SCORE;
    const opponentAtGoal = playerScores.value.opponent >= WINNING_SCORE;
    if (hostAtGoal === opponentAtGoal) {
      return;
    }

    overtimePendingSide.value = hostAtGoal ? 'opponent' : 'host';
  };

  const gameEnded = () => {
    if (isTimedSoloMode.value || isMultiRoundMode?.value) {
      return playerScores.value.host >= WINNING_SCORE || playerScores.value.opponent >= WINNING_SCORE;
    }

    if (overtimeEnabled.value) {
      return overtimeFinalWordSubmitted.value;
    }

    return playerScores.value.host >= WINNING_SCORE || playerScores.value.opponent >= WINNING_SCORE || bothSidesReachedWinningScore();
  };

  const ensureSinglePlayerState = () => {
    if (!playerTiles.value.host.length && !playerTiles.value.opponent.length) {
      submissionPauseOwner.value = null;

      if (isTestingMode) {
        if (isMultiRoundMode?.value) {
          playerTiles.value = {
            host: createTestingRack('host', playerScores.value, {
              modifierProfile: modifierProfile(),
              includeAllModifiers: true,
              personalModifierEffects: getPersonalModifierEffects(),
              roundModifierEffects: getRoundModifierEffects()
            }),
            opponent: []
          };
          rackClears.value = {
            host: 100,
            opponent: 0
          };
          playerCards.value = {
            host: createTestingHands().host,
            opponent: {
              boons: [],
              attacks: []
            }
          };
          return;
        }

        playerTiles.value = createTestingOpeningRackPair(playerScores.value, {
          modifierProfile: modifierProfile(),
          includeAllModifiers: true
        });
        rackClears.value = {
          host: 100,
          opponent: 100
        };
        playerCards.value = createTestingHands();
        return;
      }

      if (isMultiRoundMode?.value) {
        playerTiles.value = {
          host: createRack('host', playerScores.value, {
            modifierProfile: modifierProfile(),
            personalModifierEffects: getPersonalModifierEffects(),
            roundModifierEffects: getRoundModifierEffects(),
            phase: 'opening',
            turnCount: getTurnCount()
          }),
          opponent: []
        };
        rackClears.value = {
          host: 2,
          opponent: 0
        };
        playerCards.value = {
          host: {
            boons: drawCards('boon', 1),
            attacks: []
          },
          opponent: {
            boons: [],
            attacks: []
          }
        };
        return;
      }

      playerTiles.value = createOpeningRackPair(playerScores.value, {
        modifierProfile: modifierProfile(),
        turnCount: getTurnCount()
      });
      rackClears.value = {
        host: 2,
        opponent: 2
      };
      playerCards.value = {
        host: {
          boons: drawCards('boon', 1),
          attacks: shouldDrawAttacks() ? drawCardsForSide('attack', 1, 'host', {
            deck: attackDeck(),
            scores: playerScores.value
          }) : []
        },
        opponent: {
          boons: drawCards('boon', 1),
          attacks: botEnabled.value ? drawCardsForSide('attack', 1, 'opponent', {
            deck: attackDeck(),
            scores: playerScores.value
          }) : []
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
        modifierProfile: modifierProfile(),
        personalModifierEffects: getPersonalModifierEffects(),
        roundModifierEffects: getRoundModifierEffects(),
        turnCount: getTurnCount()
      })
    };

    return true;
  };

  const submitBotWord = () => {
    if (gameEnded()) {
      stopBotLoop();
      return;
    }

    ensureSinglePlayerState();

    if (submissionPauseOwner.value === 'host') {
      return;
    }

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

    const botScoreDetails = getWordScoreDetails(selectedBotTiles, {
      side: 'opponent',
      scores: playerScores.value
    });
    const botIdlePenalty = getIdleScorePenalty(botTiles, selectedBotTiles.map((tile) => tile.id));
    const botScoreDelta = botScoreDetails.total - botIdlePenalty;
    const grantedResources = getResourceGrants(selectedBotTiles, {
      includeAttacks: shouldDrawAttacks()
    });

    submittedWords.value = {
      host: submittedWords.value.host,
      opponent: normalizedBotWord
    };

    wordHistory.value = {
      host: wordHistory.value.host,
      opponent: [{
        word: normalizedBotWord,
        score: botScoreDelta,
        tiles: createHistoryTiles(selectedBotTiles)
      }, ...wordHistory.value.opponent]
    };

    playerScores.value = {
      host: playerScores.value.host,
      opponent: playerScores.value.opponent + botScoreDelta
    };
    lastWordScores.value = {
      host: lastWordScores.value.host,
      opponent: botScoreDelta
    };
    lastWordBreakdowns.value = {
      host: lastWordBreakdowns.value.host,
      opponent: {
        wordScore: botScoreDetails.total,
        burnPenalty: botIdlePenalty,
        netScore: botScoreDelta
      }
    };
    playerCards.value = {
      host: playerCards.value.host,
      opponent: {
        boons: [
          ...playerCards.value.opponent.boons,
          ...drawCardsForSide('boon', grantedResources.boons, 'opponent')
        ],
        attacks: [
          ...playerCards.value.opponent.attacks,
          ...drawCardsForSide('attack', grantedResources.attacks, 'opponent', {
            deck: attackDeck(),
            scores: playerScores.value
          })
        ]
      }
    };

    playerTiles.value = {
      host: playerTiles.value.host,
      opponent: refillTiles(botTiles, selectedBotTiles.map((tile) => tile.id), 'opponent', playerScores.value, {
        modifierProfile: modifierProfile(),
        phase: 'submit',
        turnCount: getTurnCount()
      })
    };
    if (submissionPauseOwner.value === 'opponent') {
      submissionPauseOwner.value = null;
    }
    updateOvertimeStateAfterSubmit('opponent');
  };

  const scheduleBotLoop = () => {
    if (isMultiplayer.value || !botEnabled.value || gameEnded()) {
      return;
    }

    window.clearTimeout(botLoopId);
    window.clearTimeout(botSubmitDelayId);
    botLoopId = window.setTimeout(() => {
      onBotPreparing?.();
      botSubmitDelayId = window.setTimeout(() => {
        submitBotWord();
        scheduleBotLoop();
      }, 650);
    }, BOT_DELAYS[botDifficulty.value] || BOT_DELAYS.normal);
  };

  const stopBotLoop = () => {
    window.clearTimeout(botLoopId);
    window.clearTimeout(botSubmitDelayId);
    botLoopId = null;
    botSubmitDelayId = null;
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
    //
    ensureSinglePlayerState();
    if (submissionPauseOwner.value === 'opponent') {
      localMessage.value = 'Your submissions are paused until your opponent submits.';
      return false;
    }

    const selectedTiles = selectedTilesForCurrentSide.value;
    const scoreDetails = getWordScoreDetails(selectedTiles, {
      side: 'host',
      scores: playerScores.value,
      personalModifierEffects: getPersonalModifierEffects(),
      roundModifierEffects: getRoundModifierEffects()
    });
    const idlePenalty = getIdleScorePenalty(playerTiles.value.host, selectedTiles.map((tile) => tile.id), {
      roundModifierEffects: getRoundModifierEffects()
    });
    const scoreDelta = scoreDetails.total - idlePenalty;
    const grantedResources = getResourceGrants(selectedTiles, {
      includeAttacks: shouldDrawAttacks()
    });

    submittedWords.value = {
      host: word,
      opponent: submittedWords.value.opponent
    };

    wordHistory.value = {
      host: [{
        word,
        score: scoreDelta,
        tiles: createHistoryTiles(selectedTiles)
      }, ...wordHistory.value.host],
      opponent: wordHistory.value.opponent
    };

    playerScores.value = {
      host: playerScores.value.host + scoreDelta,
      opponent: playerScores.value.opponent
    };
    lastWordScores.value = {
      host: scoreDelta,
      opponent: lastWordScores.value.opponent
    };
    lastWordBreakdowns.value = {
      host: {
        wordScore: scoreDetails.total,
        burnPenalty: idlePenalty,
        netScore: scoreDelta
      },
      opponent: lastWordBreakdowns.value.opponent
    };
    playerCards.value = {
      host: {
        boons: [
          ...playerCards.value.host.boons,
          ...drawCardsForSide('boon', grantedResources.boons, 'host')
        ],
        attacks: [
          ...playerCards.value.host.attacks,
          ...drawCardsForSide('attack', grantedResources.attacks, 'host', {
            deck: attackDeck(),
            scores: playerScores.value
          })
        ]
      },
      opponent: playerCards.value.opponent
    };

    playerTiles.value = {
      
      host: refillTiles(playerTiles.value.host, selectedTiles.map((tile) => tile.id), 'host', playerScores.value, {
        modifierProfile: modifierProfile(),
        personalModifierEffects: getPersonalModifierEffects(),
        roundModifierEffects: getRoundModifierEffects(),
        phase: 'submit',
        turnCount: getTurnCount()
      }),
      opponent: playerTiles.value.opponent
    };

    clearSelectionForSide('host');
    if (submissionPauseOwner.value === 'host') {
      submissionPauseOwner.value = null;
    }
    updateOvertimeStateAfterSubmit('host');
    localMessage.value = idlePenalty > 0
      ? `Submitted ${word} for ${scoreDelta} pts after a ${idlePenalty} pt burn penalty.`
      : `Submitted ${word} for ${scoreDelta} pts.`;
    return true;
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
        modifierProfile: modifierProfile(),
        personalModifierEffects: getPersonalModifierEffects(),
        turnCount: getTurnCount()
      })
    };

    clearSelectionForSide(side);
    localMessage.value = `Cleared your rack. ${rackClears.value[side]} clears left.`;
    return true;
  };

  const checkBotWin = (playerScore, botScore, botMode, botDifficulty) => {
    console.log('CHECK!!'+ botMode)
    if(!botMode) return botDifficulty;
    console.log('isBot')
    if (botDifficulty === BOT_DIFFICULTIES.HARD) return botDifficulty;
    console.log('notHard')
    const storedBotDifficulty = JSON.parse(localStorage.getItem('botDefaultDifficulty')) ?? BOT_DIFFICULTIES.EASY;
    console.log('old'+storedBotDifficulty)
    if(playerScore > botScore){
      let newBotDifficulty;
      if(storedBotDifficulty === BOT_DIFFICULTIES.EASY) 
        newBotDifficulty = BOT_DIFFICULTIES.NORMAL;
      if(storedBotDifficulty === BOT_DIFFICULTIES.Normal)
        newBotDifficulty = BOT_DIFFICULTIES.HARD
      localStorage.setItem('botDefaultDifficulty', newBotDifficulty);
      console.log('new'+ newBotDifficulty)
      return newBotDifficulty;
    }
    return botDifficulty
  }


  const resetSinglePlayerRound = (side = 'host') => {
    submissionPauseOwner.value = null;
    const nextRack = createRack(side, playerScores.value, {
      modifierProfile: modifierProfile(),
      personalModifierEffects: getPersonalModifierEffects(),
      roundModifierEffects: getRoundModifierEffects(),
      turnCount: getTurnCount()
    });

    playerTiles.value = {
      ...playerTiles.value,
      [side]: nextRack,
      ...(isMultiRoundMode?.value ? { opponent: [] } : {})
    };
    rackClears.value = {
      ...rackClears.value,
      [side]: 2,
      ...(isMultiRoundMode?.value ? { opponent: 0 } : {})
    };
    if (!isMultiRoundMode?.value) {
      playerCards.value = {
        ...playerCards.value,
        [side]: {
          boons: drawCards('boon', 1),
          attacks: []
        }
      };
    }
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
          boons: keepTestingHand(hand, cardId)
        }
      };

      playerTiles.value = {
        ...playerTiles.value,
        [side]: playerTiles.value[side].map((entry) => {
          if (!CARD_DEFINITIONS[entry.status] || !['zeroTile', 'mustuse', 'locked3', 'ghostTile', 'burningTile'].includes(entry.status)) {
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
          boons: keepTestingHand(hand, cardId)
        }
      };
      const nextTiles = replaceSingleTile(playerTiles.value[side], tileId, side, playerScores.value, {
        modifierProfile: modifierProfile(),
        personalModifierEffects: getPersonalModifierEffects(),
        turnCount: getTurnCount()
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
        boons: keepTestingHand(hand, cardId)
      }
    };

    if (card.effectType === 'isolate_tile') {
      playerTiles.value = {
        ...playerTiles.value,
        [side]: rerollRackExceptTile(playerTiles.value[side], tileId, side, playerScores.value, {
          modifierProfile: modifierProfile(),
          personalModifierEffects: getPersonalModifierEffects(),
          turnCount: getTurnCount()
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

    if (card.effectType === 'pause_submissions' && submissionPauseOwner.value) {
      localMessage.value = 'A submission pause is already active.';
      return false;
    }

    playerCards.value = {
      ...playerCards.value,
      [side]: {
        ...playerCards.value[side],
        attacks: keepTestingHand(hand, cardId)
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

    if (card.effectType === 'reduce_bad_modifier_chance') {
      const amount = Math.max(0, Number(card.amount) || 0.015);
      cardModifierEffects.value = {
        ...cardModifierEffects.value,
        badChanceBonus: (cardModifierEffects.value.badChanceBonus || 0) - amount
      };
      return {
        success: true,
        // message: `Bad modifiers are ${Math.round(amount * 1000) / 10}% less likely.`
        message: `Bad modifiers are a hair less likely to be pulled.`
      };
    }

    if (card.effectType === 'pause_submissions') {
      submissionPauseOwner.value = side;
      return {
        success: true,
        message: 'Paused enemy submissions until your next word.'
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

    // Random attacks should only hit clean tiles so modifiers do not stack unpredictably.
    const targetTiles = playerTiles.value[opponentSide].filter((tile) => !tile.locked && tile.status === 'normal');
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
    checkBotWin,
    clearSinglePlayerRack,
    resetSinglePlayerRound,
    useSinglePlayerBoon,
    useSinglePlayerAttack,
    submitSinglePlayerWord,
    submissionPauseOwner,
    overtimePendingSide,
    overtimeFinalWordSubmitted
  };
};
