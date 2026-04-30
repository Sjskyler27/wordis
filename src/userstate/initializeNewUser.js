import { get, ref as dbRef, update } from 'firebase/database';
import { db, firebaseEnabled } from '../firebaseClient.js';

export const createBlankUserState = () => ({
  gameData: {
    completedGames: {},
    pstgms: {}
  }
});

export const initializeNewUser = async (user) => {
  if (!firebaseEnabled || !db || !user?.uid) {
    return false;
  }

  const userRef = dbRef(db, `users/${user.uid}`);
  const snapshot = await get(userRef);

  if (!snapshot.exists()) {
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

  if (Object.keys(patch).length) {
    await update(userRef, patch);
  }

  return false;
};
