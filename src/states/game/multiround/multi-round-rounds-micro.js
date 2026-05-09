import {
  MULTI_ROUND_MODIFIER_DIFFICULTIES,
  MULTI_ROUND_REWARD_TIERS,
  createRound
} from './multi-round-rounds-hard.js';

const defaultTutorialChanceIncreases = {
  goodChanceIncrease: 0.01,
  badChanceIncrease: 0.006,
  neutralChanceIncrease: 0.005
};

export const MICRO_MULTI_ROUND_ROUNDS = [
  createRound({
    ...defaultTutorialChanceIncreases,
    id: 'micro-round-1',
    label: 'Round 1',
    targetScore: 40,
    timeSeconds: 50,
    backgroundPalette: 1,
    modifierBudget: {},
    rewardTiers: [MULTI_ROUND_REWARD_TIERS.COMMON],
    startingScoreBonusMultiplier: 0.6
  }),
  createRound({
    ...defaultTutorialChanceIncreases,
    id: 'micro-round-2',
    label: 'Round 2',
    targetScore: 60,
    timeSeconds: 60,
    backgroundPalette: 6,
    modifierBudget: {},
    rewardTiers: [MULTI_ROUND_REWARD_TIERS.COMMON],
    startingScoreBonusMultiplier: 0.6
  }),
  createRound({
    ...defaultTutorialChanceIncreases,
    id: 'micro-round-3',
    label: 'Challenge 1',
    targetScore: 70,
    timeSeconds: 60,
    isChallenge: true,
    modifierBudget: {
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.EASY]: 1
    },
    rewardTiers: [
      MULTI_ROUND_REWARD_TIERS.COMMON,
      MULTI_ROUND_REWARD_TIERS.RARE
    ],
    startingScoreBonusMultiplier: 0.6
  }),
  createRound({
    ...defaultTutorialChanceIncreases,
    id: 'micro-round-4',
    label: 'Round 4',
    targetScore: 80,
    timeSeconds: 70,
    backgroundPalette: 0,
    modifierBudget: {
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.EASY]: 1
    },
    rewardTiers: [
      MULTI_ROUND_REWARD_TIERS.COMMON,
      MULTI_ROUND_REWARD_TIERS.RARE
    ],
    startingScoreBonusMultiplier: 0.6
  }),
  createRound({
    ...defaultTutorialChanceIncreases,
    id: 'micro-round-5',
    label: 'Round 5',
    targetScore: 100,
    timeSeconds: 100,
    isChallenge: true,
    modifierBudget: {
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.EASY]: 1,
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.HARD]: 1
    },
    rewardTiers: [
      MULTI_ROUND_REWARD_TIERS.EPIC,
      MULTI_ROUND_REWARD_TIERS.RARE
    ],
    startingScoreBonusMultiplier: 0.6
  }),
  createRound({
    ...defaultTutorialChanceIncreases,
    id: 'micro-round-6',
    label: 'Challenge 2',
    targetScore: 120,
    timeSeconds: 120,
    modifierBudget: {
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.MEDIUM]: 1
    },
    rewardTiers: [MULTI_ROUND_REWARD_TIERS.EPIC],
    startingScoreBonusMultiplier: 0.6
  }),
  createRound({
    ...defaultTutorialChanceIncreases,
    id: 'micro-round-7',
    label: 'Final Challenge',
    targetScore: 150,
    timeSeconds: 150,
    isChallenge: true,
    isFinalRound: true,
    modifierBudget: {
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.HARD]: 1,
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.MEDIUM]: 1
    },
    rewardTiers: [],
    startingScoreBonusMultiplier: 0.6
  })
];
