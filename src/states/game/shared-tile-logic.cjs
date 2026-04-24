
const cardDefinitionsApi = typeof require === 'function'
  ? require('./card-definitions.cjs')
  : globalThis.__wordisCardDefinitions;
const modifierDefinitionsApi = typeof require === 'function'
  ? require('./modifier-definitions.cjs')
  : globalThis.__wordisModifierDefinitions;

const {
  CARD_DEFINITIONS,
  BOON_CARD_KEYS,
  ATTACK_CARD_KEYS,
  TIMED_SOLO_ATTACK_CARD_KEYS
} = cardDefinitionsApi || {};
const {
  createModifierDefinitions
} = modifierDefinitionsApi || {};

const createSharedTileLogic = ({ letterConfig, wordBonuses, milestoneRewards = {}, devLogging = false, testing = false }) => {
  const LETTER_KEYS = Object.keys(letterConfig);
  const LETTER_POOL = Object.entries(letterConfig).flatMap(([letter, config]) =>
    Array.from({ length: config.count }, () => letter)
  );

  const MIN_WORD_LENGTH = 4;
  const RACK_SIZE = 20;
  const DUPLICATE_PENALTY = 0.38;
  const MIN_DUPLICATE_WEIGHT = 0.18;
  const BASE_GOOD_MODIFIER_CHANCE = 0.08;
  const BASE_BAD_MODIFIER_CHANCE = 0.03;
  const BASE_NEUTRAL_MODIFIER_CHANCE = 0.02;
  const MODIFIER_SWING_DIVISOR = 90;
  const MAX_GOOD_MODIFIER_BONUS = 0.3;
  const MAX_BAD_MODIFIER_BONUS = 0.22;
  const TURN_MODIFIER_CHANCE_STEP = 0.003;
  const MAX_TURN_MODIFIER_BONUS = 0.08;
  const BLOOD_TILE_POSITION_VALUES = {
    pos1: -2,
    pos2: -1,
    pos3: 0,
    pos4: 1,
    pos5: 2,
    pos6: 3,
    pos7: 4,
    pos8: 5,
    pos9: 6
  };
  const GOOD_MODIFIERS = ['gold', 'firsttile', 'wild', 'bankTile', 'gainboon', 'gainattack'];
  const BAD_MODIFIERS = ['zeroTile', 'mustuse', 'locked3', 'burningTile'];
  const NEUTRAL_MODIFIERS = ['yinYang', 'ghostTile','bloodTile'];
  const EMPTY_TILE_ANIMATION_STATE = {
    trigger: '',
    name: '',
    key: ''
  };
  const MODIFIER_PROFILES = {
    duel: {
      goodModifiers: GOOD_MODIFIERS,
      badModifiers: BAD_MODIFIERS,
      neutralModifiers: NEUTRAL_MODIFIERS,
      baseGoodChance: BASE_GOOD_MODIFIER_CHANCE,
      baseBadChance: BASE_BAD_MODIFIER_CHANCE,
      baseNeutralChance: BASE_NEUTRAL_MODIFIER_CHANCE,
      useScoreSwing: true
    },
    bot: {
      goodModifiers: GOOD_MODIFIERS,
      badModifiers: BAD_MODIFIERS,
      neutralModifiers: NEUTRAL_MODIFIERS,
      baseGoodChance: BASE_GOOD_MODIFIER_CHANCE,
      baseBadChance: BASE_BAD_MODIFIER_CHANCE,
      baseNeutralChance: BASE_NEUTRAL_MODIFIER_CHANCE,
      useScoreSwing: true
    },
    solo: {
      goodModifiers: GOOD_MODIFIERS,
      badModifiers: BAD_MODIFIERS,
      neutralModifiers: NEUTRAL_MODIFIERS,
      baseGoodChance: 0.085,
      baseBadChance: 0.022,
      baseNeutralChance: BASE_NEUTRAL_MODIFIER_CHANCE,
      useScoreSwing: false
    }
  };
  const MODIFIER_DEFINITIONS = createModifierDefinitions({
    bloodTilePositionValues: BLOOD_TILE_POSITION_VALUES
  });
  const getRackLetterCounts = (tiles = []) => tiles.reduce((counts, tile) => {
    if (!tile?.letter) {
      return counts;
    }

    counts[tile.letter] = (counts[tile.letter] || 0) + 1;
    return counts;
  }, {});

  const getWeightedLetterPool = (tiles = []) => {
    const rackCounts = getRackLetterCounts(tiles);

    return LETTER_POOL.map((letter) => {
      const duplicateCount = rackCounts[letter] || 0;
      const weight = Math.max(MIN_DUPLICATE_WEIGHT, 1 - (duplicateCount * DUPLICATE_PENALTY));

      return { letter, weight };
    });
  };

  const drawLetter = (tiles = []) => {
    // weights determined by the letters 
    const weightedPool = getWeightedLetterPool(tiles);
    const totalWeight = weightedPool.reduce((sum, entry) => sum + entry.weight, 0);

    if (!totalWeight) {
      return LETTER_POOL[Math.floor(Math.random() * LETTER_POOL.length)];
    }

    let roll = Math.random() * totalWeight;
    for (const entry of weightedPool) {
      roll -= entry.weight;
      if (roll <= 0) {
        return entry.letter;
      }
    }

    return weightedPool[weightedPool.length - 1]?.letter || 'E';
  };

  const normalizeModifierStatus = (status = 'normal') => (status === 'black' ? 'zeroTile' : status);
  const normalizeCardKey = (cardKey) => (cardKey === 'attack_black' ? 'attack_zeroTile' : cardKey);
  const getModifierDefinition = (status = 'normal') => {
    return MODIFIER_DEFINITIONS[normalizeModifierStatus(status)] || MODIFIER_DEFINITIONS.normal;
  };
  const getModifierDescription = (status = 'normal') => {
    return getModifierDefinition(status).description || MODIFIER_DEFINITIONS.normal.description || '';
  };
  const getAllowedModifiersForProfile = (modifiers = [], profileName = 'duel') => {
    return modifiers.filter((modifier) => {
      const definition = getModifierDefinition(modifier);
      // return all if logging

      if (testing) {
        return true;
      }
      // currently duel gets everything
      if (profileName === 'solo') {
        return !definition.noSinglePlayer;
      }
      if(devLogging)console.log('profile'+ profileName)

      if (profileName === 'duel' || profileName === 'bot') {
        return !definition.noMultiPlayer;
      }

      return !definition.noSinglePlayer && !definition.noMultiPlayer;
    });
  };
  const getCardDefinition = (cardKey) => CARD_DEFINITIONS[normalizeCardKey(cardKey)];
  const getModifierProfile = (profileName = 'duel') => {
    const profile = MODIFIER_PROFILES[profileName] || MODIFIER_PROFILES.duel;

    return {
      ...profile,
      goodModifiers: getAllowedModifiersForProfile(profile.goodModifiers || [], profileName),
      badModifiers: getAllowedModifiersForProfile(profile.badModifiers || [], profileName),
      neutralModifiers: getAllowedModifiersForProfile(profile.neutralModifiers || [], profileName)
    };
  };

  const getModifierChances = (side, scores = {}, profileName = 'duel', turnCount = 0, options = {}) => {
    // base tiles off profile 
    const profile = getModifierProfile(profileName);
    const turnBonus = Math.min(MAX_TURN_MODIFIER_BONUS, Math.max(0, turnCount) * TURN_MODIFIER_CHANCE_STEP);

    const baseChances = (() => {
      if (!side || !profile.useScoreSwing) {
        return {
          goodChance: Math.min(0.45, profile.baseGoodChance + turnBonus),
          badChance: Math.min(0.4, profile.baseBadChance + turnBonus),
          neutralChance: profile.baseNeutralChance || 0
        };
      }

      const opponentSide = side === 'host' ? 'opponent' : 'host';
      const scoreDelta = (scores[side] || 0) - (scores[opponentSide] || 0);
      const catchupBonus = Math.min(MAX_GOOD_MODIFIER_BONUS, Math.max(0, -scoreDelta) / MODIFIER_SWING_DIVISOR);
      const pressureBonus = Math.min(MAX_BAD_MODIFIER_BONUS, Math.max(0, scoreDelta) / MODIFIER_SWING_DIVISOR);

      return {
        goodChance: Math.min(0.45, profile.baseGoodChance + catchupBonus + turnBonus),
        badChance: Math.min(0.4, profile.baseBadChance + pressureBonus + turnBonus),
        neutralChance: Math.min(0.2, profile.baseNeutralChance || 0)
      };
    })();
    const personalModifierEffects = options.personalModifierEffects || {};
    const modifierOddsBonus = personalModifierEffects.modifierOddsBonus || {};
    const getPoolChanceBonus = (modifiers = []) => {
      return modifiers.reduce((total, modifier) => total + (modifierOddsBonus[modifier] || 0), 0);
    };
    const openingGoodChanceBonus = options.phase === 'opening'
      ? (personalModifierEffects.openingGoodChanceBonus || 0)
      : 0;
    const goodChanceBonus = getPoolChanceBonus(profile.goodModifiers);
    const badChanceBonus = getPoolChanceBonus(profile.badModifiers);
    const neutralChanceBonus = getPoolChanceBonus(profile.neutralModifiers || []) + (personalModifierEffects.neutralChanceBonus || 0);
    const badChanceMultiplier = Math.max(0, personalModifierEffects.badChanceMultiplier ?? 1);
    const goodChance = Math.max(
      0,
      Math.min(
        0.9,
        options.goodChance ?? ((baseChances.goodChance * (options.goodChanceMultiplier ?? 1)) + openingGoodChanceBonus + goodChanceBonus)
      )
    );
    const badChance = Math.max(
      0,
      Math.min(
        0.9 - goodChance,
        options.badChance ?? ((baseChances.badChance * (options.badChanceMultiplier ?? 1) * badChanceMultiplier) + badChanceBonus)
      )
    );
    const neutralChance = Math.max(
      0,
      Math.min(
        0.9 - goodChance - badChance,
        options.neutralChance ?? ((baseChances.neutralChance * (options.neutralChanceMultiplier ?? 1)) + neutralChanceBonus)
      )
    );
    const chanceBonuses = {
      goodChanceBonus,
      badChanceBonus,
      neutralChanceBonus,
      openingGoodChanceBonus
    };

    if(devLogging){
      // update logs for actual chances
      console.log('[modifier-chances]', {
        profileName,
        allowedModifiers: {
          good: profile.goodModifiers,
          bad: profile.badModifiers,
          neutral: profile.neutralModifiers || []
        },
        baseChances: formatChanceGroup(baseChances),
        chanceBonuses: formatChanceGroup(chanceBonuses),
        finalChances: {
          good: formatChancePercent(goodChance),
          bad: formatChancePercent(badChance),
          neutral: formatChancePercent(neutralChance)
        }
      });
    }

    return {
      ...baseChances,
      baseChances,
      goodChance,
      badChance,
      neutralChance,
      chanceBonuses
    };
  };

  const hasModifierInRack = (rackTiles = [], status = 'normal') => {
    return rackTiles.some((tile) => tile.status === status);
  };
  const canApplyModifier = (status = 'normal', context = {}) => {
    status = normalizeModifierStatus(status);

    if (status === 'mustuse' && hasModifierInRack(context.rackTiles || [], 'mustuse')) {
      return false;
    }

    const definition = getModifierDefinition(status);

    if (typeof definition.canApply !== 'function') {
      return true;
    }

    return definition.canApply(context);
  };

  const chooseWeightedModifier = (modifiers = [], weightBonuses = {}) => {
    const weightedModifiers = modifiers
      .map((modifier) => ({
        modifier,
        weight: Math.max(0, (getModifierDefinition(modifier).rarityWeight ?? 1) + (weightBonuses[modifier] || 0))
      }))
      .filter((entry) => entry.weight > 0);

    if (!weightedModifiers.length) {
      return 'normal';
    }

    const totalWeight = weightedModifiers.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = Math.random() * totalWeight;

    for (const entry of weightedModifiers) {
      roll -= entry.weight;
      if (roll <= 0) {
        return entry.modifier;
      }
    }

    return weightedModifiers[weightedModifiers.length - 1].modifier;
  };

  const getWeightedModifierOdds = (modifiers = [], poolChance = 0, weightBonuses = {}) => {
    const weightedModifiers = modifiers
      .map((modifier) => ({
        modifier,
        weight: Math.max(0, (getModifierDefinition(modifier).rarityWeight ?? 1) + (weightBonuses[modifier] || 0))
      }))
      .filter((entry) => entry.weight > 0);

    if (!weightedModifiers.length || poolChance <= 0) {
      return {};
    }

    const totalWeight = weightedModifiers.reduce((sum, entry) => sum + entry.weight, 0);
    if (!totalWeight) {
      return {};
    }

    return weightedModifiers.reduce((odds, entry) => {
      odds[entry.modifier] = poolChance * (entry.weight / totalWeight);
      return odds;
    }, {});
  };

  const getModifierOddsSnapshot = ({
    goodChance,
    badChance,
    neutralChance,
    modifierOddsBonus = {},
    eligibleGoodModifiers = [],
    eligibleBadModifiers = [],
    eligibleNeutralModifiers = []
  }) => {

    if (!devLogging) {
      return;
    }

    const modifierOdds = {
      ...getWeightedModifierOdds(eligibleGoodModifiers, goodChance, modifierOddsBonus),
      ...getWeightedModifierOdds(eligibleBadModifiers, badChance, modifierOddsBonus),
      ...getWeightedModifierOdds(eligibleNeutralModifiers, neutralChance, modifierOddsBonus)
    };
    const normalChance = Math.max(
      0,
      1 - Object.values(modifierOdds).reduce((sum, chance) => sum + chance, 0)
    );
    return {
      goodModifierOdds: getWeightedModifierOdds(eligibleGoodModifiers, goodChance, modifierOddsBonus),
      badModifierOdds: getWeightedModifierOdds(eligibleBadModifiers, badChance, modifierOddsBonus),
      neutralModifierOdds: getWeightedModifierOdds(eligibleNeutralModifiers, neutralChance, modifierOddsBonus),
      modifierOdds,
      normalChance
    };
  };

  const formatChancePercent = (chance = 0) => `${(Math.max(0, chance) * 100).toFixed(1)}%`;
  const formatChanceGroup = (odds = {}) => {
    return Object.fromEntries(
      Object.entries(odds).map(([modifier, chance]) => [modifier, formatChancePercent(chance)])
    );
  };

  const logModifierRoll = ({
    selectedModifier = 'normal',
    context = {},
    roll = null,
    goodChance,
    badChance,
    neutralChance,
    baseChances = null,
    chanceBonuses = null,
    modifierOddsBonus = {},
    eligibleGoodModifiers = [],
    eligibleBadModifiers = [],
    eligibleNeutralModifiers = [],
  }) => {
    if (!devLogging) {
      return;
    }

    const {
      modifierOdds,
      normalChance,
      goodModifierOdds,
      badModifierOdds,
      neutralModifierOdds
    } = getModifierOddsSnapshot({
      goodChance,
      badChance,
      neutralChance,
      modifierOddsBonus,
      eligibleGoodModifiers,
      eligibleBadModifiers,
      eligibleNeutralModifiers
    });

    console.log('[modifier-roll]', {
      actualModifier: selectedModifier,
      actualChance: formatChancePercent(selectedModifier === 'normal'
        ? normalChance
        : (modifierOdds[selectedModifier] || 0)),
      letter: context.letter || null,
      baseScore: context.baseScore ?? null,
      roll: roll == null ? null : Number(roll.toFixed(4)),
      poolChances: {
        good: formatChancePercent(goodChance),
        bad: formatChancePercent(badChance),
        neutral: formatChancePercent(neutralChance || 0),
        normal: formatChancePercent(normalChance)
      },
      baseChances: baseChances ? {
        good: formatChancePercent(baseChances.goodChance),
        bad: formatChancePercent(baseChances.badChance),
        neutral: formatChancePercent(baseChances.neutralChance || 0)
      } : null,
      chanceBonuses: chanceBonuses ? formatChanceGroup(chanceBonuses) : null,
      modifierOdds: {
        good: formatChanceGroup(goodModifierOdds),
        bad: formatChanceGroup(badModifierOdds),
        neutral: formatChanceGroup(neutralModifierOdds)
      }
    });
  };

  const chooseWeightedCard = (cardKeys = []) => {
    const weightedCards = cardKeys
      .map((cardKey) => ({
        cardKey,
        weight: Math.max(0, getCardDefinition(cardKey)?.rarityWeight ?? 1)
      }))
      .filter((entry) => entry.weight > 0);

    if (!weightedCards.length) {
      return null;
    }

    const totalWeight = weightedCards.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = Math.random() * totalWeight;

    for (const entry of weightedCards) {
      roll -= entry.weight;
      if (roll <= 0) {
        return entry.cardKey;
      }
    }

    return weightedCards[weightedCards.length - 1].cardKey;
  };

  const rollTileModifier = (side, scores = {}, context = {}, chanceOverrides = {}) => {
    const modifierProfile = chanceOverrides.modifierProfile || 'duel';
    const personalModifierEffects = chanceOverrides.personalModifierEffects || {};
    if(devLogging)console.log(modifierProfile)
    const profile = getModifierProfile(modifierProfile);
    const modifierOddsBonus = personalModifierEffects.modifierOddsBonus || {};
    const {
      goodChance,
      badChance,
      neutralChance,
      baseChances,
      chanceBonuses
    } = getModifierChances(side, scores, modifierProfile, chanceOverrides.turnCount || 0, chanceOverrides);
    const roll = Math.random();

    const eligibleGoodModifiers = profile.goodModifiers.filter((modifier) => canApplyModifier(modifier, context));
    const eligibleBadModifiers = profile.badModifiers.filter((modifier) => canApplyModifier(modifier, context));
    const eligibleNeutralModifiers = (profile.neutralModifiers || []).filter((modifier) => canApplyModifier(modifier, context));

    let selectedModifier = 'normal';
    if (roll < goodChance) {
      selectedModifier = eligibleGoodModifiers.length ? chooseWeightedModifier(eligibleGoodModifiers, modifierOddsBonus) : 'normal';
    } else if (roll < goodChance + badChance) {
      selectedModifier = eligibleBadModifiers.length ? chooseWeightedModifier(eligibleBadModifiers, modifierOddsBonus) : 'normal';
    } else if (roll < goodChance + badChance + neutralChance) {
      selectedModifier = eligibleNeutralModifiers.length ? chooseWeightedModifier(eligibleNeutralModifiers, modifierOddsBonus) : 'normal';
    }

    logModifierRoll({
      context,
      roll,
      goodChance,
      badChance,
      neutralChance,
      baseChances,
      chanceBonuses,
      modifierOddsBonus,
      eligibleGoodModifiers,
      eligibleBadModifiers,
      eligibleNeutralModifiers,
      selectedModifier
    });

    return selectedModifier;
  };

  const rollSharedOpeningModifier = (scores = {}, contexts = [], options = {}) => {
    const modifierProfile = options.modifierProfile || 'duel';
    const profile = getModifierProfile(modifierProfile);
    const { goodChance, badChance, neutralChance } = getModifierChances(null, scores, modifierProfile, options.turnCount || 0, options);
    const roll = Math.random();

    const eligibleGoodModifiers = profile.goodModifiers.filter((modifier) => {
        return contexts.every((context) => canApplyModifier(modifier, context));
      });
    const eligibleBadModifiers = profile.badModifiers.filter((modifier) => {
        return contexts.every((context) => canApplyModifier(modifier, context));
      });
    const eligibleNeutralModifiers = (profile.neutralModifiers || []).filter((modifier) => {
        return contexts.every((context) => canApplyModifier(modifier, context));
      });

    if (roll < goodChance) {
      return eligibleGoodModifiers.length ? chooseWeightedModifier(eligibleGoodModifiers) : 'normal';
    }

    if (roll < goodChance + badChance) {
      return eligibleBadModifiers.length ? chooseWeightedModifier(eligibleBadModifiers) : 'normal';
    }

    if (roll < goodChance + badChance + neutralChance) {
      return eligibleNeutralModifiers.length ? chooseWeightedModifier(eligibleNeutralModifiers) : 'normal';
    }

    return 'normal';
  };

  const getModifierBadge = (tileOrStatus = 'normal') => {
    if (tileOrStatus && typeof tileOrStatus === 'object') {
      if (tileOrStatus.locked) {
        return `LCK${tileOrStatus.lockTurns || 0}`;
      }

      return getModifierDefinition(tileOrStatus.status).badge;
    }

    return getModifierDefinition(tileOrStatus).badge;
  };
  const getModifierUi = (status = 'normal') => getModifierDefinition(status).ui || MODIFIER_DEFINITIONS.normal.ui;
  const getLeadAwareModifierScore = (tile, options = {}) => {
    const leadMap = getModifierDefinition(tile?.status).effects.dynamicScoreByLead;
    if (!leadMap || !options.side || !options.scores) {
      return 0;
    }

    const opponentSide = options.side === 'host' ? 'opponent' : 'host';
    const scoreDelta = (options.scores[options.side] || 0) - (options.scores[opponentSide] || 0);
    if (scoreDelta > 0) {
      return leadMap.ahead || 0;
    }
    if (scoreDelta < 0) {
      return leadMap.behind || 0;
    }
    return leadMap.tied || 0;
  };
  const getPositionAwareModifierScore = (tile, options = {}) => {
    if (options.positionIndex == null) {
      return 0;
    }

    const positionKey = `pos${options.positionIndex + 1}`;
    const positionBonusByIndex = getModifierDefinition(tile?.status).effects.positionBonusByIndex || {};
    return positionBonusByIndex[positionKey] || 0;
  };
  const isVowelLetter = (letter = '') => ['A', 'E', 'I', 'O', 'U'].includes((letter || '').toUpperCase());
  const getPersonalTileScore = (tile, options = {}) => {
    const personalModifierEffects = options.personalModifierEffects || options.personalModifiers || {};
    const modifierScoreBonus = personalModifierEffects.modifierScoreBonus || {};
    let score = (
      (tile?.score || 0)
      + (tile?.bonusScore || 0)
      + getLeadAwareModifierScore(tile, options)
      + getPositionAwareModifierScore(tile, options)
      + (modifierScoreBonus[tile?.status] || 0)
    );

    if (isVowelLetter(tile?.baseLetter || tile?.letter)) {
      score += personalModifierEffects.vowelScoreBonus || 0;
      score *= personalModifierEffects.vowelScoreMultiplier || 1;
    }

    return score;
  };
  const tileScore = (tile, options = {}) => (
    getPersonalTileScore(tile, options) * (tile?.multiplier || 1)
  );
  const tickIdleTile = (tile) => {
    const definition = getModifierDefinition(tile?.status);
    const idleBonusScoreDelta = definition.effects.idleBonusScoreDelta || 0;

    if (!idleBonusScoreDelta) {
      return tile;
    }

    return {
      ...tile,
      bonusScore: (tile?.bonusScore || 0) + idleBonusScoreDelta
    };
  };

  const getIdleScorePenalty = (tiles = [], usedTileIds = [], options = {}) => {
    const usedIds = new Set(usedTileIds);
    const idlePenaltyMultiplier = options.roundModifierEffects?.idlePenaltyMultiplier || 1;

    return tiles.reduce((total, tile) => {
      if (usedIds.has(tile?.id)) {
        return total;
      }

      const definition = getModifierDefinition(tile?.status);
      return total + ((definition.effects.idleScorePenalty || 0) * idlePenaltyMultiplier);
    }, 0);
  };

  const getLengthBonus = (length) => {
    if (wordBonuses[length]) {
      return wordBonuses[length];
    }

    if (length > 9) {
      return wordBonuses[9] + ((length - 9) * 5);
    }

    return 0;
  };
  const getDifference = (length) =>{
      if (wordBonuses[length]) {
      return wordBonuses[length] - (wordBonuses[length - 1] || 0);
    }
    return 0;
  }

  const getMilestoneReward = (length, options = {}) => {
    const reward = milestoneRewards[length] || milestoneRewards[String(length)] || {};

    return {
      boons: reward.boons || 0,
      attacks: options.includeAttacks === false ? 0 : (reward.attacks || 0)
    };
  };

  const getTilesScore = (tiles, options = {}) => tiles.reduce((total, tile) => total + tileScore(tile, options), 0);
  const isConsonantLetter = (letter = '') => {
    const normalizedLetter = (letter || '').toUpperCase();
    return /^[A-Z]$/.test(normalizedLetter) && !isVowelLetter(normalizedLetter);
  };

  const getZeroedRoundModifierIndexes = (tiles = [], options = {}) => {
    if (!options.roundModifierEffects?.zeroHighestConsonant) {
      return new Set();
    }

    const highestEntry = tiles.reduce((highest, tile, index) => {
      if (!isConsonantLetter(tile?.baseLetter || tile?.letter)) {
        return highest;
      }

      const score = tileScore(tile, options);
      if (!highest || score > highest.score) {
        return { index, score };
      }

      return highest;
    }, null);

    return highestEntry ? new Set([highestEntry.index]) : new Set();
  };

  const getWordScoreDetails = (tiles, options = {}) => {
    const zeroedIndexes = getZeroedRoundModifierIndexes(tiles, options);
    const baseLetterTotal = tiles.reduce((total, tile, index) => {
      if (zeroedIndexes.has(index)) {
        return total;
      }

      return total + tileScore(tile, options);
    }, 0);
    const positionBonus = tiles.reduce((total, tile, index) => {
      const definition = getModifierDefinition(tile?.status);
      const positionKey = `pos${index + 1}`;
      const positionBonusByIndex = definition.effects.positionBonusByIndex || {};
      return total + (positionBonusByIndex[positionKey] || 0);
    }, 0);
    const firstTileBonus = tiles.reduce((total, tile, index) => {
      if (index !== 0) {
        return total;
      }

      return total + tile?.firstTileBonus;
    }, 0);
    const letterTotal = baseLetterTotal + firstTileBonus + positionBonus;
    const lengthBonus = getLengthBonus(tiles.length);
    const wordMultiplier = tiles.reduce((total, tile) => total * (tile?.wordMultiplier || 1), 1);

    return {
      baseLetterTotal,
      positionBonus,
      firstTileBonus,
      letterTotal,
      lengthBonus,
      wordMultiplier,
      total: (letterTotal + lengthBonus) * wordMultiplier
    };
  };

  const getResourceGrants = (tiles = [], options = {}) => {
    const includeAttacks = options.includeAttacks !== false;
    const totals = tiles.reduce((totals, tile) => {
      const definition = getModifierDefinition(tile.status);
      totals.boons += definition.effects.grantBoon || 0;
      totals.attacks += includeAttacks ? (definition.effects.grantAttack || 0) : 0;
      return totals;
    }, { boons: 0, attacks: 0 });

    const milestoneReward = getMilestoneReward(tiles.length, { includeAttacks });
    totals.boons += milestoneReward.boons;
    totals.attacks += milestoneReward.attacks;

    return totals;
  };

  const createCardLogic = ({ createCardId }) => {
      const createCard = (cardKey) => {
      const definition = getCardDefinition(cardKey);

      return {
        id: createCardId(),
        key: cardKey,
        ...definition
      };
    };

    const getCardPool = (kind, options = {}) => {
      if (kind === 'boon') {
        return BOON_CARD_KEYS;
      }

      if (options.deck === 'timed_solo') {
        return TIMED_SOLO_ATTACK_CARD_KEYS;
      }

      return ATTACK_CARD_KEYS.filter((cardKey) => {
        const definition = getCardDefinition(cardKey);
        if (!definition?.requiresBehind) {
          return true;
        }

        if (!options.side || !options.scores) {
          return false;
        }

        const opponentSide = options.side === 'host' ? 'opponent' : 'host';
        return (options.scores[options.side] || 0) < (options.scores[opponentSide] || 0);
      });
    };

    const drawCard = (kind, options = {}) => {
      const cardKey = chooseWeightedCard(getCardPool(kind, options));
      return cardKey ? createCard(cardKey) : null;
    };

    const drawCards = (kind, count = 1, options = {}) => {
      return Array.from({ length: count }, () => drawCard(kind, options)).filter(Boolean);
    };

    const createCards = (cardKeys = []) => {
      return cardKeys.map((cardKey) => createCard(cardKey)).filter(Boolean);
    };

    return {
      createCard,
      drawCard,
      drawCards,
      createCards
    };
  };

  const getTilesForWord = (tiles, word) => {
    const normalizedWord = (word || '').toUpperCase();
    const availableTiles = tiles.filter((tile) => !tile.locked);

    const walk = (remainingWord, remainingTiles, selectedTiles) => {
      if (!remainingWord.length) {
        return selectedTiles;
      }

      for (let index = 0; index < remainingTiles.length; index += 1) {
        const tile = remainingTiles[index];
        const token = tile.letter;
        const nextTiles = remainingTiles.filter((_, tileIndex) => tileIndex !== index);

        if (tile.status === 'wild') {
          const wildcardMatch = walk(remainingWord.slice(1), nextTiles, [...selectedTiles, tile]);
          if (wildcardMatch.length) {
            return wildcardMatch;
          }
          continue;
        }

        if (!remainingWord.startsWith(token)) {
          continue;
        }

        const exactMatch = walk(remainingWord.slice(token.length), nextTiles, [...selectedTiles, tile]);
        if (exactMatch.length) {
          return exactMatch;
        }
      }

      return [];
    };

    return walk(normalizedWord, availableTiles, []);
  };

  const getSelectedTiles = (tiles, tileIds) => {
    if (!Array.isArray(tileIds) || !tileIds.length) {
      return [];
    }

    const selectedTiles = [];
    for (const tileId of tileIds) {
      const tile = tiles.find((entry) => entry.id === tileId);
      if (!tile) {
        return null;
      }
      selectedTiles.push(tile);
    }

    return selectedTiles;
  };

  const selectedTilesMatchWord = (selectedTiles = [], word = '') => {
    let remainingWord = (word || '').toUpperCase();

    for (const tile of selectedTiles) {
      if (!remainingWord.length) {
        return false;
      }

      if (tile.status === 'wild') {
        remainingWord = remainingWord.slice(1);
        continue;
      }

      const token = (tile.letter || '').toUpperCase();
      if (!token || !remainingWord.startsWith(token)) {
        return false;
      }

      remainingWord = remainingWord.slice(token.length);
    }

    return remainingWord.length === 0;
  };

  const createTileAnimationState = (tile, trigger = '') => {
    const animationName = tile?.[trigger] || '';
    if (!animationName) {
      return EMPTY_TILE_ANIMATION_STATE;
    }

    return {
      trigger,
      name: animationName,
      key: `${trigger}-${animationName}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    };
  };

  const attachTileAnimationHooks = (tile, status = 'normal', trigger = '') => {
    const definition = getModifierDefinition(status);
    const animations = definition.animations || {};
    const nextTile = {
      ...tile,
      onPull: animations.onPull || '',
      onNewTurn: animations.onNewTurn || '',
      onSubmit: animations.onSubmit || ''
    };

    return {
      ...nextTile,
      animationState: createTileAnimationState(nextTile, trigger)
    };
  };

  const applyModifierToTile = (tile, status = 'normal', options = {}) => {
    const definition = getModifierDefinition(status);
    const baseScore = letterConfig[tile.letter]?.score || tile.baseScore || tile.score || 0;
    const tileLetter = definition.effects.wild ? '*' : (tile.baseLetter || tile.letter);
    const nextScore = definition.effects.setScore != null ? definition.effects.setScore : baseScore;
    const lockTurns = definition.effects.lockTurns || 0;

    return attachTileAnimationHooks({
      ...tile,
      letter: tileLetter,
      baseLetter: tile.baseLetter || tile.letter,
      score: nextScore,
      baseScore,
      bonusScore: definition.effects.bonusScore || 0,
      multiplier: definition.effects.zeroLetterScore ? 0 : 1,
      wordMultiplier: definition.effects.wordMultiplier || 1,
      firstTileBonus: definition.effects.firstTileBonus || 0,
      locked: lockTurns > 0,
      lockTurns,
      status
    }, status, options.trigger || '');
  };

  const replaceTileWithModifier = (tiles, tileId, status) => {
    return tiles.map((tile) => {
      if (tile.id !== tileId) {
        return tile;
      }

      return applyModifierToTile(tile, status);
    });
  };

  const getRequiredTiles = (tiles = []) => {
    return tiles.filter((tile) => tile.status === 'mustuse' && !tile.locked);
  };

  const tickLockedTile = (tile, options = {}) => {
    if (!tile?.locked) {
      return {
        ...tile,
        animationState: createTileAnimationState(tile, options.trigger || '')
      };
    }

    const nextLockTurns = Math.max(0, (tile.lockTurns || 0) - 1);
    const nextStatus = nextLockTurns > 0 ? tile.status : 'normal';
    const unlockAnimationName = nextStatus === 'normal' ? tile.onNewTurn : '';
    const nextTile = applyModifierToTile({
      ...tile,
      lockTurns: nextLockTurns,
      locked: nextLockTurns > 0
    }, nextStatus, {
      trigger: options.trigger || ''
    });

    if (!unlockAnimationName || options.trigger !== 'onNewTurn') {
      return nextTile;
    }

    return {
      ...nextTile,
      animationState: {
        trigger: options.trigger,
        name: unlockAnimationName,
        key: `${options.trigger}-${unlockAnimationName}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
      }
    };
  };

  const isMissingRequiredTile = (rackTiles = [], selectedTiles = []) => {
    const requiredTiles = getRequiredTiles(rackTiles);

    return requiredTiles.some((requiredTile) => {
      return !selectedTiles.some((selectedTile) => selectedTile.id === requiredTile.id);
    });
  };

  const createTileLogic = ({ createTileId }) => {
    const createTile = (letter = drawLetter(), side = null, scores = {}, forcedStatus = null, chanceOverrides = null) => {
      const baseScore = letterConfig[letter]?.score || 0;
      // in charge of getting the modifier for tiles 
      const status = forcedStatus || rollTileModifier(side, scores, {
        letter,
        baseScore,
        rackTiles: chanceOverrides?.rackTiles || []
      }, chanceOverrides || {});
      const modifierDefinition = getModifierDefinition(status);
      const lockTurns = modifierDefinition.effects.lockTurns || 0;
      const tileLetter = modifierDefinition.effects.wild ? '*' : letter;

      return attachTileAnimationHooks({
        id: createTileId(),
        letter: tileLetter,
        baseLetter: letter,
        score: modifierDefinition.effects.setScore != null ? modifierDefinition.effects.setScore : baseScore,
        baseScore,
        bonusScore: modifierDefinition.effects.bonusScore || 0,
        multiplier: modifierDefinition.effects.zeroLetterScore ? 0 : 1,
        wordMultiplier: modifierDefinition.effects.wordMultiplier || 1,
        firstTileBonus: modifierDefinition.effects.firstTileBonus || 0,
        locked: lockTurns > 0,
        lockTurns,
        status
      }, status, 'onPull');
    };

    const buildFreshRack = (side = null, scores = {}, options = {}) => {
      const rack = [];
      while (rack.length < RACK_SIZE) {
        rack.push(createTile(drawLetter(rack), side, scores, options.forcedStatus || null, {
          ...(options.chanceOverrides || {}),
          rackTiles: rack,
          personalModifierEffects: options.personalModifierEffects || options.chanceOverrides?.personalModifierEffects || {},
          phase: options.phase || options.chanceOverrides?.phase || 'opening',
          turnCount: options.turnCount || 0
        }));
      }
      return rack;
    };

    const countModifierGroups = (tiles = []) => {
      return tiles.reduce((totals, tile) => {
        if (GOOD_MODIFIERS.includes(tile.status)) {
          totals.good += 1;
        }

        if (BAD_MODIFIERS.includes(tile.status)) {
          totals.bad += 1;
        }

        if (NEUTRAL_MODIFIERS.includes(tile.status)) {
          totals.neutral += 1;
        }

        return totals;
      }, { good: 0, bad: 0, neutral: 0 });
    };

    const applyTargetModifierGroup = (rack, modifierPool, targetCount) => {
      for (let appliedCount = 0; appliedCount < targetCount; appliedCount += 1) {
        const candidateIndexes = rack
          .map((tile, index) => ({
            index,
            tile,
            eligibleModifiers: modifierPool.filter((modifier) => canApplyModifier(modifier, {
              letter: tile.baseLetter || tile.letter,
              baseScore: tile.baseScore || letterConfig[tile.baseLetter || tile.letter]?.score || 0,
              rackTiles: rack
            }))
          }))
          .filter((entry) => entry.tile.status === 'normal' && entry.eligibleModifiers.length);

        if (!candidateIndexes.length) {
          return rack;
        }

        const targetEntry = candidateIndexes[Math.floor(Math.random() * candidateIndexes.length)];
        const nextStatus = chooseWeightedModifier(targetEntry.eligibleModifiers);
        rack[targetEntry.index] = applyModifierToTile(rack[targetEntry.index], nextStatus);
      }

      return rack;
    };

    const createClearRack = (currentTiles = [], side = null, scores = {}, options = {}) => {
      const modifierProfile = options.modifierProfile || 'duel';
      const profile = getModifierProfile(modifierProfile);
      const currentModifierCounts = countModifierGroups(currentTiles);
      const targetGoodModifiers = currentModifierCounts.good;
      const targetBadModifiers = Math.max(0, currentModifierCounts.bad - 1);
      const targetNeutralModifiers = currentModifierCounts.neutral;
      const rack = buildFreshRack(side, scores, {
        forcedStatus: 'normal',
        chanceOverrides: {
          modifierProfile,
          turnCount: options.turnCount || 0
        }
      });

      applyTargetModifierGroup(rack, profile.goodModifiers, targetGoodModifiers);
      applyTargetModifierGroup(rack, profile.badModifiers, targetBadModifiers);
      applyTargetModifierGroup(rack, profile.neutralModifiers || [], targetNeutralModifiers);
      return rack;
    };

    const createRack = (side = null, scores = {}, options = {}) => {
      if (options.mode === 'clear') {
        return createClearRack(options.currentTiles || [], side, scores, options);
      }

      return buildFreshRack(side, scores, options);
    };

    const createOpeningRackPair = (scores = {}, options = {}) => {
      const hostRack = [];
      const opponentRack = [];

      while (hostRack.length < RACK_SIZE) {
        const hostLetter = drawLetter(hostRack);
        const opponentLetter = drawLetter(opponentRack);
        const sharedStatus = rollSharedOpeningModifier(scores, [
          { letter: hostLetter, baseScore: letterConfig[hostLetter]?.score || 0, rackTiles: hostRack },
          { letter: opponentLetter, baseScore: letterConfig[opponentLetter]?.score || 0, rackTiles: opponentRack }
        ], {
          ...options,
          turnCount: options.turnCount || 0
        });

        hostRack.push(createTile(hostLetter, 'host', scores, sharedStatus));
        opponentRack.push(createTile(opponentLetter, 'opponent', scores, sharedStatus));
      }

      return {
        host: hostRack,
        opponent: opponentRack
      };
    };

    const refillTiles = (tiles, usedTileIds, side = null, scores = {}, options = {}) => {
      const usedIds = new Set(usedTileIds);
      // remove existing ghost tiles 
      const fleetingAllTiles = Boolean(options.roundModifierEffects?.fleetingAllTiles);
      const ghostIds = new Set(
        tiles
          .filter((tile) => (tile.status === 'ghostTile' || (fleetingAllTiles && tile.status !== 'normal')) && !usedIds.has(tile.id))
          .map((tile) => tile.id)
      );
      const replacedIds = new Set([...usedIds, ...ghostIds]);
      const nextTiles = tiles.map((tile) => {
        if (replacedIds.has(tile.id)) {
          return tile;
        }

        // Surviving tiles can fire their modifier-specific new turn animation hooks here.
        return tickLockedTile(tickIdleTile(tile), { trigger: 'onNewTurn' });
      });

      nextTiles.forEach((tile, index) => {
        if (!replacedIds.has(tile.id)) {
          return;
        }

        const remainingTiles = nextTiles.filter((entry, entryIndex) => {
          return entryIndex !== index && !replacedIds.has(entry.id);
        });

        nextTiles[index] = createTile(drawLetter(remainingTiles), side, scores, null, {
          rackTiles: remainingTiles,
          modifierProfile: options.modifierProfile || 'duel',
          personalModifierEffects: options.personalModifierEffects || {},
          roundModifierEffects: options.roundModifierEffects || {},
          phase: options.phase || 'submit',
          turnCount: options.turnCount || 0
        });
      });
      if(devLogging) console.log(nextTiles) // logs something callled status so modifier is determined by this point 

      return nextTiles;
    };

    const replaceSingleTile = (tiles, replacedTileId, side = null, scores = {}, options = {}) => {
      const targetIndex = tiles.findIndex((tile) => tile.id === replacedTileId);
      if (targetIndex === -1) {
        return tiles;
      }

      const nextTiles = [...tiles];
      const remainingTiles = nextTiles.filter((entry, entryIndex) => entryIndex !== targetIndex);
      nextTiles[targetIndex] = createTile(drawLetter(remainingTiles), side, scores, null, {
        rackTiles: remainingTiles,
        modifierProfile: options.modifierProfile || 'duel',
        personalModifierEffects: options.personalModifierEffects || {},
        phase: options.phase || 'replace',
        turnCount: options.turnCount || 0
      });

      return nextTiles;
    };

    const rerollRackExceptTile = (tiles, keptTileId, side = null, scores = {}, options = {}) => {
      const keptTile = tiles.find((tile) => tile.id === keptTileId);
      if (!keptTile) {
        return tiles;
      }

      const nextTiles = tiles.map((tile) => {
        if (tile.id === keptTileId) {
          return tile;
        }

        return null;
      });

      nextTiles.forEach((tile, index) => {
        if (tile) {
          return;
        }

        const remainingTiles = nextTiles.filter((entry, entryIndex) => entryIndex !== index && entry);
        nextTiles[index] = createTile(drawLetter(remainingTiles), side, scores, null, {
          rackTiles: remainingTiles,
          modifierProfile: options.modifierProfile || 'duel',
          personalModifierEffects: options.personalModifierEffects || {},
          phase: options.phase || 'reroll',
          turnCount: options.turnCount || 0
        });
      });

      return nextTiles;
    };

    const createTestingRack = (side = null, scores = {}, options = {}) => {
      const profile = getModifierProfile(options.modifierProfile || 'duel');
      const allowedStatuses = options.includeAllModifiers
        ? new Set([
            ...profile.goodModifiers,
            ...profile.badModifiers,
            ...(profile.neutralModifiers || [])
          ])
        : new Set([
            ...profile.goodModifiers,
            ...profile.badModifiers,
            ...(profile.neutralModifiers || [])
          ]);
      const modifierStatuses = Object.keys(MODIFIER_DEFINITIONS).filter((status) => status !== 'normal' && allowedStatuses.has(status));
      const rack = [];

      while (rack.length < RACK_SIZE) {
        const forcedStatus = modifierStatuses[rack.length] || 'normal';
        rack.push(createTile(drawLetter(rack), side, scores, forcedStatus, {
          modifierProfile: 'duel',
          rackTiles: rack
        }));
      }

      return rack;
    };

    const createTestingOpeningRackPair = (scores = {}, options = {}) => {
      return {
        host: createTestingRack('host', scores, options),
        opponent: createTestingRack('opponent', scores, options)
      };
    };

    return {
      createTile,
      createRack,
      createClearRack,
      createOpeningRackPair,
      refillTiles,
      replaceSingleTile,
      rerollRackExceptTile,
      createTestingRack,
      createTestingOpeningRackPair
    };
  };

  return {
    LETTER_CONFIG: letterConfig,
    LETTER_KEYS,
    MIN_WORD_LENGTH,
    RACK_SIZE,
    CARD_DEFINITIONS,
    tileScore,
    getLengthBonus,
    getDifference,
    getMilestoneReward,
    getTilesScore,
    getWordScoreDetails,
    getIdleScorePenalty,
    getResourceGrants,
    getTilesForWord,
    getSelectedTiles,
    selectedTilesMatchWord,
    getRequiredTiles,
    isMissingRequiredTile,
    getCardDefinition,
    applyModifierToTile,
    replaceTileWithModifier,
    getModifierBadge,
    getModifierUi,
    getModifierDefinition,
    getModifierDescription,
    MODIFIER_DEFINITIONS,
    createCardLogic,
    createTileLogic
  };
};

const sharedTileLogicApi = {
  createSharedTileLogic
};

if (typeof globalThis !== 'undefined') {
  globalThis.__sharedTileLogic = sharedTileLogicApi;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = sharedTileLogicApi;
}
