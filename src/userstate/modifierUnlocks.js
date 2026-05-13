import { get, ref as dbRef, update } from 'firebase/database';
import { auth, db, firebaseEnabled } from '../firebaseClient.js';
import '../states/game/modifier-definitions.cjs';
import {
  PERSONAL_MODIFIER_DEFINITIONS
} from '../states/game/multiround/personal-modifier-definitions.js';
import {
  ROUND_MODIFIER_DEFINITIONS
} from '../states/game/multiround/round-modifier-definitions.js';
import {
  CARD_DEFINITIONS
} from '../states/game/tile-logic.js';

export const MODIFIER_UNLOCK_STORAGE_KEY = 'wordis:modifier-unlocks';
export const MODIFIER_UNLOCKS_CLOUD_KEY = 'modifierUnlocks';

export const MODIFIER_UNLOCK_TYPES = {
  TILE: 'tile',
  ROUND: 'round',
  PERSONAL: 'personal',
  CARD: 'card'
};

export const TILE_MODIFIER_GROUPS = {
  good: ['gold', 'firsttile', 'royalPear', 'twinTile', 'glassTile', 'cornucopiaTile', 'bankTile', 'gainboon', 'gainattack'],
  bad: ['zeroTile', 'mustuse', 'locked3', 'burningTile', 'rustingTile', 'lightningTile', 'barricadeTile', 'bagTile'],
  neutral: ['yinYang', 'ghostTile', 'bloodTile', 'wild', 'shimmer', 'voidTile', 'hourglassTile', 'waterTile', 'leecherTile']
};

export const MODIFIER_UNLOCK_DISPLAY_NAMES = {
  tile: {
    gold: 'Gold',
    firsttile: 'First Strike',
    royalPear: 'Royal Pair',
    twinTile: 'Twin Tile',
    glassTile: 'Glass',
    cornucopiaTile: 'Cornucopia',
    bankTile: 'Bank',
    gainboon: 'Boon Tile',
    gainattack: 'Attack Tile',
    zeroTile: 'Zero',
    mustuse: 'Must Use',
    locked3: 'Locked',
    burningTile: 'Burning',
    rustingTile: 'Rusting',
    lightningTile: 'Lightning',
    barricadeTile: 'Barricade',
    bagTile: 'Bag',
    yinYang: 'Yin Yang',
    ghostTile: 'Ghost',
    bloodTile: 'Blood',
    wild: 'Wild',
    shimmer: 'Shimmer',
    voidTile: 'Void',
    hourglassTile: 'Hourglass',
    waterTile: 'Water',
    leecherTile: 'Leecher'
  },
  round: {
    min_word_5: 'Five Up',
    no_s: 'No S',
    highest_consonant_zero: 'Muted Consonant',
    no_cards: 'No Cards',
    double_burns: 'Hot Rack',
    four_letter_sap: 'Short Sap',
    fleeting_tiles: 'Fleeting Rack',
    less_reward_options: 'Minimization',
    two_vowels: 'Vowel Toll',
    idle_tiles_decay: 'Rusting Rack',
    pressure_timer_easy: 'Quick Target',
    pressure_timer_medium: 'Tight Target',
    pressure_timer_hard: 'Brutal Target',
    loose_letters: 'Loose Letters',
    disorganised: 'Disorganised',
    chaotic_board: 'Chaotic Board',
    rotating_lock_column: 'Lockstep',
    bad_modifier_surge: 'Bad Luck',
    must_tile_each_turn: 'Constant Demand'
  },
  personal: {
    vowel_value: 'Vowel Value',
    more_options: 'More Options',
    epic_reward_choice: 'Epic Reward Choice',
    ghost_charge: 'Ghost Charge',
    golden_draft: 'Golden Draft',
    first_focus: 'First Focus',
    wild_spark: 'Wild Spark',
    cool_embers: 'Cool Embers',
    crowded_bag: 'More Modifiers',
    five_letter_form: 'Five Letter Form',
    seven_second_wind: 'Seven Second Wind',
    neutral_current: 'Neutral Current',
    better_odds: 'Better Odds',
    cleaner_rack: 'Cleaner Rack',
    bank_interest: 'Bank Interest',
    short_word_sharpener: 'Short Word Sharpener',
    tiny_dictionary: 'Tiny Dictionary',
    large_vernacular: 'Large Vernacular',
    strong_start: 'Strong Start',
    time_reserve: 'Time Reserve',
    speedy: 'Speedy Multiplier',
    speedy_addition: 'Speedy Addition',
    boon_cache: 'Boon Cache',
    attack_cache: 'Attack Cache',
    bright_letters: 'Bright Letters',
    must_shield: 'Must Shield',
    burn_shield: 'Burn Shield',
    compact_double: 'Compact Multiplier',
    semi_compact_double: 'Semi Compact Multiplier'
  },
  card: Object.fromEntries(
    Object.entries(CARD_DEFINITIONS || {}).map(([key, definition]) => [key, definition.label || key])
  )
};

const TILE_MODIFIER_GROUP_BY_KEY = Object.entries(TILE_MODIFIER_GROUPS).reduce((groups, [group, keys]) => {
  keys.forEach((key) => {
    groups[key] = group;
  });
  return groups;
}, {});

const TILE_DEFINITIONS = globalThis.__wordisModifierDefinitions?.createModifierDefinitions?.({
  bloodTilePositionValues: {
    pos1: -2,
    pos2: -1,
    pos3: 0,
    pos4: 1,
    pos5: 2,
    pos6: 3,
    pos7: 4,
    pos8: 5,
    pos9: 6
  }
}) || {};

const ALL_KEYS_BY_TYPE = {
  [MODIFIER_UNLOCK_TYPES.TILE]: Object.keys(TILE_DEFINITIONS).filter((key) => key !== 'normal'),
  [MODIFIER_UNLOCK_TYPES.ROUND]: Object.keys(ROUND_MODIFIER_DEFINITIONS),
  [MODIFIER_UNLOCK_TYPES.PERSONAL]: Object.keys(PERSONAL_MODIFIER_DEFINITIONS),
  [MODIFIER_UNLOCK_TYPES.CARD]: Object.keys(CARD_DEFINITIONS)
};

export const STARTING_MODIFIER_UNLOCKS = {
  [MODIFIER_UNLOCK_TYPES.TILE]: [
    'gold', 'firsttile', 'twinTile',
    'wild', 'ghostTile', 'void',
   'mustuse', 'locked3', 'burningTile'
  ],
  [MODIFIER_UNLOCK_TYPES.ROUND]: [
    'four_letter_sap', 'less_reward_options', 'pressure_timer_easy',
    'min_word_5', 'no_s', 'no_cards', 'pressure_timer_medium',
    'two_vowels', 'pressure_timer_hard', 'must_tile_each_turn'
  ],
  [MODIFIER_UNLOCK_TYPES.PERSONAL]: [
    'five_letter_form', 'first_focus', 'boon_cache', 'strong_start',
    'better_odds', 'cleaner_rack', 'time_reserve', 'tiny_dictionary',
    'golden_draft', 'seven_second_wind', 'bright_letters'
  ],
  [MODIFIER_UNLOCK_TYPES.CARD]: [
    'boon_delete_tile', 'boon_isolate_tile', 'boon_clear_negative',
    'boon_extra_clear', 'boon_firsttile', 'boon_wild', 'boon_newLetter',
    'boon_ghostTile', 'boon_gold', 'attack_mustuse', 'attack_locked3',
    'attack_pause_submissions', 'attack_pause_time', 'attack_gain_time',
    'attack_reduce_bad_modifiers', 'attack_reroll_next_round_modifier',
    'attack_reroll_personal_modifier_rewards', 'attack_reduce_round_target'
  ]
};

export const MODIFIER_UNLOCK_PAIRINGS = {
  'tile:firsttile': ['card:boon_firsttile'],
  'tile:wild': ['card:boon_wild'],
  'tile:ghostTile': ['card:boon_ghostTile'],
  'tile:gold': ['card:boon_gold'],
  'tile:royalPear': ['tile:locked3', 'card:boon_pair'],
  'tile:zeroTile': ['card:attack_zeroTile'],
  'tile:mustuse': ['card:attack_mustuse'],
  'tile:locked3': ['card:attack_locked3'],
  'tile:glassTile': ['tile:burningTile'],
  'tile:cornucopiaTile': ['tile:rustingTile'],
  'tile:bankTile': ['tile:barricadeTile'],
  'personal:time_reserve': ['round:pressure_timer_medium'],
  'personal:tiny_dictionary': ['round:min_word_5'],
  'personal:large_vernacular': ['round:four_letter_sap'],
  'personal:strong_start': ['round:bad_modifier_surge']
};

const PERSONAL_MODIFIER_TILE_PREREQUISITES = {
  ghost_charge: ['ghostTile'],
  golden_draft: ['gold'],
  first_focus: ['firsttile'],
  wild_spark: ['wild'],
  cool_embers: ['burningTile'],
  bank_interest: ['bankTile'],
  must_shield: ['mustuse'],
  burn_shield: ['burningTile']
};

export const MODIFIER_UNLOCK_CONDITIONS = [
  {
    type: MODIFIER_UNLOCK_TYPES.TILE,
    key: 'royalPear',
    hint: 'Spell a 6-letter word in multi-round.',
    test: ({ bestWordLength }) => bestWordLength >= 6
  },
  {
    type: MODIFIER_UNLOCK_TYPES.TILE,
    key: 'glassTile',
    hint: 'Score 35 or more with one word in multi-round.',
    test: ({ bestWordScore }) => bestWordScore >= 35
  },
  {
    type: MODIFIER_UNLOCK_TYPES.TILE,
    key: 'cornucopiaTile',
    hint: 'Clear 2 rounds in one run.',
    test: ({ completedRoundCount }) => completedRoundCount >= 2
  },
  {
    type: MODIFIER_UNLOCK_TYPES.TILE,
    key: 'bankTile',
    hint: 'Finish a round with at least 20 seconds remaining.',
    test: ({ bestSecondsRemaining, round }) => (bestSecondsRemaining || round.secondsRemaining || 0) >= 20
  },
  {
    type: MODIFIER_UNLOCK_TYPES.TILE,
    key: 'ghostTile',
    hint: 'Play 12 words across a multi-round run.',
    test: ({ wordCount }) => wordCount >= 12
  },
  {
    type: MODIFIER_UNLOCK_TYPES.TILE,
    key: 'bagTile',
    hint: 'Lose a multi-round run for the first time.',
    test: ({ runLost }) => Boolean(runLost)
  },
  {
    type: MODIFIER_UNLOCK_TYPES.TILE,
    key: 'glassTile',
    hint: 'Complete the tutorial run.',
    allowInTutorial: true,
    test: ({ tutorialCompleted }) => Boolean(tutorialCompleted)
  },
  {
    type: MODIFIER_UNLOCK_TYPES.ROUND,
    key: 'min_word_5',
    hint: 'Complete the tutorial run.',
    allowInTutorial: true,
    test: ({ tutorialCompleted }) => Boolean(tutorialCompleted)
  },
  {
    type: MODIFIER_UNLOCK_TYPES.PERSONAL,
    key: 'time_reserve',
    hint: 'Finish a round with at least 15 seconds remaining.',
    test: ({ bestSecondsRemaining, round }) => (bestSecondsRemaining || round.secondsRemaining || 0) >= 15
  },
  {
    type: MODIFIER_UNLOCK_TYPES.PERSONAL,
    key: 'tiny_dictionary',
    hint: 'Play 5 words in one multi-round run.',
    test: ({ wordCount }) => wordCount >= 5
  },
  {
    type: MODIFIER_UNLOCK_TYPES.PERSONAL,
    key: 'large_vernacular',
    hint: 'Spell an 8-letter word in multi-round.',
    test: ({ bestWordLength }) => bestWordLength >= 8
  },
  {
    type: MODIFIER_UNLOCK_TYPES.PERSONAL,
    key: 'strong_start',
    hint: 'Clear 3 rounds in one run.',
    test: ({ completedRoundCount }) => completedRoundCount >= 3
  },
  {
    type: MODIFIER_UNLOCK_TYPES.PERSONAL,
    key: 'time_reserve',
    hint: 'Complete the tutorial run.',
    allowInTutorial: true,
    test: ({ tutorialCompleted }) => Boolean(tutorialCompleted)
  }
];

const normalizeUnlockArray = (value = []) => (
  Array.isArray(value) ? [...new Set(value.filter(Boolean).map(String))] : []
);

const getContingentCardUnlockKeys = (tileKeys = []) => {
  const unlockedTiles = new Set(tileKeys);
  return Object.entries(MODIFIER_UNLOCK_PAIRINGS).flatMap(([entityId, pairings]) => {
    const entity = parseModifierEntityId(entityId);
    if (entity?.type !== MODIFIER_UNLOCK_TYPES.TILE || !unlockedTiles.has(entity.key)) {
      return [];
    }

    return pairings
      .map(parseModifierEntityId)
      .filter((pair) => pair?.type === MODIFIER_UNLOCK_TYPES.CARD)
      .map((pair) => pair.key);
  });
};

const getPersonalPrerequisiteTileKeys = (personalKeys = []) => {
  return normalizeUnlockArray(personalKeys.flatMap((key) => PERSONAL_MODIFIER_TILE_PREREQUISITES[key] || []));
};

const createDefaultUnlockState = () => ({
  v: 1,
  updatedAt: Date.now(),
  [MODIFIER_UNLOCK_TYPES.TILE]: normalizeUnlockArray(STARTING_MODIFIER_UNLOCKS.tile),
  [MODIFIER_UNLOCK_TYPES.ROUND]: normalizeUnlockArray(STARTING_MODIFIER_UNLOCKS.round),
  [MODIFIER_UNLOCK_TYPES.PERSONAL]: normalizeUnlockArray(STARTING_MODIFIER_UNLOCKS.personal),
  [MODIFIER_UNLOCK_TYPES.CARD]: normalizeUnlockArray(STARTING_MODIFIER_UNLOCKS.card)
});

export const normalizeModifierUnlockState = (state = {}) => {
  const defaults = createDefaultUnlockState();
  const personalUnlocks = normalizeUnlockArray([
    ...defaults.personal,
    ...(state.personal || [])
  ]).filter((key) => ALL_KEYS_BY_TYPE.personal.includes(key));
  const tileUnlocks = normalizeUnlockArray([
    ...defaults.tile,
    ...(state.tile || []),
    ...getPersonalPrerequisiteTileKeys(personalUnlocks)
  ]).filter((key) => ALL_KEYS_BY_TYPE.tile.includes(key));
  return {
    v: 1,
    updatedAt: Math.max(Number(state.updatedAt) || 0, defaults.updatedAt),
    [MODIFIER_UNLOCK_TYPES.TILE]: tileUnlocks,
    [MODIFIER_UNLOCK_TYPES.ROUND]: normalizeUnlockArray([
      ...defaults.round,
      ...(state.round || [])
    ]).filter((key) => ALL_KEYS_BY_TYPE.round.includes(key)),
    [MODIFIER_UNLOCK_TYPES.PERSONAL]: personalUnlocks,
    [MODIFIER_UNLOCK_TYPES.CARD]: normalizeUnlockArray([
      ...defaults.card,
      ...(state.card || []),
      ...getContingentCardUnlockKeys(tileUnlocks)
    ]).filter((key) => ALL_KEYS_BY_TYPE.card.includes(key))
  };
};

export const readLocalModifierUnlockState = () => {
  if (typeof localStorage === 'undefined') {
    return createDefaultUnlockState();
  }

  try {
    return normalizeModifierUnlockState(JSON.parse(localStorage.getItem(MODIFIER_UNLOCK_STORAGE_KEY) || '{}'));
  } catch (error) {
    return createDefaultUnlockState();
  }
};

export const writeLocalModifierUnlockState = (state = {}) => {
  const normalized = normalizeModifierUnlockState({
    ...state,
    updatedAt: Date.now()
  });
  localStorage.setItem(MODIFIER_UNLOCK_STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent('wordis:modifier-unlocks-changed', {
    detail: normalized
  }));
  return normalized;
};

export const mergeModifierUnlockStates = (...states) => {
  return normalizeModifierUnlockState(states.reduce((merged, state) => ({
    v: 1,
    updatedAt: Math.max(Number(merged.updatedAt) || 0, Number(state?.updatedAt) || 0),
    tile: [...(merged.tile || []), ...(state?.tile || [])],
    round: [...(merged.round || []), ...(state?.round || [])],
    personal: [...(merged.personal || []), ...(state?.personal || [])],
    card: [...(merged.card || []), ...(state?.card || [])]
  }), createDefaultUnlockState()));
};

export const getUnlockedModifierKeys = (type, state = readLocalModifierUnlockState()) => {
  return normalizeUnlockArray(state?.[type]);
};

export const isModifierUnlocked = (type, key, state = readLocalModifierUnlockState()) => {
  return getUnlockedModifierKeys(type, state).includes(key);
};

export const unlockAllModifiers = () => writeLocalModifierUnlockState({
  v: 1,
  updatedAt: Date.now(),
  tile: ALL_KEYS_BY_TYPE.tile,
  round: ALL_KEYS_BY_TYPE.round,
  personal: ALL_KEYS_BY_TYPE.personal,
  card: ALL_KEYS_BY_TYPE.card
});

const getModifierEntityId = (type, key) => `${type}:${key}`;

const parseModifierEntityId = (entityId = '') => {
  const [type, key] = entityId.split(':');
  return type && key ? { type, key } : null;
};

const getRemainingKeys = (type, state) => {
  const unlocked = new Set(getUnlockedModifierKeys(type, state));
  return (ALL_KEYS_BY_TYPE[type] || [])
    .filter((key) => !unlocked.has(key))
    .filter((key) => {
      if (type !== MODIFIER_UNLOCK_TYPES.PERSONAL) {
        return true;
      }

      const tilePrerequisites = PERSONAL_MODIFIER_TILE_PREREQUISITES[key] || [];
      return tilePrerequisites.every((tileKey) => isModifierUnlocked(MODIFIER_UNLOCK_TYPES.TILE, tileKey, state));
    });
};

const getDefinition = (type, key) => {
  if (type === MODIFIER_UNLOCK_TYPES.TILE) return TILE_DEFINITIONS[key] || null;
  if (type === MODIFIER_UNLOCK_TYPES.ROUND) return ROUND_MODIFIER_DEFINITIONS[key] || null;
  if (type === MODIFIER_UNLOCK_TYPES.PERSONAL) return PERSONAL_MODIFIER_DEFINITIONS[key] || null;
  if (type === MODIFIER_UNLOCK_TYPES.CARD) return CARD_DEFINITIONS[key] || null;
  return null;
};

const getLabel = (type, key) => (
  MODIFIER_UNLOCK_DISPLAY_NAMES[type]?.[key]
    || getDefinition(type, key)?.displayName
    || getDefinition(type, key)?.label
    || key
);

const getTilePreview = (key) => {
  const definition = TILE_DEFINITIONS[key] || {};
  const ui = definition.ui || TILE_DEFINITIONS.normal?.ui || {};
  return {
    badge: definition.badge || '',
    hideBadge: Boolean(ui.hideBadge),
    letter: definition.effects?.wild ? '*' : 'W',
    score: definition.effects?.setScore ?? definition.effects?.bonusScore ?? 1,
    style: {
      '--tile-bg': ui.tileBackground,
      '--tile-shadow': ui.tileShadow,
      '--tile-hover-shadow': ui.tileHoverShadows || ui.tileShadow,
      '--tile-focus-shadow': ui.tileFocusShadow || ui.tileShadow,
      '--tile-text-color': ui.textColor,
      '--tile-letter-stroke': key === 'yinYang' ? '1px rgba(255, 255, 255, 0.92)' : '0 transparent'
    },
    badgeStyle: {
      background: ui.badgeBackground,
      color: ui.badgeColor
    }
  };
};

const getPairedCandidate = (candidate, state) => {
  const entityId = getModifierEntityId(candidate.type, candidate.key);
  const explicitPair = (MODIFIER_UNLOCK_PAIRINGS[entityId] || [])
    .map(parseModifierEntityId)
    .find((pair) => pair && !isModifierUnlocked(pair.type, pair.key, state));
  if (explicitPair) {
    return explicitPair;
  }

  if (candidate.type === MODIFIER_UNLOCK_TYPES.TILE) {
    const group = TILE_MODIFIER_GROUP_BY_KEY[candidate.key];
    if (group === 'neutral') {
      return null;
    }

    const oppositeGroup = group === 'good' ? 'bad' : 'good';
    const availableKeys = TILE_MODIFIER_GROUPS[oppositeGroup].filter((key) => !isModifierUnlocked(MODIFIER_UNLOCK_TYPES.TILE, key, state));
    const key = availableKeys[Math.floor(Math.random() * availableKeys.length)];
    return key ? { type: MODIFIER_UNLOCK_TYPES.TILE, key } : null;
  }

  if (candidate.type === MODIFIER_UNLOCK_TYPES.PERSONAL) {
    const availableKeys = getRemainingKeys(MODIFIER_UNLOCK_TYPES.ROUND, state);
    const key = availableKeys[Math.floor(Math.random() * availableKeys.length)];
    return key ? { type: MODIFIER_UNLOCK_TYPES.ROUND, key } : null;
  }

  if (candidate.type === MODIFIER_UNLOCK_TYPES.ROUND) {
    const availableKeys = getRemainingKeys(MODIFIER_UNLOCK_TYPES.PERSONAL, state);
    const key = availableKeys[Math.floor(Math.random() * availableKeys.length)];
    return key ? { type: MODIFIER_UNLOCK_TYPES.PERSONAL, key } : null;
  }

  return null;
};

const getExplicitPairedCandidates = (candidate, state) => {
  const entityId = getModifierEntityId(candidate.type, candidate.key);
  return (MODIFIER_UNLOCK_PAIRINGS[entityId] || [])
    .map(parseModifierEntityId)
    .filter((pair) => pair && !isModifierUnlocked(pair.type, pair.key, state));
};

const addUnlock = (state, unlocks, candidate, reason = '') => {
  if (!candidate?.type || !candidate?.key || isModifierUnlocked(candidate.type, candidate.key, state)) {
    return state;
  }

  const nextState = {
    ...state,
    [candidate.type]: normalizeUnlockArray([
      ...(state[candidate.type] || []),
      candidate.key
    ])
  };

  unlocks.push({
    ...candidate,
    label: getLabel(candidate.type, candidate.key),
    description: getDefinition(candidate.type, candidate.key)?.description || '',
    preview: candidate.type === MODIFIER_UNLOCK_TYPES.TILE ? getTilePreview(candidate.key) : null,
    group: candidate.type === MODIFIER_UNLOCK_TYPES.TILE
      ? TILE_MODIFIER_GROUP_BY_KEY[candidate.key] || 'neutral'
      : getDefinition(candidate.type, candidate.key)?.tier || getDefinition(candidate.type, candidate.key)?.difficulty || '',
    reason
  });

  return nextState;
};

const findFallbackCandidate = (state, options = {}) => {
  const remainingByType = {
    [MODIFIER_UNLOCK_TYPES.TILE]: options.allowTileFallback === false
      ? []
      : getRemainingKeys(MODIFIER_UNLOCK_TYPES.TILE, state),
    [MODIFIER_UNLOCK_TYPES.PERSONAL]: getRemainingKeys(MODIFIER_UNLOCK_TYPES.PERSONAL, state),
    [MODIFIER_UNLOCK_TYPES.ROUND]: getRemainingKeys(MODIFIER_UNLOCK_TYPES.ROUND, state),
    [MODIFIER_UNLOCK_TYPES.CARD]: getRemainingKeys(MODIFIER_UNLOCK_TYPES.CARD, state)
  };
  const allRemaining = Object.entries(remainingByType).flatMap(([type, keys]) => keys.map((key) => ({ type, key })));
  if (!allRemaining.length) {
    return null;
  }

  if (allRemaining.length === 1) {
    return {
      ...allRemaining[0],
      hint: 'Unlocked from playing multi-round.'
    };
  }

  const tileRemaining = remainingByType[MODIFIER_UNLOCK_TYPES.TILE];
  const pairedRemaining = [
    ...remainingByType[MODIFIER_UNLOCK_TYPES.PERSONAL].map((key) => ({ type: MODIFIER_UNLOCK_TYPES.PERSONAL, key })),
    ...remainingByType[MODIFIER_UNLOCK_TYPES.ROUND].map((key) => ({ type: MODIFIER_UNLOCK_TYPES.ROUND, key })),
    ...remainingByType[MODIFIER_UNLOCK_TYPES.CARD].map((key) => ({ type: MODIFIER_UNLOCK_TYPES.CARD, key }))
  ];
  const shouldPickTile = tileRemaining.length
    && (!pairedRemaining.length || Math.random() < 0.5);
  const fallbackPool = shouldPickTile
    ? tileRemaining.map((key) => ({ type: MODIFIER_UNLOCK_TYPES.TILE, key }))
    : pairedRemaining;
  const candidate = fallbackPool[Math.floor(Math.random() * fallbackPool.length)] || allRemaining[0];

  return {
    ...candidate,
    hint: 'Unlocked from playing multi-round.'
  };
};

export const evaluateModifierUnlocksForRound = (context = {}, options = {}) => {
  let state = readLocalModifierUnlockState();
  const unlocks = [];
  const candidates = MODIFIER_UNLOCK_CONDITIONS.filter((condition) => {
    if (context.isTutorial && !condition.allowInTutorial) {
      return false;
    }

    return !isModifierUnlocked(condition.type, condition.key, state)
      && getRemainingKeys(condition.type, state).includes(condition.key)
      && condition.test(context);
  });

  const primaryCandidates = candidates.length
    ? (context.tutorialCompleted ? candidates : [candidates[0]])
    : [options.allowFallback === false ? null : findFallbackCandidate(state, {
      allowTileFallback: !context.isTutorial
    })].filter(Boolean);

  primaryCandidates.forEach((primary) => {
    const beforeCount = unlocks.length;
    state = addUnlock(state, unlocks, primary, primary.hint || 'Unlocked from multi-round progress.');
    if (unlocks.length === beforeCount) {
      return;
    }

    if (context.isTutorial && primary.allowInTutorial) {
      return;
    }

    const explicitPairs = getExplicitPairedCandidates(primary, state);
    if (explicitPairs.length) {
      explicitPairs.forEach((pair) => {
        state = addUnlock(state, unlocks, pair, pair.type === MODIFIER_UNLOCK_TYPES.CARD
          ? 'Unlocked with its matching tile.'
          : 'Unlocked as its paired modifier.');
      });
      return;
    }

    const pair = getPairedCandidate(primary, state);
    state = addUnlock(state, unlocks, pair, primary.type === MODIFIER_UNLOCK_TYPES.TILE
      ? 'Unlocked as its paired modifier.'
      : 'Unlocked as its paired rule.');
  });

  if (!unlocks.length) {
    return [];
  }

  writeLocalModifierUnlockState(state);
  void syncModifierUnlocks({ force: true });
  return unlocks;
};

export const syncModifierUnlocks = async ({ force = false, user = auth?.currentUser, userState = null } = {}) => {
  if (!firebaseEnabled || !db || !user?.uid || !navigator.onLine) {
    return { skipped: true };
  }

  const localState = readLocalModifierUnlockState();
  const remoteState = userState
    ? userState.gameData?.[MODIFIER_UNLOCKS_CLOUD_KEY]
    : (await get(dbRef(db, `users/${user.uid}/gameData/${MODIFIER_UNLOCKS_CLOUD_KEY}`))).val();
  const mergedState = mergeModifierUnlockStates(localState, remoteState || {});
  writeLocalModifierUnlockState(mergedState);

  if (force || JSON.stringify(normalizeModifierUnlockState(remoteState || {})) !== JSON.stringify(mergedState)) {
    await update(dbRef(db, `users/${user.uid}/gameData`), {
      [MODIFIER_UNLOCKS_CLOUD_KEY]: mergedState
    });
  }

  return {
    skipped: false,
    unlocked: {
      tile: mergedState.tile.length,
      round: mergedState.round.length,
      personal: mergedState.personal.length
    }
  };
};

export const getModifierUnlockCatalog = (state = readLocalModifierUnlockState()) => ({
  tile: ALL_KEYS_BY_TYPE.tile.map((key) => ({
    type: MODIFIER_UNLOCK_TYPES.TILE,
    key,
    label: getLabel(MODIFIER_UNLOCK_TYPES.TILE, key),
    description: getDefinition(MODIFIER_UNLOCK_TYPES.TILE, key)?.description || '',
    group: TILE_MODIFIER_GROUP_BY_KEY[key] || 'neutral',
    preview: getTilePreview(key),
    unlocked: isModifierUnlocked(MODIFIER_UNLOCK_TYPES.TILE, key, state)
  })),
  round: ALL_KEYS_BY_TYPE.round.map((key) => ({
    type: MODIFIER_UNLOCK_TYPES.ROUND,
    key,
    label: getLabel(MODIFIER_UNLOCK_TYPES.ROUND, key),
    description: getDefinition(MODIFIER_UNLOCK_TYPES.ROUND, key)?.description || '',
    group: getDefinition(MODIFIER_UNLOCK_TYPES.ROUND, key)?.difficulty || 'easy',
    unlocked: isModifierUnlocked(MODIFIER_UNLOCK_TYPES.ROUND, key, state)
  })),
  personal: ALL_KEYS_BY_TYPE.personal.map((key) => ({
    type: MODIFIER_UNLOCK_TYPES.PERSONAL,
    key,
    label: getLabel(MODIFIER_UNLOCK_TYPES.PERSONAL, key),
    description: getDefinition(MODIFIER_UNLOCK_TYPES.PERSONAL, key)?.description || '',
    group: getDefinition(MODIFIER_UNLOCK_TYPES.PERSONAL, key)?.tier || 'common',
    unlocked: isModifierUnlocked(MODIFIER_UNLOCK_TYPES.PERSONAL, key, state)
  })),
  card: ALL_KEYS_BY_TYPE.card.map((key) => ({
    type: MODIFIER_UNLOCK_TYPES.CARD,
    key,
    label: getLabel(MODIFIER_UNLOCK_TYPES.CARD, key),
    description: getDefinition(MODIFIER_UNLOCK_TYPES.CARD, key)?.description || '',
    group: getDefinition(MODIFIER_UNLOCK_TYPES.CARD, key)?.kind || 'boon',
    unlocked: isModifierUnlocked(MODIFIER_UNLOCK_TYPES.CARD, key, state)
  }))
});
