import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { getLengthBonus, getWordScoreDetails, getDifference, getIdleScorePenalty, getMilestoneReward } from './tile-logic.js';

const formatMilestoneReward = (length) => {
  const reward = getMilestoneReward(length);
  const labels = [];

  if (reward.attacks) {
    labels.push(`+${reward.attacks} ATK`);
  }

  if (reward.boons) {
    labels.push(`+${reward.boons} BOON`);
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
  const wordStartedAt = ref({
    host: 0,
    opponent: 0
  });
  const wordClockNow = ref(Date.now());
  let wordClockIntervalId = null;

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
    const startedAt = wordStartedAt.value[mySide.value] || 0;
    return startedAt ? Math.max(0, (wordClockNow.value - startedAt) / 1000) : 0;
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
  const lengthBonusSteps = computed(() => ([
    { length: 5, bonus: getLengthBonus(5), difference: getDifference(5), rewardLabel: formatMilestoneReward(5) },
    { length: 6, bonus: getLengthBonus(6), difference: getDifference(6), rewardLabel: formatMilestoneReward(6) },
    { length: 7, bonus: getLengthBonus(7), difference: getDifference(7), rewardLabel: formatMilestoneReward(7) },
    { length: 8, bonus: getLengthBonus(8), difference: getDifference(8), rewardLabel: formatMilestoneReward(8) },
    { length: 9, bonus: getLengthBonus(9), difference: getDifference(9), rewardLabel: formatMilestoneReward(9) }
  ]));

  const handleTileClick = (tile, options = {}) => {
    const side = mySide.value;
    if (tile.locked) {
      return null;
    }

    if (selectedTileSlots.value[side].includes(tile.id)) {
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
    if (!wordStartedAt.value[side]) {
      wordClockNow.value = Date.now();
      wordStartedAt.value = {
        ...wordStartedAt.value,
        [side]: wordClockNow.value
      };
    }
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
    if (!nextSlots.length) {
      wordStartedAt.value = {
        ...wordStartedAt.value,
        [side]: 0
      };
    }
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

  const clearSelectionForSide = (side = mySide.value) => {
    if (!selectedTileSlots.value[side].length) {
      return false;
    }

    selectedTileSlots.value = {
      ...selectedTileSlots.value,
      [side]: []
    };
    wordStartedAt.value = {
      ...wordStartedAt.value,
      [side]: 0
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

  onMounted(() => {
    wordClockIntervalId = window.setInterval(() => {
      wordClockNow.value = Date.now();
    }, 250);
  });

  onBeforeUnmount(() => {
    window.clearInterval(wordClockIntervalId);
  });

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
    replaceSelectedTileId,
    clearWord,
    clearSelectionForSide,
    saveSelectionForSide
  };
};
