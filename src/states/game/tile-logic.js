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
  getTilesForWord,
  getRequiredTiles,
  isMissingRequiredTile,
  getModifierBadge,
  getModifierUi,
  getModifierDefinition,
  MODIFIER_DEFINITIONS,
  createTileLogic
} = sharedTileLogic;

let nextLocalTileId = 1;

const { createRack, refillTiles } = createTileLogic({
  createTileId: () => `local-tile-${nextLocalTileId++}`
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
  getTilesForWord,
  getRequiredTiles,
  isMissingRequiredTile,
  getModifierBadge,
  getModifierUi,
  getModifierDefinition,
  MODIFIER_DEFINITIONS
};
