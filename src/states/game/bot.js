import { DICTIONARY_WORDS } from './dictionary.js';

const canBuildWordFromTiles = (word, tiles) => {
  const availableTiles = tiles.map((tile) => tile.letter);

  for (const letter of word.toUpperCase()) {
    const tileIndex = availableTiles.indexOf(letter);
    if (tileIndex === -1) {
      return false;
    }

    availableTiles.splice(tileIndex, 1);
  }

  return true;
};

const buildFallbackWord = (tiles) => {
  const letters = tiles.map((tile) => tile.letter);
  const vowels = ['A', 'E', 'I', 'O', 'U'];
  const uniqueTiles = [...new Set(letters)];
  const vowel = uniqueTiles.find((tile) => vowels.includes(tile));
  const consonant = uniqueTiles.find((tile) => !vowels.includes(tile));

  if (consonant && vowel) {
    return `${consonant}${vowel}`.toLowerCase();
  }

  if (letters.length >= 2) {
    return `${letters[0]}${letters[1]}`.toLowerCase();
  }

  if (letters.length === 1) {
    return letters[0].toLowerCase();
  }

  return '';
};

export const getBotWord = (tiles = [], recentWords = []) => {
  const normalizedRecentWords = recentWords.map((word) => (word || '').toLowerCase());
  const unusedWords = DICTIONARY_WORDS.filter((word) => {
    return !normalizedRecentWords.includes(word) && canBuildWordFromTiles(word, tiles);
  });

  const fallbackWords = DICTIONARY_WORDS.filter((word) => canBuildWordFromTiles(word, tiles));
  const pool = unusedWords.length ? unusedWords : fallbackWords;

  if (!pool.length) {
    return buildFallbackWord(tiles);
  }

  return pool[Math.floor(Math.random() * pool.length)];
};
