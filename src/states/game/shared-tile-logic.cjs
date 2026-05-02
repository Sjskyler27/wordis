
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
  TIMED_SOLO_ATTACK_CARD_KEYS,
  MULTI_ROUND_ATTACK_CARD_KEYS
} = cardDefinitionsApi || {};
const {
  createModifierDefinitions
} = modifierDefinitionsApi || {};


const GOOD_MODIFIERS = ['gold', 'firsttile', 'royalPear', 'twinTile', 'bankTile', 'gainboon', 'gainattack'];
const BAD_MODIFIERS = ['zeroTile', 'mustuse', 'locked3', 'burningTile', 'rustingTile', 'lightningTile', 'barricadeTile', 'bagTile'];
const NEUTRAL_MODIFIERS = ['yinYang', 'ghostTile','bloodTile', 'wild', 'shimmer', 'voidTile', 'leecherTile'];

const createSharedTileLogic = ({ letterConfig, wordBonuses, milestoneRewards = {}, devLogging = false, testing = false }) => {
  const isDevLoggingEnabled = () => typeof devLogging === 'function' ? Boolean(devLogging()) : Boolean(devLogging);
  const LETTER_KEYS = Object.keys(letterConfig);
  const LETTER_POOL = Object.entries(letterConfig).flatMap(([letter, config]) =>
    Array.from({ length: config.count }, () => letter)
  );

  const MIN_WORD_LENGTH = 4;
  const RACK_SIZE = 20;
  const RACK_COLUMNS = 5;
  const DUPLICATE_PENALTY = 0.38;
  const MIN_DUPLICATE_WEIGHT = 0.18;
  const BASE_GOOD_MODIFIER_CHANCE = 0.08;
  const BASE_BAD_MODIFIER_CHANCE = 0.03;
  const BASE_NEUTRAL_MODIFIER_CHANCE = 0.04;
  const BASE_GOOD_MODIFIER_CAP = 0.30;
  const BASE_BAD_MODIFIER_CAP = 0.20;
  const BASE_NEUTRAL_MODIFIER_CAP = 0.2;
  const TOTAL_MODIFIER_CHANCE_CAP = 0.9;
  const MODIFIER_SWING_DEAD_ZONE = 10;
  const MODIFIER_SWING_DIVISOR = 200;
  const MAX_GOOD_MODIFIER_BONUS = 0.24;
  const MAX_BAD_MODIFIER_BONUS = 0.20;
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
  const EMPTY_TILE_ANIMATION_STATE = {
    trigger: '',
    name: '',
    key: ''
  };
  const SHIMMER_INTERVAL_MS = 8000;
  const getNextShimmerCycleIndex = (tile = {}) => (tile.shimmerCycleIndex || 0) + 1;
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
  const drawShimmerLetter = (currentLetter = '', tiles = []) => {
    const current = (currentLetter || '').toUpperCase();
    const weightedPool = getWeightedLetterPool(tiles)
      .filter((entry) => entry.letter.length === 1 && entry.letter !== current);
    const totalWeight = weightedPool.reduce((sum, entry) => sum + entry.weight, 0);

    if (!totalWeight) {
      const singleLetters = LETTER_KEYS.filter((letter) => letter.length === 1 && letter !== current);
      return singleLetters[Math.floor(Math.random() * singleLetters.length)] || 'E';
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
  const getAllowedModifiersForProfile = (modifiers = [], profileName = 'solo') => {
    return modifiers.filter((modifier) => {
      const definition = getModifierDefinition(modifier);
      // return all if logging
      // console.log('PROFILE' + profileName)
      if (testing) {
        return true;
      }
      // currently duel gets everything
      if (profileName === 'solo') {
        return !definition.noSinglePlayer;
      }
      if (isDevLoggingEnabled()) console.log('profile'+ profileName)

      if (profileName === 'duel' || profileName === 'bot') {
        return !definition.noMultiPlayer;
      }

      return !definition.noSinglePlayer && !definition.noMultiPlayer;
    });
  };
  const getCardDefinition = (cardKey) => CARD_DEFINITIONS[normalizeCardKey(cardKey)];
  const getModifierProfile = (profileName = 'solo') => {
    const profile = MODIFIER_PROFILES[profileName] || MODIFIER_PROFILES.duel;

    return {
      ...profile,
      goodModifiers: getAllowedModifiersForProfile(profile.goodModifiers || [], profileName),
      badModifiers: getAllowedModifiersForProfile(profile.badModifiers || [], profileName),
      neutralModifiers: getAllowedModifiersForProfile(profile.neutralModifiers || [], profileName)
    };
  };
  const filterBlockedModifiers = (modifiers = [], personalModifierEffects = {}) => {
    const blockedModifiers = new Set(personalModifierEffects.blockedModifiers || []);
    if (!blockedModifiers.size) {
      return modifiers;
    }

    return modifiers.filter((modifier) => !blockedModifiers.has(modifier));
  };
  const getScoreSwingBonus = (scoreDelta = 0, maxBonus = 0) => {
    const liveDelta = Math.max(0, Math.abs(scoreDelta) - MODIFIER_SWING_DEAD_ZONE);

    return Math.min(maxBonus, liveDelta / MODIFIER_SWING_DIVISOR);
  };

  const getModifierChances = (side, scores = {}, profileName = 'solo', turnCount = 0, options = {}) => {
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
      const catchupBonus = scoreDelta < 0 ? getScoreSwingBonus(scoreDelta, MAX_GOOD_MODIFIER_BONUS) : 0;
      const pressureBonus = scoreDelta > 0 ? getScoreSwingBonus(scoreDelta, MAX_BAD_MODIFIER_BONUS) : 0;

      return {
        goodChance: Math.min(0.45, profile.baseGoodChance + catchupBonus + turnBonus),
        badChance: Math.min(0.4, profile.baseBadChance + pressureBonus + turnBonus),
        neutralChance: Math.min(0.2, profile.baseNeutralChance || 0)
      };
    })();
    baseChances.normalChance = Math.max(
      0,
      1 - baseChances.goodChance - baseChances.badChance - baseChances.neutralChance
    );
    const personalModifierEffects = options.personalModifierEffects || {};
    const roundModifierEffects = options.roundModifierEffects || {};
    const openingGoodChanceBonus = options.phase === 'opening'
      ? (personalModifierEffects.openingGoodChanceBonus || 0)
      : 0;
    const goodChanceBonus = (personalModifierEffects.goodChanceBonus || 0) + (roundModifierEffects.goodChanceBonus || 0);
    const badChanceBonus = (personalModifierEffects.badChanceBonus || 0) + (roundModifierEffects.badChanceBonus || 0);
    const neutralChanceBonus = (personalModifierEffects.neutralChanceBonus || 0) + (roundModifierEffects.neutralChanceBonus || 0);
    const badChanceMultiplier = Math.max(0, personalModifierEffects.badChanceMultiplier ?? 1);
    const goodChanceCap = Math.max(0, Math.min(TOTAL_MODIFIER_CHANCE_CAP, BASE_GOOD_MODIFIER_CAP + (personalModifierEffects.goodChanceCapDelta || 0) + (roundModifierEffects.goodChanceCapDelta || 0)));
    const badChanceCap = Math.max(0, Math.min(TOTAL_MODIFIER_CHANCE_CAP, BASE_BAD_MODIFIER_CAP + (personalModifierEffects.badChanceCapDelta || 0) + (roundModifierEffects.badChanceCapDelta || 0)));
    const neutralChanceCap = Math.max(0, Math.min(TOTAL_MODIFIER_CHANCE_CAP, BASE_NEUTRAL_MODIFIER_CAP + (personalModifierEffects.neutralChanceCapDelta || 0) + (roundModifierEffects.neutralChanceCapDelta || 0)));
    const chanceCaps = {
      goodChanceCap,
      badChanceCap,
      neutralChanceCap,
      totalChanceCap: TOTAL_MODIFIER_CHANCE_CAP
    };
    const goodChance = Math.max(
      0,
      Math.min(
        TOTAL_MODIFIER_CHANCE_CAP,
        goodChanceCap,
        options.goodChance ?? ((baseChances.goodChance * (options.goodChanceMultiplier ?? 1)) + openingGoodChanceBonus + goodChanceBonus)
      )
    );
    const badChance = Math.max(
      0,
      Math.min(
        TOTAL_MODIFIER_CHANCE_CAP - goodChance,
        badChanceCap,
        options.badChance ?? ((baseChances.badChance * (options.badChanceMultiplier ?? 1) * badChanceMultiplier) + badChanceBonus)
      )
    );
    const neutralChance = Math.max(
      0,
      Math.min(
        TOTAL_MODIFIER_CHANCE_CAP - goodChance - badChance,
        neutralChanceCap,
        options.neutralChance ?? ((baseChances.neutralChance * (options.neutralChanceMultiplier ?? 1)) + neutralChanceBonus)
      )
    );
    const normalChance = Math.max(0, 1 - goodChance - badChance - neutralChance);
    const chanceBonuses = {
      goodChanceBonus,
      badChanceBonus,
      neutralChanceBonus,
      openingGoodChanceBonus
    };

    if (isDevLoggingEnabled()) {
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
        chanceCaps: formatChanceGroup(chanceCaps),
        finalChances: {
          good: formatChancePercent(goodChance),
          bad: formatChancePercent(badChance),
          neutral: formatChancePercent(neutralChance),
          normal: formatChancePercent(normalChance)
        }
      });
    }

    return {
      ...baseChances,
      baseChances,
      goodChance,
      badChance,
      neutralChance,
      chanceBonuses,
      chanceCaps
    };
  };

  const hasModifierInRack = (rackTiles = [], status = 'normal') => {
    return rackTiles.some((tile) => tile.status === status);
  };
  const isSingleLetterTile = (tileOrLetter = '') => {
    const letter = typeof tileOrLetter === 'string'
      ? tileOrLetter
      : (tileOrLetter?.baseLetter || tileOrLetter?.letter || '');
    return letter.length === 1;
  };
  const canApplyModifier = (status = 'normal', context = {}) => {
    status = normalizeModifierStatus(status);

    if (status === 'mustuse' && hasModifierInRack(context.rackTiles || [], 'mustuse')) {
      return false;
    }

    if (status === 'mustuse' && !isSingleLetterTile(context.letter || '')) {
      return false;
    }

    const definition = getModifierDefinition(status);

    if (typeof definition.canApply !== 'function') {
      return true;
    }

    return definition.canApply(context);
  };

  const getModifierRackCount = (rackTiles = [], status = 'normal') => {
    const normalizedStatus = normalizeModifierStatus(status);
    return rackTiles.filter((tile) => normalizeModifierStatus(tile?.status) === normalizedStatus).length;
  };
  const getContextualRarityWeightBonus = (modifier = 'normal', context = {}) => {
    const rarityWeightModifiers = getModifierDefinition(modifier).rarityWeightModifiers || {};
    const whenOneIsInHand = Number(rarityWeightModifiers.whenOneIsInHand) || 0;
    if (!whenOneIsInHand) {
      return 0;
    }

    const rackCount = getModifierRackCount(context.rackTiles || [], modifier);
    const capForAddingBonus = Number.isFinite(Number(rarityWeightModifiers.capForAddingBonus))
      ? Number(rarityWeightModifiers.capForAddingBonus)
      : Infinity;

    return rackCount > 0 && rackCount < capForAddingBonus ? whenOneIsInHand : 0;
  };
  const getModifierWeight = (modifier = 'normal', weightBonuses = {}, context = {}) => {
    return Math.max(
      0,
      (getModifierDefinition(modifier).rarityWeight ?? 1)
        + (weightBonuses[modifier] || 0)
        + getContextualRarityWeightBonus(modifier, context)
    );
  };

  const chooseWeightedModifier = (modifiers = [], weightBonuses = {}, context = {}) => {
    const weightedModifiers = modifiers
      .map((modifier) => ({
        modifier,
        weight: getModifierWeight(modifier, weightBonuses, context)
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

  const getWeightedModifierOdds = (modifiers = [], poolChance = 0, weightBonuses = {}, context = {}) => {
    const weightedModifiers = modifiers
      .map((modifier) => ({
        modifier,
        weight: getModifierWeight(modifier, weightBonuses, context)
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
  const addWeightedOdds = (target = {}, odds = {}, multiplier = 1) => {
    Object.entries(odds).forEach(([key, chance]) => {
      target[key] = (target[key] || 0) + (chance * multiplier);
    });
  };
  const getLetterPullOdds = (rackTiles = []) => {
    const weightedPool = getWeightedLetterPool(rackTiles);
    const totalWeight = weightedPool.reduce((total, entry) => total + entry.weight, 0);

    if (!totalWeight) {
      return {};
    }

    return weightedPool.reduce((odds, entry) => {
      odds[entry.letter] = (odds[entry.letter] || 0) + (entry.weight / totalWeight);
      return odds;
    }, {});
  };
  const getModifierPullOddsSnapshot = ({
    rackTiles = [],
    profile = {},
    goodChance = 0,
    badChance = 0,
    neutralChance = 0,
    modifierOddsBonus = {}
  }) => {
    const groupedOdds = {
      good: {},
      bad: {},
      neutral: {},
      normal: {}
    };
    const letterOdds = getLetterPullOdds(rackTiles);

    Object.entries(letterOdds).forEach(([letter, letterChance]) => {
      const context = {
        letter,
        baseScore: letterConfig[letter]?.score || 0,
        rackTiles
      };
      const eligibleGoodModifiers = (profile.goodModifiers || []).filter((modifier) => canApplyModifier(modifier, context));
      const eligibleBadModifiers = (profile.badModifiers || []).filter((modifier) => canApplyModifier(modifier, context));
      const eligibleNeutralModifiers = (profile.neutralModifiers || []).filter((modifier) => canApplyModifier(modifier, context));
      const goodOdds = getWeightedModifierOdds(eligibleGoodModifiers, goodChance, modifierOddsBonus, context);
      const badOdds = getWeightedModifierOdds(eligibleBadModifiers, badChance, modifierOddsBonus, context);
      const neutralOdds = getWeightedModifierOdds(eligibleNeutralModifiers, neutralChance, modifierOddsBonus, context);
      const letterModifierChance = [
        ...Object.values(goodOdds),
        ...Object.values(badOdds),
        ...Object.values(neutralOdds)
      ].reduce((total, chance) => total + chance, 0);

      addWeightedOdds(groupedOdds.good, goodOdds, letterChance);
      addWeightedOdds(groupedOdds.bad, badOdds, letterChance);
      addWeightedOdds(groupedOdds.neutral, neutralOdds, letterChance);
      groupedOdds.normal.normal = (groupedOdds.normal.normal || 0) + (Math.max(0, 1 - letterModifierChance) * letterChance);
    });

    return {
      groupedOdds,
      letterOdds
    };
  };

  const getModifierOddsSnapshot = ({
    goodChance,
    badChance,
    neutralChance,
    modifierOddsBonus = {},
    context = {},
    eligibleGoodModifiers = [],
    eligibleBadModifiers = [],
    eligibleNeutralModifiers = []
  }) => {

    if (!isDevLoggingEnabled()) {
      return;
    }

    const modifierOdds = {
      ...getWeightedModifierOdds(eligibleGoodModifiers, goodChance, modifierOddsBonus, context),
      ...getWeightedModifierOdds(eligibleBadModifiers, badChance, modifierOddsBonus, context),
      ...getWeightedModifierOdds(eligibleNeutralModifiers, neutralChance, modifierOddsBonus, context)
    };
    const normalChance = Math.max(
      0,
      1 - Object.values(modifierOdds).reduce((sum, chance) => sum + chance, 0)
    );
    return {
      goodModifierOdds: getWeightedModifierOdds(eligibleGoodModifiers, goodChance, modifierOddsBonus, context),
      badModifierOdds: getWeightedModifierOdds(eligibleBadModifiers, badChance, modifierOddsBonus, context),
      neutralModifierOdds: getWeightedModifierOdds(eligibleNeutralModifiers, neutralChance, modifierOddsBonus, context),
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
    chanceCaps = null,
    modifierOddsBonus = {},
    profile = {},
    eligibleGoodModifiers = [],
    eligibleBadModifiers = [],
    eligibleNeutralModifiers = [],
  }) => {
    if (!isDevLoggingEnabled()) {
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
      context,
      eligibleGoodModifiers,
      eligibleBadModifiers,
      eligibleNeutralModifiers
    });
    const pullOdds = getModifierPullOddsSnapshot({
      rackTiles: context.rackTiles || [],
      profile,
      goodChance,
      badChance,
      neutralChance,
      modifierOddsBonus
    });

    console.log('[tile and letter odds]', {
      pullOdds: {
        good: formatChanceGroup(pullOdds.groupedOdds.good),
        bad: formatChanceGroup(pullOdds.groupedOdds.bad),
        neutral: formatChanceGroup(pullOdds.groupedOdds.neutral),
        normal: formatChanceGroup(pullOdds.groupedOdds.normal)
      },
      letterOdds: {
        count: Object.keys(pullOdds.letterOdds).length,
        chances: formatChanceGroup(pullOdds.letterOdds)
      }
    });

    console.log('[modifier-odds]', {
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
      chanceCaps: chanceCaps ? formatChanceGroup(chanceCaps) : null,
      modifierOdds: {
        good: formatChanceGroup(goodModifierOdds),
        bad: formatChanceGroup(badModifierOdds),
        neutral: formatChanceGroup(neutralModifierOdds)
      }
    });
  };

  const formatCardChancePercent = (chance) => `${(chance * 100).toFixed(1)}%`;
  const getHeldCardCounts = (heldCards = []) => {
    return heldCards.reduce((counts, card) => {
      const cardKey = typeof card === 'string' ? card : card?.key;
      if (cardKey) {
        counts[cardKey] = (counts[cardKey] || 0) + 1;
      }
      return counts;
    }, {});
  };

  const chooseWeightedCard = (cardKeys = [], options = {}) => {
    const heldCardCounts = getHeldCardCounts(options.heldCards || []);
    const weightedCards = cardKeys
      .map((cardKey) => {
        const baseWeight = Math.max(0, getCardDefinition(cardKey)?.rarityWeight ?? 1);
        const heldCount = heldCardCounts[cardKey] || 0;
        const duplicateMultiplier = heldCount > 0 ? Math.pow(0.22, heldCount) : 1;
        return {
          cardKey,
          baseWeight,
          heldCount,
          weight: baseWeight * duplicateMultiplier
        };
      })
      .filter((entry) => entry.weight > 0);

    if (!weightedCards.length) {
      return null;
    }

    const totalWeight = weightedCards.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = Math.random() * totalWeight;
    let selectedCardKey = weightedCards[weightedCards.length - 1].cardKey;

    for (const entry of weightedCards) {
      roll -= entry.weight;
      if (roll <= 0) {
        selectedCardKey = entry.cardKey;
        break;
      }
    }

    console.log('[card-chances]', {
      kind: options.kind || 'card',
      deck: options.deck || 'default',
      side: options.side || 'unknown',
      selected: selectedCardKey,
      totalWeight: Number(totalWeight.toFixed(3)),
      chances: weightedCards.reduce((chances, entry) => {
        chances[entry.cardKey] = {
          chance: formatCardChancePercent(entry.weight / totalWeight),
          weight: Number(entry.weight.toFixed(3)),
          baseWeight: Number(entry.baseWeight.toFixed(3)),
          heldCount: entry.heldCount
        };
        return chances;
      }, {})
    });

    return selectedCardKey;
  };

  const rollTileModifier = (side, scores = {}, context = {}, chanceOverrides = {}) => {
    const modifierProfile = chanceOverrides.modifierProfile || 'solo';
    if (isDevLoggingEnabled()) console.log('ROLL MODIFIER FOR '+ side + 'on'+modifierProfile )
    
    const personalModifierEffects = chanceOverrides.personalModifierEffects || {};
    if (isDevLoggingEnabled()) console.log(modifierProfile)
    const baseProfile = getModifierProfile(modifierProfile);
    const profile = {
      ...baseProfile,
      goodModifiers: filterBlockedModifiers(baseProfile.goodModifiers, personalModifierEffects),
      badModifiers: filterBlockedModifiers(baseProfile.badModifiers, personalModifierEffects),
      neutralModifiers: filterBlockedModifiers(baseProfile.neutralModifiers || [], personalModifierEffects)
    };
    const modifierOddsBonus = personalModifierEffects.modifierOddsBonus || {};
    const {
      goodChance,
      badChance,
      neutralChance,
      baseChances,
      chanceBonuses,
      chanceCaps
    } = getModifierChances(side, scores, modifierProfile, chanceOverrides.turnCount || 0, chanceOverrides);
    const roll = Math.random();

    const eligibleGoodModifiers = profile.goodModifiers.filter((modifier) => canApplyModifier(modifier, context));
    const eligibleBadModifiers = profile.badModifiers.filter((modifier) => canApplyModifier(modifier, context));
    const eligibleNeutralModifiers = (profile.neutralModifiers || []).filter((modifier) => canApplyModifier(modifier, context));

    let selectedModifier = 'normal';
    if (roll < goodChance) {
      selectedModifier = eligibleGoodModifiers.length ? chooseWeightedModifier(eligibleGoodModifiers, modifierOddsBonus, context) : 'normal';
    } else if (roll < goodChance + badChance) {
      selectedModifier = eligibleBadModifiers.length ? chooseWeightedModifier(eligibleBadModifiers, modifierOddsBonus, context) : 'normal';
    } else if (roll < goodChance + badChance + neutralChance) {
      selectedModifier = eligibleNeutralModifiers.length ? chooseWeightedModifier(eligibleNeutralModifiers, modifierOddsBonus, context) : 'normal';
    }

    logModifierRoll({
      context,
      roll,
      goodChance,
      badChance,
      neutralChance,
      baseChances,
      chanceBonuses,
      chanceCaps,
      modifierOddsBonus,
      profile,
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
      return eligibleGoodModifiers.length ? chooseWeightedModifier(eligibleGoodModifiers, {}, contexts[0] || {}) : 'normal';
    }

    if (roll < goodChance + badChance) {
      return eligibleBadModifiers.length ? chooseWeightedModifier(eligibleBadModifiers, {}, contexts[0] || {}) : 'normal';
    }

    if (roll < goodChance + badChance + neutralChance) {
      return eligibleNeutralModifiers.length ? chooseWeightedModifier(eligibleNeutralModifiers, {}, contexts[0] || {}) : 'normal';
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
  const hasTwinLetterInWord = (tile, wordTiles = []) => {
    if (!tile || tile.status !== 'twinTile') {
      return false;
    }

    const letter = (tile.baseLetter || tile.letter || '').toUpperCase();
    return Boolean(letter) && wordTiles.some((wordTile) => {
      return wordTile.id !== tile.id && (wordTile.baseLetter || wordTile.letter || '').toUpperCase() === letter;
    });
  };
  const getTwinLetterBonus = (tile, options = {}) => {
    const bonus = getModifierDefinition(tile?.status).effects.twinLetterBonus || 0;
    return bonus && hasTwinLetterInWord(tile, options.wordTiles || []) ? bonus : 0;
  };
  const hasVoidTileInWord = (wordTiles = []) => wordTiles.some((wordTile) => wordTile?.status === 'voidTile');
  const getVoidTileBonus = (tile, options = {}) => {
    const bonus = getModifierDefinition(tile?.status).effects.voidSelfBonus || 0;
    return bonus && hasVoidTileInWord(options.wordTiles || []) ? bonus : 0;
  };
  const isVoidZeroedTile = (tile, wordTiles = []) => tile?.status !== 'voidTile' && hasVoidTileInWord(wordTiles);
  const isVowelLetter = (letter = '') => ['A', 'E', 'I', 'O', 'U'].includes((letter || '').toUpperCase());
  const getTimedWordTierIndex = (elapsedSeconds = 0, config = {}) => {
    const graceSeconds = Math.max(0, Number(config.graceSeconds) || 0);
    const intervalSeconds = Math.max(0.001, Number(config.intervalSeconds) || 1);
    const effectiveSeconds = Math.max(0, (Number(elapsedSeconds) || 0) - graceSeconds);

    return Math.max(0, Math.floor(effectiveSeconds / intervalSeconds));
  };
  const getTimedWordMultiplier = (elapsedSeconds = 0, personalModifierEffects = {}) => {
    return (personalModifierEffects.timedWordMultipliers || []).reduce((highestMultiplier, config) => {
      const multipliers = Array.isArray(config?.multipliers) ? config.multipliers : [];
      const tierIndex = getTimedWordTierIndex(elapsedSeconds, config);
      const multiplier = multipliers[tierIndex] ?? config?.finalMultiplier ?? 1;

      return Math.max(highestMultiplier, Number(multiplier) || 1);
    }, 1);
  };
  const getTimedWordScoreBonus = (elapsedSeconds = 0, personalModifierEffects = {}) => {
    return (personalModifierEffects.timedWordScoreBonuses || []).reduce((totalBonus, config) => {
      const bonuses = Array.isArray(config?.bonuses) ? config.bonuses : [];
      const tierIndex = getTimedWordTierIndex(elapsedSeconds, config);
      const bonus = bonuses[tierIndex] ?? config?.finalBonus ?? 0;

      return totalBonus + (Number(bonus) || 0);
    }, 0);
  };
  const getPersonalTileScore = (tile, options = {}) => {
    if (isVoidZeroedTile(tile, options.wordTiles || [])) {
      return 0;
    }
    if (tile?.leecherDrained) {
      return 0;
    }

    const personalModifierEffects = options.personalModifierEffects || options.personalModifiers || {};
    const modifierScoreBonus = personalModifierEffects.modifierScoreBonus || {};
    let score = (
      (tile?.score || 0)
      + (tile?.bonusScore || 0)
      + getLeadAwareModifierScore(tile, options)
      + getPositionAwareModifierScore(tile, options)
      + getTwinLetterBonus(tile, options)
      + getVoidTileBonus(tile, options)
      + (tile?.leecherAbsorbedScore || 0)
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
  const clearRackManipulationScoreState = (tile = {}) => {
    if (!tile?.leecherDrained && !tile?.leecherAbsorbedScore) {
      return tile;
    }

    const {
      leecherDrained,
      leecherAbsorbedScore,
      ...rest
    } = tile;
    return rest;
  };
  const getAdjacentRackIndexes = (index, tilesLength = 0, columnCount = RACK_COLUMNS) => {
    const row = Math.floor(index / columnCount);
    const col = index % columnCount;
    const indexes = [];
    const cardinalOffsets = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1]
    ];

    cardinalOffsets.forEach(([rowDelta, colDelta]) => {
      const nextRow = row + rowDelta;
      const nextCol = col + colDelta;
      const nextIndex = (nextRow * columnCount) + nextCol;
      if (nextRow >= 0 && nextCol >= 0 && nextCol < columnCount && nextIndex >= 0 && nextIndex < tilesLength) {
        indexes.push(nextIndex);
      }
    });

    return indexes;
  };
  const applyRackManipulationEffects = (tiles = [], options = {}) => {
    if (!Array.isArray(tiles) || !tiles.length) {
      return tiles;
    }

    const leecherScoresById = new Map();
    const drainedTileIds = new Set();
    const baseTiles = tiles.map(clearRackManipulationScoreState);
    const selectedTileIds = options.selectedTileIds || new Set();

    baseTiles.forEach((tile, index) => {
      if (tile?.status !== 'leecherTile') {
        return;
      }
      if (selectedTileIds.has(tile.id) && tile.leechesAdjacentWhileSelected === false) {
        return;
      }

      const absorbedScore = getAdjacentRackIndexes(index, baseTiles.length)
        .reduce((total, adjacentIndex) => {
          const adjacentTile = baseTiles[adjacentIndex];
          if (!adjacentTile?.id || adjacentTile.id === tile.id) {
            return total;
          }

          drainedTileIds.add(adjacentTile.id);
          return total + Math.max(0, tileScore(adjacentTile, {
            ...options,
            wordTiles: []
          }));
        }, 0);

      if (absorbedScore) {
        leecherScoresById.set(tile.id, absorbedScore);
      }
    });

    if (!leecherScoresById.size && !drainedTileIds.size) {
      return tiles;
    }

    return baseTiles.map((tile) => {
      const leecherAbsorbedScore = leecherScoresById.get(tile?.id) || 0;
      const leecherDrained = drainedTileIds.has(tile?.id) && tile?.status !== 'leecherTile';
      if (!leecherAbsorbedScore && !leecherDrained) {
        return tile;
      }

      return {
        ...tile,
        leecherDrained: leecherDrained || undefined,
        leecherAbsorbedScore: leecherAbsorbedScore || undefined
      };
    });
  };
  const tickIdleTile = (tile, options = {}) => {
    const definition = getModifierDefinition(tile?.status);
    const personalModifierEffects = options.personalModifierEffects || options.personalModifiers || {};
    const roundModifierEffects = options.roundModifierEffects || {};
    const idleBonusScoreDeltaBonus = personalModifierEffects.idleBonusScoreDeltaBonus || {};
    const rustScoreDelta = definition.effects.rustScoreDelta || 0;
    const rustMaxTurns = definition.effects.rustMaxTurns || 0;
    const canRust = rustScoreDelta && rustMaxTurns && (tile?.rustTurns || 0) < rustMaxTurns;
    const idleBonusScoreDelta = (definition.effects.idleBonusScoreDelta || 0)
      + (idleBonusScoreDeltaBonus[tile?.status] || 0)
      + (roundModifierEffects.idleScoreDelta || 0)
      + (canRust ? rustScoreDelta : 0);

    if (!idleBonusScoreDelta) {
      return tile;
    }

    const nextBonusScore = (tile?.bonusScore || 0) + idleBonusScoreDelta;

    return {
      ...tile,
      rustTurns: canRust ? Math.min(rustMaxTurns, (tile?.rustTurns || 0) + 1) : tile?.rustTurns,
      rustMaxTurns: rustMaxTurns || tile?.rustMaxTurns,
      bonusScore: canRust ? nextBonusScore : Math.max(-(tile?.score || 0), nextBonusScore)
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
  const tickShimmerTile = (tile, options = {}) => {
    if (tile?.status !== 'shimmer') {
      return tile;
    }

    const now = options.now || Date.now();
    const intervalMs = tile.shimmerIntervalMs || getModifierDefinition('shimmer').effects.shimmerIntervalMs || SHIMMER_INTERVAL_MS;
    const frozenTileIds = options.frozenTileIds || new Set();

    if (frozenTileIds.has(tile.id)) {
      if (tile.shimmerFrozen && tile.shimmerShiftAt && tile.shimmerShiftAt > now) {
        return tile;
      }

      return {
        ...tile,
        shimmerFrozen: true,
        shimmerIntervalMs: intervalMs,
        shimmerShiftAt: now + intervalMs
      };
    }

    if (tile.shimmerFrozen) {
      return {
        ...tile,
        shimmerFrozen: false,
        shimmerIntervalMs: intervalMs,
        shimmerShiftAt: now + intervalMs,
        shimmerCycleIndex: getNextShimmerCycleIndex(tile)
      };
    }

    const shiftAt = tile.shimmerShiftAt || now + intervalMs;
    if (now < shiftAt) {
      return tile.shimmerShiftAt ? tile : {
        ...tile,
        shimmerIntervalMs: intervalMs,
        shimmerShiftAt: shiftAt
      };
    }

    const nextLetter = drawShimmerLetter(tile.baseLetter || tile.letter, options.rackTiles || []);
    const baseScore = letterConfig[nextLetter]?.score || 0;

    return {
      ...tile,
      letter: nextLetter,
      baseLetter: nextLetter,
      score: baseScore,
      baseScore,
      bonusScore: getModifierDefinition('shimmer').effects.bonusScore || 1,
      shimmerFrozen: false,
      shimmerIntervalMs: intervalMs,
      shimmerShiftAt: now + intervalMs,
      shimmerCycleIndex: getNextShimmerCycleIndex(tile),
      animationState: {
        trigger: 'timer',
        name: 'shimmer-shift',
        key: `timer-shimmer-shift-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
      }
    };
  };
  const tickShimmerTiles = (tiles = [], options = {}) => {
    let changed = false;
    const nextTiles = tiles.map((tile) => {
      const nextTile = tickShimmerTile(tile, {
        ...options,
        rackTiles: tiles
      });

      if (nextTile !== tile) {
        changed = true;
      }

      return nextTile;
    });

    return changed ? nextTiles : tiles;
  };
  const tickLightningTiles = (tiles = [], options = {}) => {
    const now = options.now || Date.now();
    let changed = false;
    let scorePenalty = 0;

    const nextTiles = tiles.map((tile) => {
      if (tile?.status !== 'lightningTile') {
        return tile;
      }

      const definition = getModifierDefinition('lightningTile');
      const intervalMs = tile.lightningIntervalMs || definition.effects.lightningIntervalMs || 3000;
      const strikeAt = tile.lightningStrikeAt || now + intervalMs;

      if (now < strikeAt) {
        if (tile.lightningStrikeAt) {
          return tile;
        }

        changed = true;
        return {
          ...tile,
          lightningIntervalMs: intervalMs,
          lightningStrikeAt: strikeAt
        };
      }

      changed = true;
      scorePenalty += definition.effects.lightningScorePenalty || 1;
      return {
        ...tile,
        lightningIntervalMs: intervalMs,
        lightningStrikeAt: now + intervalMs,
        lightningStrikeCount: (tile.lightningStrikeCount || 0) + 1
      };
    });

    return {
      tiles: changed ? nextTiles : tiles,
      scorePenalty
    };
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

      const score = tileScore(tile, {
        ...options,
        wordTiles: tiles
      });
      if (!highest || score > highest.score) {
        return { index, score };
      }

      return highest;
    }, null);

    return highestEntry ? new Set([highestEntry.index]) : new Set();
  };

  const isDisabledGold = (tiles, tile) => {

  // get selected gold ids
  const goldIds = tiles
    .filter(t => t.status === 'gold')
    .map(t => t.id);

  if(!goldIds.length) return false;

  // get all royals
  const royals = new Set(tiles.filter(t => t.status === 'royalPear'));

  // if 2 or more royals all golds disabled
  if (royals.size>1){
    return tile.status === 'gold'
  }

  // if 2 or more golds, don't disable the first selected gold
  if (goldIds.length > 1) {
    const [, ...disabledGoldIds] = goldIds;
    return disabledGoldIds.includes(tile.id);
  }

  return false;
};

  const getWordScoreDetails = (tiles, options = {}) => {
    const personalModifierEffects = options.personalModifierEffects || options.personalModifiers || {};
    const lengthScoreBonus = personalModifierEffects.lengthScoreBonus || {};
    const lengthScoreMultiplier = personalModifierEffects.lengthScoreMultiplier || {};
    const zeroedIndexes = getZeroedRoundModifierIndexes(tiles, options);
    const baseLetterTotal = tiles.reduce((total, tile, index) => {
      if (zeroedIndexes.has(index)) {
        return total;
      }

      return total + tileScore(tile, {
        ...options,
        wordTiles: tiles
      });
    }, 0);
    const positionBonus = tiles.reduce((total, tile, index) => {
      if (isVoidZeroedTile(tile, tiles)) {
        return total;
      }

      const definition = getModifierDefinition(tile?.status);
      const positionKey = `pos${index + 1}`;
      const positionBonusByIndex = definition.effects.positionBonusByIndex || {};
      return total + (positionBonusByIndex[positionKey] || 0);
    }, 0);
    const firstTileBonus = tiles.reduce((total, tile, index) => {
      if (index !== 0) {
        return total;
      }
      if (isVoidZeroedTile(tile, tiles)) {
        return total;
      }

      const firstTileBonusByModifier = personalModifierEffects.firstTileBonusByModifier || {};
      return total + tile?.firstTileBonus + (firstTileBonusByModifier[tile?.status] || 0);
    }, 0);
    const letterTotal = baseLetterTotal + firstTileBonus + positionBonus;
    const personalLengthBonus = lengthScoreBonus[tiles.length] || lengthScoreBonus[String(tiles.length)] || 0;
    const lengthBonus = getLengthBonus(tiles.length) + personalLengthBonus;
    // we need to know if a gold tile is disabled 


    const baseWordMultiplier = tiles.reduce((total, tile) => total * (isDisabledGold(tiles, tile) ? 1 :  tile?.wordMultiplier || 1), 1);
    const comboWordMultiplier = Object.values(tiles.reduce((combos, tile) => {
      const pairWordMultiplier = getModifierDefinition(tile?.status).effects.pairWordMultiplier;
      if (!pairWordMultiplier?.status) {
        return combos;
      }

      const combo = combos[pairWordMultiplier.status] || {
        count: 0,
        neededCount: pairWordMultiplier.count || 2,
        multiplier: pairWordMultiplier.multiplier || 1
      };
      combos[pairWordMultiplier.status] = {
        ...combo,
        count: combo.count + 1
      };
      return combos;
    }, {})).reduce((total, combo) => {
      return combo.count >= combo.neededCount ? total * combo.multiplier : total;
    }, 1);
    const wordMultiplier = baseWordMultiplier * comboWordMultiplier;
    const personalLengthMultiplier = lengthScoreMultiplier[tiles.length] || lengthScoreMultiplier[String(tiles.length)] || 1;
    const timedWordMultiplier = getTimedWordMultiplier(options.wordElapsedSeconds, personalModifierEffects);
    const timedWordScoreBonus = getTimedWordScoreBonus(options.wordElapsedSeconds, personalModifierEffects);
    const total = ((letterTotal + lengthBonus) * wordMultiplier * personalLengthMultiplier * timedWordMultiplier) + timedWordScoreBonus;

    return {
      baseLetterTotal,
      positionBonus,
      firstTileBonus,
      letterTotal,
      lengthBonus,
      wordMultiplier: wordMultiplier * timedWordMultiplier,
      total
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

      if (options.deck === 'multi_round') {
        return MULTI_ROUND_ATTACK_CARD_KEYS;
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
      const cardKey = chooseWeightedCard(getCardPool(kind, options), {
        ...options,
        kind
      });
      return cardKey ? createCard(cardKey) : null;
    };

    const drawCards = (kind, count = 1, options = {}) => {
      const drawnCards = [];
      for (let index = 0; index < count; index += 1) {
        const card = drawCard(kind, {
          ...options,
          heldCards: [
            ...(options.heldCards || []),
            ...drawnCards
          ]
        });
        if (card) {
          drawnCards.push(card);
        }
      }
      return drawnCards;
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

  const getModifierStartingScore = (modifierEffects = {}, baseScore = 0) => {
    if (modifierEffects.setScore != null) {
      return modifierEffects.setScore;
    }

    if (modifierEffects.startWithHalfScoreRoundedDown) {
      return Math.floor(baseScore / 2);
    }

    if (modifierEffects.startWithHalfScoreRoundedUp) {
      return Math.ceil(baseScore / 2);
    }

    return baseScore;
  };
  const getModifierTileState = (tile = {}, definition = {}, status = 'normal', options = {}) => {
    const effects = definition.effects || {};
    const state = {};

    if (effects.shimmerIntervalMs) {
      const intervalMs = effects.shimmerIntervalMs || SHIMMER_INTERVAL_MS;
      state.shimmerIntervalMs = intervalMs;
      state.shimmerShiftAt = options.shimmerShiftAt || tile.shimmerShiftAt || Date.now() + intervalMs;
      state.shimmerFrozen = false;
      state.shimmerCycleIndex = tile.shimmerCycleIndex || 0;
    } else {
      state.shimmerIntervalMs = undefined;
      state.shimmerShiftAt = undefined;
      state.shimmerFrozen = undefined;
      state.shimmerCycleIndex = undefined;
    }

    if (effects.rustMaxTurns) {
      state.rustTurns = Math.max(0, tile.rustTurns || 0);
      state.rustMaxTurns = effects.rustMaxTurns;
    } else if (status !== tile.status) {
      state.rustTurns = undefined;
      state.rustMaxTurns = undefined;
    }

    if (effects.lightningIntervalMs) {
      const intervalMs = effects.lightningIntervalMs || 3000;
      state.lightningIntervalMs = intervalMs;
      state.lightningStrikeAt = options.lightningStrikeAt || tile.lightningStrikeAt || Date.now() + intervalMs;
      state.lightningStrikeCount = tile.lightningStrikeCount || 0;
    } else if (status !== tile.status) {
      state.lightningIntervalMs = undefined;
      state.lightningStrikeAt = undefined;
      state.lightningStrikeCount = undefined;
    }

    if (effects.blocksAdjacentRackTiles) {
      state.blocksAdjacentWhileSelected = effects.blocksAdjacentWhileSelected ?? true;
    } else if (status !== tile.status) {
      state.blocksAdjacentWhileSelected = undefined;
    }

    if (effects.leechesAdjacentRackScores) {
      state.leechesAdjacentWhileSelected = effects.leechesAdjacentWhileSelected ?? true;
    } else if (status !== tile.status) {
      state.leechesAdjacentWhileSelected = undefined;
    }

    return state;
  };

  const applyModifierToTile = (tile, status = 'normal', options = {}) => {
    const definition = getModifierDefinition(status);
    const baseScore = letterConfig[tile.letter]?.score || tile.baseScore || tile.score || 0;
    const tileLetter = definition.effects.wild ? '*' : (tile.baseLetter || tile.letter);
    const nextScore = getModifierStartingScore(definition.effects, baseScore);
    const lockTurns = definition.effects.lockTurns || 0;
    const lockRestoreTile = status === 'locked3' && options.preserveTile
      ? {
          ...tile,
          locked: false,
          lockTurns: 0,
          lockRestoreTile: undefined,
          animationState: EMPTY_TILE_ANIMATION_STATE
        }
      : tile.lockRestoreTile;

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
      lockRestoreTile,
      status,
      ...getModifierTileState(tile, definition, status, options)
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
    if (nextLockTurns === 0 && tile.lockRestoreTile) {
      const unlockAnimationName = tile.onNewTurn || '';
      const restoredTile = attachTileAnimationHooks({
        ...tile.lockRestoreTile,
        locked: false,
        lockTurns: 0,
        lockRestoreTile: undefined,
        animationState: createTileAnimationState(tile.lockRestoreTile, options.trigger || '')
      }, tile.lockRestoreTile.status || 'normal', options.trigger || '');

      if (!unlockAnimationName || options.trigger !== 'onNewTurn') {
        return restoredTile;
      }

      return {
        ...restoredTile,
        animationState: {
          trigger: options.trigger,
          name: unlockAnimationName,
          key: `${options.trigger}-${unlockAnimationName}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
        }
      };
    }

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
        score: getModifierStartingScore(modifierDefinition.effects, baseScore),
        baseScore,
        bonusScore: modifierDefinition.effects.bonusScore || 0,
        multiplier: modifierDefinition.effects.zeroLetterScore ? 0 : 1,
        wordMultiplier: modifierDefinition.effects.wordMultiplier || 1,
        firstTileBonus: modifierDefinition.effects.firstTileBonus || 0,
        locked: lockTurns > 0,
        lockTurns,
        status,
        ...getModifierTileState({}, modifierDefinition, status)
      }, status, 'onPull');
    };

    const canForceTurnMustTile = (options = {}) => {
      const roundModifierEffects = options.roundModifierEffects || options.chanceOverrides?.roundModifierEffects || {};
      const personalModifierEffects = options.personalModifierEffects || options.chanceOverrides?.personalModifierEffects || {};
      return Boolean(roundModifierEffects.mustTileEachTurn)
        && !(personalModifierEffects.blockedModifiers || []).includes('mustuse');
    };

    const rackHasAvailableMustTile = (tiles = []) => {
      return tiles.some((tile) => tile.status === 'mustuse' && !tile.locked);
    };

    const drawSingleLetter = (rack = []) => {
      for (let attempt = 0; attempt < 30; attempt += 1) {
        const letter = drawLetter(rack);
        if (isSingleLetterTile(letter)) {
          return letter;
        }
      }

      return LETTER_KEYS.find((letter) => isSingleLetterTile(letter)) || drawLetter(rack);
    };

    const buildFreshRack = (side = null, scores = {}, options = {}) => {
      const rack = [];
      const forceOpeningMust = canForceTurnMustTile(options);
      while (rack.length < RACK_SIZE) {
        const forceMust = forceOpeningMust && rack.length === 0;
        rack.push(createTile(forceMust ? drawSingleLetter(rack) : drawLetter(rack), side, scores, forceMust ? 'mustuse' : (options.forcedStatus || null), {
          ...(options.chanceOverrides || {}),
          rackTiles: rack,
          personalModifierEffects: options.personalModifierEffects || options.chanceOverrides?.personalModifierEffects || {},
          roundModifierEffects: options.roundModifierEffects || options.chanceOverrides?.roundModifierEffects || {},
          phase: options.phase || options.chanceOverrides?.phase || 'normal',
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

    const applyTargetModifierGroup = (rack, modifierPool, targetCount, options = {}) => {
      const availableModifierPool = filterBlockedModifiers(modifierPool, options.personalModifierEffects || {});
      for (let appliedCount = 0; appliedCount < targetCount; appliedCount += 1) {
        const candidateIndexes = rack
          .map((tile, index) => ({
            index,
            tile,
            eligibleModifiers: availableModifierPool.filter((modifier) => canApplyModifier(modifier, {
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
        const nextStatus = chooseWeightedModifier(targetEntry.eligibleModifiers, {}, {
          letter: targetEntry.tile.baseLetter || targetEntry.tile.letter,
          baseScore: targetEntry.tile.baseScore || letterConfig[targetEntry.tile.baseLetter || targetEntry.tile.letter]?.score || 0,
          rackTiles: rack
        });
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
        personalModifierEffects: options.personalModifierEffects || {},
        roundModifierEffects: options.roundModifierEffects || {},
        chanceOverrides: {
          modifierProfile,
          personalModifierEffects: options.personalModifierEffects || {},
          roundModifierEffects: options.roundModifierEffects || {},
          turnCount: options.turnCount || 0
        }
      });

      applyTargetModifierGroup(rack, profile.goodModifiers, targetGoodModifiers, options);
      applyTargetModifierGroup(rack, profile.badModifiers, targetBadModifiers, options);
      applyTargetModifierGroup(rack, profile.neutralModifiers || [], targetNeutralModifiers, options);
      return rack;
    };

    const createRack = (side = null, scores = {}, options = {}) => {
      if (options.mode === 'clear') {
        const clearRack = createClearRack(options.currentTiles || [], side, scores, options);
        return options.roundModifierEffects?.lockNextColumn
          ? applyRotatingLockColumn(clearRack, options.turnCount || 1)
          : clearRack;
      }

      const rack = buildFreshRack(side, scores, options);
      return options.roundModifierEffects?.lockNextColumn
        ? applyRotatingLockColumn(rack, options.turnCount || 1)
        : rack;
    };

    const shuffleTiles = (tiles = []) => {
      const shuffledTiles = [...tiles];
      for (let index = shuffledTiles.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [shuffledTiles[index], shuffledTiles[swapIndex]] = [shuffledTiles[swapIndex], shuffledTiles[index]];
      }

      return shuffledTiles;
    };

    const applyRotatingLockColumn = (tiles = [], turnCount = 1) => {
      const columnCount = 5;
      const lockedColumnIndex = Math.max(0, (turnCount - 1) % columnCount);

      return tiles.map((tile, index) => {
        if (index % columnCount !== lockedColumnIndex) {
          return tile;
        }

        return applyModifierToTile(tile, 'locked3', { trigger: 'onPull', preserveTile: true });
      });
    };

    const applyTurnMustTile = (tiles = [], options = {}) => {
      if ((options.personalModifierEffects?.blockedModifiers || []).includes('mustuse')) {
        return tiles;
      }

      if (tiles.some((tile) => tile.status === 'mustuse' && !tile.locked)) {
        return tiles;
      }

      const candidates = tiles
        .map((tile, index) => ({ tile, index }))
        .filter(({ tile }) => !tile.locked && tile.status !== 'mustuse');

      if (!candidates.length) {
        return tiles;
      }

      const target = candidates[Math.floor(Math.random() * candidates.length)];
      return tiles.map((tile, index) => {
        return index === target.index ? applyModifierToTile(tile, 'mustuse', { trigger: 'onPull' }) : tile;
      });
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
      const roundModifierEffects = options.roundModifierEffects || {};
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
        return tickLockedTile(tickIdleTile(tile, {
          personalModifierEffects: options.personalModifierEffects || {},
          roundModifierEffects
        }), { trigger: 'onNewTurn' });
      });

      const shouldForceReplacementMust = canForceTurnMustTile(options)
        && !rackHasAvailableMustTile(nextTiles.filter((tile) => !replacedIds.has(tile.id)));
      let forcedReplacementMust = false;

      nextTiles.forEach((tile, index) => {
        if (!replacedIds.has(tile.id)) {
          return;
        }

        const remainingTiles = nextTiles.filter((entry, entryIndex) => {
          return entryIndex !== index && !replacedIds.has(entry.id);
        });

        const forceMust = shouldForceReplacementMust && !forcedReplacementMust;
        nextTiles[index] = createTile(forceMust ? drawSingleLetter(remainingTiles) : drawLetter(remainingTiles), side, scores, forceMust ? 'mustuse' : null, {
          rackTiles: remainingTiles,
          modifierProfile: options.modifierProfile || 'duel',
          personalModifierEffects: options.personalModifierEffects || {},
          roundModifierEffects,
          phase: options.phase || 'submit',
          turnCount: options.turnCount || 0
        });
        if (forceMust) {
          forcedReplacementMust = true;
        }
      });
      if (isDevLoggingEnabled()) console.log(nextTiles) // logs something callled status so modifier is determined by this point 

      let resolvedTiles = nextTiles;
      if (roundModifierEffects.lockNextColumn) {
        resolvedTiles = applyRotatingLockColumn(resolvedTiles, options.turnCount || 1);
      }
      if (roundModifierEffects.shuffleOnSubmit) {
        resolvedTiles = shuffleTiles(resolvedTiles);
      }

      return resolvedTiles;
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
      const modifierStatuses = Object.keys(MODIFIER_DEFINITIONS).filter((status) => {
        const definition = getModifierDefinition(status);
        return status !== 'normal' && allowedStatuses.has(status) && !definition.excludeFromTest;
      });
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
    applyRackManipulationEffects,
    getWordScoreDetails,
    getIdleScorePenalty,
    tickShimmerTiles,
    tickLightningTiles,
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
  createSharedTileLogic,
  BAD_TILES: BAD_MODIFIERS,
  NEUTRAL_TILES: NEUTRAL_MODIFIERS,
  GOOD_TILES: GOOD_MODIFIERS
};

if (typeof globalThis !== 'undefined') {
  globalThis.__sharedTileLogic = sharedTileLogicApi;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = sharedTileLogicApi;
}
