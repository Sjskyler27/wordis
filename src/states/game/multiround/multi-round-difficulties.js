import { EASY_MULTI_ROUND_ROUNDS } from './multi-round-rounds-easy.js';
import { NORMAL_MULTI_ROUND_ROUNDS } from './multi-round-rounds-normal.js';
import { HARD_MULTI_ROUND_ROUNDS } from './multi-round-rounds-hard.js';
import { TUTORIAL_MULTI_ROUND_ROUNDS } from './multi-round-rounds-tutorial.js';

export const MULTI_ROUND_DIFFICULTIES = {
  TUTORIAL: 'tutorial',
  EASY: 'easy',
  NORMAL: 'normal',
  HARD: 'hard'
};

export const MULTI_ROUND_ROUNDS_BY_DIFFICULTY = {
  [MULTI_ROUND_DIFFICULTIES.TUTORIAL]: TUTORIAL_MULTI_ROUND_ROUNDS,
  [MULTI_ROUND_DIFFICULTIES.EASY]: EASY_MULTI_ROUND_ROUNDS,
  [MULTI_ROUND_DIFFICULTIES.NORMAL]: NORMAL_MULTI_ROUND_ROUNDS,
  [MULTI_ROUND_DIFFICULTIES.HARD]: HARD_MULTI_ROUND_ROUNDS
};

export const getMultiRoundRounds = (difficulty = MULTI_ROUND_DIFFICULTIES.NORMAL) => {
  return MULTI_ROUND_ROUNDS_BY_DIFFICULTY[difficulty] || NORMAL_MULTI_ROUND_ROUNDS;
};
