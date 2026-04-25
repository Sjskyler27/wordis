import { isTestingMode } from '../testing.js';

export const MULTI_ROUND_REWARD_TIERS = {
  COMMON: 'common',
  RARE: 'rare',
  EPIC: 'epic'
};

export const MULTI_ROUND_MODIFIER_DIFFICULTIES = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
};

const createRound = ({
  id,
  label,
  targetScore,
  timeSeconds,
  isChallenge = false,
  modifierBudget = {},
  rewardTiers = [MULTI_ROUND_REWARD_TIERS.COMMON],
  startingScoreBonusMultiplier = 0.5
}) => ({
  id,
  label,
  targetScore: isTestingMode ? 15 : targetScore,
  timeSeconds: isTestingMode ? 20 : timeSeconds,
  isChallenge,
  modifierBudget,
  rewardTiers,
  startingScoreBonusMultiplier
});

export const MULTI_ROUND_ROUNDS = [
  createRound({
    id: 'round-1',
    label: 'Round 1',
    targetScore: 250,
    timeSeconds: 180,
    modifierBudget: {},
    rewardTiers: [MULTI_ROUND_REWARD_TIERS.COMMON]
  }),
  createRound({
    id: 'round-2',
    label: 'Round 2',
    targetScore: 275,
    timeSeconds: 180,
    modifierBudget: {
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.EASY]: 1
    },
    rewardTiers: [MULTI_ROUND_REWARD_TIERS.COMMON]
  }),
  createRound({
    id: 'round-3',
    label: 'Challenge 1',
    targetScore: 325,
    timeSeconds: 175,
    isChallenge: true,
    modifierBudget: {
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.EASY]: 1,
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.MEDIUM]: 1
    },
    rewardTiers: [MULTI_ROUND_REWARD_TIERS.RARE]
  }),
  createRound({
    id: 'round-4',
    label: 'Round 4',
    targetScore: 350,
    timeSeconds: 170,
    modifierBudget: {
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.MEDIUM]: 1
    },
    rewardTiers: [
      MULTI_ROUND_REWARD_TIERS.COMMON,
      MULTI_ROUND_REWARD_TIERS.RARE
    ]
  }),
  createRound({
    id: 'round-5',
    label: 'Round 5',
    targetScore: 375,
    timeSeconds: 170,
    modifierBudget: {
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.EASY]: 1,
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.MEDIUM]: 1
    },
    rewardTiers: [
      MULTI_ROUND_REWARD_TIERS.COMMON,
      MULTI_ROUND_REWARD_TIERS.RARE
    ]
  }),
  createRound({
    id: 'round-6',
    label: 'Challenge 2',
    targetScore: 425,
    timeSeconds: 165,
    isChallenge: true,
    modifierBudget: {
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.MEDIUM]: 2
    },
    rewardTiers: [MULTI_ROUND_REWARD_TIERS.EPIC]
  }),
  createRound({
    id: 'round-7',
    label: 'Round 7',
    targetScore: 450,
    timeSeconds: 165,
    modifierBudget: {
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.MEDIUM]: 1,
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.HARD]: 1
    },
    rewardTiers: [
      MULTI_ROUND_REWARD_TIERS.RARE,
      MULTI_ROUND_REWARD_TIERS.EPIC
    ]
  }),
  createRound({
    id: 'round-8',
    label: 'Round 8',
    targetScore: 500,
    timeSeconds: 160,
    modifierBudget: {
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.EASY]: 1,
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.HARD]: 1
    },
    rewardTiers: [
      MULTI_ROUND_REWARD_TIERS.RARE,
      MULTI_ROUND_REWARD_TIERS.EPIC
    ]
  }),
  createRound({
    id: 'round-9',
    label: 'Challenge 3',
    targetScore: 575,
    timeSeconds: 155,
    isChallenge: true,
    modifierBudget: {
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.MEDIUM]: 1,
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.HARD]: 2
    },
    rewardTiers: [MULTI_ROUND_REWARD_TIERS.EPIC]
  }),
  createRound({
    id: 'round-10',
    label: 'Round 10',
    targetScore: 625,
    timeSeconds: 150,
    modifierBudget: {
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.HARD]: 2
    },
    rewardTiers: [
      MULTI_ROUND_REWARD_TIERS.RARE,
      MULTI_ROUND_REWARD_TIERS.EPIC
    ]
  }),
  createRound({
    id: 'round-11',
    label: 'Round 11',
    targetScore: 700,
    timeSeconds: 150,
    modifierBudget: {
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.MEDIUM]: 2,
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.HARD]: 1
    },
    rewardTiers: [
      MULTI_ROUND_REWARD_TIERS.RARE,
      MULTI_ROUND_REWARD_TIERS.EPIC
    ]
  }),
  createRound({
    id: 'round-12',
    label: 'Challenge 4',
    targetScore: 800,
    timeSeconds: 145,
    isChallenge: true,
    modifierBudget: {
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.HARD]: 3
    },
    rewardTiers: [MULTI_ROUND_REWARD_TIERS.EPIC]
  }),
  createRound({
    id: 'round-13',
    label: 'Final Challenge',
    targetScore: 900,
    timeSeconds: 140,
    isChallenge: true,
    modifierBudget: {
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.MEDIUM]: 1,
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.HARD]: 3
    },
    rewardTiers: []
  })
];
