import easyDictionaryText from './english_dictionaries/4.txt?raw';
import dictionary5Text from './english_dictionaries/5.txt?raw';
import hardDictionaryText from './english_dictionaries/bot_dictionary_hard.txt?raw';

const parseDictionaryEntries = (dictionaryText = '') => dictionaryText
  .split('\n')
  .map((word) => word.trim())
  .filter(Boolean);

export const DICTIONARY_WORDS = {
  easy: parseDictionaryEntries(easyDictionaryText),
  normal: parseDictionaryEntries(`${easyDictionaryText}\n${dictionary5Text}`),
  hard: parseDictionaryEntries(hardDictionaryText)
};

export const getDictionaryWords = (difficulty = 'normal') => {
  const normalizedDifficulty = String(difficulty || 'normal').toLowerCase();
  return DICTIONARY_WORDS[normalizedDifficulty] || DICTIONARY_WORDS.normal;
};
