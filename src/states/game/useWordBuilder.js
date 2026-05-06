import { computed, ref } from 'vue';
import { getLengthBonus, getWordScoreDetails, getDifference, getIdleScorePenalty, getMilestoneReward } from './tile-logic.js';

const formatMilestoneReward = (length, options = {}) => {
  const reward = getMilestoneReward(length);
  const personalEffects = options.personalModifierEffects || {};
  const roundEffects = options.roundModifierEffects || {};
  const labels = [];

  if (reward.attacks) {
    labels.push(`+${reward.attacks} ATK`);
  }

  if (reward.boons) {
    labels.push(`+${reward.boons} BOON`);
  }

  const lengthScoreBonus = personalEffects.lengthScoreBonus?.[length] || personalEffects.lengthScoreBonus?.[String(length)] || 0;
  if (lengthScoreBonus) {
    labels.push(`+${lengthScoreBonus} PTS`);
  }

  const lengthScoreMultiplier = personalEffects.lengthScoreMultiplier?.[length] || personalEffects.lengthScoreMultiplier?.[String(length)] || 0;
  if (lengthScoreMultiplier && lengthScoreMultiplier !== 1) {
    labels.push(`x${Number(lengthScoreMultiplier).toFixed(1)}`);
  }

  const lengthTimeBonus = personalEffects.lengthTimeBonus?.[length] || personalEffects.lengthTimeBonus?.[String(length)] || 0;
  if (lengthTimeBonus) {
    labels.push(`+${lengthTimeBonus}s`);
  }

  const lengthTimePenalty = roundEffects.lengthTimePenalty?.[length] || roundEffects.lengthTimePenalty?.[String(length)] || 0;
  if (lengthTimePenalty) {
    labels.push(`-${lengthTimePenalty}s`);
  }

  return labels.join(' · ');
};

export const useWordBuilder = ({ mySide, myTiles, playerScores, scoreOptions }) => {
  const selectedTileSlots = ref({
    host: [],
    opponent: []
  });
  const savedTileSlots = ref({
    host: [],
    opponent: []
  });
  const selectedTileAnimationSync = ref({
    host: {},
    opponent: {}
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
      .map((tileId) => {
        const tile = tilesById.get(tileId);
        const animationSync = selectedTileAnimationSync.value[mySide.value]?.[tileId];
        return tile && animationSync ? { ...tile, ...animationSync } : tile;
      })
      .filter(Boolean);
  });

  const currentWordDisplay = computed(() => {
    return selectedTilesForCurrentSide.value.map((tile) => tile.letter).join('');
  });

  const currentWordLength = computed(() => selectedTilesForCurrentSide.value.length);
  const currentWordElapsedSeconds = computed(() => {
    return Math.max(0, Number(scoreOptions?.value?.wordElapsedSeconds) || 0);
  });
  const currentScoreDetails = computed(() => getWordScoreDetails(selectedTilesForCurrentSide.value, {
    side: mySide.value,
    scores: playerScores.value,
    wordElapsedSeconds: currentWordElapsedSeconds.value,
    ...(scoreOptions?.value || {})
  }));
  const currentIdlePenalty = computed(() => {
    if (!selectedTilesForCurrentSide.value.length) {
      return 0;
    }

    return getIdleScorePenalty(myTiles.value, selectedTilesForCurrentSide.value.map((tile) => tile.id), {
      roundModifierEffects: scoreOptions?.value?.roundModifierEffects || {}
    });
  });
  const currentLengthBonus = computed(() => currentScoreDetails.value.lengthBonus);
  const currentFirstTileBonus = computed(() => currentScoreDetails.value.firstTileBonus);
  const currentLetterTotal = computed(() => currentScoreDetails.value.letterTotal);
  const currentWordMultiplier = computed(() => currentScoreDetails.value.wordMultiplier);
  const currentWordScore = computed(() => currentScoreDetails.value.total - currentIdlePenalty.value);
  const lengthBonusSteps = computed(() => {
    const activeScoreOptions = scoreOptions?.value || {};
    return [4, 5, 6, 7, 8, 9]
      .map((length) => ({
        length,
        bonus: getLengthBonus(length),
        difference: getDifference(length),
        rewardLabel: formatMilestoneReward(length, activeScoreOptions)
      }))
      .filter((step) => step.bonus || step.rewardLabel);
  });

  const handleTileClick = (tile, options = {}) => {
    const side = mySide.value;
    if (tile.locked) {
      return null;
    }

    if (selectedTileSlots.value[side].includes(tile.id) && !tile.reusableInBuilder) {
      removeSpecificTile(tile.id);
      return 'removed';
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
    if (options.animationSync) {
      selectedTileAnimationSync.value = {
        ...selectedTileAnimationSync.value,
        [side]: {
          ...selectedTileAnimationSync.value[side],
          [tile.id]: options.animationSync
        }
      };
    }
    return 'added';
  };

  const removeLastLetter = () => {
    const side = mySide.value;
    if (!selectedTileSlots.value[side].length) {
      return false;
    }

    selectedTileSlots.value = {
      ...selectedTileSlots.value,
      [side]: selectedTileSlots.value[side].slice(0, -1)
    };
    return true;
  };

  const removeSpecificTile = (tileId) => {
    const side = mySide.value;
    const nextSlots = [...selectedTileSlots.value[side]];
    const index = nextSlots.indexOf(tileId);

    if (index === -1) {
      return false;
    }

    nextSlots.splice(index, 1);
    selectedTileSlots.value = {
      ...selectedTileSlots.value,
      [side]: nextSlots
    };
    if (selectedTileAnimationSync.value[side]?.[tileId]) {
      const nextAnimationSync = { ...selectedTileAnimationSync.value[side] };
      delete nextAnimationSync[tileId];
      selectedTileAnimationSync.value = {
        ...selectedTileAnimationSync.value,
        [side]: nextAnimationSync
      };
    }
    return true;
  };

  const removeTileAtIndex = (index) => {
    const side = mySide.value;
    const nextSlots = [...selectedTileSlots.value[side]];
    const boundedIndex = Math.max(0, Math.min(Number(index), nextSlots.length - 1));

    if (!nextSlots.length || !Number.isFinite(boundedIndex)) {
      return false;
    }

    const [removedTileId] = nextSlots.splice(boundedIndex, 1);
    selectedTileSlots.value = {
      ...selectedTileSlots.value,
      [side]: nextSlots
    };
    if (removedTileId && !nextSlots.includes(removedTileId) && selectedTileAnimationSync.value[side]?.[removedTileId]) {
      const nextAnimationSync = { ...selectedTileAnimationSync.value[side] };
      delete nextAnimationSync[removedTileId];
      selectedTileAnimationSync.value = {
        ...selectedTileAnimationSync.value,
        [side]: nextAnimationSync
      };
    }
    return true;
  };

  const reorderSelectedTile = (side = mySide.value, fromIndex, toIndex) => {
    const currentSlots = selectedTileSlots.value[side] || [];
    const boundedFromIndex = Math.max(0, Math.min(Number(fromIndex), currentSlots.length - 1));
    const boundedToIndex = Math.max(0, Math.min(Number(toIndex), currentSlots.length - 1));
    if (!currentSlots.length || boundedFromIndex === boundedToIndex) {
      return false;
    }

    const nextSlots = [...currentSlots];
    const [movedTileId] = nextSlots.splice(boundedFromIndex, 1);
    nextSlots.splice(boundedToIndex, 0, movedTileId);
    selectedTileSlots.value = {
      ...selectedTileSlots.value,
      [side]: nextSlots
    };
    return true;
  };

  const clearSelectionForSide = (side = mySide.value) => {
    if (!selectedTileSlots.value[side].length) {
      return false;
    }

    selectedTileSlots.value = {
      ...selectedTileSlots.value,
      [side]: []
    };
    selectedTileAnimationSync.value = {
      ...selectedTileAnimationSync.value,
      [side]: {}
    };
    return true;
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

  const replaceSelectedTileId = (side = mySide.value, fromTileId, toTileId) => {
    if (!fromTileId || !toTileId || fromTileId === toTileId) {
      return;
    }

    selectedTileSlots.value = {
      ...selectedTileSlots.value,
      [side]: selectedTileSlots.value[side].map((tileId) => (tileId === fromTileId ? toTileId : tileId))
    };

    const sideAnimationSync = selectedTileAnimationSync.value[side] || {};
    if (sideAnimationSync[fromTileId]) {
      const nextAnimationSync = { ...sideAnimationSync };
      nextAnimationSync[toTileId] = nextAnimationSync[fromTileId];
      delete nextAnimationSync[fromTileId];
      selectedTileAnimationSync.value = {
        ...selectedTileAnimationSync.value,
        [side]: nextAnimationSync
      };
    }

    savedTileSlots.value = {
      ...savedTileSlots.value,
      [side]: savedTileSlots.value[side].map((tileId) => (tileId === fromTileId ? toTileId : tileId))
    };
  };

  return {
    selectedTileIds,
    savedTileIds,
    selectedTilesForCurrentSide,
    currentWordDisplay,
    currentWordLength,
    currentWordElapsedSeconds,
    currentLengthBonus,
    currentFirstTileBonus,
    currentLetterTotal,
    currentWordMultiplier,
    currentWordScore,
    lengthBonusSteps,
    handleTileClick,
    removeLastLetter,
    removeSpecificTile,
    removeTileAtIndex,
    reorderSelectedTile,
    replaceSelectedTileId,
    clearWord,
    clearSelectionForSide,
    saveSelectionForSide
  };
};
