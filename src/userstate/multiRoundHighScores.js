import { ref as dbRef, set } from 'firebase/database';
import { auth, db, firebaseEnabled } from '../firebaseClient.js';
import {
  MULTI_ROUND_DIFFICULTIES,
  normalizeMultiRoundDifficulty
} from '../states/game/multiround/multi-round-difficulties.js';

export const MULTI_ROUND_HIGH_SCORES_LOCAL_KEY = 'wordis:mr-high-scores';
export const MULTI_ROUND_HIGH_SCORES_DB_KEY = 'multiRoundHighScores';
export const MULTI_ROUND_HIGH_SCORES_PENDING_SYNC_KEY = 'wordis:mr-high-scores:pending-sync';

const VALID_DIFFICULTIES = new Set(Object.values(MULTI_ROUND_DIFFICULTIES));

const safeParse = (raw) => {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse multi-round high scores.', error);
    return null;
  }
};

const normalizeDifficulty = (difficulty) => {
  const normalizedDifficulty = normalizeMultiRoundDifficulty(difficulty);
  return VALID_DIFFICULTIES.has(normalizedDifficulty) ? normalizedDifficulty : MULTI_ROUND_DIFFICULTIES.NORMAL;
};

const normalizeNumber = (value) => {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
};

const scoreRound = (round = {}) => {
  const score = Math.max(0, Math.round(normalizeNumber(round.score)));
  const targetScore = Math.max(0, Math.round(normalizeNumber(round.targetScore)));
  const secondsRemaining = Math.max(0, Math.round(normalizeNumber(round.secondsRemaining)));
  const overScore = Math.max(0, score - targetScore);

  return {
    roundNumber: Math.max(0, Math.round(normalizeNumber(round.roundNumber))),
    roundId: round.roundId || '',
    roundLabel: round.roundLabel || '',
    score,
    targetScore,
    secondsRemaining,
    timeScore: secondsRemaining,
    overScore,
    roundScore: secondsRemaining + overScore
  };
};

export const calculateMultiRoundScore = ({ completedRounds = [], failedRound = null } = {}) => {
  const scoredRounds = [
    ...(Array.isArray(completedRounds) ? completedRounds : []),
    ...(failedRound ? [failedRound] : [])
  ].map(scoreRound);

  return scoredRounds.reduce((summary, round) => {
    summary.score += round.roundScore;
    summary.timeScore += round.timeScore;
    summary.overScore += round.overScore;
    summary.rounds.push(round);
    return summary;
  }, {
    score: 0,
    timeScore: 0,
    overScore: 0,
    rounds: []
  });
};

export const readLocalMultiRoundHighScores = () => {
  const scores = safeParse(localStorage.getItem(MULTI_ROUND_HIGH_SCORES_LOCAL_KEY)) || {};
  if (scores.tutorial && !scores[MULTI_ROUND_DIFFICULTIES.MICRO]) {
    scores[MULTI_ROUND_DIFFICULTIES.MICRO] = scores.tutorial;
  }
  delete scores.tutorial;
  return scores;
};

export const writeLocalMultiRoundHighScores = (scores = {}) => {
  localStorage.setItem(MULTI_ROUND_HIGH_SCORES_LOCAL_KEY, JSON.stringify(scores || {}));
  window.dispatchEvent(new CustomEvent('wordis:multi-round-high-scores-changed'));
};

export const clearLocalMultiRoundHighScores = () => {
  localStorage.removeItem(MULTI_ROUND_HIGH_SCORES_LOCAL_KEY);
  localStorage.removeItem(MULTI_ROUND_HIGH_SCORES_PENDING_SYNC_KEY);
  window.dispatchEvent(new CustomEvent('wordis:multi-round-high-scores-changed'));
};

const markMultiRoundHighScoresPendingSync = () => {
  localStorage.setItem(MULTI_ROUND_HIGH_SCORES_PENDING_SYNC_KEY, String(Date.now()));
};

const clearMultiRoundHighScoresPendingSync = () => {
  localStorage.removeItem(MULTI_ROUND_HIGH_SCORES_PENDING_SYNC_KEY);
};

export const hasPendingMultiRoundHighScoreSync = () => {
  return Boolean(localStorage.getItem(MULTI_ROUND_HIGH_SCORES_PENDING_SYNC_KEY));
};

export const normalizeMultiRoundHighScoreRecord = (record = {}, difficulty = '') => {
  const normalizedDifficulty = normalizeDifficulty(record.difficulty || difficulty);
  const score = Math.max(0, Math.round(normalizeNumber(record.score)));
  if (!score && !record.updatedAt) {
    return null;
  }

  return {
    difficulty: normalizedDifficulty,
    score,
    timeScore: Math.max(0, Math.round(normalizeNumber(record.timeScore))),
    overScore: Math.max(0, Math.round(normalizeNumber(record.overScore))),
    roundsCleared: Math.max(0, Math.round(normalizeNumber(record.roundsCleared))),
    totalRounds: Math.max(0, Math.round(normalizeNumber(record.totalRounds))),
    result: record.result === 'won' ? 'won' : 'failed',
    updatedAt: Math.max(0, Math.round(normalizeNumber(record.updatedAt))),
    rounds: Array.isArray(record.rounds) ? record.rounds.map(scoreRound) : []
  };
};

export const mergeMultiRoundHighScores = (localScores = {}, remoteScores = {}) => {
  const merged = {};

  Object.values(MULTI_ROUND_DIFFICULTIES).forEach((difficulty) => {
    const localRecord = normalizeMultiRoundHighScoreRecord(localScores[difficulty], difficulty);
    const remoteRecord = normalizeMultiRoundHighScoreRecord(remoteScores[difficulty], difficulty);

    if (!localRecord && !remoteRecord) {
      return;
    }

    if (!remoteRecord || (localRecord && localRecord.score > remoteRecord.score)) {
      merged[difficulty] = localRecord;
      return;
    }

    if (!localRecord || remoteRecord.score > localRecord.score) {
      merged[difficulty] = remoteRecord;
      return;
    }

    merged[difficulty] = (remoteRecord.updatedAt || 0) > (localRecord.updatedAt || 0)
      ? remoteRecord
      : localRecord;
  });

  return merged;
};

export const syncMultiRoundHighScores = async (uid, userState = {}) => {
  const localScores = readLocalMultiRoundHighScores();
  const remoteScores = userState.gameData?.[MULTI_ROUND_HIGH_SCORES_DB_KEY] || {};
  const mergedScores = mergeMultiRoundHighScores(localScores, remoteScores);
  const localChanged = JSON.stringify(localScores) !== JSON.stringify(mergedScores);
  const remoteChanged = JSON.stringify(remoteScores || {}) !== JSON.stringify(mergedScores);

  if (localChanged) {
    writeLocalMultiRoundHighScores(mergedScores);
  }

  if (remoteChanged) {
    await set(dbRef(db, `users/${uid}/gameData/${MULTI_ROUND_HIGH_SCORES_DB_KEY}`), mergedScores);
  }
  clearMultiRoundHighScoresPendingSync();

  return {
    changed: localChanged || remoteChanged,
    count: Object.keys(mergedScores).length
  };
};

export const saveMultiRoundHighScore = async ({
  difficulty,
  result,
  completedRounds = [],
  failedRound = null,
  totalRounds = 0
} = {}, { user = auth?.currentUser } = {}) => {
  const normalizedDifficulty = normalizeDifficulty(difficulty);
  const scoreSummary = calculateMultiRoundScore({ completedRounds, failedRound });
  const updatedAt = Date.now();
  const nextRecord = normalizeMultiRoundHighScoreRecord({
    difficulty: normalizedDifficulty,
    score: scoreSummary.score,
    timeScore: scoreSummary.timeScore,
    overScore: scoreSummary.overScore,
    roundsCleared: completedRounds.length,
    totalRounds,
    result,
    updatedAt,
    rounds: scoreSummary.rounds
  }, normalizedDifficulty);
  const localScores = readLocalMultiRoundHighScores();
  const mergedScores = mergeMultiRoundHighScores(localScores, {
    [normalizedDifficulty]: nextRecord
  });
  const bestRecord = mergedScores[normalizedDifficulty];
  const improved = bestRecord?.updatedAt === updatedAt;

  if (improved) {
    writeLocalMultiRoundHighScores(mergedScores);
    markMultiRoundHighScoresPendingSync();
  }

  if (improved && firebaseEnabled && db && user?.uid && navigator.onLine) {
    try {
      await set(dbRef(db, `users/${user.uid}/gameData/${MULTI_ROUND_HIGH_SCORES_DB_KEY}/${normalizedDifficulty}`), bestRecord);
    } catch (error) {
      console.warn('Failed to save multi-round high score to Firebase.', error);
    }
  }

  return {
    improved,
    record: bestRecord,
    scoreSummary
  };
};
