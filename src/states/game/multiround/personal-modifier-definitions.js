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
    tags: ['score', 'ghostTile'],
    maxStacks: 3,
    effects: {
      modifierScoreBonus: {
        ghostTile: 6
      },
      modifierOddsBonus: {
        ghostTile: 0.025
      }
    }
  },
  golden_draft: {
    key: 'golden_draft',
    label: 'Golden Draft',
    description: 'Gold tiles appear more often.',
    rarity: 0.55,
    tier: PERSONAL_MODIFIER_TIERS.RARE,
    tags: ['tile-odds', 'gold'],
    maxStacks: 3,
    effects: {
      modifierOddsBonus: {
        gold: 0.035
      }
    }
  },
  cleaner_rack: {
    key: 'cleaner_rack',
    label: 'Cleaner Rack',
    description: 'Bad tile modifiers are less likely to appear.',
    rarity: 0.65,
    tier: PERSONAL_MODIFIER_TIERS.RARE,
    tags: ['tile-odds', 'bad-cap'],
    maxStacks: 2,
    effects: {
      badChanceMultiplierDelta: -0.18
    }
  },
  strong_start: {
    key: 'strong_start',
    label: 'Strong Start',
    description: 'Rounds start with better good modifier odds.',
    rarity: 0.5,
    tier: PERSONAL_MODIFIER_TIERS.RARE,
    tags: ['opening-rack', 'good-cap'],
    maxStacks: 2,
    effects: {
      openingGoodChanceBonus: 0.04
    }
  },
  boon_cache: {
    key: 'boon_cache',
    label: 'Boon Cache',
    description: 'Immediately gain 3 boons when selected.',
    rarity: 0.35,
    tier: PERSONAL_MODIFIER_TIERS.EPIC,
    tags: ['boons', 'immediate'],
    maxStacks: 1,
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
    effects: {
      vowelScoreMultiplier: 2
    }
  }
};

export const PERSONAL_MODIFIER_KEYS = Object.keys(PERSONAL_MODIFIER_DEFINITIONS);

export const getPersonalModifierDefinition = (key) => PERSONAL_MODIFIER_DEFINITIONS[key] || null;
