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
    difficulty: ROUND_MODIFIER_DIFFICULTIES.EASY,
    tags: ['word-length'],
    rules: {
      minimumWordLength: 5
    }
  },
  no_s: {
    key: 'no_s',
    label: 'No S',
    description: 'Words cannot use S.',
    difficulty: ROUND_MODIFIER_DIFFICULTIES.EASY,
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
    tags: ['cards'],
    cardRules: {
      cardsDisabled: true
    }
  },
  min_word_6: {
    key: 'min_word_6',
    label: 'Six Up',
    description: 'Words must use at least 6 tiles.',
    difficulty: ROUND_MODIFIER_DIFFICULTIES.HARD,
    tags: ['word-length'],
    rules: {
      minimumWordLength: 6
    }
  },
  double_burns: {
    key: 'double_burns',
    label: 'Hot Rack',
    description: 'Burn penalties are doubled.',
    difficulty: ROUND_MODIFIER_DIFFICULTIES.HARD,
    tags: ['burns'],
    scoreEffects: {
      idlePenaltyMultiplier: 2
    }
  },
  fleeting_tiles: {
    key: 'fleeting_tiles',
    label: 'Fleeting Rack',
    description: 'Unused special tiles are more punishing this round.',
    difficulty: ROUND_MODIFIER_DIFFICULTIES.HARD,
    tags: ['tile-lifecycle'],
    tileEffects: {
      fleetingAllTiles: true
    }
  }
};

export const ROUND_MODIFIER_KEYS_BY_DIFFICULTY = Object.values(ROUND_MODIFIER_DEFINITIONS).reduce((pools, modifier) => {
  pools[modifier.difficulty] = [
    ...(pools[modifier.difficulty] || []),
    modifier.key
  ];
  return pools;
}, {});

export const getRoundModifierDefinition = (key) => ROUND_MODIFIER_DEFINITIONS[key] || null;
