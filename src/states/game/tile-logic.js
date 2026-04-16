import letterConfig from './letters.json';
import wordBonuses from './word-bonuses.json';
import './shared-tile-logic.cjs';

const { createSharedTileLogic } = globalThis.__sharedTileLogic || {};
if (typeof createSharedTileLogic !== 'function') {
  throw new Error('Shared tile logic failed to initialize');
}

const sharedTileLogic = createSharedTileLogic({
  letterConfig,
  wordBonuses
});

const {
  LETTER_KEYS,
  MIN_WORD_LENGTH,
  tileScore,
  getLengthBonus,
  getDifference,
  getTilesScore,
  getWordScoreDetails,
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
  MODIFIER_DEFINITIONS,
  CARD_DEFINITIONS,
  getCardDefinition,
  createCardLogic,
  createTileLogic
} = sharedTileLogic;

let nextLocalTileId = 1;
let nextLocalCardId = 1;

const {
  createRack,
  createOpeningRackPair,
  refillTiles,
  rerollRackExceptTile,
  createTestingRack,
  createTestingOpeningRackPair
} = createTileLogic({
  createTileId: () => `local-tile-${nextLocalTileId++}`
});
const { createCard, createCards, drawCard, drawCards } = createCardLogic({
  createCardId: () => `local-card-${nextLocalCardId++}`
});

export {
  LETTER_KEYS,
  createRack,
  createOpeningRackPair,
  refillTiles,
  rerollRackExceptTile,
  createTestingRack,
  createTestingOpeningRackPair,
  MIN_WORD_LENGTH,
  tileScore,
  getLengthBonus,
  getDifference,
  getTilesScore,
  getWordScoreDetails,
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
  MODIFIER_DEFINITIONS,
  CARD_DEFINITIONS,
  getCardDefinition,
  createCard,
  createCards,
  drawCard,
  drawCards
};
