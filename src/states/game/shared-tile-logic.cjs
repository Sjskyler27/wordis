const createSharedTileLogic = ({ letterConfig, wordBonuses }) => {
  const LETTER_KEYS = Object.keys(letterConfig);
  const LETTER_POOL = Object.entries(letterConfig).flatMap(([letter, config]) =>
    Array.from({ length: config.count }, () => letter)
  );

  const MIN_WORD_LENGTH = 4;
  const RACK_SIZE = 20;
  const DUPLICATE_PENALTY = 0.38;
  const MIN_DUPLICATE_WEIGHT = 0.18;
  const BASE_GOOD_MODIFIER_CHANCE = 0.05;
  const BASE_BAD_MODIFIER_CHANCE = 0.04;
  const MODIFIER_SWING_DIVISOR = 90;
  const MAX_MODIFIER_BONUS = 0.18;
  const GOOD_MODIFIERS = ['gold', 'firsttile', 'wild', 'gainboon', 'gainattack'];
  const BAD_MODIFIERS = ['black', 'mustuse', 'locked3'];
  const SOLO_GOOD_MODIFIERS = ['gold', 'firsttile', 'wild', 'gainboon'];
  const BOON_CARD_KEYS = ['boon_delete_tile', 'boon_isolate_tile', 'boon_firsttile', 'boon_wild', 'boon_gold'];
  const ATTACK_CARD_KEYS = ['attack_black', 'attack_mustuse', 'attack_locked3'];
  const MODIFIER_PROFILES = {
    duel: {
      goodModifiers: GOOD_MODIFIERS,
      badModifiers: BAD_MODIFIERS,
      baseGoodChance: BASE_GOOD_MODIFIER_CHANCE,
      baseBadChance: BASE_BAD_MODIFIER_CHANCE,
      useScoreSwing: true
    },
    solo: {
      goodModifiers: SOLO_GOOD_MODIFIERS,
      badModifiers: BAD_MODIFIERS,
      baseGoodChance: 0.085,
      baseBadChance: 0.022,
      useScoreSwing: false
    }
  };
  const MODIFIER_DEFINITIONS = {
    normal: {
      badge: '',
      effects: {},
      rarityWeight: 0,
      ui: {
        tileBackground: 'linear-gradient(180deg, #fffef8 0%, #f2ebe0 70%, #d9cec0 100%)',
        tileShadow: 'inset 0 -4px 0 rgba(0, 0, 0, 0.12), 0 10px 18px rgba(45, 10, 24, 0.16)',
        textColor: '#1c1930',
        badgeBackground: 'transparent',
        badgeColor: 'transparent',
        hideBadge: true
      }
    },
    gold: {
      badge: 'x2',
      effects: { wordMultiplier: 2 },
      rarityWeight: 0.9,
      canApply: ({ baseScore }) => baseScore >= 3,
      ui: {
        tileBackground: 'linear-gradient(180deg, #fff7d2 0%, #f4cf67 72%, #c68b1d 100%)',
        tileShadow: 'inset 0 -4px 0 rgba(122, 72, 8, 0.2), 0 12px 20px rgba(45, 10, 24, 0.2), 0 0 0 1px rgba(255, 223, 128, 0.5)',
        textColor: '#1c1930',
        badgeBackground: 'rgba(255, 245, 196, 0.95)',
        badgeColor: '#8e4b00'
      }
    },
    gainboon: {
      badge: '+BOON',
      effects: { grantBoon: 1 },
      rarityWeight: 0.28,
      ui: {
        tileBackground: 'linear-gradient(180deg, #f6ffe1 0%, #b9e16b 72%, #6f9d24 100%)',
        tileShadow: 'inset 0 -4px 0 rgba(60, 92, 14, 0.24), 0 12px 20px rgba(45, 10, 24, 0.16), 0 0 0 1px rgba(209, 244, 131, 0.42)',
        textColor: '#193115',
        badgeBackground: 'rgba(245, 255, 228, 0.95)',
        badgeColor: '#537f18'
      }
    },
    gainattack: {
      badge: '+ATK',
      effects: { grantAttack: 1 },
      rarityWeight: 0.28,
      ui: {
        tileBackground: 'linear-gradient(180deg, #ffe8d9 0%, #ff9b6e 72%, #b64a1f 100%)',
        tileShadow: 'inset 0 -4px 0 rgba(116, 43, 12, 0.24), 0 12px 20px rgba(45, 10, 24, 0.18), 0 0 0 1px rgba(255, 190, 150, 0.42)',
        textColor: '#311610',
        badgeBackground: 'rgba(255, 238, 228, 0.95)',
        badgeColor: '#9c3f18'
      }
    },
    wild: {
      effects: {
         wild: true,
         setScore: -1
        },
      rarityWeight: 0.45,
      ui: {
        tileBackground: 'linear-gradient(180deg, #fff6ff 0%, #d8c0ff 52%, #7f5cd4 100%)',
        tileShadow: 'inset 0 -4px 0 rgba(63, 36, 120, 0.24), 0 12px 20px rgba(38, 17, 62, 0.22), 0 0 0 1px rgba(226, 204, 255, 0.4)',
        textColor: '#201339',
        badgeBackground: 'rgba(255, 244, 255, 0.96)',
        badgeColor: '#7148b4',
        hideBadge: true
      }
    },
    firsttile: {
      badge: '1st',
      effects: { firstTileBonus: 10 },
      rarityWeight: 0.3,
      ui: {
        tileBackground: 'linear-gradient(180deg, #d9edff 0%, #8cb1d8 72%, #4f6999 100%)',
        tileShadow: 'inset 0 -4px 0 rgba(34, 58, 101, 0.25), 0 12px 20px rgba(24, 20, 46, 0.18), 0 0 0 1px rgba(173, 210, 255, 0.4)',
        textColor: '#11213f',
        badgeBackground: 'rgba(233, 244, 255, 0.96)',
        badgeColor: '#274577'
      }
    },
    black: {
      effects: { setScore: 0 },
      rarityWeight: 0.95,
      canApply: ({ baseScore }) => baseScore <= 4,
      ui: {
  tileBackground: 'linear-gradient(180deg, #d2a679 0%, #a87442 70%, #91623c 100%)',
  tileShadow: 'inset 0 -4px 0 rgba(60, 30, 10, 0.35), 0 10px 18px rgba(45, 20, 10, 0.25), 0 0 0 1px rgba(255, 220, 180, 0.25)',
  textColor: '#2b1a0f',
  badgeBackground: 'rgba(255, 235, 210, 0.9)',
  hideBadge: true
}
    },
    mustuse: {
      badge: 'MUST',
      effects: { required: true },
      rarityWeight: 0.6,
      canApply: ({ baseScore }) => baseScore <= 3,
      ui: {
        tileBackground: 'linear-gradient(180deg, #ffdfe2 0%, #ff8b97 72%, #b72848 100%)',
        tileShadow: 'inset 0 -4px 0 rgba(104, 18, 37, 0.24), 0 12px 20px rgba(45, 10, 24, 0.2), 0 0 0 1px rgba(255, 166, 179, 0.42)',
        textColor: '#1c1930',
        badgeBackground: 'rgba(255, 233, 236, 0.96)',
        badgeColor: '#a61c39'
      }
    },
    locked3: {
      badge: '',
      effects: { lockTurns: 1 },
      rarityWeight: 0.6,
      ui: {
        tileBackground: 'linear-gradient(180deg, #3b3343 0%, #211926 72%, #100b14 100%)',
        tileShadow: 'inset 0 -4px 0 rgba(0, 0, 0, 0.4), 0 12px 20px rgba(10, 5, 12, 0.34)',
        textColor: '#f6efe1',
        badgeBackground: 'rgba(255, 255, 255, 0.12)',
        badgeColor: 'rgba(160, 160, 160, 0.88)',
        badgeColor: '#fff'
      }
    }
  };
  const CARD_DEFINITIONS = {
    boon_delete_tile: {
      kind: 'boon',
      label: 'Delete Tile',
      description: 'Delete one of your tiles and draw a replacement.',
      rarityWeight: 1.25,
      effectType: 'delete_tile'
    },
    boon_isolate_tile: {
      kind: 'boon',
      label: 'Keep Only',
      description: 'Keep the chosen tile and redraw every other tile on your rack.',
      rarityWeight: 0.55,
      effectType: 'isolate_tile'
    },
    boon_firsttile: {
      kind: 'boon',
      label: 'First Tile',
      description: 'Give one of your tiles the first-tile bonus.',
      rarityWeight: 1,
      effectType: 'apply_modifier',
      modifier: 'firsttile'
    },
    boon_wild: {
      kind: 'boon',
      label: 'Wild',
      description: 'Turn one of your tiles into a wild.',
      rarityWeight: 0.8,
      effectType: 'apply_modifier',
      modifier: 'wild'
    },
    boon_gold: {
      kind: 'boon',
      label: 'Gold',
      description: 'Give one of your tiles the gold modifier.',
      rarityWeight: 0.35,
      effectType: 'apply_modifier',
      modifier: 'gold'
    },
    attack_black: {
      kind: 'attack',
      label: 'Blackout',
      description: 'Give a random enemy tile the black modifier.',
      rarityWeight: 1,
      effectType: 'random_attack',
      modifier: 'black'
    },
    attack_mustuse: {
      kind: 'attack',
      label: 'Must Use',
      description: 'Give a random enemy tile the MUST modifier.',
      rarityWeight: 0.85,
      effectType: 'random_attack',
      modifier: 'mustuse'
    },
    attack_locked3: {
      kind: 'attack',
      label: 'Lock',
      description: 'Lock a random enemy tile for three turns.',
      rarityWeight: 0.65,
      effectType: 'random_attack',
      modifier: 'locked3'
    }
  };

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

  const getModifierProfile = (profileName = 'duel') => {
    return MODIFIER_PROFILES[profileName] || MODIFIER_PROFILES.duel;
  };

  const getModifierChances = (side, scores = {}, profileName = 'duel') => {
    const profile = getModifierProfile(profileName);

    if (!side || !profile.useScoreSwing) {
      return {
        goodChance: profile.baseGoodChance,
        badChance: profile.baseBadChance
      };
    }

    const opponentSide = side === 'host' ? 'opponent' : 'host';
    const scoreDelta = (scores[side] || 0) - (scores[opponentSide] || 0);
    const catchupBonus = Math.min(MAX_MODIFIER_BONUS, Math.max(0, -scoreDelta) / MODIFIER_SWING_DIVISOR);
    const pressureBonus = Math.min(MAX_MODIFIER_BONUS, Math.max(0, scoreDelta) / MODIFIER_SWING_DIVISOR);

    return {
      goodChance: Math.min(0.45, profile.baseGoodChance + catchupBonus),
      badChance: Math.min(0.4, profile.baseBadChance + pressureBonus)
    };
  };

  const getModifierDefinition = (status = 'normal') => MODIFIER_DEFINITIONS[status] || MODIFIER_DEFINITIONS.normal;
  const getCardDefinition = (cardKey) => CARD_DEFINITIONS[cardKey];
  const hasModifierInRack = (rackTiles = [], status = 'normal') => {
    return rackTiles.some((tile) => tile.status === status);
  };
  const canApplyModifier = (status = 'normal', context = {}) => {
    if (status === 'mustuse' && hasModifierInRack(context.rackTiles || [], 'mustuse')) {
      return false;
    }

    const definition = getModifierDefinition(status);

    if (typeof definition.canApply !== 'function') {
      return true;
    }

    return definition.canApply(context);
  };

  const chooseWeightedModifier = (modifiers = []) => {
    const weightedModifiers = modifiers
      .map((modifier) => ({
        modifier,
        weight: Math.max(0, getModifierDefinition(modifier).rarityWeight ?? 1)
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
    const profile = getModifierProfile(modifierProfile);
    const baseChances = getModifierChances(side, scores, modifierProfile);
    const goodChance = Math.max(
      0,
      Math.min(
        0.9,
        chanceOverrides.goodChance ?? (baseChances.goodChance * (chanceOverrides.goodChanceMultiplier ?? 1))
      )
    );
    const badChance = Math.max(
      0,
      Math.min(
        0.9 - goodChance,
        chanceOverrides.badChance ?? (baseChances.badChance * (chanceOverrides.badChanceMultiplier ?? 1))
      )
    );
    const roll = Math.random();

    if (roll < goodChance) {
      const eligibleGoodModifiers = profile.goodModifiers.filter((modifier) => canApplyModifier(modifier, context));
      if (!eligibleGoodModifiers.length) {
        return 'normal';
      }

      return chooseWeightedModifier(eligibleGoodModifiers);
    }

    if (roll < goodChance + badChance) {
      const eligibleBadModifiers = profile.badModifiers.filter((modifier) => canApplyModifier(modifier, context));
      if (!eligibleBadModifiers.length) {
        return 'normal';
      }

      return chooseWeightedModifier(eligibleBadModifiers);
    }

    return 'normal';
  };

  const rollSharedOpeningModifier = (scores = {}, contexts = [], options = {}) => {
    const modifierProfile = options.modifierProfile || 'duel';
    const profile = getModifierProfile(modifierProfile);
    const { goodChance, badChance } = getModifierChances(null, scores, modifierProfile);
    const roll = Math.random();

    if (roll < goodChance) {
      const eligibleGoodModifiers = profile.goodModifiers.filter((modifier) => {
        return contexts.every((context) => canApplyModifier(modifier, context));
      });

      if (!eligibleGoodModifiers.length) {
        return 'normal';
      }

      return chooseWeightedModifier(eligibleGoodModifiers);
    }

    if (roll < goodChance + badChance) {
      const eligibleBadModifiers = profile.badModifiers.filter((modifier) => {
        return contexts.every((context) => canApplyModifier(modifier, context));
      });

      if (!eligibleBadModifiers.length) {
        return 'normal';
      }

      return chooseWeightedModifier(eligibleBadModifiers);
    }

    return 'normal';
  };

  const getModifierBadge = (tileOrStatus = 'normal') => {
    if (tileOrStatus && typeof tileOrStatus === 'object') {
      if (tileOrStatus.locked) {
        return `LCK ${tileOrStatus.lockTurns || 0}`;
      }

      return getModifierDefinition(tileOrStatus.status).badge;
    }

    return getModifierDefinition(tileOrStatus).badge;
  };
  const getModifierUi = (status = 'normal') => getModifierDefinition(status).ui || MODIFIER_DEFINITIONS.normal.ui;
  const tileScore = (tile) => (tile?.score || 0) * (tile?.multiplier || 1);

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

  const getTilesScore = (tiles) => tiles.reduce((total, tile) => total + tileScore(tile), 0);

  const getWordScoreDetails = (tiles) => {
    const baseLetterTotal = getTilesScore(tiles);
    const firstTileBonus = tiles.reduce((total, tile, index) => {
      if (index !== 0) {
        return total;
      }

      return total + tile?.firstTileBonus;
    }, 0);
    const letterTotal = baseLetterTotal + firstTileBonus;
    const lengthBonus = getLengthBonus(tiles.length);
    const wordMultiplier = tiles.reduce((total, tile) => total * (tile?.wordMultiplier || 1), 1);

    return {
      baseLetterTotal,
      firstTileBonus,
      letterTotal,
      lengthBonus,
      wordMultiplier,
      total: (letterTotal + lengthBonus) * wordMultiplier
    };
  };

  const getResourceGrants = (tiles = [], options = {}) => {
    const includeAttacks = options.includeAttacks !== false;
    return tiles.reduce((totals, tile) => {
      const definition = getModifierDefinition(tile.status);
      totals.boons += definition.effects.grantBoon || 0;
      totals.attacks += includeAttacks ? (definition.effects.grantAttack || 0) : 0;
      return totals;
    }, { boons: 0, attacks: 0 });
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

    const drawCard = (kind) => {
      const cardKey = chooseWeightedCard(kind === 'boon' ? BOON_CARD_KEYS : ATTACK_CARD_KEYS);
      return cardKey ? createCard(cardKey) : null;
    };

    const drawCards = (kind, count = 1) => {
      return Array.from({ length: count }, () => drawCard(kind)).filter(Boolean);
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

  const applyModifierToTile = (tile, status = 'normal') => {
    const definition = getModifierDefinition(status);
    const baseScore = letterConfig[tile.letter]?.score || tile.baseScore || tile.score || 0;
    const tileLetter = definition.effects.wild ? '*' : (tile.baseLetter || tile.letter);
    const nextScore = definition.effects.setScore != null ? definition.effects.setScore : baseScore;
    const lockTurns = definition.effects.lockTurns || 0;

    return {
      ...tile,
      letter: tileLetter,
      baseLetter: tile.baseLetter || tile.letter,
      score: nextScore,
      baseScore,
      multiplier: definition.effects.zeroLetterScore ? 0 : 1,
      wordMultiplier: definition.effects.wordMultiplier || 1,
      firstTileBonus: definition.effects.firstTileBonus || 0,
      locked: lockTurns > 0,
      lockTurns,
      status
    };
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

  const tickLockedTile = (tile) => {
    if (!tile?.locked) {
      return tile;
    }

    const nextLockTurns = Math.max(0, (tile.lockTurns || 0) - 1);

    return {
      ...tile,
      lockTurns: nextLockTurns,
      locked: nextLockTurns > 0,
      status: nextLockTurns > 0 ? tile.status : 'normal'
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
      const status = forcedStatus || rollTileModifier(side, scores, {
        letter,
        baseScore,
        rackTiles: chanceOverrides?.rackTiles || []
      }, chanceOverrides || {});
      const modifierDefinition = getModifierDefinition(status);
      const lockTurns = modifierDefinition.effects.lockTurns || 0;
      const tileLetter = modifierDefinition.effects.wild ? '*' : letter;

      return {
        id: createTileId(),
        letter: tileLetter,
        baseLetter: letter,
        score: modifierDefinition.effects.setScore != null ? modifierDefinition.effects.setScore : baseScore,
        baseScore,
        multiplier: modifierDefinition.effects.zeroLetterScore ? 0 : 1,
        wordMultiplier: modifierDefinition.effects.wordMultiplier || 1,
        firstTileBonus: modifierDefinition.effects.firstTileBonus || 0,
        locked: lockTurns > 0,
        lockTurns,
        status
      };
    };

    const buildFreshRack = (side = null, scores = {}, options = {}) => {
      const rack = [];
      while (rack.length < RACK_SIZE) {
        rack.push(createTile(drawLetter(rack), side, scores, options.forcedStatus || null, {
          ...(options.chanceOverrides || {}),
          rackTiles: rack
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

        return totals;
      }, { good: 0, bad: 0 });
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
      const rack = buildFreshRack(side, scores, {
        forcedStatus: 'normal',
        chanceOverrides: {
          modifierProfile
        }
      });

      applyTargetModifierGroup(rack, profile.goodModifiers, targetGoodModifiers);
      applyTargetModifierGroup(rack, profile.badModifiers, targetBadModifiers);
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
        ], options);

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
      const nextTiles = tiles.map((tile) => {
        if (usedIds.has(tile.id)) {
          return tile;
        }

        return tickLockedTile(tile);
      });

      nextTiles.forEach((tile, index) => {
        if (!usedIds.has(tile.id)) {
          return;
        }

        const remainingTiles = nextTiles.filter((entry, entryIndex) => {
          return entryIndex !== index && !usedIds.has(entry.id);
        });

        nextTiles[index] = createTile(drawLetter(remainingTiles), side, scores, null, {
          rackTiles: remainingTiles,
          modifierProfile: options.modifierProfile || 'duel'
        });
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
          modifierProfile: options.modifierProfile || 'duel'
        });
      });

      return nextTiles;
    };

    const createTestingRack = (offset = 0, side = null, scores = {}) => {
      const modifierStatuses = Object.keys(MODIFIER_DEFINITIONS).filter((status) => status !== 'normal');

      return Array.from({ length: RACK_SIZE }, (_, index) => {
        const letter = LETTER_KEYS[(offset + index) % LETTER_KEYS.length];
        const forcedStatus = modifierStatuses[index] || 'normal';

        return createTile(letter, side, scores, forcedStatus, {
          modifierProfile: 'duel'
        });
      });
    };

    const createTestingOpeningRackPair = (scores = {}) => {
      return {
        host: createTestingRack(0, 'host', scores),
        opponent: createTestingRack(RACK_SIZE, 'opponent', scores)
      };
    };

    return {
      createTile,
      createRack,
      createClearRack,
      createOpeningRackPair,
      refillTiles,
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
    getTilesScore,
    getWordScoreDetails,
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
