const createSharedTileLogic = ({ letterConfig, wordBonuses }) => {
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
  const BOON_CARD_KEYS = ['boon_delete_tile', 'boon_firsttile', 'boon_wild', 'boon_gold'];
  const ATTACK_CARD_KEYS = ['attack_black', 'attack_mustuse', 'attack_locked3'];
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
        tileBackground: 'linear-gradient(180deg, #fff4de 0%, #ffb56b 72%, #d86e27 100%)',
        tileShadow: 'inset 0 -4px 0 rgba(130, 52, 12, 0.24), 0 12px 20px rgba(45, 10, 24, 0.2), 0 0 0 1px rgba(255, 190, 120, 0.45)',
        textColor: '#1c1930',
        badgeBackground: 'rgba(255, 232, 210, 0.96)',
        badgeColor: '#9b4708'
      }
    },
    black: {
      effects: { setScore: 0 },
      rarityWeight: 0.95,
      canApply: ({ baseScore }) => baseScore <= 4,
      ui: {
  tileBackground: 'linear-gradient(180deg, #d2a679 0%, #a87442 70%, #6b4423 100%)',
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

  const getModifierChances = (side, scores = {}) => {
    if (!side) {
      return {
        goodChance: BASE_GOOD_MODIFIER_CHANCE,
        badChance: BASE_BAD_MODIFIER_CHANCE
      };
    }

    const opponentSide = side === 'host' ? 'opponent' : 'host';
    const scoreDelta = (scores[side] || 0) - (scores[opponentSide] || 0);
    const catchupBonus = Math.min(MAX_MODIFIER_BONUS, Math.max(0, -scoreDelta) / MODIFIER_SWING_DIVISOR);
    const pressureBonus = Math.min(MAX_MODIFIER_BONUS, Math.max(0, scoreDelta) / MODIFIER_SWING_DIVISOR);

    return {
      goodChance: Math.min(0.45, BASE_GOOD_MODIFIER_CHANCE + catchupBonus),
      badChance: Math.min(0.4, BASE_BAD_MODIFIER_CHANCE + pressureBonus)
    };
  };

  const getModifierDefinition = (status = 'normal') => MODIFIER_DEFINITIONS[status] || MODIFIER_DEFINITIONS.normal;
  const getCardDefinition = (cardKey) => CARD_DEFINITIONS[cardKey];
  const canApplyModifier = (status = 'normal', context = {}) => {
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

  const rollTileModifier = (side, scores = {}, context = {}) => {
    const { goodChance, badChance } = getModifierChances(side, scores);
    const roll = Math.random();

    if (roll < goodChance) {
      const eligibleGoodModifiers = GOOD_MODIFIERS.filter((modifier) => canApplyModifier(modifier, context));
      if (!eligibleGoodModifiers.length) {
        return 'normal';
      }

      return chooseWeightedModifier(eligibleGoodModifiers);
    }

    if (roll < goodChance + badChance) {
      const eligibleBadModifiers = BAD_MODIFIERS.filter((modifier) => canApplyModifier(modifier, context));
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

  const getResourceGrants = (tiles = []) => {
    return tiles.reduce((totals, tile) => {
      const definition = getModifierDefinition(tile.status);
      totals.boons += definition.effects.grantBoon || 0;
      totals.attacks += definition.effects.grantAttack || 0;
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

    return {
      createCard,
      drawCard,
      drawCards
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
    const createTile = (letter = drawLetter(), side = null, scores = {}) => {
      const baseScore = letterConfig[letter]?.score || 0;
      const status = rollTileModifier(side, scores, { letter, baseScore });
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

    const createRack = (side = null, scores = {}) => {
      const rack = [];
      while (rack.length < RACK_SIZE) {
        rack.push(createTile(drawLetter(rack), side, scores));
      }
      return rack;
    };

    const refillTiles = (tiles, usedTileIds, side = null, scores = {}) => {
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

        nextTiles[index] = createTile(drawLetter(remainingTiles), side, scores);
      });

      return nextTiles;
    };

    return {
      createTile,
      createRack,
      refillTiles
    };
  };

  return {
    LETTER_CONFIG: letterConfig,
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
