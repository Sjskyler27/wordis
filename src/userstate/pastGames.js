import { get, ref as dbRef, set, update } from 'firebase/database';
import { auth, db, firebaseEnabled } from '../firebaseClient.js';
import {
  savePastGamesBotMatch,
  savePastGamesMultiRound,
  savePastGamesMultiplayer,
  savePastGamesTimedSolo,
  showPastGamesBotMatch,
  showPastGamesMultiRound,
  showPastGamesMultiplayer,
  showPastGamesTimedSolo
} from '../../globalVariables.js';

export const PAST_GAME_SCHEMA_VERSION = 1;
export const PAST_GAMES_LOCAL_KEY = 'wordis:pstgms';
export const PAST_GAMES_DB_KEY = 'pstgms';

export const PAST_GAME_MODES = {
  MULTI_ROUND: 'mr',
  BOT_MATCH: 'bt',
  TIMED_SOLO: 'ts',
  MULTIPLAYER: 'mp'
};

export const PAST_GAME_MODE_DETAILS = [
  {
    mode: PAST_GAME_MODES.MULTI_ROUND,
    label: 'Runs',
    saveEnabled: savePastGamesMultiRound,
    showEnabled: showPastGamesMultiRound
  },
  {
    mode: PAST_GAME_MODES.BOT_MATCH,
    label: 'Bot',
    saveEnabled: savePastGamesBotMatch,
    showEnabled: showPastGamesBotMatch
  },
  {
    mode: PAST_GAME_MODES.TIMED_SOLO,
    label: 'Solo',
    saveEnabled: savePastGamesTimedSolo,
    showEnabled: showPastGamesTimedSolo
  },
  {
    mode: PAST_GAME_MODES.MULTIPLAYER,
    label: 'Duel',
    saveEnabled: savePastGamesMultiplayer,
    showEnabled: showPastGamesMultiplayer
  }
];

export const getVisiblePastGameModes = () => PAST_GAME_MODE_DETAILS.filter((mode) => mode.showEnabled);

const createEmptyPastGames = () => {
  return PAST_GAME_MODE_DETAILS.reduce((games, mode) => {
    games[mode.mode] = {};
    return games;
  }, {});
};

const safeParse = (raw) => {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse past games.', error);
    return null;
  }
};

const readLocalPastGames = () => {
  return {
    ...createEmptyPastGames(),
    ...(safeParse(localStorage.getItem(PAST_GAMES_LOCAL_KEY)) || {})
  };
};

const writeLocalPastGames = (games) => {
  localStorage.setItem(PAST_GAMES_LOCAL_KEY, JSON.stringify({
    ...createEmptyPastGames(),
    ...(games || {})
  }));
  window.dispatchEvent(new CustomEvent('wordis:past-games-changed'));
};

const getModeDetails = (mode) => PAST_GAME_MODE_DETAILS.find((entry) => entry.mode === mode);

export const canSavePastGameMode = (mode) => Boolean(getModeDetails(mode)?.saveEnabled);

export const getPastGamesByMode = (mode) => {
  const games = readLocalPastGames();
  return Object.values(games[mode] || {})
    .filter((game) => game?.v === PAST_GAME_SCHEMA_VERSION && game?.m === mode)
    .sort((first, second) => Number(second.ca || 0) - Number(first.ca || 0));
};

export const getPastGames = () => readLocalPastGames();

export const makePastGameId = (mode) => {
  const prefix = mode || 'gm';
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}_${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const normalizePastGame = (game) => {
  if (!game?.m || !game?.id) {
    return null;
  }

  return {
    ...game,
    v: PAST_GAME_SCHEMA_VERSION,
    uat: Number(game.uat || game.ca || Date.now())
  };
};

const upsertLocalPastGame = (game) => {
  const normalizedGame = normalizePastGame(game);
  if (!normalizedGame) {
    return null;
  }

  const games = readLocalPastGames();
  const modeGames = games[normalizedGame.m] || {};
  const existingGame = modeGames[normalizedGame.id];

  if (existingGame && Number(existingGame.uat || 0) > Number(normalizedGame.uat || 0)) {
    return existingGame;
  }

  games[normalizedGame.m] = {
    ...modeGames,
    [normalizedGame.id]: normalizedGame
  };
  writeLocalPastGames(games);
  return normalizedGame;
};

const saveCloudPastGame = async (game, user = auth?.currentUser) => {
  if (!firebaseEnabled || !db || !user?.uid || !navigator.onLine) {
    return false;
  }

  await set(dbRef(db, `users/${user.uid}/gameData/${PAST_GAMES_DB_KEY}/${game.m}/${game.id}`), game);
  return true;
};

export const savePastGame = async (game, { user = auth?.currentUser } = {}) => {
  if (!canSavePastGameMode(game?.m)) {
    return null;
  }

  const savedGame = upsertLocalPastGame(game);
  if (!savedGame) {
    return null;
  }

  try {
    await saveCloudPastGame(savedGame, user);
  } catch (error) {
    console.warn('Failed to save past game to Firebase.', error);
  }

  return savedGame;
};

const mergePastGameSets = (localGames = {}, remoteGames = {}) => {
  const merged = { ...localGames };

  Object.entries(remoteGames || {}).forEach(([id, remoteGame]) => {
    const normalizedRemote = normalizePastGame(remoteGame);
    if (!normalizedRemote) {
      return;
    }

    const localGame = merged[id];
    merged[id] = !localGame || Number(normalizedRemote.uat || 0) > Number(localGame.uat || 0)
      ? normalizedRemote
      : localGame;
  });

  return merged;
};

export const syncPastGames = async ({ user = auth?.currentUser } = {}) => {
  if (!firebaseEnabled || !db || !user?.uid || !navigator.onLine) {
    return { skipped: true, uploaded: 0, downloaded: 0 };
  }

  const snapshot = await get(dbRef(db, `users/${user.uid}/gameData/${PAST_GAMES_DB_KEY}`));
  const remoteGames = snapshot.exists() ? snapshot.val() : {};
  const localGames = readLocalPastGames();
  const mergedGames = createEmptyPastGames();
  let uploaded = 0;
  let downloaded = 0;

  await Promise.all(PAST_GAME_MODE_DETAILS.map(async ({ mode }) => {
    const mergedModeGames = mergePastGameSets(localGames[mode] || {}, remoteGames[mode] || {});
    mergedGames[mode] = mergedModeGames;

    const cloudPatch = {};
    Object.entries(mergedModeGames).forEach(([id, game]) => {
      const localGame = localGames[mode]?.[id];
      const remoteGame = remoteGames[mode]?.[id];

      if (!localGame || Number(game.uat || 0) > Number(localGame.uat || 0)) {
        downloaded += 1;
      }

      if (!remoteGame || Number(game.uat || 0) > Number(remoteGame.uat || 0)) {
        cloudPatch[id] = game;
        uploaded += 1;
      }
    });

    if (Object.keys(cloudPatch).length) {
      await update(dbRef(db, `users/${user.uid}/gameData/${PAST_GAMES_DB_KEY}/${mode}`), cloudPatch);
    }
  }));

  writeLocalPastGames(mergedGames);
  return { skipped: false, uploaded, downloaded };
};

export const buildBestWordSummary = (history = []) => {
  return (history || []).reduce((bestWord, entry) => {
    const score = Number(entry?.score || 0);
    if (!entry?.word || score <= Number(bestWord?.sc || 0)) {
      return bestWord;
    }

    return {
      w: entry.word,
      sc: score,
      rn: entry.rn || null
    };
  }, null);
};
