const createSharedTileLogic = ({ letterConfig, wordBonuses, milestoneRewards = {}, devLogging = false, testing = false }) => {
  const LETTER_KEYS = Object.keys(letterConfig);
  const LETTER_POOL = Object.entries(letterConfig).flatMap(([letter, config]) =>
    Array.from({ length: config.count }, () => letter)
  );

  const MIN_WORD_LENGTH = 4;
  const RACK_SIZE = 20;
  const DUPLICATE_PENALTY = 0.38;
  const MIN_DUPLICATE_WEIGHT = 0.18;
  const BASE_GOOD_MODIFIER_CHANCE = 0.08;
  const BASE_BAD_MODIFIER_CHANCE = 0.03;
  const BASE_NEUTRAL_MODIFIER_CHANCE = 0.02;
  const MODIFIER_SWING_DIVISOR = 90;
  const MAX_GOOD_MODIFIER_BONUS = 0.3;
  const MAX_BAD_MODIFIER_BONUS = 0.22;
  const TURN_MODIFIER_CHANCE_STEP = 0.003;
  const MAX_TURN_MODIFIER_BONUS = 0.08;
  const BLOOD_TILE_POSITION_VALUES = {
    pos1: -2,
    pos2: -1,
    pos3: 0,
    pos4: 1,
    pos5: 2,
    pos6: 3,
    pos7: 4,
    pos8: 5,
    pos9: 6
  };
  const GOOD_MODIFIERS = ['gold', 'firsttile', 'wild', 'bankTile', 'gainboon', 'gainattack'];
  const BAD_MODIFIERS = ['zeroTile', 'mustuse', 'locked3', 'burningTile'];
  const NEUTRAL_MODIFIERS = ['yinYang', 'ghostTile','bloodTile'];
  const BOON_CARD_KEYS = ['boon_delete_tile', 'boon_isolate_tile', 'boon_clear_negative', 'boon_firsttile', 'boon_wild', 'boon_gold'];
  const ATTACK_CARD_KEYS = ['attack_zeroTile', 'attack_mustuse', 'attack_locked3', 'attack_ghostTile'];
  const TIMED_SOLO_ATTACK_CARD_KEYS = ['attack_pause_time', 'attack_gain_time'];
  const EMPTY_TILE_ANIMATION_STATE = {
    trigger: '',
    name: '',
    key: ''
  };
  const MODIFIER_PROFILES = {
    duel: {
      goodModifiers: GOOD_MODIFIERS,
      badModifiers: BAD_MODIFIERS,
      neutralModifiers: NEUTRAL_MODIFIERS,
      baseGoodChance: BASE_GOOD_MODIFIER_CHANCE,
      baseBadChance: BASE_BAD_MODIFIER_CHANCE,
      baseNeutralChance: BASE_NEUTRAL_MODIFIER_CHANCE,
      useScoreSwing: true
    },
    bot: {
      goodModifiers: GOOD_MODIFIERS,
      badModifiers: BAD_MODIFIERS,
      neutralModifiers: NEUTRAL_MODIFIERS,
      baseGoodChance: BASE_GOOD_MODIFIER_CHANCE,
      baseBadChance: BASE_BAD_MODIFIER_CHANCE,
      baseNeutralChance: BASE_NEUTRAL_MODIFIER_CHANCE,
      useScoreSwing: true
    },
    solo: {
      goodModifiers: GOOD_MODIFIERS,
      badModifiers: BAD_MODIFIERS,
      neutralModifiers: NEUTRAL_MODIFIERS,
      baseGoodChance: 0.085,
      baseBadChance: 0.022,
      baseNeutralChance: BASE_NEUTRAL_MODIFIER_CHANCE,
      useScoreSwing: false
    }
  };
  const MODIFIER_DEFINITIONS = {
    normal: {
      badge: '',
      effects: {},
      rarityWeight: 0,
      ui: {
        tileBackground: 'linear-gradient(180deg, #fffef8 0%, #f2ebe0 70%, #d9cec0 100%)',
        tileShadow: 'inset 0 -4px 0 rgba(0, 0, 0, 0.12), 0 10px 18px rgba(45, 10, 24, 0.16)',
        textColor: '#1c1930',
        badgeBackground: 'transparent',
        badgeColor: 'transparent',
        hideBadge: true
      }
    },
    gold: {
      badge: 'x2',
      effects: { wordMultiplier: 2 },
      rarityWeight: 0.9,
      canApply: ({ baseScore }) => baseScore >= 3,
      ui: {
        tileBackground: 'linear-gradient(180deg, #fff7d2 0%, #f4cf67 72%, #c68b1d 100%)',
        tileShadow: 'inset 0 -4px 0 rgba(122, 72, 8, 0.2), 0 12px 20px rgba(45, 10, 24, 0.2), 0 0 0 1px rgba(255, 223, 128, 0.5)',
        textColor: '#1c1930',
        badgeBackground: 'rgba(255, 245, 196, 0.95)',
        badgeColor: '#8e4b00'
      }
    },
    gainboon: {
      badge: 'BOON',
      effects: { grantBoon: 1 },
      rarityWeight: 0.28,
      ui: {
        tileBackground: 'linear-gradient(180deg, #f6ffe1 0%, #b9e16b 72%, #6f9d24 100%)',
        tileShadow: 'inset 0 -4px 0 rgba(60, 92, 14, 0.24), 0 12px 20px rgba(45, 10, 24, 0.16), 0 0 0 1px rgba(209, 244, 131, 0.42)',
        textColor: '#193115',
        badgeBackground: 'rgba(245, 255, 228, 0.95)',
        badgeColor: '#537f18'
      }
    },
    gainattack: {
      badge: 'ATK',
      effects: { grantAttack: 1 },
      rarityWeight: 0.28,
      ui: {
        tileBackground: 'linear-gradient(180deg, #ffe8d9 0%, #ff9b6e 72%, #b64a1f 100%)',
        tileShadow: 'inset 0 -4px 0 rgba(116, 43, 12, 0.24), 0 12px 20px rgba(45, 10, 24, 0.18), 0 0 0 1px rgba(255, 190, 150, 0.42)',
        textColor: '#311610',
        badgeBackground: 'rgba(255, 238, 228, 0.95)',
        badgeColor: '#9c3f18'
      }
    },
    wild: {
      effects: {
         wild: true,
         setScore: -1
        },
      rarityWeight: 0.45,
      ui: {
        tileBackground: 'linear-gradient(180deg, #fff6ff 0%, #d8c0ff 52%, #7f5cd4 100%)',
        tileShadow: 'inset 0 -4px 0 rgba(63, 36, 120, 0.24), 0 12px 20px rgba(38, 17, 62, 0.22), 0 0 0 1px rgba(226, 204, 255, 0.4)',
        textColor: '#201339',
        badgeBackground: 'rgba(255, 244, 255, 0.96)',
        badgeColor: '#7148b4',
        hideBadge: true
      }
    },
    firsttile: {
      badge: '1st',
      effects: { firstTileBonus: 10 },
      rarityWeight: 0.22,
      ui: {
        tileBackground: 'linear-gradient(180deg, #d9edff 0%, #8cb1d8 72%, #4f6999 100%)',
        tileShadow: 'inset 0 -4px 0 rgba(34, 58, 101, 0.25), 0 12px 20px rgba(24, 20, 46, 0.18), 0 0 0 1px rgba(173, 210, 255, 0.4)',
        textColor: '#11213f',
        badgeBackground: 'rgba(233, 244, 255, 0.96)',
        badgeColor: '#274577'
      }
    },
    bloodTile: {
      badge: 'BLOOD',
      effects: {
        setScore: 0,
        positionBonusByIndex: BLOOD_TILE_POSITION_VALUES
      },
      rarityWeight: 0.36,
      ui: {
        tileBackground: 'radial-gradient(circle at 26% 24%, rgba(255, 125, 125, 0.96) 0%, rgba(255, 125, 125, 0.96) 11%, rgba(120, 15, 21, 0.94) 12%, rgba(120, 15, 21, 0.94) 26%, rgba(28, 7, 12, 0.98) 27%, rgba(28, 7, 12, 0.98) 44%, rgba(182, 20, 34, 0.96) 45%, rgba(182, 20, 34, 0.96) 62%, rgba(24, 6, 10, 0.98) 63%, rgba(24, 6, 10, 0.98) 100%)',
        tileShadow: 'inset 0 -4px 0 rgba(54, 7, 13, 0.4), 0 12px 22px rgba(54, 7, 13, 0.28), 0 0 0 1px rgba(255, 120, 130, 0.24)',
        textColor: '#fff4f4',
        badgeBackground: 'rgba(20, 6, 10, 0.92)',
        badgeColor: '#ff9fa8'
      }
    },
    bankTile: {
      badge: 'BANK',
      effects: { setScore: 0, idleBonusScoreDelta: 1 },
      rarityWeight: 0.18,
      ui: {
        tileBackground: 'linear-gradient(180deg, #d7ffe9 0%, #5ee2a8 42%, #0b9a6f 76%, #046647 100%)',
        tileShadow: 'inset 0 -4px 0 rgba(4, 82, 58, 0.34), 0 12px 22px rgba(4, 82, 58, 0.24), 0 0 0 1px rgba(175, 255, 213, 0.46)',
        textColor: '#0a2b23',
        badgeBackground: 'rgba(231, 255, 241, 0.94)',
        badgeColor: '#0a8b63'
      }
    },
    yinYang: {
      badge: 'YIN',
      effects: {
        dynamicScoreByLead: {
          ahead: -3,
          behind: 3,
          tied: 0
        }
      },
      rarityWeight: 0.32,
      noSinglePlayer: true,
      ui: {
        tileBackground: 'linear-gradient(225deg, #f6f0e4 0%, #f6f0e4 48%, #181217 49%, #181217 100%)',
        tileShadow: 'inset 0 -4px 0 rgba(20, 14, 19, 0.28), 0 12px 22px rgba(20, 14, 19, 0.22), 0 0 0 1px rgba(255, 255, 255, 0.24)',
        textColor: '#8a2f2f',
        badgeBackground: 'rgba(255, 255, 255, 0.92)',
        badgeColor: '#1a1519'
      }
    },
    zeroTile: {
      effects: { setScore: 0 },
      rarityWeight: 0.95,
      canApply: ({ baseScore }) => baseScore <= 4,
      ui: {
        tileBackground: 'linear-gradient(180deg, #dfc1a3 0%, #cda278 70%, #91623c 100%)',
        tileShadow: 'inset 0 -4px 0 rgba(60, 30, 10, 0.35), 0 10px 18px rgba(45, 20, 10, 0.25), 0 0 0 1px rgba(255, 220, 180, 0.25)',
        textColor: '#2b1a0f',
        badgeBackground: 'rgba(255, 235, 210, 0.9)',
        hideBadge: true
      }
    },
    mustuse: {
      badge: 'MUST',
      effects: { required: true },
      rarityWeight: 0.6,
      canApply: ({ baseScore }) => baseScore <= 3,
      ui: {
        tileBackground: 'linear-gradient(180deg, #ffdfe2 0%, #ff8b97 72%, #b72848 100%)',
        tileShadow: 'inset 0 -4px 0 rgba(104, 18, 37, 0.24), 0 12px 20px rgba(45, 10, 24, 0.2), 0 0 0 1px rgba(255, 166, 179, 0.42)',
        textColor: '#1c1930',
        badgeBackground: 'rgba(255, 233, 236, 0.96)',
        badgeColor: '#a61c39'
      }
    },
    locked3: {
      badge: '',
      effects: { lockTurns: 1 },
      rarityWeight: 0.6,
      ui: {
        tileBackground: 'linear-gradient(180deg, #3b3343 0%, #211926 72%, #100b14 100%)',
        tileShadow: 'inset 0 -4px 0 rgba(0, 0, 0, 0.4), 0 12px 20px rgba(10, 5, 12, 0.34)',
        textColor: '#f6efe1',
        badgeBackground: 'rgba(255, 255, 255, 0.12)',
        badgeColor: 'rgba(160, 160, 160, 0.88)',
        badgeColor: '#fff'
      }
    },
    ghostTile: {
      badge: 'GHST',
      effects: { fadesIfUnused: true, bonusScore: 3 },
      rarityWeight: 0.52,
      canApply: ({ baseScore }) => baseScore <= 4,
      ui: {
        tileBackground: 'linear-gradient(180deg, rgba(242, 250, 255, 0.88) 0%, rgba(198, 218, 236, 0.78) 58%, rgba(131, 156, 181, 0.74) 100%)',
        tileShadow: 'inset 0 -4px 0 rgba(82, 105, 131, 0.18), 0 10px 18px rgba(44, 61, 86, 0.16), 0 0 0 1px rgba(236, 247, 255, 0.48)',
        textColor: '#223247',
        badgeBackground: 'rgba(244, 250, 255, 0.88)',
        badgeColor: '#607890'
      }
    },
    burningTile: {
      noSinglePlayer: true,
      badge: 'BURN',
      effects: { setScore: 1, idleScorePenalty: 3 },
      rarityWeight: 0.5,
      canApply: ({ baseScore }) => baseScore <= 4,
      animations: {
        onNewTurn: 'blaze'
      },
      ui: {
        tileBackground: 'linear-gradient(180deg, #2f160d 0%, #6d2513 32%, #c44717 72%, #ffb347 100%)',
        tileShadow: 'inset 0 -4px 0 rgba(83, 23, 5, 0.32), 0 12px 20px rgba(85, 24, 6, 0.22), 0 0 0 1px rgba(255, 180, 94, 0.34)',
        textColor: '#fff1dd',
        badgeBackground: 'rgba(74, 18, 6, 0.92)',
        badgeColor: '#ffd08b'
      }
    }
  };
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

  const getRackLetterCounts = (tiles = []) => tiles.reduce((counts, tile) => {
    if (!tile?.letter) {
      return counts;
    }

    counts[tile.letter] = (counts[tile.letter] || 0) + 1;
    return counts;
  }, {});

  const getWeightedLetterPool = (tiles = []) => {
    const rackCounts = getRackLetterCounts(tiles);

    return LETTER_POOL.map((letter) => {
      const duplicateCount = rackCounts[letter] || 0;
      const weight = Math.max(MIN_DUPLICATE_WEIGHT, 1 - (duplicateCount * DUPLICATE_PENALTY));

      return { letter, weight };
    });
  };

  const drawLetter = (tiles = []) => {
    // weights determined by the letters 
    const weightedPool = getWeightedLetterPool(tiles);
    const totalWeight = weightedPool.reduce((sum, entry) => sum + entry.weight, 0);

    if (!totalWeight) {
      return LETTER_POOL[Math.floor(Math.random() * LETTER_POOL.length)];
    }

    let roll = Math.random() * totalWeight;
    for (const entry of weightedPool) {
      roll -= entry.weight;
      if (roll <= 0) {
        return entry.letter;
      }
    }

    return weightedPool[weightedPool.length - 1]?.letter || 'E';
  };

  const normalizeModifierStatus = (status = 'normal') => (status === 'black' ? 'zeroTile' : status);
  const normalizeCardKey = (cardKey) => (cardKey === 'attack_black' ? 'attack_zeroTile' : cardKey);
  const getModifierDefinition = (status = 'normal') => {
    return MODIFIER_DEFINITIONS[normalizeModifierStatus(status)] || MODIFIER_DEFINITIONS.normal;
  };
  const getAllowedModifiersForProfile = (modifiers = [], profileName = 'duel') => {
    return modifiers.filter((modifier) => {
      const definition = getModifierDefinition(modifier);
      // return all if logging

      console.log('test mode is: '+ testing)
      if (testing) {
        return true;
      }
      // currently duel gets everything
      if (profileName === 'solo') {
        return !definition.noSinglePlayer;
      }
      if(devLogging)console.log('profile'+ profileName)

      if (profileName === 'duel' || profileName === 'bot') {
        return !definition.noMultiPlayer;
      }

      return !definition.noSinglePlayer && !definition.noMultiPlayer;
    });
  };
  const getCardDefinition = (cardKey) => CARD_DEFINITIONS[normalizeCardKey(cardKey)];
  const getModifierProfile = (profileName = 'duel') => {
    const profile = MODIFIER_PROFILES[profileName] || MODIFIER_PROFILES.duel;

    return {
      ...profile,
      goodModifiers: getAllowedModifiersForProfile(profile.goodModifiers || [], profileName),
      badModifiers: getAllowedModifiersForProfile(profile.badModifiers || [], profileName),
      neutralModifiers: getAllowedModifiersForProfile(profile.neutralModifiers || [], profileName)
    };
  };

  const getModifierChances = (side, scores = {}, profileName = 'duel', turnCount = 0) => {
    // base tiles off profile 
    const profile = getModifierProfile(profileName);
    if(devLogging){
      console.log('current profile' + profileName)
      console.log('allowed Tiles!')
      console.log(profile)
    }
    const turnBonus = Math.min(MAX_TURN_MODIFIER_BONUS, Math.max(0, turnCount) * TURN_MODIFIER_CHANCE_STEP);

    if (!side || !profile.useScoreSwing) {
      return {
        goodChance: Math.min(0.45, profile.baseGoodChance + turnBonus),
        badChance: Math.min(0.4, profile.baseBadChance + turnBonus),
        neutralChance: profile.baseNeutralChance || 0
      };
    }

    const opponentSide = side === 'host' ? 'opponent' : 'host';
    const scoreDelta = (scores[side] || 0) - (scores[opponentSide] || 0);
    const catchupBonus = Math.min(MAX_GOOD_MODIFIER_BONUS, Math.max(0, -scoreDelta) / MODIFIER_SWING_DIVISOR);
    const pressureBonus = Math.min(MAX_BAD_MODIFIER_BONUS, Math.max(0, scoreDelta) / MODIFIER_SWING_DIVISOR);

    return {
      goodChance: Math.min(0.45, profile.baseGoodChance + catchupBonus + turnBonus),
      badChance: Math.min(0.4, profile.baseBadChance + pressureBonus + turnBonus),
      neutralChance: Math.min(0.2, profile.baseNeutralChance || 0)
    };
  };
  const hasModifierInRack = (rackTiles = [], status = 'normal') => {
    return rackTiles.some((tile) => tile.status === status);
  };
  const canApplyModifier = (status = 'normal', context = {}) => {
    status = normalizeModifierStatus(status);

    if (status === 'mustuse' && hasModifierInRack(context.rackTiles || [], 'mustuse')) {
      return false;
    }

    const definition = getModifierDefinition(status);

    if (typeof definition.canApply !== 'function') {
      return true;
    }

    return definition.canApply(context);
  };

  const chooseWeightedModifier = (modifiers = []) => {
    const weightedModifiers = modifiers
      .map((modifier) => ({
        modifier,
        weight: Math.max(0, getModifierDefinition(modifier).rarityWeight ?? 1)
      }))
      .filter((entry) => entry.weight > 0);

    if (!weightedModifiers.length) {
      return 'normal';
    }

    const totalWeight = weightedModifiers.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = Math.random() * totalWeight;

    for (const entry of weightedModifiers) {
      roll -= entry.weight;
      if (roll <= 0) {
        return entry.modifier;
      }
    }

    return weightedModifiers[weightedModifiers.length - 1].modifier;
  };

  const getWeightedModifierOdds = (modifiers = [], poolChance = 0) => {
    const weightedModifiers = modifiers
      .map((modifier) => ({
        modifier,
        weight: Math.max(0, getModifierDefinition(modifier).rarityWeight ?? 1)
      }))
      .filter((entry) => entry.weight > 0);

    if (!weightedModifiers.length || poolChance <= 0) {
      return {};
    }

    const totalWeight = weightedModifiers.reduce((sum, entry) => sum + entry.weight, 0);
    if (!totalWeight) {
      return {};
    }

    return weightedModifiers.reduce((odds, entry) => {
      odds[entry.modifier] = poolChance * (entry.weight / totalWeight);
      return odds;
    }, {});
  };

  const getModifierOddsSnapshot = ({
    goodChance,
    badChance,
    neutralChance,
    eligibleGoodModifiers = [],
    eligibleBadModifiers = [],
    eligibleNeutralModifiers = []
  }) => {

    if (!devLogging) {
      return;
    }

    const modifierOdds = {
      ...getWeightedModifierOdds(eligibleGoodModifiers, goodChance),
      ...getWeightedModifierOdds(eligibleBadModifiers, badChance),
      ...getWeightedModifierOdds(eligibleNeutralModifiers, neutralChance)
    };
    const normalChance = Math.max(
      0,
      1 - Object.values(modifierOdds).reduce((sum, chance) => sum + chance, 0)
    );
    return {
      goodModifierOdds: getWeightedModifierOdds(eligibleGoodModifiers, goodChance),
      badModifierOdds: getWeightedModifierOdds(eligibleBadModifiers, badChance),
      neutralModifierOdds: getWeightedModifierOdds(eligibleNeutralModifiers, neutralChance),
      modifierOdds,
      normalChance
    };
  };

  const formatChancePercent = (chance = 0) => `${(Math.max(0, chance) * 100).toFixed(1)}%`;
  const formatChanceGroup = (odds = {}) => {
    return Object.fromEntries(
      Object.entries(odds).map(([modifier, chance]) => [modifier, formatChancePercent(chance)])
    );
  };

  const logModifierRoll = ({
    selectedModifier = 'normal',
    context = {},
    roll = null,
    goodChance,
    badChance,
    neutralChance,
    eligibleGoodModifiers = [],
    eligibleBadModifiers = [],
    eligibleNeutralModifiers = [],
  }) => {
    if (!devLogging) {
      return;
    }

    const {
      modifierOdds,
      normalChance,
      goodModifierOdds,
      badModifierOdds,
      neutralModifierOdds
    } = getModifierOddsSnapshot({
      goodChance,
      badChance,
      neutralChance,
      eligibleGoodModifiers,
      eligibleBadModifiers,
      eligibleNeutralModifiers
    });

console.log(JSON.stringify({
  goodTiles: formatChanceGroup(goodModifierOdds),
  badTiles: formatChanceGroup(badModifierOdds),
  neutralTiles: formatChanceGroup(neutralModifierOdds),
  normal: formatChancePercent(normalChance)
}, null, 2))

    console.log('[modifier-roll]', {
      actualModifier: selectedModifier,
      actualChance: formatChancePercent(selectedModifier === 'normal'
        ? normalChance
        : (modifierOdds[selectedModifier] || 0)),
      letter: context.letter || null,
      baseScore: context.baseScore ?? null,
      roll: roll == null ? null : Number(roll.toFixed(4)),
      goodChance: formatChancePercent(goodChance),
      badChance: formatChancePercent(badChance),
      neutralChance: formatChancePercent(neutralChance || 0),
    });
  };

  const chooseWeightedCard = (cardKeys = []) => {
    const weightedCards = cardKeys
      .map((cardKey) => ({
        cardKey,
        weight: Math.max(0, getCardDefinition(cardKey)?.rarityWeight ?? 1)
      }))
      .filter((entry) => entry.weight > 0);

    if (!weightedCards.length) {
      return null;
    }

    const totalWeight = weightedCards.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = Math.random() * totalWeight;

    for (const entry of weightedCards) {
      roll -= entry.weight;
      if (roll <= 0) {
        return entry.cardKey;
      }
    }

    return weightedCards[weightedCards.length - 1].cardKey;
  };

  const rollTileModifier = (side, scores = {}, context = {}, chanceOverrides = {}) => {
    const modifierProfile = chanceOverrides.modifierProfile || 'duel';
    if(devLogging)console.log(modifierProfile)
    const profile = getModifierProfile(modifierProfile);
    const baseChances = getModifierChances(side, scores, modifierProfile, chanceOverrides.turnCount || 0);
    const goodChance = Math.max(
      0,
      Math.min(
        0.9,
        chanceOverrides.goodChance ?? (baseChances.goodChance * (chanceOverrides.goodChanceMultiplier ?? 1))
      )
    );
    const badChance = Math.max(
      0,
      Math.min(
        0.9 - goodChance,
        chanceOverrides.badChance ?? (baseChances.badChance * (chanceOverrides.badChanceMultiplier ?? 1))
      )
    );
    const neutralChance = Math.max(
      0,
      Math.min(
        0.9 - goodChance - badChance,
        chanceOverrides.neutralChance ?? (baseChances.neutralChance * (chanceOverrides.neutralChanceMultiplier ?? 1))
      )
    );
    const roll = Math.random();

    const eligibleGoodModifiers = profile.goodModifiers.filter((modifier) => canApplyModifier(modifier, context));
    const eligibleBadModifiers = profile.badModifiers.filter((modifier) => canApplyModifier(modifier, context));
    const eligibleNeutralModifiers = (profile.neutralModifiers || []).filter((modifier) => canApplyModifier(modifier, context));

    if (roll < goodChance) {
      return eligibleGoodModifiers.length ? chooseWeightedModifier(eligibleGoodModifiers) : 'normal';
    }

    if (roll < goodChance + badChance) {
      return eligibleBadModifiers.length ? chooseWeightedModifier(eligibleBadModifiers) : 'normal';
    }

    if (roll < goodChance + badChance + neutralChance) {
      return eligibleNeutralModifiers.length ? chooseWeightedModifier(eligibleNeutralModifiers) : 'normal';
    }

    return 'normal';
  };

  const rollSharedOpeningModifier = (scores = {}, contexts = [], options = {}) => {
    const modifierProfile = options.modifierProfile || 'duel';
    const profile = getModifierProfile(modifierProfile);
    const { goodChance, badChance, neutralChance } = getModifierChances(null, scores, modifierProfile, options.turnCount || 0);
    const roll = Math.random();

    const eligibleGoodModifiers = profile.goodModifiers.filter((modifier) => {
        return contexts.every((context) => canApplyModifier(modifier, context));
      });
    const eligibleBadModifiers = profile.badModifiers.filter((modifier) => {
        return contexts.every((context) => canApplyModifier(modifier, context));
      });
    const eligibleNeutralModifiers = (profile.neutralModifiers || []).filter((modifier) => {
        return contexts.every((context) => canApplyModifier(modifier, context));
      });

    if (roll < goodChance) {
      return eligibleGoodModifiers.length ? chooseWeightedModifier(eligibleGoodModifiers) : 'normal';
    }

    if (roll < goodChance + badChance) {
      return eligibleBadModifiers.length ? chooseWeightedModifier(eligibleBadModifiers) : 'normal';
    }

    if (roll < goodChance + badChance + neutralChance) {
      return eligibleNeutralModifiers.length ? chooseWeightedModifier(eligibleNeutralModifiers) : 'normal';
    }

    return 'normal';
  };

  const getModifierBadge = (tileOrStatus = 'normal') => {
    if (tileOrStatus && typeof tileOrStatus === 'object') {
      if (tileOrStatus.locked) {
        return `LCK${tileOrStatus.lockTurns || 0}`;
      }

      return getModifierDefinition(tileOrStatus.status).badge;
    }

    return getModifierDefinition(tileOrStatus).badge;
  };
  const getModifierUi = (status = 'normal') => getModifierDefinition(status).ui || MODIFIER_DEFINITIONS.normal.ui;
  const getLeadAwareModifierScore = (tile, options = {}) => {
    const leadMap = getModifierDefinition(tile?.status).effects.dynamicScoreByLead;
    if (!leadMap || !options.side || !options.scores) {
      return 0;
    }

    const opponentSide = options.side === 'host' ? 'opponent' : 'host';
    const scoreDelta = (options.scores[options.side] || 0) - (options.scores[opponentSide] || 0);
    if (scoreDelta > 0) {
      return leadMap.ahead || 0;
    }
    if (scoreDelta < 0) {
      return leadMap.behind || 0;
    }
    return leadMap.tied || 0;
  };
  const getPositionAwareModifierScore = (tile, options = {}) => {
    if (options.positionIndex == null) {
      return 0;
    }

    const positionKey = `pos${options.positionIndex + 1}`;
    const positionBonusByIndex = getModifierDefinition(tile?.status).effects.positionBonusByIndex || {};
    return positionBonusByIndex[positionKey] || 0;
  };
  const tileScore = (tile, options = {}) => (
    (
      (tile?.score || 0)
      + (tile?.bonusScore || 0)
      + getLeadAwareModifierScore(tile, options)
      + getPositionAwareModifierScore(tile, options)
    ) * (tile?.multiplier || 1)
  );
  const tickIdleTile = (tile) => {
    const definition = getModifierDefinition(tile?.status);
    const idleBonusScoreDelta = definition.effects.idleBonusScoreDelta || 0;

    if (!idleBonusScoreDelta) {
      return tile;
    }

    return {
      ...tile,
      bonusScore: (tile?.bonusScore || 0) + idleBonusScoreDelta
    };
  };

  const getIdleScorePenalty = (tiles = [], usedTileIds = []) => {
    const usedIds = new Set(usedTileIds);

    return tiles.reduce((total, tile) => {
      if (usedIds.has(tile?.id)) {
        return total;
      }

      const definition = getModifierDefinition(tile?.status);
      return total + (definition.effects.idleScorePenalty || 0);
    }, 0);
  };

  const getLengthBonus = (length) => {
    if (wordBonuses[length]) {
      return wordBonuses[length];
    }

    if (length > 9) {
      return wordBonuses[9] + ((length - 9) * 5);
    }

    return 0;
  };
  const getDifference = (length) =>{
      if (wordBonuses[length]) {
      return wordBonuses[length] - (wordBonuses[length - 1] || 0);
    }
    return 0;
  }

  const getMilestoneReward = (length, options = {}) => {
    const reward = milestoneRewards[length] || milestoneRewards[String(length)] || {};

    return {
      boons: reward.boons || 0,
      attacks: options.includeAttacks === false ? 0 : (reward.attacks || 0)
    };
  };

  const getTilesScore = (tiles, options = {}) => tiles.reduce((total, tile) => total + tileScore(tile, options), 0);

  const getWordScoreDetails = (tiles, options = {}) => {
    const baseLetterTotal = getTilesScore(tiles, options);
    const positionBonus = tiles.reduce((total, tile, index) => {
      const definition = getModifierDefinition(tile?.status);
      const positionKey = `pos${index + 1}`;
      const positionBonusByIndex = definition.effects.positionBonusByIndex || {};
      return total + (positionBonusByIndex[positionKey] || 0);
    }, 0);
    const firstTileBonus = tiles.reduce((total, tile, index) => {
      if (index !== 0) {
        return total;
      }

      return total + tile?.firstTileBonus;
    }, 0);
    const letterTotal = baseLetterTotal + firstTileBonus + positionBonus;
    const lengthBonus = getLengthBonus(tiles.length);
    const wordMultiplier = tiles.reduce((total, tile) => total * (tile?.wordMultiplier || 1), 1);

    return {
      baseLetterTotal,
      positionBonus,
      firstTileBonus,
      letterTotal,
      lengthBonus,
      wordMultiplier,
      total: (letterTotal + lengthBonus) * wordMultiplier
    };
  };

  const getResourceGrants = (tiles = [], options = {}) => {
    const includeAttacks = options.includeAttacks !== false;
    const totals = tiles.reduce((totals, tile) => {
      const definition = getModifierDefinition(tile.status);
      totals.boons += definition.effects.grantBoon || 0;
      totals.attacks += includeAttacks ? (definition.effects.grantAttack || 0) : 0;
      return totals;
    }, { boons: 0, attacks: 0 });

    const milestoneReward = getMilestoneReward(tiles.length, { includeAttacks });
    totals.boons += milestoneReward.boons;
    totals.attacks += milestoneReward.attacks;

    return totals;
  };

  const createCardLogic = ({ createCardId }) => {
      const createCard = (cardKey) => {
      const definition = getCardDefinition(cardKey);

      return {
        id: createCardId(),
        key: cardKey,
        ...definition
      };
    };

    const getCardPool = (kind, options = {}) => {
      if (kind === 'boon') {
        return BOON_CARD_KEYS;
      }

      if (options.deck === 'timed_solo') {
        return TIMED_SOLO_ATTACK_CARD_KEYS;
      }

      return ATTACK_CARD_KEYS;
    };

    const drawCard = (kind, options = {}) => {
      const cardKey = chooseWeightedCard(getCardPool(kind, options));
      return cardKey ? createCard(cardKey) : null;
    };

    const drawCards = (kind, count = 1, options = {}) => {
      return Array.from({ length: count }, () => drawCard(kind, options)).filter(Boolean);
    };

    const createCards = (cardKeys = []) => {
      return cardKeys.map((cardKey) => createCard(cardKey)).filter(Boolean);
    };

    return {
      createCard,
      drawCard,
      drawCards,
      createCards
    };
  };

  const getTilesForWord = (tiles, word) => {
    const normalizedWord = (word || '').toUpperCase();
    const availableTiles = tiles.filter((tile) => !tile.locked);

    const walk = (remainingWord, remainingTiles, selectedTiles) => {
      if (!remainingWord.length) {
        return selectedTiles;
      }

      for (let index = 0; index < remainingTiles.length; index += 1) {
        const tile = remainingTiles[index];
        const token = tile.letter;
        const nextTiles = remainingTiles.filter((_, tileIndex) => tileIndex !== index);

        if (tile.status === 'wild') {
          const wildcardMatch = walk(remainingWord.slice(1), nextTiles, [...selectedTiles, tile]);
          if (wildcardMatch.length) {
            return wildcardMatch;
          }
          continue;
        }

        if (!remainingWord.startsWith(token)) {
          continue;
        }

        const exactMatch = walk(remainingWord.slice(token.length), nextTiles, [...selectedTiles, tile]);
        if (exactMatch.length) {
          return exactMatch;
        }
      }

      return [];
    };

    return walk(normalizedWord, availableTiles, []);
  };

  const getSelectedTiles = (tiles, tileIds) => {
    if (!Array.isArray(tileIds) || !tileIds.length) {
      return [];
    }

    const selectedTiles = [];
    for (const tileId of tileIds) {
      const tile = tiles.find((entry) => entry.id === tileId);
      if (!tile) {
        return null;
      }
      selectedTiles.push(tile);
    }

    return selectedTiles;
  };

  const selectedTilesMatchWord = (selectedTiles = [], word = '') => {
    let remainingWord = (word || '').toUpperCase();

    for (const tile of selectedTiles) {
      if (!remainingWord.length) {
        return false;
      }

      if (tile.status === 'wild') {
        remainingWord = remainingWord.slice(1);
        continue;
      }

      const token = (tile.letter || '').toUpperCase();
      if (!token || !remainingWord.startsWith(token)) {
        return false;
      }

      remainingWord = remainingWord.slice(token.length);
    }

    return remainingWord.length === 0;
  };

  const createTileAnimationState = (tile, trigger = '') => {
    const animationName = tile?.[trigger] || '';
    if (!animationName) {
      return EMPTY_TILE_ANIMATION_STATE;
    }

    return {
      trigger,
      name: animationName,
      key: `${trigger}-${animationName}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    };
  };

  const attachTileAnimationHooks = (tile, status = 'normal', trigger = '') => {
    const definition = getModifierDefinition(status);
    const animations = definition.animations || {};
    const nextTile = {
      ...tile,
      onPull: animations.onPull || '',
      onNewTurn: animations.onNewTurn || '',
      onSubmit: animations.onSubmit || ''
    };

    return {
      ...nextTile,
      animationState: createTileAnimationState(nextTile, trigger)
    };
  };

  const applyModifierToTile = (tile, status = 'normal', options = {}) => {
    const definition = getModifierDefinition(status);
    const baseScore = letterConfig[tile.letter]?.score || tile.baseScore || tile.score || 0;
    const tileLetter = definition.effects.wild ? '*' : (tile.baseLetter || tile.letter);
    const nextScore = definition.effects.setScore != null ? definition.effects.setScore : baseScore;
    const lockTurns = definition.effects.lockTurns || 0;

    return attachTileAnimationHooks({
      ...tile,
      letter: tileLetter,
      baseLetter: tile.baseLetter || tile.letter,
      score: nextScore,
      baseScore,
      bonusScore: definition.effects.bonusScore || 0,
      multiplier: definition.effects.zeroLetterScore ? 0 : 1,
      wordMultiplier: definition.effects.wordMultiplier || 1,
      firstTileBonus: definition.effects.firstTileBonus || 0,
      locked: lockTurns > 0,
      lockTurns,
      status
    }, status, options.trigger || '');
  };

  const replaceTileWithModifier = (tiles, tileId, status) => {
    return tiles.map((tile) => {
      if (tile.id !== tileId) {
        return tile;
      }

      return applyModifierToTile(tile, status);
    });
  };

  const getRequiredTiles = (tiles = []) => {
    return tiles.filter((tile) => tile.status === 'mustuse' && !tile.locked);
  };

  const tickLockedTile = (tile, options = {}) => {
    if (!tile?.locked) {
      return {
        ...tile,
        animationState: createTileAnimationState(tile, options.trigger || '')
      };
    }

    const nextLockTurns = Math.max(0, (tile.lockTurns || 0) - 1);
    const nextStatus = nextLockTurns > 0 ? tile.status : 'normal';

    return applyModifierToTile({
      ...tile,
      lockTurns: nextLockTurns,
      locked: nextLockTurns > 0
    }, nextStatus, {
      trigger: options.trigger || ''
    });
  };

  const isMissingRequiredTile = (rackTiles = [], selectedTiles = []) => {
    const requiredTiles = getRequiredTiles(rackTiles);

    return requiredTiles.some((requiredTile) => {
      return !selectedTiles.some((selectedTile) => selectedTile.id === requiredTile.id);
    });
  };

  const createTileLogic = ({ createTileId }) => {
    const logSubmittedTilePull = (tile, side, scores = {}, options = {}) => {
      if (!devLogging || options.phase !== 'submit') {
        return;
      }

      const modifierProfile = options.modifierProfile || 'duel';
      const profile = getModifierProfile(modifierProfile);
      const { goodChance, badChance, neutralChance } = getModifierChances(side, scores, modifierProfile, options.turnCount || 0);
      const context = {
        letter: tile.baseLetter || tile.letter,
        baseScore: tile.baseScore || letterConfig[tile.baseLetter || tile.letter]?.score || 0,
        rackTiles: options.rackTiles || []
      };
      const eligibleGoodModifiers = profile.goodModifiers.filter((modifier) => canApplyModifier(modifier, context));
      const eligibleBadModifiers = profile.badModifiers.filter((modifier) => canApplyModifier(modifier, context));
      const eligibleNeutralModifiers = (profile.neutralModifiers || []).filter((modifier) => canApplyModifier(modifier, context));

      logModifierRoll({
        side,
        phase: 'submit',
        context,
        goodChance,
        badChance,
        neutralChance,
        eligibleGoodModifiers,
        eligibleBadModifiers,
        eligibleNeutralModifiers,
        selectedModifier: tile.status
      });
    };

    const createTile = (letter = drawLetter(), side = null, scores = {}, forcedStatus = null, chanceOverrides = null) => {
      const baseScore = letterConfig[letter]?.score || 0;
      // in charge of getting the modifier for tiles 
      const status = forcedStatus || rollTileModifier(side, scores, {
        letter,
        baseScore,
        rackTiles: chanceOverrides?.rackTiles || []
      }, chanceOverrides || {});
      const modifierDefinition = getModifierDefinition(status);
      const lockTurns = modifierDefinition.effects.lockTurns || 0;
      const tileLetter = modifierDefinition.effects.wild ? '*' : letter;

      return attachTileAnimationHooks({
        id: createTileId(),
        letter: tileLetter,
        baseLetter: letter,
        score: modifierDefinition.effects.setScore != null ? modifierDefinition.effects.setScore : baseScore,
        baseScore,
        bonusScore: modifierDefinition.effects.bonusScore || 0,
        multiplier: modifierDefinition.effects.zeroLetterScore ? 0 : 1,
        wordMultiplier: modifierDefinition.effects.wordMultiplier || 1,
        firstTileBonus: modifierDefinition.effects.firstTileBonus || 0,
        locked: lockTurns > 0,
        lockTurns,
        status
      }, status, 'onPull');
    };

    const buildFreshRack = (side = null, scores = {}, options = {}) => {
      const rack = [];
      while (rack.length < RACK_SIZE) {
        rack.push(createTile(drawLetter(rack), side, scores, options.forcedStatus || null, {
          ...(options.chanceOverrides || {}),
          rackTiles: rack,
          turnCount: options.turnCount || 0
        }));
      }
      return rack;
    };

    const countModifierGroups = (tiles = []) => {
      return tiles.reduce((totals, tile) => {
        if (GOOD_MODIFIERS.includes(tile.status)) {
          totals.good += 1;
        }

        if (BAD_MODIFIERS.includes(tile.status)) {
          totals.bad += 1;
        }

        if (NEUTRAL_MODIFIERS.includes(tile.status)) {
          totals.neutral += 1;
        }

        return totals;
      }, { good: 0, bad: 0, neutral: 0 });
    };

    const applyTargetModifierGroup = (rack, modifierPool, targetCount) => {
      for (let appliedCount = 0; appliedCount < targetCount; appliedCount += 1) {
        const candidateIndexes = rack
          .map((tile, index) => ({
            index,
            tile,
            eligibleModifiers: modifierPool.filter((modifier) => canApplyModifier(modifier, {
              letter: tile.baseLetter || tile.letter,
              baseScore: tile.baseScore || letterConfig[tile.baseLetter || tile.letter]?.score || 0,
              rackTiles: rack
            }))
          }))
          .filter((entry) => entry.tile.status === 'normal' && entry.eligibleModifiers.length);

        if (!candidateIndexes.length) {
          return rack;
        }

        const targetEntry = candidateIndexes[Math.floor(Math.random() * candidateIndexes.length)];
        const nextStatus = chooseWeightedModifier(targetEntry.eligibleModifiers);
        rack[targetEntry.index] = applyModifierToTile(rack[targetEntry.index], nextStatus);
      }

      return rack;
    };

    const createClearRack = (currentTiles = [], side = null, scores = {}, options = {}) => {
      const modifierProfile = options.modifierProfile || 'duel';
      const profile = getModifierProfile(modifierProfile);
      const currentModifierCounts = countModifierGroups(currentTiles);
      const targetGoodModifiers = currentModifierCounts.good;
      const targetBadModifiers = Math.max(0, currentModifierCounts.bad - 1);
      const targetNeutralModifiers = currentModifierCounts.neutral;
      const rack = buildFreshRack(side, scores, {
        forcedStatus: 'normal',
        chanceOverrides: {
          modifierProfile,
          turnCount: options.turnCount || 0
        }
      });

      applyTargetModifierGroup(rack, profile.goodModifiers, targetGoodModifiers);
      applyTargetModifierGroup(rack, profile.badModifiers, targetBadModifiers);
      applyTargetModifierGroup(rack, profile.neutralModifiers || [], targetNeutralModifiers);
      return rack;
    };

    const createRack = (side = null, scores = {}, options = {}) => {
      if (options.mode === 'clear') {
        return createClearRack(options.currentTiles || [], side, scores, options);
      }

      return buildFreshRack(side, scores, options);
    };

    const createOpeningRackPair = (scores = {}, options = {}) => {
      const hostRack = [];
      const opponentRack = [];

      while (hostRack.length < RACK_SIZE) {
        const hostLetter = drawLetter(hostRack);
        const opponentLetter = drawLetter(opponentRack);
        const sharedStatus = rollSharedOpeningModifier(scores, [
          { letter: hostLetter, baseScore: letterConfig[hostLetter]?.score || 0, rackTiles: hostRack },
          { letter: opponentLetter, baseScore: letterConfig[opponentLetter]?.score || 0, rackTiles: opponentRack }
        ], {
          ...options,
          turnCount: options.turnCount || 0
        });

        hostRack.push(createTile(hostLetter, 'host', scores, sharedStatus));
        opponentRack.push(createTile(opponentLetter, 'opponent', scores, sharedStatus));
      }

      return {
        host: hostRack,
        opponent: opponentRack
      };
    };

    const refillTiles = (tiles, usedTileIds, side = null, scores = {}, options = {}) => {
      const usedIds = new Set(usedTileIds);
      // remove existing ghost tiles 
      const ghostIds = new Set(
        tiles
          .filter((tile) => tile.status === 'ghostTile' && !usedIds.has(tile.id))
          .map((tile) => tile.id)
      );
      const replacedIds = new Set([...usedIds, ...ghostIds]);
      const nextTiles = tiles.map((tile) => {
        if (replacedIds.has(tile.id)) {
          return tile;
        }

        // Surviving tiles can fire their modifier-specific new turn animation hooks here.
        return tickLockedTile(tickIdleTile(tile), { trigger: 'onNewTurn' });
      });

      nextTiles.forEach((tile, index) => {
        if (!replacedIds.has(tile.id)) {
          return;
        }

        const remainingTiles = nextTiles.filter((entry, entryIndex) => {
          return entryIndex !== index && !replacedIds.has(entry.id);
        });

        nextTiles[index] = createTile(drawLetter(remainingTiles), side, scores, null, {
          rackTiles: remainingTiles,
          modifierProfile: options.modifierProfile || 'duel',
          turnCount: options.turnCount || 0
        });
        logSubmittedTilePull(nextTiles[index], side, scores, {
          ...options,
          rackTiles: remainingTiles
        });
      });
      if(devLogging) console.log(nextTiles) // logs something callled status so modifier is determined by this point 

      return nextTiles;
    };

    const replaceSingleTile = (tiles, replacedTileId, side = null, scores = {}, options = {}) => {
      const targetIndex = tiles.findIndex((tile) => tile.id === replacedTileId);
      if (targetIndex === -1) {
        return tiles;
      }

      const nextTiles = [...tiles];
      const remainingTiles = nextTiles.filter((entry, entryIndex) => entryIndex !== targetIndex);
      nextTiles[targetIndex] = createTile(drawLetter(remainingTiles), side, scores, null, {
        rackTiles: remainingTiles,
        modifierProfile: options.modifierProfile || 'duel',
        turnCount: options.turnCount || 0
      });

      return nextTiles;
    };

    const rerollRackExceptTile = (tiles, keptTileId, side = null, scores = {}, options = {}) => {
      const keptTile = tiles.find((tile) => tile.id === keptTileId);
      if (!keptTile) {
        return tiles;
      }

      const nextTiles = tiles.map((tile) => {
        if (tile.id === keptTileId) {
          return tile;
        }

        return null;
      });

      nextTiles.forEach((tile, index) => {
        if (tile) {
          return;
        }

        const remainingTiles = nextTiles.filter((entry, entryIndex) => entryIndex !== index && entry);
        nextTiles[index] = createTile(drawLetter(remainingTiles), side, scores, null, {
          rackTiles: remainingTiles,
          modifierProfile: options.modifierProfile || 'duel',
          turnCount: options.turnCount || 0
        });
      });

      return nextTiles;
    };

    const createTestingRack = (side = null, scores = {}, options = {}) => {
      const profile = getModifierProfile(options.modifierProfile || 'duel');
      const allowedStatuses = options.includeAllModifiers
        ? new Set([
            ...profile.goodModifiers,
            ...profile.badModifiers,
            ...(profile.neutralModifiers || [])
          ])
        : new Set([
            ...profile.goodModifiers,
            ...profile.badModifiers,
            ...(profile.neutralModifiers || [])
          ]);
      const modifierStatuses = Object.keys(MODIFIER_DEFINITIONS).filter((status) => status !== 'normal' && allowedStatuses.has(status));
      const rack = [];

      while (rack.length < RACK_SIZE) {
        const forcedStatus = modifierStatuses[rack.length] || 'normal';
        rack.push(createTile(drawLetter(rack), side, scores, forcedStatus, {
          modifierProfile: 'duel',
          rackTiles: rack
        }));
      }

      return rack;
    };

    const createTestingOpeningRackPair = (scores = {}, options = {}) => {
      return {
        host: createTestingRack('host', scores, options),
        opponent: createTestingRack('opponent', scores, options)
      };
    };

    return {
      createTile,
      createRack,
      createClearRack,
      createOpeningRackPair,
      refillTiles,
      replaceSingleTile,
      rerollRackExceptTile,
      createTestingRack,
      createTestingOpeningRackPair
    };
  };

  return {
    LETTER_CONFIG: letterConfig,
    LETTER_KEYS,
    MIN_WORD_LENGTH,
    RACK_SIZE,
    CARD_DEFINITIONS,
    tileScore,
    getLengthBonus,
    getDifference,
    getMilestoneReward,
    getTilesScore,
    getWordScoreDetails,
    getIdleScorePenalty,
    getResourceGrants,
    getTilesForWord,
    getSelectedTiles,
    selectedTilesMatchWord,
    getRequiredTiles,
    isMissingRequiredTile,
    getCardDefinition,
    applyModifierToTile,
    replaceTileWithModifier,
    getModifierBadge,
    getModifierUi,
    getModifierDefinition,
    MODIFIER_DEFINITIONS,
    createCardLogic,
    createTileLogic
  };
};

const sharedTileLogicApi = {
  createSharedTileLogic
};

if (typeof globalThis !== 'undefined') {
  globalThis.__sharedTileLogic = sharedTileLogicApi;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = sharedTileLogicApi;
}
