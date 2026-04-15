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
  const GOOD_MODIFIERS = ['gold', 'firsttile'];
  const BAD_MODIFIERS = ['black', 'mustuse'];
  const MODIFIER_DEFINITIONS = {
    normal: {
      badge: '',
      effects: {},
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
      ui: {
        tileBackground: 'linear-gradient(180deg, #fff7d2 0%, #f4cf67 72%, #c68b1d 100%)',
        tileShadow: 'inset 0 -4px 0 rgba(122, 72, 8, 0.2), 0 12px 20px rgba(45, 10, 24, 0.2), 0 0 0 1px rgba(255, 223, 128, 0.5)',
        textColor: '#1c1930',
        badgeBackground: 'rgba(255, 245, 196, 0.95)',
        badgeColor: '#8e4b00'
      }
    },
    firsttile: {
      badge: '1st',
      effects: { firstTileMultiplier: 2 },
      ui: {
        tileBackground: 'linear-gradient(180deg, #fff4de 0%, #ffb56b 72%, #d86e27 100%)',
        tileShadow: 'inset 0 -4px 0 rgba(130, 52, 12, 0.24), 0 12px 20px rgba(45, 10, 24, 0.2), 0 0 0 1px rgba(255, 190, 120, 0.45)',
        textColor: '#1c1930',
        badgeBackground: 'rgba(255, 232, 210, 0.96)',
        badgeColor: '#9b4708'
      }
    },
    black: {
      badge: '0',
      effects: { zeroLetterScore: true },
      ui: {
        tileBackground: 'linear-gradient(180deg, #3b3343 0%, #211926 72%, #100b14 100%)',
        tileShadow: 'inset 0 -4px 0 rgba(0, 0, 0, 0.4), 0 12px 20px rgba(10, 5, 12, 0.34)',
        textColor: '#f6efe1',
        badgeBackground: 'rgba(255, 255, 255, 0.12)',
        badgeColor: 'rgba(255, 255, 255, 0.88)',
        hideBadge: true
      }
    },
    mustuse: {
      badge: 'MUST',
      effects: { required: true },
      ui: {
        tileBackground: 'linear-gradient(180deg, #ffdfe2 0%, #ff8b97 72%, #b72848 100%)',
        tileShadow: 'inset 0 -4px 0 rgba(104, 18, 37, 0.24), 0 12px 20px rgba(45, 10, 24, 0.2), 0 0 0 1px rgba(255, 166, 179, 0.42)',
        textColor: '#1c1930',
        badgeBackground: 'rgba(255, 233, 236, 0.96)',
        badgeColor: '#a61c39'
      }
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

  const rollTileModifier = (side, scores = {}) => {
    const { goodChance, badChance } = getModifierChances(side, scores);
    const roll = Math.random();

    if (roll < goodChance) {
      return GOOD_MODIFIERS[Math.floor(Math.random() * GOOD_MODIFIERS.length)];
    }

    if (roll < goodChance + badChance) {
      return BAD_MODIFIERS[Math.floor(Math.random() * BAD_MODIFIERS.length)];
    }

    return 'normal';
  };

  const getModifierDefinition = (status = 'normal') => MODIFIER_DEFINITIONS[status] || MODIFIER_DEFINITIONS.normal;
  const getModifierBadge = (status = 'normal') => getModifierDefinition(status).badge;
  const getModifierUi = (status = 'normal') => getModifierDefinition(status).ui || MODIFIER_DEFINITIONS.normal.ui;
  const tileScore = (tile) => (tile?.score || 0) * (tile?.multiplier || 1);

  const getLengthBonus = (length) => {
    if (wordBonuses[length]) {
      return wordBonuses[length];
    }

    if (length > 8) {
      return wordBonuses[8] + ((length - 8) * 5);
    }

    return 0;
  };

  const getTilesScore = (tiles) => tiles.reduce((total, tile) => total + tileScore(tile), 0);

  const getWordScoreDetails = (tiles) => {
    const baseLetterTotal = getTilesScore(tiles);
    const firstTileBonus = tiles.reduce((total, tile, index) => {
      if (index !== 0) {
        return total;
      }

      return total + ((tileScore(tile) * (tile?.firstTileMultiplier || 1)) - tileScore(tile));
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

  const getTilesForWord = (tiles, word) => {
    const selectedTiles = [];

    for (const character of (word || '').toUpperCase()) {
      const tile = tiles.find((entry) => {
        return entry.letter === character && !entry.locked && !selectedTiles.some((selected) => selected.id === entry.id);
      });

      if (!tile) {
        return [];
      }

      selectedTiles.push(tile);
    }

    return selectedTiles;
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

  const getRequiredTiles = (tiles = []) => {
    return tiles.filter((tile) => tile.status === 'mustuse' && !tile.locked);
  };

  const isMissingRequiredTile = (rackTiles = [], selectedTiles = []) => {
    const requiredTiles = getRequiredTiles(rackTiles);

    return requiredTiles.some((requiredTile) => {
      return !selectedTiles.some((selectedTile) => selectedTile.id === requiredTile.id);
    });
  };

  const createTileLogic = ({ createTileId }) => {
    const createTile = (letter = drawLetter(), side = null, scores = {}) => {
      const status = rollTileModifier(side, scores);
      const modifierDefinition = getModifierDefinition(status);
      const baseScore = letterConfig[letter]?.score || 0;

      return {
        id: createTileId(),
        letter,
        score: modifierDefinition.effects.zeroLetterScore ? 0 : baseScore,
        multiplier: modifierDefinition.effects.zeroLetterScore ? 0 : 1,
        wordMultiplier: modifierDefinition.effects.wordMultiplier || 1,
        firstTileMultiplier: modifierDefinition.effects.firstTileMultiplier || 1,
        locked: false,
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
      const nextTiles = [...tiles];

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
    tileScore,
    getLengthBonus,
    getTilesScore,
    getWordScoreDetails,
    getTilesForWord,
    getSelectedTiles,
    getRequiredTiles,
    isMissingRequiredTile,
    getModifierBadge,
    getModifierUi,
    getModifierDefinition,
    MODIFIER_DEFINITIONS,
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
