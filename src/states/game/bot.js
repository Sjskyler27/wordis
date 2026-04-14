const BOT_WORDS = [
  'spark',
  'planet',
  'river',
  'glow',
  'thunder',
  'cinder',
  'meadow',
  'comet'
];

const canBuildWordFromTiles = (word, tiles) => {
  const availableTiles = [...tiles];

  for (const letter of word.toUpperCase()) {
    const tileIndex = availableTiles.indexOf(letter);
    if (tileIndex === -1) {
      return false;
    }

    availableTiles.splice(tileIndex, 1);
  }

  return true;
};

export const getBotWord = (tiles = [], recentWords = []) => {
  const normalizedRecentWords = recentWords.map((word) => (word || '').toLowerCase());
  const unusedWords = BOT_WORDS.filter((word) => {
    return !normalizedRecentWords.includes(word) && canBuildWordFromTiles(word, tiles);
  });

  const fallbackWords = BOT_WORDS.filter((word) => canBuildWordFromTiles(word, tiles));
  const pool = unusedWords.length ? unusedWords : fallbackWords;

  if (!pool.length) {
    return '';
  }

  return pool[Math.floor(Math.random() * pool.length)];
};
