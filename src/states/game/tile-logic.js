import sharedTileLogic from './shared-tile-logic.cjs';

const {
  tileScore,
  getLengthBonus,
  getTilesScore,
  getWordScoreDetails,
  getTilesForWord,
  getRequiredTiles,
  isMissingRequiredTile,
  createTileLogic
} = sharedTileLogic;

let nextLocalTileId = 1;

const { createRack, refillTiles } = createTileLogic({
  createTileId: () => `local-tile-${nextLocalTileId++}`
});

export {
  createRack,
  refillTiles,
  tileScore,
  getLengthBonus,
  getTilesScore,
  getWordScoreDetails,
  getTilesForWord,
  getRequiredTiles,
  isMissingRequiredTile
};
