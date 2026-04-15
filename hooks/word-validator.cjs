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

const LENGTH_DICTIONARIES = {
  4: parseDictionary('4.txt'),
  5: parseDictionary('5.txt'),
  6: parseDictionary('6.txt'),
  7: parseDictionary('7.txt')
};

const BOT_DICTIONARY = parseDictionary('bot_dictionary.txt');

const getFallbackDictionary = (word) => {
  const normalizedWord = (word || '').trim().toLowerCase();
  return LENGTH_DICTIONARIES[normalizedWord.length] || BOT_DICTIONARY;
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

module.exports = {
  validateWord
};
