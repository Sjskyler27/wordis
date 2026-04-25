import {
  MULTI_ROUND_MODIFIER_DIFFICULTIES,
  MULTI_ROUND_REWARD_TIERS,
  createRound
} from './multi-round-rounds-hard.js';

export const NORMAL_MULTI_ROUND_ROUNDS = [
  createRound({
    id: 'normal-round-1',
    label: 'Round 1',
    targetScore: 100,
    timeSeconds: 100,
    modifierBudget: {},
    rewardTiers: [MULTI_ROUND_REWARD_TIERS.COMMON],
    startingScoreBonusMultiplier: 0.55
  }),
  createRound({
    id: 'normal-round-2',
    label: 'Round 2',
    targetScore: 120,
    timeSeconds: 105,
    modifierBudget: {
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.EASY]: 1
    },
    rewardTiers: [MULTI_ROUND_REWARD_TIERS.COMMON],
    startingScoreBonusMultiplier: 0.55
  }),
  createRound({
    id: 'normal-round-3',
    label: 'Challenge 1',
    targetScore: 125,
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
    timeSeconds: 120,
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
    timeSeconds: 130,
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
    targetScore: 190,
    timeSeconds: 140,
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
    targetScore: 215,
    timeSeconds: 150,
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
    targetScore: 240,
    timeSeconds: 165,
    isChallenge: true,
    modifierBudget: {
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.MEDIUM]: 1,
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.HARD]: 2
    },
    rewardTiers: [],
    startingScoreBonusMultiplier: 0.55
  })
];
