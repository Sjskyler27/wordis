export const MULTI_ROUND_BACKGROUND_PALETTES = {
  main: {
    corner: ['#e9b248', '#ff7b5c'],
    top: ['#c79129', '#d25b3f'],
    mid: ['#ff8658', '#a53149'],
    bottom: ['#76347c', '#24061f'],
    glowAlpha: [0.26, 0.16],
    shapeFarOpacity: [0.18, 0.28],
    shapeNearOpacity: [0.14, 0.24],
    saturate: [1.03, 1.19]
  },
  bot: {
    corner: ['#435b68', '#6a7f88'],
    top: ['#283c4e', '#334b5d'],
    mid: ['#1c2c3d', '#24384a'],
    bottom: ['#101720', '#091018'],
    glowAlpha: [0.16, 0.22],
    shapeFarOpacity: [0.1, 0.18],
    shapeNearOpacity: [0.08, 0.16],
    saturate: [0.86, 0.94]
  },
  challenge: {
    corner: ['#4df1d5', '#6a7f88'],
    top: ['#10bfa4', '#4071d5'],
    mid: ['#14778f', '#00708f'],
    bottom: ['#25174d', '#12071f'],
    glowAlpha: [0.24, 0.17],
    shapeFarOpacity: [0.16, 0.28],
    shapeNearOpacity: [0.12, 0.24],
    saturate: [1.04, 1.22]
  },
  final: {
    corner: ['#fff1b8', '#ff8e63'],
    top: ['#ffca58', '#ea5b4a'],
    mid: ['#ff4f72', '#7a2c92'],
    bottom: ['#2b0d25', '#080309'],
    glowAlpha: [0.28, 0.18],
    shapeFarOpacity: [0.2, 0.32],
    shapeNearOpacity: [0.16, 0.28],
    saturate: [1.08, 1.28]
  },
  extras: [
    {
      corner: ['#ffe1c6', '#ff9b8c'],
      top: ['#ffaf6f', '#d96a5f'],
      mid: ['#ff7a7a', '#a63f67'],
      bottom: ['#3c1739', '#140713'],
      glowAlpha: [0.25, 0.16],
      shapeFarOpacity: [0.17, 0.27],
      shapeNearOpacity: [0.13, 0.23],
      saturate: [1.02, 1.16]
    },
    {
      corner: ['#dbffd4', '#8bf0c3'],
      top: ['#8fe97b', '#31c39d'],
      mid: ['#35a889', '#2c7193'],
      bottom: ['#163445', '#08111e'],
      glowAlpha: [0.2, 0.13],
      shapeFarOpacity: [0.15, 0.24],
      shapeNearOpacity: [0.11, 0.2],
      saturate: [0.98, 1.12]
    },
    {
      corner: ['#d7f1ff', '#b9c7ff'],
      top: ['#83c6ff', '#7f8cff'],
      mid: ['#4c8dff', '#5b53d0'],
      bottom: ['#1d2858', '#0a0d1c'],
      glowAlpha: [0.2, 0.14],
      shapeFarOpacity: [0.15, 0.24],
      shapeNearOpacity: [0.11, 0.2],
      saturate: [0.98, 1.1]
    },
    {
      corner: ['#ffe8bf', '#ffc788'],
      top: ['#ffc261', '#ff8d68'],
      mid: ['#ff8f5a', '#da4f4f'],
      bottom: ['#51213d', '#170711'],
      glowAlpha: [0.24, 0.16],
      shapeFarOpacity: [0.17, 0.27],
      shapeNearOpacity: [0.13, 0.23],
      saturate: [1.03, 1.17]
    },
    {
      corner: ['#f6dbff', '#d0a2ff'],
      top: ['#d88cff', '#9c6dff'],
      mid: ['#934ff5', '#613acb'],
      bottom: ['#281348', '#090512'],
      glowAlpha: [0.21, 0.14],
      shapeFarOpacity: [0.16, 0.25],
      shapeNearOpacity: [0.12, 0.21],
      saturate: [1.01, 1.14]
    },
    {
      corner: ['#d6fff1', '#87f5e3'],
      top: ['#72f1d2', '#2cc4bf'],
      mid: ['#1ca0af', '#2a5f96'],
      bottom: ['#15304c', '#070d17'],
      glowAlpha: [0.2, 0.13],
      shapeFarOpacity: [0.15, 0.24],
      shapeNearOpacity: [0.11, 0.2],
      saturate: [0.99, 1.12]
    },
    {
      corner: ['#fff0d8', '#ffc2d9'],
      top: ['#ffd17b', '#ff8db1'],
      mid: ['#ff8a82', '#b24c8f'],
      bottom: ['#431d46', '#110711'],
      glowAlpha: [0.24, 0.16],
      shapeFarOpacity: [0.17, 0.27],
      shapeNearOpacity: [0.13, 0.23],
      saturate: [1.03, 1.16]
    }
  ]
};

export const MULTI_ROUND_EXTRA_BACKGROUND_PALETTE_COUNT = MULTI_ROUND_BACKGROUND_PALETTES.extras.length;

export const getMultiRoundBackgroundPalette = (paletteKey = 'main') => {
  if (typeof paletteKey === 'string' && paletteKey.startsWith('extra-')) {
    const extraIndex = Number.parseInt(paletteKey.slice(6), 10);
    return MULTI_ROUND_BACKGROUND_PALETTES.extras[extraIndex] || MULTI_ROUND_BACKGROUND_PALETTES.main;
  }

  return MULTI_ROUND_BACKGROUND_PALETTES[paletteKey] || MULTI_ROUND_BACKGROUND_PALETTES.main;
};
