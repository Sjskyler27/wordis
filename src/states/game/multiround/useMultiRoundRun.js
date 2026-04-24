import { computed, ref } from 'vue';
import { MULTI_ROUND_ROUNDS } from './multi-round-rounds.js';
import {
  PERSONAL_MODIFIER_DEFINITIONS,
  getPersonalModifierDefinition
} from './personal-modifier-definitions.js';
import {
  FORCE_TEST_ROUND_MODIFIER_KEYS,
  ROUND_MODIFIER_KEYS_BY_DIFFICULTY,
  getRoundModifierDefinition
} from './round-modifier-definitions.js';

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
    const pool = ROUND_MODIFIER_KEYS_BY_DIFFICULTY[difficulty] || [];
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
      resolvedModifierKeys: [...new Set([
        ...(round.roundModifierKeys || []),
        ...generatedModifierKeys,
        ...FORCE_TEST_ROUND_MODIFIER_KEYS
      ])]
    };
  });
};

const getHighestTier = (tiers = []) => {
  const tierRank = {
    common: 1,
    rare: 2,
    epic: 3
  };

  return [...tiers].sort((first, second) => (tierRank[second] || 0) - (tierRank[first] || 0))[0] || 'common';
};

const chooseWeightedReward = (definitions = []) => {
  const totalWeight = definitions.reduce((total, definition) => total + Math.max(0, definition.rarity || 0), 0);
  if (!totalWeight) {
    return definitions[0] || null;
  }

  let roll = Math.random() * totalWeight;
  for (const definition of definitions) {
    roll -= Math.max(0, definition.rarity || 0);
    if (roll <= 0) {
      return definition;
    }
  }

  return definitions[definitions.length - 1] || null;
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
  const activeRoundModifiers = computed(() => activeRoundModifierKeys.value
    .map((modifierKey) => getRoundModifierDefinition(modifierKey))
    .filter(Boolean));
  const rewardTiers = computed(() => currentRound.value?.rewardTiers || []);
  const rewardChoiceOpen = computed(() => rewardChoices.value.length > 0);
  const runWon = computed(() => runEnded.value && !failureSummary.value);
  const activePersonalModifierEffects = computed(() => {
    return personalModifiers.value.reduce((effects, modifier) => {
      const stacks = Math.max(1, modifier.stacks || 1);
      const definitionEffects = modifier.effects || {};

      effects.vowelScoreBonus += (definitionEffects.vowelScoreBonus || 0) * stacks;
      effects.vowelScoreMultiplier = Math.max(
        effects.vowelScoreMultiplier,
        definitionEffects.vowelScoreMultiplier || 1
      );
      effects.badChanceMultiplier += (definitionEffects.badChanceMultiplierDelta || 0) * stacks;
      effects.openingGoodChanceBonus += (definitionEffects.openingGoodChanceBonus || 0) * stacks;
      Object.entries(definitionEffects.modifierScoreBonus || {}).forEach(([key, bonus]) => {
        effects.modifierScoreBonus[key] = (effects.modifierScoreBonus[key] || 0) + (bonus * stacks);
      });
      Object.entries(definitionEffects.modifierOddsBonus || {}).forEach(([key, bonus]) => {
        effects.modifierOddsBonus[key] = (effects.modifierOddsBonus[key] || 0) + (bonus * stacks);
      });
      return effects;
    }, {
      vowelScoreBonus: 0,
      vowelScoreMultiplier: 1,
      modifierScoreBonus: {},
      modifierOddsBonus: {},
      badChanceMultiplier: 1,
      openingGoodChanceBonus: 0
    });
  });
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

  const addPersonalModifier = (modifierKey) => {
    const definition = getPersonalModifierDefinition(modifierKey);
    if (!definition) {
      return null;
    }

    const existingModifier = personalModifiers.value.find((modifier) => modifier.key === modifierKey);
    if (existingModifier) {
      const nextStacks = Math.min(definition.maxStacks || 1, (existingModifier.stacks || 1) + 1);
      personalModifiers.value = personalModifiers.value.map((modifier) => {
        if (modifier.key !== modifierKey) {
          return modifier;
        }

        return {
          ...modifier,
          stacks: nextStacks
        };
      });
      return {
        ...existingModifier,
        stacks: nextStacks
      };
    }

    const nextModifier = {
      ...definition,
      stacks: 1
    };
    personalModifiers.value = [
      ...personalModifiers.value,
      nextModifier
    ];
    return nextModifier;
  };

  const generateRewardChoices = () => {
    const allowedTiers = currentRound.value?.isChallenge
      ? [getHighestTier(rewardTiers.value)]
      : rewardTiers.value;
    const currentStacks = personalModifiers.value.reduce((stacks, modifier) => {
      stacks[modifier.key] = modifier.stacks || 1;
      return stacks;
    }, {});
    const eligibleDefinitions = Object.values(PERSONAL_MODIFIER_DEFINITIONS).filter((definition) => {
      return allowedTiers.includes(definition.tier)
        && (currentStacks[definition.key] || 0) < (definition.maxStacks || 1);
    });
    const choices = [];
    const availableDefinitions = [...eligibleDefinitions];

    while (choices.length < 3 && availableDefinitions.length) {
      const choice = chooseWeightedReward(availableDefinitions);
      if (!choice) {
        break;
      }

      choices.push(choice);
      availableDefinitions.splice(availableDefinitions.findIndex((definition) => definition.key === choice.key), 1);
    }

    rewardChoices.value = choices;
    return choices;
  };

  const selectRewardChoice = (modifierKey) => {
    const selectedModifier = addPersonalModifier(modifierKey);
    if (!selectedModifier) {
      return null;
    }

    const lastRoundIndex = completedRounds.value.length - 1;
    if (lastRoundIndex >= 0) {
      completedRounds.value = completedRounds.value.map((round, index) => {
        if (index !== lastRoundIndex) {
          return round;
        }

        return {
          ...round,
          selectedRewardKey: selectedModifier.key,
          selectedRewardLabel: selectedModifier.label
        };
      });
    }
    rewardChoices.value = [];
    return selectedModifier;
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
    activePersonalModifierEffects,
    activeRoundModifierKeys,
    activeRoundModifiers,
    rewardTiers,
    rewardChoices,
    rewardChoiceOpen,
    runEnded,
    runWon,
    failureSummary,
    resetRun,
    setTimerRemainingSeconds,
    setStartingScoreBonus,
    addPersonalModifier,
    generateRewardChoices,
    selectRewardChoice,
    recordCompletedRound,
    goToNextRound,
    endRun
  };
};
