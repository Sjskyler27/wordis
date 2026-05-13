import { effect } from "vue";

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
    includeInTutorial: true,
    difficulty: ROUND_MODIFIER_DIFFICULTIES.MEDIUM,
    force_test: false,
    cantCombineWith: [],
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
    cantCombineWith: [],
    tags: ['letter-ban'],
    rules: {
      bannedLetters: ['S']
    }
  },
  highest_consonant_zero: {
    key: 'highest_consonant_zero',
    label: 'Muted Consonant',
    description: 'The highest-scoring consonant in each word scores 0.',
    difficulty: ROUND_MODIFIER_DIFFICULTIES.HARD,
    force_test: false,
    cantCombineWith: [],
    tags: ['score-transform'],
    scoreEffects: {
      zeroHighestConsonant: true
    }
  },
  no_cards: {
    key: 'no_cards',
    label: 'No Cards',
    description: 'Cards cannot be played this round.',
    difficulty: ROUND_MODIFIER_DIFFICULTIES.MEDIUM,
    force_test: false,
    cantCombineWith: [],
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
    description: 'Burn penalties are doubled, if no burn tile is on your board there is a 25% cahnce of pulling one.',
    difficulty: ROUND_MODIFIER_DIFFICULTIES.EASY,
    force_test: false,
    cantCombineWith: [],
    tags: ['burns', 'tile-odds'],
    scoreEffects: {
      idlePenaltyMultiplier: 2
    },
    tileEffects: {
      burnTileEachTurn: .25,
    },
    chanceEffects: {
      badChanceBonus: 0.02,
      badChanceCapDelta: 0.03,
      modifierOddsBonus: {
        burningTile: 0.18 
      }
    }
  },
  four_letter_sap: {
    key: 'four_letter_sap',
    label: 'Short Sap',
    description: 'Four-letter words remove 4 seconds from the clock.',
    includeInTutorial: true,
    difficulty: ROUND_MODIFIER_DIFFICULTIES.EASY,
    force_test: false,
    cantCombineWith: [],
    tags: ['time', 'word-length'],
    roundEffects: {
      lengthTimePenalty: {
        4: 4
      }
    }
  },
  fleeting_tiles: {
    key: 'fleeting_tiles',
    label: 'Fleeting Rack',
    description: 'All Modified tiles are cleared after submitting a word',
    difficulty: ROUND_MODIFIER_DIFFICULTIES.HARD,
    force_test: false,
    cantCombineWith: [],
    tags: ['tile-lifecycle'],
    tileEffects: {
      fleetingAllTiles: true
    }
  },
  less_reward_options: {
    key: 'less_reward_options',
    label: 'Minimization',
    description: 'Recieve 1 less upgrade reward this round',
    includeInTutorial: true,
    difficulty: ROUND_MODIFIER_DIFFICULTIES.EASY,
    force_test: false,
    cantCombineWith: [],
    tags: ['reward-options'],
    roundEffects:{
      rewardCountModifier: -1
    }
  },
  two_vowels: {
    key: 'two_vowels',
    label: 'Vowel Toll',
    description: 'Words must use at least 2 vowels.',
    difficulty: ROUND_MODIFIER_DIFFICULTIES.HARD,
    force_test: false,
    cantCombineWith: [],
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
    cantCombineWith: [],
    tags: ['tile-lifecycle', 'score-transform'],
    tileEffects: {
      idleScoreDelta: -1
    }
  },
  pressure_timer_easy: {
    key: 'pressure_timer_easy',
    label: 'Quick Target',
    description: 'The round has 10 less seconds and needs 15 more points.',
    includeInTutorial: true,
    difficulty: ROUND_MODIFIER_DIFFICULTIES.EASY,
    force_test: false,
    cantCombineWith: ['pressure_timer_medium', 'pressure_timer_hard'],
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
    cantCombineWith: ['pressure_timer_easy', 'pressure_timer_hard'],
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
    cantCombineWith: ['pressure_timer_easy', 'pressure_timer_medium'],
    tags: ['time', 'target-score'],
    roundEffects: {
      timeSecondsDelta: -20,
      targetScoreDelta: 30
    }
  },
  loose_letters: {
    key: 'loose_letters',
    label: 'Loose Letters',
    description: 'Built letters return to your rack every 8 seconds.',
    difficulty: ROUND_MODIFIER_DIFFICULTIES.EASY,
    force_test: false,
    cantCombineWith: ['chaotic_board'],
    tags: ['tile-lifecycle'],
    tileEffects: {
      returnBuilderIntervalMs: 8000
    }
  },
  disorganised: {
    key: 'disorganised',
    label: 'Disorganised',
    description: 'Rack tiles shuffle every 8 seconds, leaving built letters alone.',
    difficulty: ROUND_MODIFIER_DIFFICULTIES.MEDIUM,
    force_test: false,
    cantCombineWith: ['chaotic_board'],
    tags: ['tile-lifecycle'],
    tileEffects: {
      shuffleRackIntervalMs: 8000
    }
  },
  chaotic_board: {
    key: 'chaotic_board',
    label: 'Chaotic Board',
    description: 'Built letters return and the rack shuffles every 10 seconds.',
    difficulty: ROUND_MODIFIER_DIFFICULTIES.HARD,
    force_test: false,
    cantCombineWith: ['loose_letters', 'disorganised'],
    tags: ['tile-lifecycle'],
    tileEffects: {
      returnBuilderIntervalMs: 10000,
      shuffleRackIntervalMs: 10000,
      chaoticBoardIntervalMs: 10000
    }
  },
  rotating_lock_column: {
    key: 'rotating_lock_column',
    label: 'Lockstep',
    description: 'After each word, the next column becomes locked.',
    difficulty: ROUND_MODIFIER_DIFFICULTIES.HARD,
    force_test: false,
    cantCombineWith: [],
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
    cantCombineWith: [],
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
    cantCombineWith: [],
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
