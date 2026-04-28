export const PERSONAL_MODIFIER_TIERS = {
  COMMON: 'common',
  RARE: 'rare',
  EPIC: 'epic'
};

export const PERSONAL_MODIFIER_DEFINITIONS = {
  vowel_value: {
    key: 'vowel_value',
    label: 'Vowel Value',
    description: 'Vowels gain +1 tile score.',
    rarity: .26,
    tier: PERSONAL_MODIFIER_TIERS.EPIC,
    tags: ['score', 'vowels'],
    maxStacks: 3,
    start_with: 0,
    effects: {
      vowelScoreBonus: 1
    }
  },
  ghost_charge: {
    key: 'ghost_charge',
    label: 'Ghost Charge',
    description: 'Ghost tiles give +3 more bonus score and appear more often.',
    rarity: 0.75,
    tier: PERSONAL_MODIFIER_TIERS.COMMON,
    tags: ['score', 'tile-odds', 'ghostTile'],
    maxStacks: 5,
    start_with: 0,
    effects: {
      modifierScoreBonus: {
        ghostTile: 3
      },
      // increases chance of pulling ghost tile 
      // this in theory would decrease chance of pulling other tiles 
      modifierOddsBonus: {
        ghostTile: 0.20
      },
      // increase base chance of pulling neutral tiles to offset that imbalence 
      neutralChanceBonus: 0.005,
      neutralChanceCapDelta: 0.005
      // current value changes:
      // bloodTil:"0.6%"ghostTile:"0.8%"yinYan: "0.6%" with none then up to .5 1 .5 see how the others decrease withought bonus and cap
      // bloodTile: "0.6%"ghostTile: "1.2%"yinYang: "0.7%"    when we increase the buonus and cap by .005
      }
  },
  golden_draft: {
    key: 'golden_draft',
    label: 'Golden Draft',
    description: 'Gold tiles appear more often.',
    rarity: 0.55,
    tier: PERSONAL_MODIFIER_TIERS.EPIC,
    tags: ['tile-odds', 'gold'],
    maxStacks: 3,
    start_with: 0,
    effects: {
      modifierOddsBonus: {
        gold: 0.35
      },
      // offset other pulls
      goodChanceBonus: 0.001,
      goodChanceCapDelta: 0.001
    }
  },
  first_focus: {
    key: 'first_focus',
    label: 'First Focus',
    description: 'First-position tiles gain +5 more score and appear more often.',
    rarity: 0.72,
    tier: PERSONAL_MODIFIER_TIERS.COMMON,
    tags: ['score', 'tile-odds', 'firsttile'],
    maxStacks: 5,
    start_with: 0,
    effects: {
      firstTileBonusByModifier: {
        firsttile: 5
      },
      modifierOddsBonus: {
        firsttile: 0.16
      },
      goodChanceBonus: 0.002,
      goodChanceCapDelta: 0.004
    }
  },
  wild_spark: {
    key: 'wild_spark',
    label: 'Wild Spark',
    description: 'Wild tiles gain +1 score and appear more often.',
    rarity: 0.72,
    tier: PERSONAL_MODIFIER_TIERS.COMMON,
    tags: ['score', 'tile-odds', 'wild'],
    maxStacks: 5,
    start_with: 0,
    effects: {
      modifierScoreBonus: {
        wild: 1
      },
      modifierOddsBonus: {
        wild: 0.16
      },
      neutralChanceBonus: 0.002,
      neutralChanceCapDelta: 0.004
    }
  },
  cool_embers: {
    key: 'cool_embers',
    label: 'Cool Embers',
    description: 'Burn tiles appear less often.',
    rarity: 0.72,
    tier: PERSONAL_MODIFIER_TIERS.COMMON,
    tags: ['tile-odds', 'burningTile'],
    maxStacks: 5,
    start_with: 0,
    effects: {
      modifierOddsBonus: {
        burningTile: -0.08
      }
    }
  },
  crowded_bag: {
    key: 'crowded_bag',
    label: 'More Modifiers',
    description: 'All modifier groups appear more often.',
    rarity: 0.64,
    tier: PERSONAL_MODIFIER_TIERS.COMMON,
    tags: ['tile-odds', 'good', 'bad', 'neutral'],
    maxStacks: 5,
    start_with: 0,
    effects: {
      goodChanceBonus: 0.006,
      badChanceBonus: 0.004,
      neutralChanceBonus: 0.003,
      goodChanceCapDelta: 0.012,
      badChanceCapDelta: 0.01,
      neutralChanceCapDelta: 0.008
    }
  },
  five_letter_form: {
    key: 'five_letter_form',
    label: 'Five Letter Form',
    description: 'Five-letter words score +3.',
    rarity: 0.68,
    tier: PERSONAL_MODIFIER_TIERS.COMMON,
    tags: ['score', 'word-length'],
    maxStacks: 3,
    start_with: 0,
    effects: {
      lengthScoreBonus: {
        5: 3
      }
    }
  },
  seven_second_wind: {
    key: 'seven_second_wind',
    label: 'Seven Second Wind',
    description: 'Seven-letter words restore seven seconds.',
    rarity: 0.68,
    tier: PERSONAL_MODIFIER_TIERS.COMMON,
    tags: ['time', 'word-length'],
    maxStacks: 1,
    start_with: 0,
    effects: {
      lengthTimeBonus: {
        7: 7
      }
    }
  },
  neutral_current: {
    key: 'neutral_current',
    label: 'Neutral Current',
    description: 'Neutral tile modifiers appear more often.',
    rarity: 0.6,
    tier: PERSONAL_MODIFIER_TIERS.RARE,
    tags: ['tile-odds', 'neutral'],
    maxStacks: 3,
    start_with: 0,
    effects: {
      neutralChanceBonus: 0.02,
      neutralChanceCapDelta: 0.03
    }
  },
  better_odds: {
    key: 'better_odds',
    label: 'Better Odds',
    description: 'Good tile modifiers appear more often.',
    rarity: 0.6,
    tier: PERSONAL_MODIFIER_TIERS.RARE,
    tags: ['tile-odds', 'good'],
    maxStacks: 5,
    start_with: 0,
    effects: {
      goodChanceBonus: 0.006,
      goodChanceCapDelta: 0.01
    }
  },
  cleaner_rack: {
    key: 'cleaner_rack',
    label: 'Cleaner Rack',
    description: 'Bad tile modifiers are less likely to appear.',
    rarity: 0.65,
    tier: PERSONAL_MODIFIER_TIERS.RARE,
    tags: ['tile-odds', 'bad-cap'],
    maxStacks: 5,
    start_with: 0,
    effects: {
      badChanceBonus: -0.004
    }
  },
  bank_interest: {
    key: 'bank_interest',
    label: 'Bank Interest',
    description: 'Bank tiles gain +1 more score each turn.',
    rarity: 0.48,
    tier: PERSONAL_MODIFIER_TIERS.RARE,
    tags: ['score', 'bankTile'],
    maxStacks: 3,
    effects: {
      idleBonusScoreDeltaBonus: {
        bankTile: 1
      }
    }
  },
  short_word_sharpener: {
    key: 'short_word_sharpener',
    label: 'Short Word Sharpener',
    description: 'Four-letter words score +5.',
    rarity: 0.48,
    tier: PERSONAL_MODIFIER_TIERS.RARE,
    tags: ['score', 'word-length'],
    maxStacks: 3,
    start_with: 0,
    effects: {
      lengthScoreBonus: {
        4: 5
      }
    }
  },
  strong_start: {
    key: 'strong_start',
    label: 'Strong Start',
    description: 'Rounds start with better good modifier odds.',
    rarity: 0.4,
    tier: PERSONAL_MODIFIER_TIERS.COMMON,
    tags: ['opening-rack', 'good-cap'],
    maxStacks: 5,
    start_with: 1,
    effects: {
      openingGoodChanceBonus: .99
    }
  },
  time_reserve: {
    key: 'time_reserve',
    label: 'Time Reserve',
    description: 'Every round starts with 5 extra seconds.',
    rarity: 0.5,
    tier: PERSONAL_MODIFIER_TIERS.RARE,
    tags: ['time'],
    maxStacks: 3,
    start_with: 0,
    effects: {
      roundTimeSecondsBonus: 5
    }
  },
  // good_ceiling: {
  //   key: 'good_ceiling',
  //   label: 'Good Ceiling',
  //   description: 'Good modifier chance cap is raised.',
  //   rarity: 0.0,
  //   tier: PERSONAL_MODIFIER_TIERS,
  //   tags: ['tile-odds', 'good-cap'],
  //   maxStacks: 3,
  //   start_with: 0,
  //   effects: {
  //     goodChanceCapDelta: 0.05
  //   }
  // },
  // safety_ceiling: {
  //   key: 'safety_ceiling',
  //   label: 'Safety Ceiling',
  //   description: 'Bad modifier chance cap is lowered.',
  //   rarity: 0.0,
  //   tier: PERSONAL_MODIFIER_TIERS,
  //   tags: ['tile-odds', 'bad-cap'],
  //   maxStacks: 3,
  //   start_with: 0,
  //   effects: {
  //     badChanceCapDelta: -0.04
  //   }
  // },
  // neutral_ceiling: {
  //   key: 'neutral_ceiling',
  //   label: 'Neutral Ceiling',
  //   description: 'Neutral modifier chance cap is raised.',
  //   rarity: 0.0,
  //   tier: PERSONAL_MODIFIER_TIERS,
  //   tags: ['tile-odds', 'neutral-cap'],
  //   maxStacks: 3,
  //   start_with: 0,
  //   effects: {
  //     neutralChanceCapDelta: 0.04
  //   }
  // },
  boon_cache: {
    key: 'boon_cache',
    label: 'Boon Cache',
    description: 'Immediately gain 3 boons when selected.',
    rarity: 9.35,
    tier: PERSONAL_MODIFIER_TIERS.COMMON,
    tags: ['boons', 'immediate'],
    maxStacks: 20,
    start_with: 0,
    effects: {
      immediateBoons: 3
    }
  },
  attack_cache: {
    key: 'attack_cache',
    label: 'Attack Cache',
    description: 'Immediately gain 3 attacks when selected.',
    rarity: 9.35,
    tier: PERSONAL_MODIFIER_TIERS.COMMON,
    tags: ['attacks', 'immediate'],
    maxStacks: 20,
    start_with: 0,
    effects: {
      immediateAttacks: 3
    }
  },
  bright_letters: {
    key: 'bright_letters',
    label: 'Bright Letters',
    description: 'Vowels score double before word multipliers.',
    rarity: 0.24,
    tier: PERSONAL_MODIFIER_TIERS.EPIC,
    tags: ['score', 'vowels'],
    maxStacks: 1,
    start_with: 0,
    effects: {
      vowelScoreMultiplier: 2
    }
  },
  must_shield: {
    key: 'must_shield',
    label: 'Must Shield',
    description: 'MUST tiles no longer appear.',
    rarity: 0.22,
    tier: PERSONAL_MODIFIER_TIERS.EPIC,
    tags: ['tile-odds', 'mustuse'],
    maxStacks: 1,
    start_with: 0,
    effects: {
      blockedModifiers: ['mustuse']
    }
  },
  burn_shield: {
    key: 'burn_shield',
    label: 'Burn Shield',
    description: 'MUST tiles no longer appear.',
    rarity: 0.22,
    tier: PERSONAL_MODIFIER_TIERS.EPIC,
    tags: ['tile-odds', 'burn'],
    maxStacks: 1,
    start_with: 0,
    effects: {
      blockedModifiers: ['burn']
    }
  },
  compact_double: {
    key: 'compact_double',
    label: 'Compact Multiplier',
    description: 'Four-letter word scores are now multiplied by 1.2 after all other points.',
    rarity: 0.2,
    tier: PERSONAL_MODIFIER_TIERS.EPIC,
    tags: ['score', 'word-length'],
    maxStacks: 1,
    start_with: 0,
    effects: {
      lengthScoreMultiplier: {
        5: 1.3
      }
    }
  },
  semi_compact_double: {
    key: 'semi_compact_double',
    label: 'Semi Compact Multiplier',
    description: 'Five-letter word scores are now multiplied by 1.3 after all other points.',
    rarity: 0.2,
    tier: PERSONAL_MODIFIER_TIERS.EPIC,
    tags: ['score', 'word-length'],
    maxStacks: 1,
    start_with: 0,
    effects: {
      lengthScoreMultiplier: {
        4: 1.3
      }
    }
  }
};

export const PERSONAL_MODIFIER_KEYS = Object.keys(PERSONAL_MODIFIER_DEFINITIONS);

export const getPersonalModifierDefinition = (key) => PERSONAL_MODIFIER_DEFINITIONS[key] || null;
