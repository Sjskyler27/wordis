const createModifierDefinitions = ({ bloodTilePositionValues }) => ({
    normal: {
      badge: '',
      description: 'Normal tile. Scores its face value with no extra effect.',
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
      description: 'Doubles this tile as a word multiplier when used.',
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
      description: 'Grants 1 boon card when this tile is used.',
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
      description: 'Grants 1 attack card when this tile is used.',
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
      description: 'Acts as any letter, but its tile score becomes -1.',
      effects: {
         wild: true,
         setScore: -1,
         botPerformanceDelta: 0.28
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
      description: 'Adds +10 if this tile is played in the first position.',
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
      description: 'Scores by position instead of face value. Later positions score higher.',
      effects: {
        setScore: 0,
        positionBonusByIndex: bloodTilePositionValues
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
      description: 'Scores 0 when used, but gains +1 bonus score each turn it stays unused.',
      effects: { setScore: 0, idleBonusScoreDelta: 1 },
      rarityWeight: 0.18,
      animations: {
        onNewTurn: 'emerald'
      },
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
      description: 'Changes value by the score gap: stronger when behind, weaker when ahead.',
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
      description: 'This tile always scores 0.',
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
      description: 'You must include this tile in your submitted word.',
      effects: { required: true, botPerformanceDelta: -0.9 },
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
      description: 'Locked tile. It cannot be used until the lock wears off.',
      effects: { lockTurns: 1 },
      rarityWeight: 0.6,
      animations: {
        onNewTurn: 'unlock-dissolve'
      },
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
      description: 'Worth +3, but disappears if you leave it unused.',
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
      description: 'Scores as 1 if used. If left unused, it burns you for -3.',
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
  });

const modifierDefinitionsApi = {
  createModifierDefinitions
};

if (typeof globalThis !== 'undefined') {
  globalThis.__wordisModifierDefinitions = modifierDefinitionsApi;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = modifierDefinitionsApi;
}
