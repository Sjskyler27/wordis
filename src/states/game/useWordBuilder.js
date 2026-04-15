import { computed, ref } from 'vue';
import { getLengthBonus, getWordScoreDetails, getDifference } from './tile-logic.js';

export const useWordBuilder = ({ mySide, myTiles }) => {
  const selectedTileSlots = ref({
    host: [],
    opponent: []
  });
  const savedTileSlots = ref({
    host: [],
    opponent: []
  });

  const selectedTileIds = computed(() => ({
    host: new Set(selectedTileSlots.value.host),
    opponent: new Set(selectedTileSlots.value.opponent)
  }));
  const savedTileIds = computed(() => ({
    host: new Set(savedTileSlots.value.host),
    opponent: new Set(savedTileSlots.value.opponent)
  }));

  const selectedTilesForCurrentSide = computed(() => {
    const tilesById = new Map(myTiles.value.map((tile) => [tile.id, tile]));

    return selectedTileSlots.value[mySide.value]
      .map((tileId) => tilesById.get(tileId))
      .filter(Boolean);
  });

  const currentWordDisplay = computed(() => {
    return selectedTilesForCurrentSide.value.map((tile) => tile.letter).join('');
  });

  const currentWordLength = computed(() => selectedTilesForCurrentSide.value.length);
  const currentScoreDetails = computed(() => getWordScoreDetails(selectedTilesForCurrentSide.value));
  const currentLengthBonus = computed(() => currentScoreDetails.value.lengthBonus);
  const currentFirstTileBonus = computed(() => currentScoreDetails.value.firstTileBonus);
  const currentLetterTotal = computed(() => currentScoreDetails.value.letterTotal);
  const currentWordMultiplier = computed(() => currentScoreDetails.value.wordMultiplier);
  const currentWordScore = computed(() => currentScoreDetails.value.total);
  const lengthBonusSteps = computed(() => ([
    { length: 5, bonus: getLengthBonus(5), difference: getDifference(5) },
    { length: 6, bonus: getLengthBonus(6), difference: getDifference(6)  },
    { length: 7, bonus: getLengthBonus(7), difference: getDifference(7)  },
    { length: 8, bonus: getLengthBonus(8), difference: getDifference(8)  },
    { length: 9, bonus: getLengthBonus(9), difference: getDifference(9)  }
  ]));

  const handleTileClick = (tile) => {
    const side = mySide.value;
    if (tile.locked) {
      return;
    }

    if (selectedTileSlots.value[side].includes(tile.id)) {
      removeSpecificTile(tile.id);
      return;
    }

    if (savedTileSlots.value[side].includes(tile.id)) {
      savedTileSlots.value = {
        ...savedTileSlots.value,
        [side]: savedTileSlots.value[side].filter((savedTileId) => savedTileId !== tile.id)
      };
    }

    selectedTileSlots.value = {
      ...selectedTileSlots.value,
      [side]: [...selectedTileSlots.value[side], tile.id]
    };
  };

  const removeLastLetter = () => {
    const side = mySide.value;
    selectedTileSlots.value = {
      ...selectedTileSlots.value,
      [side]: selectedTileSlots.value[side].slice(0, -1)
    };
  };

  const removeSpecificTile = (tileId) => {
    const side = mySide.value;
    const nextSlots = [...selectedTileSlots.value[side]];
    const index = nextSlots.indexOf(tileId);

    if (index === -1) {
      return;
    }

    nextSlots.splice(index, 1);
    selectedTileSlots.value = {
      ...selectedTileSlots.value,
      [side]: nextSlots
    };
  };

  const clearSelectionForSide = (side = mySide.value) => {
    selectedTileSlots.value = {
      ...selectedTileSlots.value,
      [side]: []
    };
  };

  const saveSelectionForSide = (side = mySide.value) => {
    const selectedIds = selectedTileSlots.value[side];
    if (!selectedIds.length) {
      return false;
    }

    const mergedSavedIds = [...new Set([
      ...savedTileSlots.value[side],
      ...selectedIds
    ])];

    savedTileSlots.value = {
      ...savedTileSlots.value,
      [side]: mergedSavedIds
    };

    clearSelectionForSide(side);
    return true;
  };

  const clearWord = () => clearSelectionForSide();

  return {
    selectedTileIds,
    savedTileIds,
    selectedTilesForCurrentSide,
    currentWordDisplay,
    currentWordLength,
    currentLengthBonus,
    currentFirstTileBonus,
    currentLetterTotal,
    currentWordMultiplier,
    currentWordScore,
    lengthBonusSteps,
    handleTileClick,
    removeLastLetter,
    removeSpecificTile,
    clearWord,
    clearSelectionForSide,
    saveSelectionForSide
  };
};
