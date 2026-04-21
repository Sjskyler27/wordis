import letterConfig from './letters.json';
import wordBonuses from './word-bonuses.json';
import milestoneRewards from './word-milestone-rewards.json';
import './card-definitions.cjs';
import './modifier-definitions.cjs';
import './shared-tile-logic.cjs';

const { createSharedTileLogic } = globalThis.__sharedTileLogic || {};
if (typeof createSharedTileLogic !== 'function') {
  throw new Error('Shared tile logic failed to initialize');
}

const sharedTileLogic = createSharedTileLogic({
  letterConfig,
  wordBonuses,
  milestoneRewards,
  devLogging: import.meta.env.VITE_MODE === 'dev',
  testing: import.meta.env.VITE_TESTING === 't'
});

const {
  LETTER_KEYS,
  MIN_WORD_LENGTH,
  tileScore,
  getLengthBonus,
  getDifference,
  getMilestoneReward,
  getTilesScore,
  getWordScoreDetails,
  getIdleScorePenalty,
  getResourceGrants,
  getTilesForWord,
  getRequiredTiles,
  isMissingRequiredTile,
  selectedTilesMatchWord,
  applyModifierToTile,
  replaceTileWithModifier,
  getModifierBadge,
  getModifierUi,
  getModifierDefinition,
  getModifierDescription,
  MODIFIER_DEFINITIONS,
  CARD_DEFINITIONS,
  getCardDefinition,
  createCardLogic,
  createTileLogic
} = sharedTileLogic;

const createSessionKey = (prefix) => {
  const uniquePart = globalThis.crypto?.randomUUID?.()
    || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${uniquePart}`;
};
const getIdState = (stateKey, prefix) => {
  if (!globalThis[stateKey]) {
    globalThis[stateKey] = {
      session: createSessionKey(prefix),
      next: 1
    };
  }

  return globalThis[stateKey];
};
const nextClientId = (stateKey, prefix) => {
  const state = getIdState(stateKey, prefix);
  const id = `${prefix}-${state.session}-${state.next}`;
  state.next += 1;
  return id;
};

const {
  createRack,
  createOpeningRackPair,
  refillTiles,
  replaceSingleTile,
  rerollRackExceptTile,
  createTestingRack,
  createTestingOpeningRackPair
} = createTileLogic({
  createTileId: () => nextClientId('__wordisLocalTileIdState', 'local-tile')
});
const { createCard, createCards, drawCard, drawCards } = createCardLogic({
  createCardId: () => nextClientId('__wordisLocalCardIdState', 'local-card')
});

export {
  LETTER_KEYS,
  createRack,
  createOpeningRackPair,
  refillTiles,
  replaceSingleTile,
  rerollRackExceptTile,
  createTestingRack,
  createTestingOpeningRackPair,
  MIN_WORD_LENGTH,
  tileScore,
  getLengthBonus,
  getDifference,
  getMilestoneReward,
  getTilesScore,
  getWordScoreDetails,
  getIdleScorePenalty,
  getResourceGrants,
  getTilesForWord,
  getRequiredTiles,
  isMissingRequiredTile,
  selectedTilesMatchWord,
  applyModifierToTile,
  replaceTileWithModifier,
  getModifierBadge,
  getModifierUi,
  getModifierDefinition,
  getModifierDescription,
  MODIFIER_DEFINITIONS,
  CARD_DEFINITIONS,
  getCardDefinition,
  createCard,
  createCards,
  drawCard,
  drawCards
};
