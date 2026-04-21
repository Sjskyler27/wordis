const CARD_DEFINITIONS = {
  boon_delete_tile: {
    kind: 'boon',
    label: 'Delete Tile',
    description: 'Delete one of your tiles and draw a replacement.',
    rarityWeight: 1.25,
    effectType: 'delete_tile',
    ui: {
      cardGlow: 'rgba(142, 255, 222, 0.22)',
      cardEdge: 'rgba(162, 255, 229, 0.34)',
      cardPattern: 'rgba(219, 255, 241, 0.1)',
      cardBackground: 'linear-gradient(180deg, rgba(74, 194, 177, 0.98), rgba(34, 115, 108, 0.96))',
      cardBadgeBackground: 'rgba(16, 74, 68, 0.42)'
    }
  },
  boon_isolate_tile: {
    kind: 'boon',
    label: 'Keep Only',
    description: 'Keep the chosen tile and redraw every other tile on your rack.',
    rarityWeight: 0.55,
    effectType: 'isolate_tile',
    ui: {
      cardGlow: 'rgba(163, 207, 255, 0.24)',
      cardEdge: 'rgba(188, 221, 255, 0.34)',
      cardPattern: 'rgba(231, 244, 255, 0.11)',
      cardBackground: 'linear-gradient(180deg, rgba(88, 143, 232, 0.98), rgba(46, 78, 168, 0.96))',
      cardBadgeBackground: 'rgba(24, 46, 96, 0.42)'
    }
  },
  boon_clear_negative: {
    kind: 'boon',
    label: 'Cleanse',
    description: 'Remove all negative modifiers from your rack.',
    rarityWeight: 0.48,
    effectType: 'clear_negative_modifiers',
    ui: {
      cardGlow: 'rgba(174, 255, 224, 0.24)',
      cardEdge: 'rgba(198, 255, 234, 0.34)',
      cardPattern: 'rgba(232, 255, 246, 0.1)',
      cardBackground: 'linear-gradient(180deg, rgba(78, 214, 183, 0.98), rgba(24, 126, 116, 0.96))',
      cardBadgeBackground: 'rgba(15, 78, 72, 0.42)'
    }
  },
  boon_firsttile: {
    kind: 'boon',
    label: 'First Tile',
    description: 'Give one of your tiles the first-tile bonus.',
    rarityWeight: 1,
    effectType: 'apply_modifier',
    modifier: 'firsttile',
    ui: {
      cardGlow: 'rgba(166, 205, 255, 0.22)',
      cardEdge: 'rgba(190, 217, 255, 0.32)',
      cardPattern: 'rgba(228, 240, 255, 0.1)',
      cardBackground: 'linear-gradient(180deg, rgba(99, 138, 210, 0.98), rgba(46, 58, 127, 0.96))',
      cardBadgeBackground: 'rgba(25, 31, 88, 0.42)'
    }
  },
  boon_wild: {
    kind: 'boon',
    label: 'Wild',
    description: 'Turn one of your tiles into a wild.',
    rarityWeight: 0.8,
    effectType: 'apply_modifier',
    modifier: 'wild',
    ui: {
      cardGlow: 'rgba(226, 193, 255, 0.24)',
      cardEdge: 'rgba(230, 201, 255, 0.34)',
      cardPattern: 'rgba(246, 234, 255, 0.1)',
      cardBackground: 'linear-gradient(180deg, rgba(158, 112, 238, 0.98), rgba(95, 60, 176, 0.96))',
      cardBadgeBackground: 'rgba(57, 31, 108, 0.42)'
    }
  },
  boon_gold: {
    kind: 'boon',
    label: 'Gold',
    description: 'Give one of your tiles the gold modifier.',
    rarityWeight: 0.35,
    effectType: 'apply_modifier',
    modifier: 'gold',
    ui: {
      cardGlow: 'rgba(255, 226, 134, 0.26)',
      cardEdge: 'rgba(255, 230, 156, 0.36)',
      cardPattern: 'rgba(255, 245, 205, 0.11)',
      cardBackground: 'linear-gradient(180deg, rgba(245, 196, 82, 0.98), rgba(178, 114, 15, 0.96))',
      cardBadgeBackground: 'rgba(107, 67, 8, 0.42)'
    }
  },
  attack_zeroTile: {
    kind: 'attack',
    label: 'Zero Tile',
    description: 'Give a random enemy tile the Zero Tile modifier.',
    rarityWeight: 1,
    effectType: 'random_attack',
    modifier: 'zeroTile',
    ui: {
      cardGlow: 'rgba(227, 195, 162, 0.24)',
      cardEdge: 'rgba(233, 207, 180, 0.34)',
      cardPattern: 'rgba(252, 238, 220, 0.1)',
      cardBackground: 'linear-gradient(180deg, rgba(183, 131, 84, 0.98), rgba(103, 61, 31, 0.96))',
      cardBadgeBackground: 'rgba(73, 41, 17, 0.42)'
    }
  },
  attack_mustuse: {
    kind: 'attack',
    label: 'Must Use',
    description: 'Give a random enemy tile the MUST modifier.',
    rarityWeight: 0.85,
    effectType: 'random_attack',
    modifier: 'mustuse',
    ui: {
      cardGlow: 'rgba(255, 170, 187, 0.24)',
      cardEdge: 'rgba(255, 188, 201, 0.34)',
      cardPattern: 'rgba(255, 232, 238, 0.1)',
      cardBackground: 'linear-gradient(180deg, rgba(230, 95, 124, 0.98), rgba(139, 24, 57, 0.96))',
      cardBadgeBackground: 'rgba(94, 17, 40, 0.42)'
    }
  },
  attack_locked3: {
    kind: 'attack',
    label: 'Lock',
    description: 'Lock a random enemy tile for three turns.',
    rarityWeight: 0.65,
    effectType: 'random_attack',
    modifier: 'locked3',
    ui: {
      cardGlow: 'rgba(132, 118, 172, 0.24)',
      cardEdge: 'rgba(171, 156, 209, 0.3)',
      cardPattern: 'rgba(232, 226, 255, 0.08)',
      cardBackground: 'linear-gradient(180deg, rgba(74, 67, 104, 0.98), rgba(26, 22, 39, 0.98))',
      cardBadgeBackground: 'rgba(14, 10, 24, 0.46)'
    }
  },
  attack_ghostTile: {
    kind: 'attack',
    label: 'Ghost Tile',
    description: 'Give a random enemy tile the ghostTile modifier.',
    rarityWeight: 0.72,
    effectType: 'random_attack',
    modifier: 'ghostTile',
    ui: {
      cardGlow: 'rgba(220, 240, 255, 0.24)',
      cardEdge: 'rgba(227, 243, 255, 0.34)',
      cardPattern: 'rgba(244, 250, 255, 0.12)',
      cardBackground: 'linear-gradient(180deg, rgba(161, 191, 219, 0.98), rgba(91, 119, 157, 0.96))',
      cardBadgeBackground: 'rgba(50, 70, 104, 0.42)'
    }
  },
  attack_pause_submissions: {
    kind: 'attack',
    label: 'Pause Submissions',
    description: 'Stop your opponent from submitting until you submit a word. Cannot be played while another pause is active.',
    rarityWeight: 100.58,
    effectType: 'pause_submissions',
    ui: {
      cardGlow: 'rgba(255, 216, 151, 0.24)',
      cardEdge: 'rgba(255, 228, 179, 0.34)',
      cardPattern: 'rgba(255, 244, 224, 0.1)',
      cardBackground: 'linear-gradient(180deg, rgba(206, 126, 64, 0.98), rgba(122, 55, 37, 0.96))',
      cardBadgeBackground: 'rgba(79, 34, 21, 0.42)'
    }
  },
  attack_pause_time: {
    kind: 'attack',
    label: 'Pause Time',
    description: 'Pause the clock until your next word.',
    rarityWeight: 0.72,
    effectType: 'pause_time',
    timedSoloOnly: true,
    ui: {
      cardGlow: 'rgba(178, 247, 255, 0.24)',
      cardEdge: 'rgba(196, 252, 255, 0.34)',
      cardPattern: 'rgba(230, 255, 255, 0.12)',
      cardBackground: 'linear-gradient(180deg, rgba(74, 188, 205, 0.98), rgba(28, 102, 133, 0.96))',
      cardBadgeBackground: 'rgba(16, 63, 79, 0.42)'
    }
  },
  attack_gain_time: {
    kind: 'attack',
    label: 'Gain Time',
    description: 'Add 10 seconds to the timer.',
    rarityWeight: 1.08,
    effectType: 'gain_time',
    amount: 10,
    timedSoloOnly: true,
    ui: {
      cardGlow: 'rgba(170, 255, 185, 0.24)',
      cardEdge: 'rgba(196, 255, 207, 0.34)',
      cardPattern: 'rgba(232, 255, 236, 0.12)',
      cardBackground: 'linear-gradient(180deg, rgba(84, 205, 132, 0.98), rgba(35, 122, 68, 0.96))',
      cardBadgeBackground: 'rgba(18, 71, 35, 0.42)'
    }
  }
};

const BOON_CARD_KEYS = [
  'boon_delete_tile',
  'boon_isolate_tile',
  'boon_clear_negative',
  'boon_firsttile',
  'boon_wild',
  'boon_gold'
];

const ATTACK_CARD_KEYS = [
  'attack_zeroTile',
  'attack_mustuse',
  'attack_locked3',
  'attack_ghostTile',
  'attack_pause_submissions'
];

const TIMED_SOLO_ATTACK_CARD_KEYS = ['attack_pause_time', 'attack_gain_time'];

const cardDefinitionsApi = {
  CARD_DEFINITIONS,
  BOON_CARD_KEYS,
  ATTACK_CARD_KEYS,
  TIMED_SOLO_ATTACK_CARD_KEYS
};

if (typeof globalThis !== 'undefined') {
  globalThis.__wordisCardDefinitions = cardDefinitionsApi;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = cardDefinitionsApi;
}
