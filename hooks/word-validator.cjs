const fs = require('fs');
const path = require('path');

const API_TIMEOUT_MS = 2500;
const DICTIONARY_DIR = path.join(__dirname, '../src/states/game/english_dictionaries');
const normalizeLanguageCode = (languageCode = 'en') => {
  const normalizedCode = (languageCode || 'en').toLowerCase().split('-')[0];
  return normalizedCode || 'en';
};

const parseDictionary = (filename) => {
  const filePath = path.join(DICTIONARY_DIR, filename);
  const fileText = fs.readFileSync(filePath, 'utf8');

  return new Set(
    fileText
      .split('\n')
      .map((word) => word.trim().toLowerCase())
      .filter(Boolean)
  );
};

const FALLBACK_DICTIONARIES = {
  en: {
    byLength: {
      4: parseDictionary('4.txt'),
      5: parseDictionary('5.txt'),
      6: parseDictionary('6.txt'),
      7: parseDictionary('7.txt')
    },
    bot: parseDictionary('bot_dictionary.txt')
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
    return { valid: true, source: 'assumed' };
  }

  if (normalizedWord.includes('*')) {
    for (const candidateWord of fallbackDictionary) {
      if (matchesWildcardWord(candidateWord, normalizedWord)) {
        return { valid: true, source: 'fallback-wildcard' };
      }
    }

    return { valid: false, source: 'fallback-wildcard' };
  }

  return {
    valid: fallbackDictionary.has(normalizedWord),
    source: 'fallback'
  };
};

const checkDictionaryApi = async (word, languageCode) => {
  const normalizedWord = (word || '').trim().toLowerCase();
  const normalizedLanguageCode = normalizeLanguageCode(languageCode);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

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
    clearTimeout(timeoutId);
  }
};

const validateWord = async (word, languageCode = 'en') => {
  const normalizedWord = (word || '').trim().toLowerCase();
  if (!normalizedWord) {
    return { valid: false, source: 'empty' };
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

module.exports = {
  validateWord
};
