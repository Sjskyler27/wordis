export const ROUND_MODIFIER_DIFFICULTIES = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
};

export const ROUND_MODIFIER_DEFINITIONS = {
  min_word_5: {
    key: 'min_word_5',
    label: 'Five Up',
    description: 'Words must use at least 5 tiles.',
    difficulty: ROUND_MODIFIER_DIFFICULTIES.MEDIUM,
    force_test: false,
    tags: ['word-length'],
    rules: {
      minimumWordLength: 5
    }
  },
  no_s: {
    key: 'no_s',
    label: 'No S',
    description: 'Words cannot use S.',
    difficulty: ROUND_MODIFIER_DIFFICULTIES.MEDIUM,
    force_test: false,
    tags: ['letter-ban'],
    rules: {
      bannedLetters: ['S']
    }
  },
  highest_consonant_zero: {
    key: 'highest_consonant_zero',
    label: 'Muted Consonant',
    description: 'The highest-scoring consonant in each word scores 0.',
    difficulty: ROUND_MODIFIER_DIFFICULTIES.MEDIUM,
    force_test: false,
    tags: ['score-transform'],
    scoreEffects: {
      zeroHighestConsonant: true
    }
  },
  no_cards: {
    key: 'no_cards',
    label: 'No Cards',
    description: 'Boons and attacks cannot be played this round.',
    difficulty: ROUND_MODIFIER_DIFFICULTIES.MEDIUM,
    force_test: false,
    tags: ['cards'],
    cardRules: {
      cardsDisabled: true
    }
  },
  // min_word_6: {
  //   key: 'min_word_6',
  //   label: 'Six Up',
  //   description: 'Words must use at least 6 tiles.',
  //   difficulty: ROUND_MODIFIER_DIFFICULTIES.HARD,
  //   force_test: false,
  //   tags: ['word-length'],
  //   rules: {
  //     minimumWordLength: 6
  //   }
  // },
  double_burns: {
    key: 'double_burns',
    label: 'Hot Rack',
    description: 'Burn penalties are doubled.',
    difficulty: ROUND_MODIFIER_DIFFICULTIES.EASY,
    force_test: false,
    tags: ['burns'],
    scoreEffects: {
      idlePenaltyMultiplier: 2
    }
  },
  fleeting_tiles: {
    key: 'fleeting_tiles',
    label: 'Fleeting Rack',
    description: 'All tiles are cleared after submitting a word',
    difficulty: ROUND_MODIFIER_DIFFICULTIES.MEDIUM,
    force_test: false,
    tags: ['tile-lifecycle'],
    tileEffects: {
      fleetingAllTiles: true
    }
  },
  two_vowels: {
    key: 'two_vowels',
    label: 'Vowel Toll',
    description: 'Words must use at least 2 vowels.',
    difficulty: ROUND_MODIFIER_DIFFICULTIES.HARD,
    force_test: false,
    tags: ['word-shape'],
    rules: {
      minimumVowels: 2
    }
  },
  idle_tiles_decay: {
    key: 'idle_tiles_decay',
    label: 'Rusting Rack',
    description: 'Tiles you do not play lose 1 value after each word.',
    difficulty: ROUND_MODIFIER_DIFFICULTIES.HARD,
    force_test: false,
    tags: ['tile-lifecycle', 'score-transform'],
    tileEffects: {
      idleScoreDelta: -1
    }
  },
  pressure_timer_easy: {
    key: 'pressure_timer_easy',
    label: 'Quick Target',
    description: 'The round has 10 less seconds and needs 15 more points.',
    difficulty: ROUND_MODIFIER_DIFFICULTIES.EASY,
    force_test: false,
    tags: ['time', 'target-score'],
    roundEffects: {
      timeSecondsDelta: -10,
      targetScoreDelta: 15
    }
  },
  pressure_timer_medium: {
    key: 'pressure_timer_medium',
    label: 'Tight Target',
    description: 'The round has 15 less seconds and needs 20 more points.',
    difficulty: ROUND_MODIFIER_DIFFICULTIES.MEDIUM,
    force_test: false,
    tags: ['time', 'target-score'],
    roundEffects: {
      timeSecondsDelta: -15,
      targetScoreDelta: 20
    }
  },
  pressure_timer_hard: {
    key: 'pressure_timer_hard',
    label: 'Brutal Target',
    description: 'The round has 20 less seconds and needs 30 more points.',
    difficulty: ROUND_MODIFIER_DIFFICULTIES.HARD,
    force_test: false,
    tags: ['time', 'target-score'],
    roundEffects: {
      timeSecondsDelta: -20,
      targetScoreDelta: 30
    }
  },
  shuffle_after_submit: {
    key: 'shuffle_after_submit',
    label: 'Loose Rack',
    description: 'Your tiles shuffle every 8 seconds.',
    difficulty: ROUND_MODIFIER_DIFFICULTIES.HARD,
    force_test: false,
    tags: ['tile-lifecycle'],
    tileEffects: {
      shuffleOnSubmit: true
    }
  },
  rotating_lock_column: {
    key: 'rotating_lock_column',
    label: 'Lockstep',
    description: 'After each word, the next column becomes locked.',
    difficulty: ROUND_MODIFIER_DIFFICULTIES.HARD,
    force_test: false,
    tags: ['tile-lifecycle', 'locks'],
    tileEffects: {
      lockNextColumn: true
    }
  },
  bad_modifier_surge: {
    key: 'bad_modifier_surge',
    label: 'Bad Luck',
    description: 'Bad tile modifiers appear more often.',
    difficulty: ROUND_MODIFIER_DIFFICULTIES.EASY,
    force_test: false,
    tags: ['tile-odds', 'bad'],
    chanceEffects: {
      badChanceBonus: 0.08,
      badChanceCapDelta: 0.1
    }
  },
  must_tile_each_turn: {
    key: 'must_tile_each_turn',
    label: 'Constant Demand',
    description: 'Each turn gives you a MUST tile if you do not already have one.',
    difficulty: ROUND_MODIFIER_DIFFICULTIES.HARD,
    force_test: false,
    tags: ['tile-lifecycle', 'mustuse'],
    tileEffects: {
      mustTileEachTurn: true
    }
  }
};

export const FORCE_TEST_ROUND_MODIFIER_KEYS = Object.values(ROUND_MODIFIER_DEFINITIONS)
  .filter((modifier) => modifier.force_test)
  .map((modifier) => modifier.key);

export const ROUND_MODIFIER_KEYS_BY_DIFFICULTY = Object.values(ROUND_MODIFIER_DEFINITIONS).reduce((pools, modifier) => {
  if (modifier.force_test) {
    return pools;
  }

  pools[modifier.difficulty] = [
    ...(pools[modifier.difficulty] || []),
    modifier.key
  ];
  return pools;
}, {});

export const getRoundModifierDefinition = (key) => ROUND_MODIFIER_DEFINITIONS[key] || null;
