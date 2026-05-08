import { computed, ref } from 'vue';
import { MULTI_ROUND_ROUNDS } from './multi-round-rounds-hard.js';
import { MULTI_ROUND_EXTRA_BACKGROUND_PALETTE_COUNT } from './multi-round-background-palettes.js';
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

export const resolveBackgroundPaletteKey = (round = {}) => {
  if (round.isFinalRound) {
    return 'final';
  }

  if (round.isChallenge) {
    return 'challenge';
  }

  if (round.backgroundPalette === 'random-extra') {
    return `extra-${Math.floor(Math.random() * MULTI_ROUND_EXTRA_BACKGROUND_PALETTE_COUNT)}`;
  }

  if (Number.isInteger(round.backgroundPalette)) {
    const safeIndex = Math.max(0, Math.min(MULTI_ROUND_EXTRA_BACKGROUND_PALETTE_COUNT - 1, round.backgroundPalette));
    return `extra-${safeIndex}`;
  }

  return round.backgroundPalette || 'main';
};

const getCantCombineWith = (modifierKey) => {
  const definition = getRoundModifierDefinition(modifierKey);
  return new Set(definition?.cantCombineWith || []);
};

const canAddRoundModifier = (modifierKey, selectedKeys = []) => {
  if (selectedKeys.includes(modifierKey)) {
    return false;
  }

  const blockedByCandidate = getCantCombineWith(modifierKey);
  return selectedKeys.every((selectedKey) => {
    return !blockedByCandidate.has(selectedKey) && !getCantCombineWith(selectedKey).has(modifierKey);
  });
};

const resolveModifierBudget = (modifierBudget = {}, excludedModifierKeys = []) => {
  const resolvedKeys = [];
  const excludedKeys = new Set(excludedModifierKeys);

  Object.entries(modifierBudget).forEach(([difficulty, count]) => {
    const pool = ROUND_MODIFIER_KEYS_BY_DIFFICULTY[difficulty] || [];

    for (let index = 0; index < normalizeBudgetCount(count); index += 1) {
      const availableKeys = pool.filter((modifierKey) => {
        return !excludedKeys.has(modifierKey) && canAddRoundModifier(modifierKey, resolvedKeys);
      });
      const key = chooseRandomEntry(availableKeys);
      if (!key) {
        break;
      }

      resolvedKeys.push(key);
    }
  });

  return resolvedKeys;
};

const getRoundContextExcludedModifierKeys = (round = {}, roundIndex = 0, totalRounds = 0) => {
  const excludedKeys = [];
  if (round.isFinalRound || roundIndex >= totalRounds - 1) {
    excludedKeys.push('less_reward_options');
  }
  return excludedKeys;
};

const resolveCompatibleModifierKeys = (modifierKeys = []) => {
  return modifierKeys.reduce((selectedKeys, modifierKey) => {
    if (!canAddRoundModifier(modifierKey, selectedKeys)) {
      return selectedKeys;
    }

    return [...selectedKeys, modifierKey];
  }, []);
};

const applyRoundEffects = (round, resolvedModifierKeys = []) => {
  const roundEffects = resolvedModifierKeys.reduce((effects, modifierKey) => {
    const modifier = getRoundModifierDefinition(modifierKey);
    const modifierRoundEffects = modifier?.roundEffects || {};

    return {
      timeSecondsDelta: effects.timeSecondsDelta + (modifierRoundEffects.timeSecondsDelta || 0),
      targetScoreDelta: effects.targetScoreDelta + (modifierRoundEffects.targetScoreDelta || 0)
    };
  }, {
    timeSecondsDelta: 0,
    targetScoreDelta: 0
  });

  return {
    ...round,
    timeSeconds: Math.max(10, (round.timeSeconds || 0) + roundEffects.timeSecondsDelta),
    targetScore: Math.max(1, (round.targetScore || 0) + roundEffects.targetScoreDelta)
  };
};

const resolveRounds = (rounds = MULTI_ROUND_ROUNDS) => {
  return rounds.map((round, roundIndex) => {
    const contextExcludedKeys = getRoundContextExcludedModifierKeys(round, roundIndex, rounds.length);
    const generatedModifierKeys = resolveModifierBudget(round.modifierBudget || {}, contextExcludedKeys);
    const resolvedModifierKeys = resolveCompatibleModifierKeys([
      ...(round.roundModifierKeys || []).filter((modifierKey) => !contextExcludedKeys.includes(modifierKey)),
      ...generatedModifierKeys,
      ...FORCE_TEST_ROUND_MODIFIER_KEYS.filter((modifierKey) => !contextExcludedKeys.includes(modifierKey))
    ]);

    return {
      ...applyRoundEffects(round, resolvedModifierKeys),
      resolvedModifierKeys,
      resolvedBackgroundPaletteKey: resolveBackgroundPaletteKey(round)
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

const createStartingPersonalModifiers = () => {
  return Object.values(PERSONAL_MODIFIER_DEFINITIONS)
    .map((definition) => {
      const stacks = Math.min(
        definition.maxStacks || 1,
        Math.max(0, Math.floor(Number(definition.start_with) || 0))
      );

      if (!stacks) {
        return null;
      }

      return {
        ...definition,
        stacks
      };
    })
    .filter(Boolean);
};

export const useMultiRoundRun = ({ rounds = MULTI_ROUND_ROUNDS } = {}) => {
  const resolvedRounds = ref(resolveRounds(rounds));
  const currentRoundIndex = ref(0);
  const startingScoreBonus = ref(0);
  const timerRemainingSeconds = ref(resolvedRounds.value[0]?.timeSeconds || 0);
  const completedRounds = ref([]);
  const personalModifiers = ref(createStartingPersonalModifiers());
  const rewardChoices = ref([]);
  const rewardSelectionsRemaining = ref(0);
  const rewardSelectionsTotal = ref(0);
  const runEnded = ref(false);
  const failureSummary = ref(null);

  const currentRound = computed(() => resolvedRounds.value[currentRoundIndex.value] || null);
  const currentRoundNumber = computed(() => currentRoundIndex.value + 1);
  const totalRounds = computed(() => resolvedRounds.value.length);
  const rewardChoicesRemainingInRun = computed(() => Math.max(0, totalRounds.value - currentRoundIndex.value - 1));
  const currentTargetScore = computed(() => currentRound.value?.targetScore || 0);
  const currentRoundTimeLimit = computed(() => {
    return Math.max(
      10,
      (currentRound.value?.timeSeconds || 0) + (activePersonalModifierEffects.value.roundTimeSecondsBonus || 0)
    );
  });
  const activeRoundModifierKeys = computed(() => currentRound.value?.resolvedModifierKeys || []);
  const activeRoundModifiers = computed(() => activeRoundModifierKeys.value
    .map((modifierKey) => getRoundModifierDefinition(modifierKey))
    .filter(Boolean));
  const accumulatedChanceIncrease = computed(() => {
    return completedRounds.value.reduce((increase, round) => {
      const chanceIncrease = round.chanceIncrease || {};
      return {
        good: increase.good + (Number(chanceIncrease.good) || 0),
        bad: increase.bad + (Number(chanceIncrease.bad) || 0),
        neutral: increase.neutral + (Number(chanceIncrease.neutral) || 0)
      };
    }, {
      good: 0,
      bad: 0,
      neutral: 0
    });
  });
  const rewardTiers = computed(() => currentRound.value?.rewardTiers || []);
  const rewardChoiceOpen = computed(() => rewardChoices.value.length > 0 && rewardSelectionsRemaining.value > 0);
  const rewardSelectionsChosen = computed(() => Math.max(0, rewardSelectionsTotal.value - rewardSelectionsRemaining.value));
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
      effects.goodChanceBonus += (definitionEffects.goodChanceBonus || 0) * stacks;
      effects.badChanceBonus += (definitionEffects.badChanceBonus || 0) * stacks;
      effects.neutralChanceBonus += (definitionEffects.neutralChanceBonus || 0) * stacks;
      effects.roundTimeSecondsBonus += (definitionEffects.roundTimeSecondsBonus || 0) * stacks;
      effects.goodChanceCapDelta += (definitionEffects.goodChanceCapDelta || 0) * stacks;
      effects.badChanceCapDelta += (definitionEffects.badChanceCapDelta || 0) * stacks;
      effects.neutralChanceCapDelta += (definitionEffects.neutralChanceCapDelta || 0) * stacks;
      if (definitionEffects.minimumWordLength) {
        effects.minimumWordLength = effects.minimumWordLength
          ? Math.min(effects.minimumWordLength, definitionEffects.minimumWordLength)
          : definitionEffects.minimumWordLength;
      }
      effects.rewardCountModifier += (definitionEffects.rewardCountModifier || 0) * stacks;
      effects.rewardSelectionCountBonus += (definitionEffects.rewardSelectionCountBonus || 0) * stacks;
      Object.entries(definitionEffects.modifierScoreBonus || {}).forEach(([key, bonus]) => {
        effects.modifierScoreBonus[key] = (effects.modifierScoreBonus[key] || 0) + (bonus * stacks);
      });
      Object.entries(definitionEffects.firstTileBonusByModifier || {}).forEach(([key, bonus]) => {
        effects.firstTileBonusByModifier[key] = (effects.firstTileBonusByModifier[key] || 0) + (bonus * stacks);
      });
      Object.entries(definitionEffects.idleBonusScoreDeltaBonus || {}).forEach(([key, bonus]) => {
        effects.idleBonusScoreDeltaBonus[key] = (effects.idleBonusScoreDeltaBonus[key] || 0) + (bonus * stacks);
      });
      Object.entries(definitionEffects.lengthScoreBonus || {}).forEach(([length, bonus]) => {
        effects.lengthScoreBonus[length] = (effects.lengthScoreBonus[length] || 0) + (bonus * stacks);
      });
      Object.entries(definitionEffects.lengthScoreMultiplier || {}).forEach(([length, multiplier]) => {
        effects.lengthScoreMultiplier[length] = Math.max(
          effects.lengthScoreMultiplier[length] || 1,
          multiplier || 1
        );
      });
      Object.entries(definitionEffects.lengthTimeBonus || {}).forEach(([length, seconds]) => {
        effects.lengthTimeBonus[length] = (effects.lengthTimeBonus[length] || 0) + (seconds * stacks);
      });
      if (definitionEffects.timedWordMultiplier) {
        effects.timedWordMultipliers.push(definitionEffects.timedWordMultiplier);
      }
      if (definitionEffects.timedWordScoreBonus) {
        effects.timedWordScoreBonuses.push(definitionEffects.timedWordScoreBonus);
      }
      Object.entries(definitionEffects.modifierOddsBonus || {}).forEach(([key, bonus]) => {
        effects.modifierOddsBonus[key] = (effects.modifierOddsBonus[key] || 0) + (bonus * stacks);
      });
      (definitionEffects.blockedModifiers || []).forEach((modifierKey) => {
        if (!effects.blockedModifiers.includes(modifierKey)) {
          effects.blockedModifiers.push(modifierKey);
        }
      });
      return effects;
    }, {
      vowelScoreBonus: 0,
      vowelScoreMultiplier: 1,
      modifierScoreBonus: {},
      firstTileBonusByModifier: {},
      idleBonusScoreDeltaBonus: {},
      lengthScoreBonus: {},
      lengthScoreMultiplier: {},
      lengthTimeBonus: {},
      timedWordMultipliers: [],
      timedWordScoreBonuses: [],
      modifierOddsBonus: {},
      blockedModifiers: [],
      badChanceMultiplier: 1,
      openingGoodChanceBonus: 0,
      goodChanceBonus: 0,
      badChanceBonus: 0,
      neutralChanceBonus: 0,
      roundTimeSecondsBonus: 0,
      goodChanceCapDelta: 0,
      badChanceCapDelta: 0,
      neutralChanceCapDelta: 0,
      minimumWordLength: 0,
      rewardCountModifier: 0,
      rewardSelectionCountBonus: 0
    });
  });
  const visibleProgressRounds = computed(() => {
    return resolvedRounds.value.map((round, index) => ({
      ...round,
      number: index + 1,
      isCurrent: index === currentRoundIndex.value,
      isComplete: index < currentRoundIndex.value,
      visibleModifierKeys: round.resolvedModifierKeys || []
    }));
  });

  const resetRun = () => {
    resolvedRounds.value = resolveRounds(rounds);
    currentRoundIndex.value = 0;
    startingScoreBonus.value = 0;
    timerRemainingSeconds.value = resolvedRounds.value[0]?.timeSeconds || 0;
    completedRounds.value = [];
    personalModifiers.value = createStartingPersonalModifiers();
    rewardChoices.value = [];
    rewardSelectionsRemaining.value = 0;
    rewardSelectionsTotal.value = 0;
    runEnded.value = false;
    failureSummary.value = null;
  };

  const restoreRunState = (state = {}) => {
    resolvedRounds.value = Array.isArray(state.resolvedRounds) && state.resolvedRounds.length
      ? state.resolvedRounds
      : resolveRounds(rounds);
    currentRoundIndex.value = Math.max(0, Math.min(
      Number(state.currentRoundIndex) || 0,
      Math.max(0, resolvedRounds.value.length - 1)
    ));
    startingScoreBonus.value = Math.max(0, Math.floor(Number(state.startingScoreBonus) || 0));
    timerRemainingSeconds.value = Math.max(0, Number(state.timerRemainingSeconds) || 0);
    completedRounds.value = Array.isArray(state.completedRounds) ? state.completedRounds : [];
    personalModifiers.value = Array.isArray(state.personalModifiers)
      ? state.personalModifiers
      : createStartingPersonalModifiers();
    rewardChoices.value = Array.isArray(state.rewardChoices) ? state.rewardChoices : [];
    rewardSelectionsRemaining.value = Math.max(0, Math.floor(Number(state.rewardSelectionsRemaining) || 0));
    rewardSelectionsTotal.value = Math.max(
      rewardSelectionsRemaining.value,
      Math.floor(Number(state.rewardSelectionsTotal) || rewardSelectionsRemaining.value || (rewardChoices.value.length ? 1 : 0))
    );
    runEnded.value = Boolean(state.runEnded);
    failureSummary.value = state.failureSummary || null;
  };

  const setTimerRemainingSeconds = (seconds) => {
    timerRemainingSeconds.value = Math.max(0, Number(seconds) || 0);
  };

  const setStartingScoreBonus = (score) => {
    startingScoreBonus.value = Math.max(0, Math.floor(Number(score) || 0));
  };

  const rerollNextRoundModifiers = () => {
    const nextRoundIndex = currentRoundIndex.value + 1;
    if (nextRoundIndex >= resolvedRounds.value.length) {
      return null;
    }

    const baseRound = rounds[nextRoundIndex] || resolvedRounds.value[nextRoundIndex];
    const currentModifierKeys = resolvedRounds.value[nextRoundIndex]?.resolvedModifierKeys || [];
    const contextExcludedKeys = getRoundContextExcludedModifierKeys(baseRound, nextRoundIndex, resolvedRounds.value.length);
    const excludedModifierKeys = new Set([...currentModifierKeys, ...contextExcludedKeys]);
    const generatedModifierKeys = resolveModifierBudget(baseRound.modifierBudget || {}, [...excludedModifierKeys]);
    const resolvedModifierKeys = resolveCompatibleModifierKeys([
      ...(baseRound.roundModifierKeys || []).filter((modifierKey) => !excludedModifierKeys.has(modifierKey)),
      ...generatedModifierKeys,
      ...FORCE_TEST_ROUND_MODIFIER_KEYS.filter((modifierKey) => !excludedModifierKeys.has(modifierKey))
    ]);
    const nextRound = {
      ...applyRoundEffects(baseRound, resolvedModifierKeys),
      resolvedModifierKeys
    };

    resolvedRounds.value = resolvedRounds.value.map((round, index) => {
      return index === nextRoundIndex ? nextRound : round;
    });

    return nextRound;
  };

  const reduceCurrentTargetScore = (amount = 10) => {
    const round = currentRound.value;
    if (!round) {
      return null;
    }

    const oldTarget = Math.max(1, round.targetScore || 1);
    const newTarget = Math.max(1, oldTarget - Math.max(0, Math.floor(Number(amount) || 0)));
    resolvedRounds.value = resolvedRounds.value.map((entry, index) => {
      return index === currentRoundIndex.value
        ? { ...entry, targetScore: newTarget }
        : entry;
    });

    return {
      oldTarget,
      newTarget
    };
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

  const getEligibleRewardDefinitions = () => {
    const allowedTiers = currentRound.value?.isChallenge
      ? [getHighestTier(rewardTiers.value)]
      : rewardTiers.value;
    const currentStacks = personalModifiers.value.reduce((stacks, modifier) => {
      stacks[modifier.key] = modifier.stacks || 1;
      return stacks;
    }, {});
    return Object.values(PERSONAL_MODIFIER_DEFINITIONS).filter((definition) => {
      const minimumRewardChoicesRemaining = Number(definition.minimumRewardChoicesRemainingToApear) || 0;
      return allowedTiers.includes(definition.tier)
        && rewardChoicesRemainingInRun.value >= minimumRewardChoicesRemaining
        && (currentStacks[definition.key] || 0) < (definition.maxStacks || 1);
    });
  };

  const chooseRewardChoices = (count = 3, excludedKeys = new Set()) => {
    const eligibleDefinitions = getEligibleRewardDefinitions();
    const choices = [];
    let availableDefinitions = eligibleDefinitions.filter((definition) => !excludedKeys.has(definition.key));
    if (!availableDefinitions.length) {
      availableDefinitions = [...eligibleDefinitions];
    }

    while (choices.length < count && availableDefinitions.length) {
      const choice = chooseWeightedReward(availableDefinitions);
      if (!choice) {
        break;
      }

      choices.push(choice);
      availableDefinitions.splice(availableDefinitions.findIndex((definition) => definition.key === choice.key), 1);
    }

    return choices;
  };

  const generateRewardChoices = (lengthModifier = 0, selectionModifier = 0) => {
    const defaultLength = 3;
    const choices = chooseRewardChoices(defaultLength + lengthModifier);
    rewardChoices.value = choices;
    rewardSelectionsTotal.value = choices.length
      ? Math.max(1, Math.floor(1 + (Number(selectionModifier) || 0)))
      : 0;
    rewardSelectionsRemaining.value = rewardSelectionsTotal.value;
    return choices;
  };

  const rerollRewardChoices = () => {
    if (!rewardChoiceOpen.value || !rewardChoices.value.length) {
      return [];
    }

    const excludedKeys = new Set(rewardChoices.value.map((choice) => choice.key));
    const choices = chooseRewardChoices(rewardChoices.value.length, excludedKeys);
    if (!choices.length) {
      return rewardChoices.value;
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
          selectedRewardLabel: selectedModifier.label,
          selectedRewardKeys: [...(round.selectedRewardKeys || []), selectedModifier.key],
          selectedRewardLabels: [...(round.selectedRewardLabels || []), selectedModifier.label]
        };
      });
    }
    rewardSelectionsRemaining.value = Math.max(0, rewardSelectionsRemaining.value - 1);
    rewardChoices.value = rewardChoices.value.filter((choice) => choice.key !== modifierKey);
    if (rewardSelectionsRemaining.value <= 0 || !rewardChoices.value.length) {
      rewardChoices.value = [];
      rewardSelectionsRemaining.value = 0;
      rewardSelectionsTotal.value = 0;
    }
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
        chanceIncrease: { ...(currentRound.value?.chanceIncrease || {}) },
        ...roundRecord
      }
    ];
  };

  const goToNextRound = ({ startingScore = 0 } = {}) => {
    rewardChoices.value = [];
    rewardSelectionsRemaining.value = 0;
    rewardSelectionsTotal.value = 0;
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
    accumulatedChanceIncrease,
    rewardTiers,
    rewardChoices,
    rewardSelectionsRemaining,
    rewardSelectionsTotal,
    rewardSelectionsChosen,
    rewardChoiceOpen,
    runEnded,
    runWon,
    failureSummary,
    resetRun,
    restoreRunState,
    setTimerRemainingSeconds,
    setStartingScoreBonus,
    rerollNextRoundModifiers,
    reduceCurrentTargetScore,
    addPersonalModifier,
    generateRewardChoices,
    rerollRewardChoices,
    selectRewardChoice,
    recordCompletedRound,
    goToNextRound,
    endRun
  };
};
