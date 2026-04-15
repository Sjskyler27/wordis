import letterConfig from './letters.json';
import wordBonuses from './word-bonuses.json';

const LETTER_POOL = Object.entries(letterConfig).flatMap(([letter, config]) =>
  Array.from({ length: config.count }, () => letter)
);

const RACK_SIZE = 22;
const DUPLICATE_PENALTY = 0.38;
const MIN_DUPLICATE_WEIGHT = 0.18;
const BASE_GOOD_MODIFIER_CHANCE = 0.05;
const BASE_BAD_MODIFIER_CHANCE = 0.04;
const MODIFIER_SWING_DIVISOR = 90;
const MAX_MODIFIER_BONUS = 0.18;

let nextLocalTileId = 1;

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
    return 'gold';
  }

  if (roll < goodChance + badChance) {
    return 'black';
  }

  return 'normal';
};

const createTile = (letter = drawLetter(), side = null, scores = {}) => {
  const status = rollTileModifier(side, scores);

  return {
    id: `local-tile-${nextLocalTileId++}`,
    letter,
    score: status === 'black' ? 0 : letterConfig[letter]?.score || 0,
    multiplier: status === 'black' ? 0 : 1,
    wordMultiplier: status === 'gold' ? 2 : 1,
    locked: false,
    status
  };
};

export const createRack = (side = null, scores = {}) => {
  const rack = [];
  while (rack.length < RACK_SIZE) {
    rack.push(createTile(drawLetter(rack), side, scores));
  }
  return rack;
};

export const tileScore = (tile) => (tile?.score || 0) * (tile?.multiplier || 1);

export const getLengthBonus = (length) => {
  if (wordBonuses[length]) {
    return wordBonuses[length];
  }

  if (length > 8) {
    return wordBonuses[8] + ((length - 8) * 5);
  }

  return 0;
};

export const getTilesScore = (tiles) => tiles.reduce((total, tile) => total + tileScore(tile), 0);

export const getWordScoreDetails = (tiles) => {
  const letterTotal = getTilesScore(tiles);
  const lengthBonus = getLengthBonus(tiles.length);
  const wordMultiplier = tiles.reduce((total, tile) => total * (tile?.wordMultiplier || 1), 1);

  return {
    letterTotal,
    lengthBonus,
    wordMultiplier,
    total: (letterTotal + lengthBonus) * wordMultiplier
  };
};

export const getTilesForWord = (tiles, word) => {
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

export const refillTiles = (tiles, usedTileIds, side = null, scores = {}) => {
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
