import dictionary4Text from './english_dictionaries/4.txt?raw';
import dictionary5Text from './english_dictionaries/5.txt?raw';
import dictionary6Text from './english_dictionaries/6.txt?raw';
import dictionary7Text from './english_dictionaries/7.txt?raw';
import botDictionaryText from './english_dictionaries/bot_dictionary.txt?raw';

const API_TIMEOUT_MS = 2500;
const normalizeLanguageCode = (languageCode = 'en') => {
  const normalizedCode = (languageCode || 'en').toLowerCase().split('-')[0];
  return normalizedCode || 'en';
};

const parseDictionary = (text) => {
  return new Set(
    text
      .split('\n')
      .map((word) => word.trim().toLowerCase())
      .filter(Boolean)
  );
};

const LENGTH_DICTIONARIES = {
  4: parseDictionary(dictionary4Text),
  5: parseDictionary(dictionary5Text),
  6: parseDictionary(dictionary6Text),
  7: parseDictionary(dictionary7Text)
};

const BOT_DICTIONARY = parseDictionary(botDictionaryText);

const getFallbackDictionary = (word) => {
  const normalizedWord = (word || '').trim().toLowerCase();
  return LENGTH_DICTIONARIES[normalizedWord.length] || BOT_DICTIONARY;
};

const checkDictionaryApi = async (word, languageCode) => {
  const normalizedWord = (word || '').trim().toLowerCase();
  const normalizedLanguageCode = normalizeLanguageCode(languageCode);
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/${normalizedLanguageCode}/${normalizedWord}`, {
      signal: controller.signal
    });

    if (response.ok) {
      return { valid: true, source: 'api' };
    }

    if (response.status === 404) {
      return { valid: false, source: 'api' };
    }

    return { valid: null, source: 'api' };
  } catch (error) {
    return { valid: null, source: 'api' };
  } finally {
    window.clearTimeout(timeoutId);
  }
};

export const validateWord = async (word, languageCode = 'en') => {
  const normalizedWord = (word || '').trim().toLowerCase();
  if (!normalizedWord) {
    return { valid: false, source: 'empty' };
  }

  const apiResult = await checkDictionaryApi(normalizedWord, normalizeLanguageCode(languageCode));
  if (apiResult.valid !== null) {
    return apiResult;
  }

  const fallbackDictionary = getFallbackDictionary(normalizedWord);
  return {
    valid: fallbackDictionary.has(normalizedWord),
    source: 'fallback'
  };
};
