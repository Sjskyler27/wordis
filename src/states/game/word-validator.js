import dictionary4Text from './english_dictionaries/4.txt?raw';
import dictionary5Text from './english_dictionaries/5.txt?raw';
import dictionary6Text from './english_dictionaries/6.txt?raw';
import dictionary7Text from './english_dictionaries/7.txt?raw';
import dictionary8Text from './english_dictionaries/8.txt?raw';
import dictionary9Text from './english_dictionaries/9.txt?raw';
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

const FALLBACK_DICTIONARIES = {
  en: {
    byLength: {
      4: parseDictionary(dictionary4Text),
      5: parseDictionary(dictionary5Text),
      6: parseDictionary(dictionary6Text),
      7: parseDictionary(dictionary7Text),
      8: parseDictionary(dictionary8Text),
      9: parseDictionary(dictionary9Text),
    },
    bot: parseDictionary(botDictionaryText)
  }
};

const getFallbackDictionarySet = (word, languageCode) => {
  const normalizedWord = (word || '').trim().toLowerCase();
  const normalizedLanguageCode = normalizeLanguageCode(languageCode);
  const fallbackDictionaries = FALLBACK_DICTIONARIES[normalizedLanguageCode];

  if (!fallbackDictionaries) {
    return null;
  }

  return fallbackDictionaries.byLength[normalizedWord.length] || fallbackDictionaries.bot;
};

const matchesWildcardWord = (candidateWord, wildcardWord) => {
  if (candidateWord.length !== wildcardWord.length) {
    return false;
  }

  for (let index = 0; index < wildcardWord.length; index += 1) {
    const wildcardLetter = wildcardWord[index];
    if (wildcardLetter !== '*' && wildcardLetter !== candidateWord[index]) {
      return false;
    }
  }

  return true;
};

const checkFallbackDictionary = (word, languageCode) => {
  const normalizedWord = (word || '').trim().toLowerCase();
  const fallbackDictionary = getFallbackDictionarySet(normalizedWord, languageCode);

  if (!fallbackDictionary) {
    return { valid: true, source: 'assumed', resolvedWord: normalizedWord };
  }

  if (normalizedWord.includes('*')) {
    for (const candidateWord of fallbackDictionary) {
      if (matchesWildcardWord(candidateWord, normalizedWord)) {
        return { valid: true, source: 'fallback-wildcard', resolvedWord: candidateWord };
      }
    }

    return { valid: false, source: 'fallback-wildcard', resolvedWord: normalizedWord };
  }

  return {
    valid: fallbackDictionary.has(normalizedWord),
    source: 'fallback',
    resolvedWord: normalizedWord
  };
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
      return { valid: true, source: 'api', resolvedWord: normalizedWord };
    }

    if (response.status === 404) {
      return { valid: false, source: 'api', resolvedWord: normalizedWord };
    }

    return { valid: null, source: 'api', resolvedWord: normalizedWord };
  } catch (error) {
    return { valid: null, source: 'api', resolvedWord: normalizedWord };
  } finally {
    window.clearTimeout(timeoutId);
  }
};

export const validateWord = async (word, languageCode = 'en') => {
  const normalizedWord = (word || '').trim().toLowerCase();
  if (!normalizedWord) {
    return { valid: false, source: 'empty', resolvedWord: '' };
  }

  if (normalizedWord.includes('*')) {
    return checkFallbackDictionary(normalizedWord, languageCode);
  }

  const apiResult = await checkDictionaryApi(normalizedWord, normalizeLanguageCode(languageCode));
  if (apiResult.valid !== null) {
    return apiResult;
  }

  return checkFallbackDictionary(normalizedWord, languageCode);
};
