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
    description: 'Ghost tiles give +6 more bonus score and appear more often.',
    rarity: 0.75,
    tier: PERSONAL_MODIFIER_TIERS.COMMON,
    tags: ['score', 'tile-odds', 'ghostTile'],
    maxStacks: 5,
    start_with: 0,
    effects: {
      modifierScoreBonus: {
        ghostTile: 6
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
    maxStacks: 300,
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
  strong_start: {
    key: 'strong_start',
    label: 'Strong Start',
    description: 'Rounds start with better good modifier odds.',
    rarity: 0.5,
    tier: PERSONAL_MODIFIER_TIERS.RARE,
    tags: ['opening-rack', 'good-cap'],
    maxStacks: 5,
    start_with: 0,
    effects: {
      openingGoodChanceBonus: 0.04
    }
  },
  // good_ceiling: {
  //   key: 'good_ceiling',
  //   label: 'Good Ceiling',
  //   description: 'Good modifier chance cap is raised.',
  //   rarity: 0.0,
  //   tier: PERSONAL_MODIFIER_TIERS.RARE,
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
  //   tier: PERSONAL_MODIFIER_TIERS.RARE,
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
  //   tier: PERSONAL_MODIFIER_TIERS.RARE,
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
    rarity: 0.35,
    tier: PERSONAL_MODIFIER_TIERS.EPIC,
    tags: ['boons', 'immediate'],
    maxStacks: 1,
    start_with: 0,
    effects: {
      immediateBoons: 3
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
  }
};

export const PERSONAL_MODIFIER_KEYS = Object.keys(PERSONAL_MODIFIER_DEFINITIONS);

export const getPersonalModifierDefinition = (key) => PERSONAL_MODIFIER_DEFINITIONS[key] || null;
