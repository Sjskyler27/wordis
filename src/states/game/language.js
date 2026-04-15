const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en',
    label: 'English'
  }
};

export const getPreferredLanguageCode = () => {
  const browserLanguage = typeof navigator !== 'undefined'
    ? (navigator.language || navigator.languages?.[0] || '')
    : '';
  const normalizedCode = browserLanguage.toLowerCase().split('-')[0];

  return SUPPORTED_LANGUAGES[normalizedCode]?.code || 'en';
};

export const getPreferredLanguage = () => {
  const code = getPreferredLanguageCode();
  return SUPPORTED_LANGUAGES[code] || SUPPORTED_LANGUAGES.en;
};

export const getLanguageLabel = (code) => {
  return SUPPORTED_LANGUAGES[code]?.label || SUPPORTED_LANGUAGES.en.label;
};

export { SUPPORTED_LANGUAGES };
