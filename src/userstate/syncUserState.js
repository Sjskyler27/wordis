import { onAuthStateChanged } from 'firebase/auth';
import { get, ref as dbRef, remove, set, update } from 'firebase/database';
import { auth, db, firebaseEnabled } from '../firebaseClient.js';
import {
  SAVE_MODES,
  SYNCABLE_SAVE_MODES,
  clearLocalGameSave,
  getCloudSaveKey,
  importLocalGameSave,
  isCompatibleGameSave,
  loadLocalGame,
  loadLocalGameSaves
} from '../states/game/save-state.js';
import { BOT_DIFFICULTIES, botDifficulty } from '../states/game/play-config.js';
import { initializeNewUser } from './initializeNewUser.js';
import {
  clearLocalMultiRoundHighScores,
  syncMultiRoundHighScores
} from './multiRoundHighScores.js';
import { syncModifierUnlocks } from './modifierUnlocks.js';
import { syncMultiRoundDifficultyUnlocks } from './multiRoundDifficultyUnlocks.js';

export const USER_SYNC_INTERVAL_MS = 10 * 60 * 1000;
export const LAST_USER_SYNC_KEY = 'wordis:userstate:last-sync-at';
export const SYNC_SAVED_GAMES_ENABLED_KEY = 'wordis:sync:saved-games-enabled';
const USER_SYNC_TIMEOUT_MS = 6000;

const userSyncLog = (...args) => {
  console.log('[UserState Sync]', ...args);
};

const userSyncWarn = (...args) => {
  console.warn('[UserState Sync]', ...args);
};

const getUserLabel = (user) => {
  return user?.uid ? `${user.uid.slice(0, 6)}...` : 'none';
};

const withTimeout = (promise, label, timeoutMs = USER_SYNC_TIMEOUT_MS) => {
  let timeoutId;

  const timeoutPromise = new Promise((resolve) => {
    timeoutId = window.setTimeout(() => {
      userSyncWarn(`${label} timed out after ${timeoutMs}ms`);
      resolve({ timedOut: true });
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise])
    .finally(() => {
      window.clearTimeout(timeoutId);
    });
};

const BOT_DIFFICULTY_RANK = {
  [BOT_DIFFICULTIES.EASY]: 0,
  [BOT_DIFFICULTIES.NORMAL]: 1,
  [BOT_DIFFICULTIES.HARD]: 2
};

const normalizeDifficulty = (difficulty) => {
  return BOT_DIFFICULTY_RANK[difficulty] === undefined ? BOT_DIFFICULTIES.EASY : difficulty;
};

const maxDifficulty = (left, right) => {
  const leftDifficulty = normalizeDifficulty(left);
  const rightDifficulty = normalizeDifficulty(right);
  return BOT_DIFFICULTY_RANK[leftDifficulty] >= BOT_DIFFICULTY_RANK[rightDifficulty]
    ? leftDifficulty
    : rightDifficulty;
};

const getRemoteBotDifficulty = (userState = {}) => {
  const remote = userState.gameData?.botDifficultyCompletion;
  if (typeof remote === 'string') {
    return normalizeDifficulty(remote);
  }

  return normalizeDifficulty(remote?.maxUnlocked);
};

const getLocalBotDifficulty = () => {
  return normalizeDifficulty(localStorage.getItem('botDefaultDifficulty'));
};

const setLocalBotDifficulty = (difficulty) => {
  const nextDifficulty = normalizeDifficulty(difficulty);
  localStorage.setItem('botDefaultDifficulty', nextDifficulty);
  botDifficulty.value = nextDifficulty;
};

export const isSavedGameSyncEnabled = () => {
  return localStorage.getItem(SYNC_SAVED_GAMES_ENABLED_KEY) !== 'false';
};

export const setSavedGameSyncEnabled = (enabled) => {
  localStorage.setItem(SYNC_SAVED_GAMES_ENABLED_KEY, enabled ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent('wordis:sync-settings-changed'));
};

const canSyncNow = (force = false) => {
  if (force) {
    return true;
  }

  const lastSyncedAt = Number(localStorage.getItem(LAST_USER_SYNC_KEY) || 0);
  return !lastSyncedAt || Date.now() - lastSyncedAt >= USER_SYNC_INTERVAL_MS;
};

const getSaveTimestamp = (save) => {
  const timestamp = Number(save?.ts || 0);
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const getRemoteSave = (remoteSaves = {}, mode) => {
  const cloudKey = getCloudSaveKey(mode);
  const save = remoteSaves[cloudKey] || remoteSaves[mode] || null;
  return isCompatibleGameSave(save, mode) ? save : null;
};

const syncSavedGames = async (uid, userState = {}) => {
  if (!isSavedGameSyncEnabled()) {
    userSyncLog('saved game sync disabled locally');
    return { uploaded: 0, downloaded: 0 };
  }

  const localSaves = loadLocalGameSaves();
  const remoteSaves = userState.svgms || {};
  let uploaded = 0;
  let downloaded = 0;

  await Promise.all(SYNCABLE_SAVE_MODES.map(async (mode) => {
    const localSave = localSaves[mode] || loadLocalGame(mode);
    const remoteSave = getRemoteSave(remoteSaves, mode);

    if (!localSave && !remoteSave) {
      return;
    }

    if (remoteSave && (!localSave || getSaveTimestamp(remoteSave) > getSaveTimestamp(localSave))) {
      userSyncLog('downloading newer save', mode, {
        remoteTs: getSaveTimestamp(remoteSave),
        localTs: getSaveTimestamp(localSave)
      });
      if (importLocalGameSave(mode, remoteSave)) {
        downloaded += 1;
      }
      return;
    }

    if (localSave && (!remoteSave || getSaveTimestamp(localSave) > getSaveTimestamp(remoteSave))) {
      userSyncLog('uploading newer save', mode, {
        localTs: getSaveTimestamp(localSave),
        remoteTs: getSaveTimestamp(remoteSave)
      });
      await set(dbRef(db, `users/${uid}/svgms/${getCloudSaveKey(mode)}`), localSave);
      uploaded += 1;
    }
  }));

  return { uploaded, downloaded };
};

const syncBotDifficultyCompletion = async (uid, userState = {}) => {
  const localDifficulty = getLocalBotDifficulty();
  const remoteDifficulty = getRemoteBotDifficulty(userState);
  const mergedDifficulty = maxDifficulty(localDifficulty, remoteDifficulty);

  if (mergedDifficulty !== localDifficulty) {
    userSyncLog('updating local bot difficulty', { from: localDifficulty, to: mergedDifficulty });
    setLocalBotDifficulty(mergedDifficulty);
  }

  if (mergedDifficulty !== remoteDifficulty) {
    userSyncLog('updating cloud bot difficulty', { from: remoteDifficulty, to: mergedDifficulty });
    await update(dbRef(db, `users/${uid}/gameData`), {
      botDifficultyCompletion: {
        maxUnlocked: mergedDifficulty,
        updatedAt: Date.now()
      }
    });
  }

  return mergedDifficulty;
};

export const syncUserState = async ({ force = false, user = auth?.currentUser } = {}) => {
  userSyncLog('sync requested', {
    force,
    firebaseEnabled,
    hasDb: Boolean(db),
    hasUser: Boolean(user?.uid),
    user: getUserLabel(user),
    online: navigator.onLine
  });

  if (!firebaseEnabled || !db || !user?.uid || !navigator.onLine) {
    userSyncLog('sync skipped: unavailable dependency or offline');
    return { skipped: true };
  }

  if (!canSyncNow(force)) {
    userSyncLog('sync skipped: ten minute guard');
    return { skipped: true };
  }

  try {
    const initResult = await withTimeout(initializeNewUser(user), 'initializeNewUser');
    if (initResult?.timedOut) {
      return { skipped: true, timedOut: true };
    }

    const userRef = dbRef(db, `users/${user.uid}`);
    const snapshot = await withTimeout(get(userRef), 'read user state');
    if (snapshot?.timedOut) {
      return { skipped: true, timedOut: true };
    }

    const userState = snapshot.exists() ? snapshot.val() : {};
    userSyncLog('cloud user state read', {
      hasSvgms: Boolean(userState.svgms),
      hasGameData: Boolean(userState.gameData)
    });

    const syncResult = await withTimeout(Promise.all([
      syncSavedGames(user.uid, userState),
      syncBotDifficultyCompletion(user.uid, userState),
      syncMultiRoundHighScores(user.uid, userState),
      syncModifierUnlocks({ user, userState }),
      syncMultiRoundDifficultyUnlocks({ user, userState })
    ]), 'merge user state');
    if (syncResult?.timedOut) {
      return { skipped: true, timedOut: true };
    }

    const [savedGames, botDifficulty, multiRoundHighScores, modifierUnlocks, multiRoundDifficultyUnlocks] = syncResult;
    localStorage.setItem(LAST_USER_SYNC_KEY, String(Date.now()));
    window.dispatchEvent(new CustomEvent('wordis:saves-changed'));
    userSyncLog('sync finished', { savedGames, botDifficulty, multiRoundHighScores, modifierUnlocks, multiRoundDifficultyUnlocks });

    return {
      skipped: false,
      savedGames,
      botDifficulty,
      multiRoundHighScores,
      modifierUnlocks,
      multiRoundDifficultyUnlocks
    };
  } catch (error) {
    userSyncWarn('sync failed safely', error);
    return { skipped: true, error };
  }
};

export const initUserSync = (showAuthPrompt, onSignedIn) => {
  if (!firebaseEnabled || !auth) {
    userSyncLog('auth listener skipped: firebase auth unavailable');
    return () => {};
  }

  userSyncLog('auth listener starting');
  let unsubscribeAuth = () => {};

  try {
    unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      userSyncLog('auth state changed', {
        hasUser: Boolean(user?.uid),
        user: getUserLabel(user)
      });

      if (!user) {
        userSyncLog('no auth user; automatic auth prompt disabled');
        return;
      }

      onSignedIn?.(user);

      try {
        await syncUserState({ user });
      } catch (error) {
        userSyncWarn('initial user sync failed safely', error);
      }
    });
  } catch (error) {
    userSyncWarn('auth listener failed safely', error);
    return () => {};
  }

  const handleOnline = () => {
    userSyncLog('online event sync requested');
    void syncUserState();
  };

  window.addEventListener('online', handleOnline);

  return () => {
    unsubscribeAuth();
    window.removeEventListener('online', handleOnline);
  };
};

export const logoutCleanup = async () => {
  const currentUser = auth?.currentUser;

  if (currentUser) {
    try {
      await syncUserState({ force: true, user: currentUser });
    } catch (error) {
      console.warn('Failed to sync on logout.', error);
    }
  }

  SYNCABLE_SAVE_MODES.forEach((mode) => {
    clearLocalGameSave(mode);
  });

  localStorage.removeItem('botDefaultDifficulty');
  clearLocalMultiRoundHighScores();
  localStorage.removeItem(LAST_USER_SYNC_KEY);
};

export const deleteCloudGameSave = async (mode, user = auth?.currentUser) => {
  if (!firebaseEnabled || !db || !user?.uid || !mode) {
    return false;
  }

  await remove(dbRef(db, `users/${user.uid}/svgms/${getCloudSaveKey(mode)}`));
  return true;
};

export { SAVE_MODES };
