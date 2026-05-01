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
  return rounds.map((round) => {
    const generatedModifierKeys = resolveModifierBudget(round.modifierBudget || {});
    const resolvedModifierKeys = resolveCompatibleModifierKeys([
      ...(round.roundModifierKeys || []),
      ...generatedModifierKeys,
      ...FORCE_TEST_ROUND_MODIFIER_KEYS
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
  const runEnded = ref(false);
  const failureSummary = ref(null);

  const currentRound = computed(() => resolvedRounds.value[currentRoundIndex.value] || null);
  const currentRoundNumber = computed(() => currentRoundIndex.value + 1);
  const totalRounds = computed(() => resolvedRounds.value.length);
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
      effects.goodChanceBonus += (definitionEffects.goodChanceBonus || 0) * stacks;
      effects.badChanceBonus += (definitionEffects.badChanceBonus || 0) * stacks;
      effects.neutralChanceBonus += (definitionEffects.neutralChanceBonus || 0) * stacks;
      effects.roundTimeSecondsBonus += (definitionEffects.roundTimeSecondsBonus || 0) * stacks;
      effects.goodChanceCapDelta += (definitionEffects.goodChanceCapDelta || 0) * stacks;
      effects.badChanceCapDelta += (definitionEffects.badChanceCapDelta || 0) * stacks;
      effects.neutralChanceCapDelta += (definitionEffects.neutralChanceCapDelta || 0) * stacks;
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
      neutralChanceCapDelta: 0
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
    const excludedModifierKeys = new Set(currentModifierKeys);
    const generatedModifierKeys = resolveModifierBudget(baseRound.modifierBudget || {}, currentModifierKeys);
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
    restoreRunState,
    setTimerRemainingSeconds,
    setStartingScoreBonus,
    rerollNextRoundModifiers,
    reduceCurrentTargetScore,
    addPersonalModifier,
    generateRewardChoices,
    selectRewardChoice,
    recordCompletedRound,
    goToNextRound,
    endRun
  };
};
