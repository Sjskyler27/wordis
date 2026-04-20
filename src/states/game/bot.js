import { DICTIONARY_WORDS } from './dictionary.js';
import { getModifierDefinition, getTilesForWord } from './tile-logic.js';

const MIN_WORD_LENGTH = 4;
const MAX_CANDIDATES_PER_POOL = 18;

const createLetterCounts = (text = '') => {
  const counts = Object.create(null);

  for (const letter of text) {
    counts[letter] = (counts[letter] || 0) + 1;
  }

  return counts;
};

const WORD_ENTRIES = DICTIONARY_WORDS
  .filter((word) => word.length >= MIN_WORD_LENGTH)
  .map((word) => ({
    word,
    length: word.length,
    letterCounts: createLetterCounts(word)
  }))
  .sort((left, right) => right.length - left.length || left.word.localeCompare(right.word));

const getRackProfile = (tiles = []) => {
  const letterCounts = Object.create(null);
  const requiredTileIds = new Set();
  let wildCount = 0;
  let botPerformance = 0;

  for (const tile of tiles) {
    if (tile.locked) {
      continue;
    }

    botPerformance += getModifierDefinition(tile.status).effects.botPerformanceDelta || 0;

    if (tile.status === 'mustuse') {
      requiredTileIds.add(tile.id);
    }

    if (tile.status === 'wild') {
      wildCount += 1;
      continue;
    }

    for (const letter of (tile.letter || '')) {
      letterCounts[letter.toLowerCase()] = (letterCounts[letter.toLowerCase()] || 0) + 1;
    }
  }

  return {
    letterCounts,
    wildCount,
    requiredTileIds,
    botPerformance
  };
};

const canWordFitRackProfile = (wordEntry, rackProfile) => {
  let missingLetters = 0;

  for (const [letter, neededCount] of Object.entries(wordEntry.letterCounts)) {
    const availableCount = rackProfile.letterCounts[letter] || 0;
    if (availableCount >= neededCount) {
      continue;
    }

    missingLetters += neededCount - availableCount;
    if (missingLetters > rackProfile.wildCount) {
      return false;
    }
  }

  return true;
};

const includesRequiredTiles = (matchedTiles = [], requiredTileIds = new Set()) => {
  if (!requiredTileIds.size) {
    return true;
  }

  return Array.from(requiredTileIds).every((requiredTileId) => {
    return matchedTiles.some((tile) => tile.id === requiredTileId);
  });
};

const chooseCandidate = (candidates = [], difficulty = 'normal', botPerformance = 0) => {
  if (!candidates.length) {
    return '';
  }

  const topSliceLengthByDifficulty = {
    easy: Math.min(14, candidates.length),
    normal: Math.min(8, candidates.length),
    hard: Math.min(4, candidates.length)
  };

  const baseSliceLength = topSliceLengthByDifficulty[difficulty] || topSliceLengthByDifficulty.normal;
  const performanceAdjustedSliceLength = Math.round(baseSliceLength * (1 - (botPerformance * 0.55)));
  const topSliceLength = Math.max(1, Math.min(candidates.length, performanceAdjustedSliceLength));
  const offset = Math.floor(Math.random() * topSliceLength);
  return candidates[offset];
};

export const getBotWord = (tiles = [], recentWords = [], difficulty = 'normal') => {
  const recentWordSet = new Set(recentWords.map((entry) => {
    const word = typeof entry === 'string' ? entry : entry?.word;
    return (word || '').toLowerCase();
  }));
  const rackProfile = getRackProfile(tiles);
  const freshCandidates = [];
  const repeatCandidates = [];

  for (const wordEntry of WORD_ENTRIES) {
    if (!canWordFitRackProfile(wordEntry, rackProfile)) {
      continue;
    }

    const matchedTiles = getTilesForWord(tiles, wordEntry.word);
    if (!matchedTiles.length || !includesRequiredTiles(matchedTiles, rackProfile.requiredTileIds)) {
      continue;
    }

    if (!recentWordSet.has(wordEntry.word)) {
      freshCandidates.push(wordEntry.word);
      if (freshCandidates.length >= MAX_CANDIDATES_PER_POOL) {
        break;
      }
      continue;
    }

    if (repeatCandidates.length < MAX_CANDIDATES_PER_POOL) {
      repeatCandidates.push(wordEntry.word);
    }
  }

  // Modifier-driven bot pressure can make the bot blank on a rack before it settles on a word.
  const botBlankChance = Math.min(0.55, Math.max(0, -rackProfile.botPerformance) * 0.22);
  if ((freshCandidates.length || repeatCandidates.length) && botBlankChance > 0 && Math.random() < botBlankChance) {
    return '';
  }

  return chooseCandidate(freshCandidates, difficulty, rackProfile.botPerformance)
    || chooseCandidate(repeatCandidates, difficulty, rackProfile.botPerformance);
};
