import { DICTIONARY_WORDS } from './dictionary.js';

const MIN_WORD_LENGTH = 4;

const canBuildWordFromTiles = (word, tiles) => {
  const availableTiles = tiles
    .filter((tile) => !tile.locked)
    .map((tile) => tile.letter);

  for (const letter of word.toUpperCase()) {
    const tileIndex = availableTiles.indexOf(letter);
    if (tileIndex === -1) {
      return false;
    }

    availableTiles.splice(tileIndex, 1);
  }

  return true;
};

const includesRequiredTiles = (word, tiles) => {
  const requiredLetters = tiles
    .filter((tile) => tile.status === 'mustuse' && !tile.locked)
    .map((tile) => tile.letter);

  const wordLetters = word.toUpperCase().split('');

  for (const letter of requiredLetters) {
    const index = wordLetters.indexOf(letter);
    if (index === -1) {
      return false;
    }

    wordLetters.splice(index, 1);
  }

  return true;
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
