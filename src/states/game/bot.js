import { DICTIONARY_WORDS } from './dictionary.js';
import { getTilesForWord } from './tile-logic.js';

const MIN_WORD_LENGTH = 4;

const canBuildWordFromTiles = (word, tiles) => {
  return getTilesForWord(tiles, word).length > 0;
};

const includesRequiredTiles = (word, tiles) => {
  const requiredTiles = tiles
    .filter((tile) => tile.status === 'mustuse' && !tile.locked)
    .map((tile) => tile.id);

  const matchedTiles = getTilesForWord(tiles, word);

  return requiredTiles.every((requiredTileId) => {
    return matchedTiles.some((tile) => tile.id === requiredTileId);
  });
};

export const getBotWord = (tiles = [], recentWords = []) => {
  const normalizedRecentWords = recentWords.map((word) => (word || '').toLowerCase());
  const unusedWords = DICTIONARY_WORDS.filter((word) => {
    return !normalizedRecentWords.includes(word) &&
      word.length >= MIN_WORD_LENGTH &&
      canBuildWordFromTiles(word, tiles) &&
      includesRequiredTiles(word, tiles);
  });

  const fallbackWords = DICTIONARY_WORDS.filter((word) => {
    return word.length >= MIN_WORD_LENGTH &&
      canBuildWordFromTiles(word, tiles) &&
      includesRequiredTiles(word, tiles);
  });
  const pool = unusedWords.length ? unusedWords : fallbackWords;

  if (!pool.length) {
    return '';
  }

  return pool[Math.floor(Math.random() * pool.length)];
};
