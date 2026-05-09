import { EASY_MULTI_ROUND_ROUNDS } from './multi-round-rounds-easy.js';
import { NORMAL_MULTI_ROUND_ROUNDS } from './multi-round-rounds-normal.js';
import { HARD_MULTI_ROUND_ROUNDS } from './multi-round-rounds-hard.js';
import { MICRO_MULTI_ROUND_ROUNDS } from './multi-round-rounds-micro.js';

export const MULTI_ROUND_DIFFICULTIES = {
  MICRO: 'micro',
  EASY: 'easy',
  NORMAL: 'normal',
  HARD: 'hard'
};

export const MULTI_ROUND_ROUNDS_BY_DIFFICULTY = {
  [MULTI_ROUND_DIFFICULTIES.MICRO]: MICRO_MULTI_ROUND_ROUNDS,
  [MULTI_ROUND_DIFFICULTIES.EASY]: EASY_MULTI_ROUND_ROUNDS,
  [MULTI_ROUND_DIFFICULTIES.NORMAL]: NORMAL_MULTI_ROUND_ROUNDS,
  [MULTI_ROUND_DIFFICULTIES.HARD]: HARD_MULTI_ROUND_ROUNDS
};

export const normalizeMultiRoundDifficulty = (difficulty = MULTI_ROUND_DIFFICULTIES.NORMAL) => {
  return difficulty;
};

export const getMultiRoundRounds = (difficulty = MULTI_ROUND_DIFFICULTIES.NORMAL) => {
  return MULTI_ROUND_ROUNDS_BY_DIFFICULTY[normalizeMultiRoundDifficulty(difficulty)] || NORMAL_MULTI_ROUND_ROUNDS;
};
