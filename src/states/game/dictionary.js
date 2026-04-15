import dictionaryText from './english_dictionaries/bot_dictionary.txt?raw';

export const DICTIONARY_WORDS = dictionaryText
  .split('\n')
  .map((word) => word.trim())
  .filter(Boolean);
