import { computed } from 'vue';

export function useScoreRibbonState({
  showOpponentLane,
  isTimedSoloMode,
  leftLane,
  rightLane
}) {
  const scoreGap = computed(() => {
    if (!showOpponentLane.value) {
      return 0;
    }

    return Math.abs(leftLane.value.score - rightLane.value.score);
  });
  const scoreGapTier = computed(() => {
    if (scoreGap.value >= 120) {
      return 'epic';
    }

    if (scoreGap.value >= 60) {
      return 'high';
    }

    if (scoreGap.value >= 25) {
      return 'medium';
    }

    if (scoreGap.value >= 10) {
      return 'low';
    }

    return 'none';
  });

  const scoreBoxClass = (side) => {
    if (!showOpponentLane.value || isTimedSoloMode.value || scoreGapTier.value === 'none') {
      return {};
    }

    const sideScore = side === 'host' ? leftLane.value.score : rightLane.value.score;
    const otherScore = side === 'host' ? rightLane.value.score : leftLane.value.score;

    return {
      'score-gap-low': scoreGapTier.value === 'low',
      'score-gap-medium': scoreGapTier.value === 'medium',
      'score-gap-high': scoreGapTier.value === 'high',
      'score-gap-epic': scoreGapTier.value === 'epic',
      'score-box-leading': sideScore > otherScore,
      'score-box-trailing': sideScore < otherScore
    };
  };

  return {
    scoreBoxClass
  };
}
