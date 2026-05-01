import {
  MULTI_ROUND_MODIFIER_DIFFICULTIES,
  MULTI_ROUND_REWARD_TIERS,
  createRound
} from './multi-round-rounds-hard.js';

export const EASY_MULTI_ROUND_ROUNDS = [
  createRound({
    id: 'easy-round-1',
    label: 'Round 1',
    targetScore: 70,
    timeSeconds: 110,
    backgroundPalette: 'random-extra',
    modifierBudget: {},
    rewardTiers: [MULTI_ROUND_REWARD_TIERS.COMMON],
    startingScoreBonusMultiplier: 0.6
  }),
  createRound({
    id: 'easy-round-2',
    label: 'Round 2',
    targetScore: 85,
    timeSeconds: 115,
    backgroundPalette: 6,
    modifierBudget: {},
    rewardTiers: [MULTI_ROUND_REWARD_TIERS.COMMON],
    startingScoreBonusMultiplier: 0.6
  }),
  createRound({
    id: 'easy-round-3',
    label: 'Challenge 1',
    targetScore: 105,
    timeSeconds: 125,
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
    id: 'easy-round-4',
    label: 'Round 4',
    targetScore: 95,
    timeSeconds: 130,
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
    id: 'easy-round-5',
    label: 'Round 5',
    targetScore: 110,
    timeSeconds: 135,
    isChallenge: true,
    modifierBudget: {
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.EASY]: 1,
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.HARD]: 1
    },
    rewardTiers: [
      MULTI_ROUND_REWARD_TIERS.COMMON,
      MULTI_ROUND_REWARD_TIERS.RARE
    ],
    startingScoreBonusMultiplier: 0.6
  }),
  createRound({
    id: 'easy-round-6',
    label: 'Challenge 2',
    targetScore: 120,
    timeSeconds: 145,
    isChallenge: true,
    modifierBudget: {
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.EASY]: 1,
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.MEDIUM]: 1
    },
    rewardTiers: [MULTI_ROUND_REWARD_TIERS.RARE],
    startingScoreBonusMultiplier: 0.6
  }),
  createRound({
    id: 'easy-round-7',
    label: 'Final Challenge',
    targetScore: 160,
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
