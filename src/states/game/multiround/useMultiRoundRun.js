import { computed, ref } from 'vue';
import { MULTI_ROUND_ROUNDS } from './multi-round-rounds.js';

const ROUND_MODIFIER_POOLS = {
  easy: [
    'min_word_5',
    'no_s'
  ],
  medium: [
    'highest_consonant_zero',
    'no_cards'
  ],
  hard: [
    'min_word_6',
    'double_burns',
    'fleeting_tiles'
  ]
};

const normalizeBudgetCount = (count) => Math.max(0, Number(count) || 0);

const chooseRandomEntry = (entries = []) => {
  if (!entries.length) {
    return null;
  }

  return entries[Math.floor(Math.random() * entries.length)] || null;
};

const resolveModifierBudget = (modifierBudget = {}) => {
  const resolvedKeys = [];

  Object.entries(modifierBudget).forEach(([difficulty, count]) => {
    const pool = ROUND_MODIFIER_POOLS[difficulty] || [];
    const availableKeys = [...pool];

    for (let index = 0; index < normalizeBudgetCount(count); index += 1) {
      const key = chooseRandomEntry(availableKeys);
      if (!key) {
        break;
      }

      resolvedKeys.push(key);
      availableKeys.splice(availableKeys.indexOf(key), 1);
    }
  });

  return resolvedKeys;
};

const resolveRounds = (rounds = MULTI_ROUND_ROUNDS) => {
  return rounds.map((round) => {
    const generatedModifierKeys = resolveModifierBudget(round.modifierBudget || {});
    return {
      ...round,
      resolvedModifierKeys: [
        ...(round.roundModifierKeys || []),
        ...generatedModifierKeys
      ]
    };
  });
};

export const useMultiRoundRun = ({ rounds = MULTI_ROUND_ROUNDS } = {}) => {
  const resolvedRounds = ref(resolveRounds(rounds));
  const currentRoundIndex = ref(0);
  const startingScoreBonus = ref(0);
  const timerRemainingSeconds = ref(resolvedRounds.value[0]?.timeSeconds || 0);
  const completedRounds = ref([]);
  const personalModifiers = ref([]);
  const rewardChoices = ref([]);
  const runEnded = ref(false);
  const failureSummary = ref(null);

  const currentRound = computed(() => resolvedRounds.value[currentRoundIndex.value] || null);
  const currentRoundNumber = computed(() => currentRoundIndex.value + 1);
  const totalRounds = computed(() => resolvedRounds.value.length);
  const currentTargetScore = computed(() => currentRound.value?.targetScore || 0);
  const currentRoundTimeLimit = computed(() => currentRound.value?.timeSeconds || 0);
  const activeRoundModifierKeys = computed(() => currentRound.value?.resolvedModifierKeys || []);
  const rewardTiers = computed(() => currentRound.value?.rewardTiers || []);
  const rewardChoiceOpen = computed(() => rewardChoices.value.length > 0);
  const runWon = computed(() => runEnded.value && !failureSummary.value);
  const visibleProgressRounds = computed(() => {
    return resolvedRounds.value.map((round, index) => ({
      ...round,
      number: index + 1,
      isCurrent: index === currentRoundIndex.value,
      isComplete: index < currentRoundIndex.value,
      visibleModifierKeys: round.isChallenge ? round.resolvedModifierKeys : []
    }));
  });

  const resetRun = () => {
    resolvedRounds.value = resolveRounds(rounds);
    currentRoundIndex.value = 0;
    startingScoreBonus.value = 0;
    timerRemainingSeconds.value = resolvedRounds.value[0]?.timeSeconds || 0;
    completedRounds.value = [];
    personalModifiers.value = [];
    rewardChoices.value = [];
    runEnded.value = false;
    failureSummary.value = null;
  };

  const setTimerRemainingSeconds = (seconds) => {
    timerRemainingSeconds.value = Math.max(0, Number(seconds) || 0);
  };

  const setStartingScoreBonus = (score) => {
    startingScoreBonus.value = Math.max(0, Math.floor(Number(score) || 0));
  };

  const recordCompletedRound = (roundRecord = {}) => {
    completedRounds.value = [
      ...completedRounds.value,
      {
        roundId: currentRound.value?.id || '',
        roundLabel: currentRound.value?.label || '',
        roundNumber: currentRoundNumber.value,
        targetScore: currentTargetScore.value,
        timeSeconds: currentRoundTimeLimit.value,
        startingScoreBonus: startingScoreBonus.value,
        activeRoundModifierKeys: [...activeRoundModifierKeys.value],
        ...roundRecord
      }
    ];
  };

  const goToNextRound = ({ startingScore = 0 } = {}) => {
    rewardChoices.value = [];
    if (currentRoundIndex.value >= resolvedRounds.value.length - 1) {
      runEnded.value = true;
      failureSummary.value = null;
      return false;
    }

    currentRoundIndex.value += 1;
    setStartingScoreBonus(startingScore);
    timerRemainingSeconds.value = currentRound.value?.timeSeconds || 0;
    return true;
  };

  const endRun = (summary = {}) => {
    runEnded.value = true;
    failureSummary.value = {
      roundId: currentRound.value?.id || '',
      roundLabel: currentRound.value?.label || '',
      roundNumber: currentRoundNumber.value,
      targetScore: currentTargetScore.value,
      timeSeconds: currentRoundTimeLimit.value,
      secondsRemaining: timerRemainingSeconds.value,
      activeRoundModifierKeys: [...activeRoundModifierKeys.value],
      ...summary
    };
  };

  return {
    resolvedRounds,
    visibleProgressRounds,
    currentRoundIndex,
    currentRound,
    currentRoundNumber,
    totalRounds,
    currentTargetScore,
    currentRoundTimeLimit,
    timerRemainingSeconds,
    startingScoreBonus,
    completedRounds,
    personalModifiers,
    activeRoundModifierKeys,
    rewardTiers,
    rewardChoices,
    rewardChoiceOpen,
    runEnded,
    runWon,
    failureSummary,
    resetRun,
    setTimerRemainingSeconds,
    setStartingScoreBonus,
    recordCompletedRound,
    goToNextRound,
    endRun
  };
};
