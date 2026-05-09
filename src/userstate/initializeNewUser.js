import { get, ref as dbRef, update } from 'firebase/database';
import { db, firebaseEnabled } from '../firebaseClient.js';

const initUserLog = (...args) => {
  console.log('[UserState Init]', ...args);
};

export const createBlankUserState = () => ({
  gameData: {
    completedGames: {},
    pstgms: {},
    multiRoundHighScores: {}
  }
});

export const initializeNewUser = async (user) => {
  if (!firebaseEnabled || !db || !user?.uid) {
    initUserLog('skipped', {
      firebaseEnabled,
      hasDb: Boolean(db),
      hasUser: Boolean(user?.uid)
    });
    return false;
  }

  initUserLog('checking user shell', user.uid.slice(0, 6));
  const userRef = dbRef(db, `users/${user.uid}`);
  const snapshot = await get(userRef);

  if (!snapshot.exists()) {
    initUserLog('creating blank user shell');
    await update(userRef, createBlankUserState());
    return true;
  }

  const existing = snapshot.val() || {};
  const patch = {};

  if (!existing.gameData) {
    patch.gameData = createBlankUserState().gameData;
  } else if (!existing.gameData.completedGames) {
    patch['gameData/completedGames'] = {};
  }

  if (existing.gameData && !existing.gameData.pstgms) {
    patch['gameData/pstgms'] = {};
  }

  if (existing.gameData && !existing.gameData.multiRoundHighScores) {
    patch['gameData/multiRoundHighScores'] = {};
  }

  if (Object.keys(patch).length) {
    initUserLog('patching missing user shell keys', Object.keys(patch));
    await update(userRef, patch);
  }

  initUserLog('user shell ready');
  return false;
};
