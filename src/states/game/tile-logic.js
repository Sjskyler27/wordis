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

const { createRack, refillTiles } = createTileLogic({
  createTileId: () => `local-tile-${nextLocalTileId++}`
});
const { drawCard, drawCards } = createCardLogic({
  createCardId: () => `local-card-${nextLocalCardId++}`
});

export {
  createRack,
  refillTiles,
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
  applyModifierToTile,
  replaceTileWithModifier,
  getModifierBadge,
  getModifierUi,
  getModifierDefinition,
  MODIFIER_DEFINITIONS,
  CARD_DEFINITIONS,
  getCardDefinition,
  drawCard,
  drawCards
};
