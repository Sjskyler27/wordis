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

export const getBotWord = (recentWords = []) => {
  const normalizedRecentWords = recentWords.map((word) => (word || '').toLowerCase());
  const unusedWords = BOT_WORDS.filter((word) => !normalizedRecentWords.includes(word));

  const pool = unusedWords.length ? unusedWords : BOT_WORDS;
  return pool[Math.floor(Math.random() * pool.length)];
};
