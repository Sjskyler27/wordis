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

export const MULTI_ROUND_ROUNDS = [
  {
    id: 'round-1',
    label: 'Round 1',
    targetScore: 250,
    timeSeconds: 180,
    isChallenge: false,
    modifierBudget: {},
    rewardTiers: [MULTI_ROUND_REWARD_TIERS.COMMON],
    startingScoreBonusMultiplier: 0.5
  },
  {
    id: 'round-2',
    label: 'Round 2',
    targetScore: 275,
    timeSeconds: 180,
    isChallenge: false,
    modifierBudget: {
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.EASY]: 1
    },
    rewardTiers: [MULTI_ROUND_REWARD_TIERS.COMMON],
    startingScoreBonusMultiplier: 0.5
  },
  {
    id: 'round-3',
    label: 'Challenge 1',
    targetScore: 325,
    timeSeconds: 175,
    isChallenge: true,
    modifierBudget: {
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.EASY]: 1,
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.MEDIUM]: 1
    },
    rewardTiers: [MULTI_ROUND_REWARD_TIERS.RARE],
    startingScoreBonusMultiplier: 0.5
  },
  {
    id: 'round-4',
    label: 'Round 4',
    targetScore: 350,
    timeSeconds: 170,
    isChallenge: false,
    modifierBudget: {
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.MEDIUM]: 1
    },
    rewardTiers: [
      MULTI_ROUND_REWARD_TIERS.COMMON,
      MULTI_ROUND_REWARD_TIERS.RARE
    ],
    startingScoreBonusMultiplier: 0.5
  },
  {
    id: 'round-5',
    label: 'Challenge 2',
    targetScore: 425,
    timeSeconds: 165,
    isChallenge: true,
    modifierBudget: {
      [MULTI_ROUND_MODIFIER_DIFFICULTIES.MEDIUM]: 2
    },
    rewardTiers: [MULTI_ROUND_REWARD_TIERS.EPIC],
    startingScoreBonusMultiplier: 0.5
  }
];
