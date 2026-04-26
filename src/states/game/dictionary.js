import easyDictionaryText from './english_dictionaries/bot_dictionary_easy.txt?raw';
import normalDictionaryText from './english_dictionaries/bot_dictionary_normal.txt?raw';
import hardDictionaryText from './english_dictionaries/bot_dictionary_hard.txt?raw';

const parseDictionaryEntries = (dictionaryText = '') => dictionaryText
  .split('\n')
  .map((word) => word.trim())
  .filter(Boolean);

export const DICTIONARY_WORDS = {
  easy: parseDictionaryEntries(easyDictionaryText),
  normal: parseDictionaryEntries(normalDictionaryText),
  hard: parseDictionaryEntries(hardDictionaryText)
};

export const getDictionaryWords = (difficulty = 'normal') => {
  const normalizedDifficulty = String(difficulty || 'normal').toLowerCase();
  return DICTIONARY_WORDS[normalizedDifficulty] || DICTIONARY_WORDS.normal;
};
