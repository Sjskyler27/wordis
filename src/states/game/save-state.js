import { get, ref as dbRef, remove, set, push } from 'firebase/database';
import { auth, db, firebaseEnabled } from '../../firebaseClient.js';
import { CARD_DEFINITIONS } from './tile-logic.js';

export const SAVE_MODES = {
  MULTI_ROUND: 'mr',
  BOT_MATCH: 'bt'
};

export const SAVE_SCHEMA_VERSION = 1;
export const SAVE_ON_WORD_SUBMIT = true; // Anti-cheat save point. Toggle off if submit-time writes get too heavy.
export const CLOUD_SAVES_ENABLED = import.meta.env.VITE_ENABLE_CLOUD_SAVES === 'true';

const LOCAL_SAVE_KEYS = {
  [SAVE_MODES.MULTI_ROUND]: 'wordis:save:mr',
  [SAVE_MODES.BOT_MATCH]: 'wordis:save:bt'
};

const CLOUD_SAVE_PATHS = {
  [SAVE_MODES.MULTI_ROUND]: 'mr'
};

export const SYNCABLE_SAVE_MODES = [
  SAVE_MODES.MULTI_ROUND,
  SAVE_MODES.BOT_MATCH
];

const safeParse = (raw) => {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse save state.', error);
    return null;
  }
};

const isCompatibleSave = (save, mode) => {
  return Boolean(save && save.v === SAVE_SCHEMA_VERSION && save.m === mode);
};

export const getLocalSaveKey = (mode) => LOCAL_SAVE_KEYS[mode] || `wordis:save:${mode}`;
export const getCloudSaveKey = (mode) => CLOUD_SAVE_PATHS[mode] || mode;
export const isCompatibleGameSave = isCompatibleSave;

export const saveLocalGame = (mode, save) => {
  if (!mode || !save) {
    return false;
  }

  try {
    localStorage.setItem(getLocalSaveKey(mode), JSON.stringify(save));
    window.dispatchEvent(new CustomEvent('wordis:saves-changed'));
    return true;
  } catch (error) {
    console.warn('Failed to save game locally.', error);
    return false;
  }
};

export const loadLocalGame = (mode) => {
  const save = safeParse(localStorage.getItem(getLocalSaveKey(mode)));
  return isCompatibleSave(save, mode) ? save : null;
};

export const hasLocalGameSave = (mode) => Boolean(loadLocalGame(mode));

export const loadLocalGameSaves = () => {
  return SYNCABLE_SAVE_MODES.reduce((saves, mode) => {
    const save = loadLocalGame(mode);
    if (save) {
      saves[mode] = save;
    }
    return saves;
  }, {});
};

export const importLocalGameSave = (mode, save) => {
  if (!isCompatibleSave(save, mode)) {
    return false;
  }

  return saveLocalGame(mode, save);
};

export const clearLocalGameSave = (mode) => {
  localStorage.removeItem(getLocalSaveKey(mode));
  window.dispatchEvent(new CustomEvent('wordis:saves-changed'));
};

const canSaveCloud = () => {
  return CLOUD_SAVES_ENABLED
    && firebaseEnabled
    && db
    && auth?.currentUser
    && navigator.onLine;
};

const getCloudSaveRef = (mode) => {
  const cloudKey = CLOUD_SAVE_PATHS[mode];
  const uid = auth?.currentUser?.uid;
  if (!cloudKey || !uid || !db) {
    return null;
  }

  return dbRef(db, `users/${uid}/svgms/${cloudKey}`);
};

export const saveCloudGame = async (mode, save) => {
  if (!canSaveCloud()) {
    return false;
  }

  const saveRef = getCloudSaveRef(mode);
  if (!saveRef) {
    return false;
  }

  try {
    console.log('trying to push to db '+ saveRef + save)
    await set(saveRef, save);
    return true;
  } catch (error) {
    console.warn('Failed to save game to Firebase.', error);
    return false;
  }
};

export const loadCloudGame = async (mode) => {
  if (!canSaveCloud()) {
    return null;
  }

  const saveRef = getCloudSaveRef(mode);
  if (!saveRef) {
    return null;
  }

  try {
    const snapshot = await get(saveRef);
    const save = snapshot.exists() ? snapshot.val() : null;
    return isCompatibleSave(save, mode) ? save : null;
  } catch (error) {
    console.warn('Failed to load Firebase save.', error);
    return null;
  }
};

export const clearCloudGameSave = async (mode) => {
  if (!canSaveCloud()) {
    return false;
  }

  const saveRef = getCloudSaveRef(mode);
  if (!saveRef) {
    return false;
  }

  try {
    await remove(saveRef);
    return true;
  } catch (error) {
    console.warn('Failed to clear Firebase save.', error);
    return false;
  }
};

const packTilesBySide = (tilesBySide = {}) => ({
  h: packTiles(tilesBySide.host || []),
  o: packTiles(tilesBySide.opponent || [])
});

const unpackTilesBySide = (tilesBySide = {}) => ({
  host: unpackTiles(tilesBySide.h || []),
  opponent: unpackTiles(tilesBySide.o || [])
});

const packTiles = (tiles = []) => tiles.map((tile) => ({
  i: tile.id,
  l: tile.letter,
  bl: tile.baseLetter,
  sc: tile.score,
  bs: tile.baseScore,
  bo: tile.bonusScore,
  mu: tile.multiplier,
  wm: tile.wordMultiplier,
  ft: tile.firstTileBonus,
  st: tile.status,
  lk: tile.locked,
  lt: tile.lockTurns,
  lr: tile.lockRestoreTile ? packTile(tile.lockRestoreTile) : undefined,
  sh: tile.shimmerShiftAt,
  si: tile.shimmerIntervalMs,
  sf: tile.shimmerFrozen,
  sx: tile.shimmerCycleIndex,
  rt: tile.rustTurns,
  rm: tile.rustMaxTurns,
  li: tile.lightningIntervalMs,
  la: tile.lightningStrikeAt,
  lc: tile.lightningStrikeCount
}));

const packTile = (tile = {}) => packTiles([tile])[0] || null;

const unpackTiles = (tiles = []) => tiles.map((tile) => ({
  id: tile.i,
  letter: tile.st === 'wild' ? '*' : tile.l,
  baseLetter: tile.bl,
  score: tile.sc,
  baseScore: tile.bs,
  bonusScore: tile.bo,
  multiplier: tile.mu,
  wordMultiplier: tile.wm,
  firstTileBonus: tile.ft,
  status: tile.st,
  locked: tile.lk,
  lockTurns: tile.lt,
  lockRestoreTile: tile.lr ? unpackTile(tile.lr) : undefined,
  shimmerShiftAt: tile.sh,
  shimmerIntervalMs: tile.si,
  shimmerFrozen: tile.sf,
  shimmerCycleIndex: tile.sx,
  rustTurns: tile.rt,
  rustMaxTurns: tile.rm,
  lightningIntervalMs: tile.li,
  lightningStrikeAt: tile.la,
  lightningStrikeCount: tile.lc
}));

const unpackTile = (tile = {}) => unpackTiles([tile])[0] || null;

const packCardsBySide = (cardsBySide = {}) => ({
  h: packCardHand(cardsBySide.host),
  o: packCardHand(cardsBySide.opponent)
});

const unpackCardsBySide = (cardsBySide = {}) => ({
  host: unpackCardHand(cardsBySide.h),
  opponent: unpackCardHand(cardsBySide.o)
});

const packCardHand = (hand = {}) => ({
  b: packCards(hand.boons || []),
  a: packCards(hand.attacks || [])
});

const unpackCardHand = (hand = {}) => ({
  boons: unpackCards(hand.b || []),
  attacks: unpackCards(hand.a || [])
});

const packCards = (cards = []) => cards.map((card) => ({
  i: card.id,
  k: card.key
}));

const unpackCards = (cards = []) => cards
  .map((card) => {
    const definition = CARD_DEFINITIONS[card.k];
    if (!definition) {
      return null;
    }

    return {
      id: card.i,
      key: card.k,
      ...definition
    };
  })
  .filter(Boolean);

const packHistoryBySide = (historyBySide = {}) => ({
  h: packHistory(historyBySide.host || []),
  o: packHistory(historyBySide.opponent || [])
});

const unpackHistoryBySide = (historyBySide = {}) => ({
  host: unpackHistory(historyBySide.h || []),
  opponent: unpackHistory(historyBySide.o || [])
});

const packHistory = (history = []) => history.map((entry) => ({
  w: entry.word,
  s: entry.score,
  t: packTiles(entry.tiles || [])
}));

const unpackHistory = (history = []) => history.map((entry) => ({
  word: entry.w,
  score: entry.s,
  tiles: unpackTiles(entry.t || [])
}));

const packSubmittedWords = (words = {}) => ({
  h: words.host || '',
  o: words.opponent || ''
});

const unpackSubmittedWords = (words = {}) => ({
  host: words.h || '',
  opponent: words.o || ''
});

const packSideValues = (values = {}) => ({
  h: values.host || 0,
  o: values.opponent || 0
});

const unpackSideValues = (values = {}) => ({
  host: values.h || 0,
  opponent: values.o || 0
});

export const packCommonGameState = ({
  scores,
  tiles,
  cards,
  wordHistory,
  submittedWords,
  rackClears
} = {}) => ({
  s: packSideValues(scores),
  t: packTilesBySide(tiles),
  c: packCardsBySide(cards),
  h: packHistoryBySide(wordHistory),
  w: packSubmittedWords(submittedWords),
  r: packSideValues(rackClears)
});

export const unpackCommonGameState = (save = {}) => ({
  scores: unpackSideValues(save.s),
  tiles: unpackTilesBySide(save.t),
  cards: unpackCardsBySide(save.c),
  wordHistory: unpackHistoryBySide(save.h),
  submittedWords: unpackSubmittedWords(save.w),
  rackClears: unpackSideValues(save.r)
});

export const packMultiRoundSave = ({
  difficulty,
  common,
  multiRound,
  includeInRound = true,
  includeHistory = true
} = {}) => ({
  v: SAVE_SCHEMA_VERSION,
  m: SAVE_MODES.MULTI_ROUND,
  ts: Date.now(),
  d: difficulty,
  g: includeHistory ? common : {
    s: common?.s,
    c: common?.c,
    r: common?.r
  },
  mr: {
    i: multiRound?.currentRoundIndex,
    t: includeInRound ? multiRound?.timerRemainingSeconds : undefined,
    rr: multiRound?.resolvedRounds,
    cr: multiRound?.completedRounds,
    pm: multiRound?.personalModifiers,
    rc: multiRound?.rewardChoices,
    rsr: multiRound?.rewardSelectionsRemaining,
    rst: multiRound?.rewardSelectionsTotal,
    pe: multiRound?.pendingStartingScore,
    end: multiRound?.runEnded,
    fs: multiRound?.failureSummary,
    fw: multiRound?.finalWordSpent,
    ts: multiRound?.timedModeTimerStarted
  }
});

export const packBotMatchSave = ({
  difficulty,
  common,
  overtime
} = {}) => ({
  v: SAVE_SCHEMA_VERSION,
  m: SAVE_MODES.BOT_MATCH,
  ts: Date.now(),
  d: difficulty,
  g: common,
  bt: {
    o: overtime
  }
});

export const unpackSave = (save = {}) => {
  if (!isCompatibleSave(save, save?.m)) {
    return null;
  }

  return {
    ...save,
    common: unpackCommonGameState(save.g || {})
  };
};
