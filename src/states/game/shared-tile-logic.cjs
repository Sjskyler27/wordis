const LETTER_CONFIG = require('./letters.json');
const WORD_BONUSES = require('./word-bonuses.json');

const LETTER_POOL = Object.entries(LETTER_CONFIG).flatMap(([letter, config]) =>
  Array.from({ length: config.count }, () => letter)
);

const RACK_SIZE = 22;
const DUPLICATE_PENALTY = 0.38;
const MIN_DUPLICATE_WEIGHT = 0.18;
const BASE_GOOD_MODIFIER_CHANCE = 0.05;
const BASE_BAD_MODIFIER_CHANCE = 0.04;
const MODIFIER_SWING_DIVISOR = 90;
const MAX_MODIFIER_BONUS = 0.18;

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

    return {
      letter,
      weight
    };
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
    return Math.random() < 0.5 ? 'gold' : 'firsttile';
  }

  if (roll < goodChance + badChance) {
    return Math.random() < 0.5 ? 'black' : 'mustuse';
  }

  return 'normal';
};

const tileScore = (tile) => (tile?.score || 0) * (tile?.multiplier || 1);

const getLengthBonus = (length) => {
  if (WORD_BONUSES[length]) {
    return WORD_BONUSES[length];
  }

  if (length > 8) {
    return WORD_BONUSES[8] + ((length - 8) * 5);
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

    return {
      id: createTileId(),
      letter,
      score: status === 'black' ? 0 : LETTER_CONFIG[letter]?.score || 0,
      multiplier: status === 'black' ? 0 : 1,
      wordMultiplier: status === 'gold' ? 2 : 1,
      firstTileMultiplier: status === 'firsttile' ? 2 : 1,
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

module.exports = {
  LETTER_CONFIG,
  RACK_SIZE,
  tileScore,
  getLengthBonus,
  getTilesScore,
  getWordScoreDetails,
  getTilesForWord,
  getSelectedTiles,
  getRequiredTiles,
  isMissingRequiredTile,
  createTileLogic
};
