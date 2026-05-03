import {
  MULTI_ROUND_MODIFIER_DIFFICULTIES,
  MULTI_ROUND_REWARD_TIERS,
  createRound
} from './multi-round-rounds-hard.js';

export const NORMAL_MULTI_ROUND_ROUNDS = [
  createRound({
    id: 'normal-round-1',
    label: 'Round 1',
    targetScore: 95,
    timeSeconds: 100,
    backgroundPalette: 'main',
    modifierBudget: {},
    rewardTiers: [MULTI_ROUND_REWARD_TIERS.COMMON],
    startingScoreBonusMultiplier: 0.55
  }),
  createRound({
    id: 'normal-round-2',
    label: 'Round 2',
    targetScore: 120,
    timeSeconds: 120,
    backgroundPalette: 'random-extra',
    modifierBudget: {
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.EASY]: 1
    },
    rewardTiers: [MULTI_ROUND_REWARD_TIERS.COMMON],
    startingScoreBonusMultiplier: 0.55
  }),
  createRound({
    id: 'normal-round-3',
    label: 'Challenge 1',
    targetScore: 130,
    timeSeconds: 115,
    isChallenge: true,
    modifierBudget: {
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.EASY]: 1,
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.MEDIUM]: 1
    },
    rewardTiers: [MULTI_ROUND_REWARD_TIERS.RARE],
    startingScoreBonusMultiplier: 0.55
  }),
  createRound({
    id: 'normal-round-4',
    label: 'Round 4',
    targetScore: 145,
    timeSeconds: 100,
    backgroundPalette: 2,
    modifierBudget: {
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.MEDIUM]: 1
    },
    rewardTiers: [
      MULTI_ROUND_REWARD_TIERS.COMMON,
      MULTI_ROUND_REWARD_TIERS.RARE
    ],
    startingScoreBonusMultiplier: 0.55
  }),
  createRound({
    id: 'normal-round-5',
    label: 'Round 5',
    targetScore: 160,
    timeSeconds: 125,
    backgroundPalette: 5,
    modifierBudget: {
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.EASY]: 1,
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.MEDIUM]: 1
    },
    rewardTiers: [
      MULTI_ROUND_REWARD_TIERS.COMMON,
      MULTI_ROUND_REWARD_TIERS.RARE
    ],
    startingScoreBonusMultiplier: 0.55
  }),
  createRound({
    id: 'normal-round-6',
    label: 'Challenge 2',
    targetScore: 175,
    timeSeconds: 100,
    isChallenge: true,
    modifierBudget: {
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.MEDIUM]: 2
    },
    rewardTiers: [MULTI_ROUND_REWARD_TIERS.EPIC],
    startingScoreBonusMultiplier: 0.55
  }),
  createRound({
    id: 'normal-round-7',
    label: 'Round 7',
    targetScore: 200,
    timeSeconds: 120,
    backgroundPalette: 1,
    modifierBudget: {
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.MEDIUM]: 1
    },
    rewardTiers: [
      MULTI_ROUND_REWARD_TIERS.RARE,
      MULTI_ROUND_REWARD_TIERS.EPIC
    ],
    startingScoreBonusMultiplier: 0.55
  }),
  createRound({
    id: 'normal-round-8',
    label: 'Round 8',
    targetScore: 205,
    timeSeconds: 145,
    backgroundPalette: 'random-extra',
    modifierBudget: {
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.EASY]: 1,
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.HARD]: 1
    },
    rewardTiers: [
      MULTI_ROUND_REWARD_TIERS.RARE,
      MULTI_ROUND_REWARD_TIERS.EPIC
    ],
    startingScoreBonusMultiplier: 0.55
  }),
  createRound({
    id: 'normal-round-9',
    label: 'Challenge 3',
    targetScore: 250,
    timeSeconds: 140,
    isChallenge: true,
    modifierBudget: {
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.MEDIUM]: 1,
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.HARD]: 1
    },
    rewardTiers: [MULTI_ROUND_REWARD_TIERS.EPIC],
    startingScoreBonusMultiplier: 0.55
  }),
  createRound({
    id: 'normal-round-10',
    label: 'Final Challenge',
    targetScore: 350,
    timeSeconds: 155,
    isChallenge: true,
    isFinalRound: true,
    modifierBudget: {
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.MEDIUM]: 1,
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.HARD]: 2
    },
    rewardTiers: [],
    startingScoreBonusMultiplier: 0.55
  })
];
