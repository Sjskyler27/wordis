import { get, ref as dbRef, update } from 'firebase/database';
import { auth, db, firebaseEnabled } from '../firebaseClient.js';
import {
  MULTI_ROUND_DIFFICULTIES,
  normalizeMultiRoundDifficulty
} from '../states/game/multiround/multi-round-difficulties.js';

export const MULTI_ROUND_DIFFICULTY_UNLOCK_STORAGE_KEY = 'wordis:multi-round-difficulty-unlocks';
export const MULTI_ROUND_DIFFICULTY_UNLOCK_CLOUD_KEY = 'multiRoundDifficultyUnlocks';

export const MULTI_ROUND_DIFFICULTY_ORDER = [
  MULTI_ROUND_DIFFICULTIES.MICRO,
  MULTI_ROUND_DIFFICULTIES.EASY,
  MULTI_ROUND_DIFFICULTIES.NORMAL,
  MULTI_ROUND_DIFFICULTIES.HARD
];

const DEFAULT_UNLOCKED_DIFFICULTIES = [MULTI_ROUND_DIFFICULTIES.MICRO];

const normalizeDifficultyUnlockState = (state = {}) => {
  const unlocked = Array.isArray(state.unlocked)
    ? state.unlocked
    : DEFAULT_UNLOCKED_DIFFICULTIES;

  return {
    v: 1,
    updatedAt: Number(state.updatedAt) || 0,
    unlocked: [...new Set([
      ...DEFAULT_UNLOCKED_DIFFICULTIES,
      ...unlocked.map(normalizeMultiRoundDifficulty)
    ])].filter((difficulty) => MULTI_ROUND_DIFFICULTY_ORDER.includes(difficulty))
  };
};

export const readLocalMultiRoundDifficultyUnlockState = () => {
  if (typeof localStorage === 'undefined') {
    return normalizeDifficultyUnlockState();
  }

  try {
    return normalizeDifficultyUnlockState(JSON.parse(localStorage.getItem(MULTI_ROUND_DIFFICULTY_UNLOCK_STORAGE_KEY) || '{}'));
  } catch (error) {
    return normalizeDifficultyUnlockState();
  }
};

export const writeLocalMultiRoundDifficultyUnlockState = (state = {}) => {
  const normalized = normalizeDifficultyUnlockState({
    ...state,
    updatedAt: Date.now()
  });
  localStorage.setItem(MULTI_ROUND_DIFFICULTY_UNLOCK_STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent('wordis:multi-round-difficulty-unlocks-changed', {
    detail: normalized
  }));
  return normalized;
};

export const isMultiRoundDifficultyUnlocked = (difficulty, state = readLocalMultiRoundDifficultyUnlockState()) => {
  return normalizeDifficultyUnlockState(state).unlocked.includes(normalizeMultiRoundDifficulty(difficulty));
};

export const getFirstUnlockedMultiRoundDifficulty = (state = readLocalMultiRoundDifficultyUnlockState()) => {
  const normalized = normalizeDifficultyUnlockState(state);
  return MULTI_ROUND_DIFFICULTY_ORDER.find((difficulty) => normalized.unlocked.includes(difficulty))
    || MULTI_ROUND_DIFFICULTIES.MICRO;
};

const getNextDifficulty = (difficulty) => {
  const index = MULTI_ROUND_DIFFICULTY_ORDER.indexOf(difficulty);
  return index >= 0 ? MULTI_ROUND_DIFFICULTY_ORDER[index + 1] || null : null;
};

const unlockDifficulty = (difficulty) => {
  if (!difficulty) {
    return null;
  }

  const state = readLocalMultiRoundDifficultyUnlockState();
  if (state.unlocked.includes(difficulty)) {
    return null;
  }

  const nextState = writeLocalMultiRoundDifficultyUnlockState({
    ...state,
    unlocked: [...state.unlocked, difficulty]
  });
  void syncMultiRoundDifficultyUnlocks({ force: true });
  return nextState;
};

export const unlockNextDifficultyForStartedRun = (difficulty) => {
  if (normalizeMultiRoundDifficulty(difficulty) !== MULTI_ROUND_DIFFICULTIES.MICRO) {
    return null;
  }

  return unlockDifficulty(getNextDifficulty(MULTI_ROUND_DIFFICULTIES.MICRO));
};

export const unlockNextDifficultyForWonRun = (difficulty) => {
  return unlockDifficulty(getNextDifficulty(normalizeMultiRoundDifficulty(difficulty)));
};

export const unlockAllMultiRoundDifficulties = () => {
  const nextState = writeLocalMultiRoundDifficultyUnlockState({
    v: 1,
    updatedAt: Date.now(),
    unlocked: MULTI_ROUND_DIFFICULTY_ORDER
  });
  void syncMultiRoundDifficultyUnlocks({ force: true });
  return nextState;
};

export const mergeMultiRoundDifficultyUnlockStates = (...states) => {
  return normalizeDifficultyUnlockState(states.reduce((merged, state) => ({
    v: 1,
    updatedAt: Math.max(Number(merged.updatedAt) || 0, Number(state?.updatedAt) || 0),
    unlocked: [...(merged.unlocked || []), ...(state?.unlocked || [])]
  }), normalizeDifficultyUnlockState()));
};

export const syncMultiRoundDifficultyUnlocks = async ({ force = false, user = auth?.currentUser, userState = null } = {}) => {
  if (!firebaseEnabled || !db || !user?.uid || !navigator.onLine) {
    return { skipped: true };
  }

  const localState = readLocalMultiRoundDifficultyUnlockState();
  const remoteState = userState
    ? userState.gameData?.[MULTI_ROUND_DIFFICULTY_UNLOCK_CLOUD_KEY]
    : (await get(dbRef(db, `users/${user.uid}/gameData/${MULTI_ROUND_DIFFICULTY_UNLOCK_CLOUD_KEY}`))).val();
  const mergedState = mergeMultiRoundDifficultyUnlockStates(localState, remoteState || {});
  writeLocalMultiRoundDifficultyUnlockState(mergedState);

  if (force || JSON.stringify(normalizeDifficultyUnlockState(remoteState || {})) !== JSON.stringify(mergedState)) {
    await update(dbRef(db, `users/${user.uid}/gameData`), {
      [MULTI_ROUND_DIFFICULTY_UNLOCK_CLOUD_KEY]: mergedState
    });
  }

  return {
    skipped: false,
    unlocked: mergedState.unlocked
  };
};
