const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');

app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('enable-direct-write');
app.commandLine.appendSwitch('enable-features', 'OverlayScrollbar');
app.commandLine.appendSwitch('in-process-gpu');

let Steamworks;
let steam;

try {
  Steamworks = require('steamworks.js');
  steam = Steamworks.init(3838530);
  console.log('✅ Steamworks initialized');
} catch (err) {
  console.warn('⚠️ Steamworks not initialized:', err.message);
  Steamworks = null;
}

// ✅ Get Steam user ID
let steamId;
if(steam){
  steamId = steam.localplayer.getSteamId();
  console.log('[Steam] Logged in as:', steam.localplayer.getSteamId());
  console.log('Steam ID:', steamId.steamId64.toString());
}

ipcMain.handle('unlock-achievement', (event, id) => {
  if (!steam) {
    console.log('[Steam] Skipping achievement unlock — Steam not initialized');
    return false;
  }
  const achievementMap = {
    1: 'TUTORIAL_COMPLETE',
    2: 'UNLOCK_FREE_PLAY',
    3: 'UNLOCK_DRAFT_DUEL',
    4: 'UNLOCK_DAILY_CHALLENGE',
    5: 'UNLOCK_75_CHARS',
    6: 'COMPLETE_20_MASTERY',
    7: 'UNLOCK_75_MASTERY',
    8: 'GAIN_25_FAME',
    9: 'GAIN_25_GOLD',
    10: 'EMERALDS_FALSE_GOD',
    11: 'SAVIOR_BUST',
    14: 'SUMMON_MUMMY',
    16: 'FIRST_BUST',
    17: 'DRAW',
    18: '10_FAME_WOLF',
    20: 'PULL_BASE_HAND',
    21: '50_GOLD_END_TURN',
    23: '25_SUPPLIES',
    24: 'FEAR_CAP_50',
    25: 'GAIN_8_EMERALDS',
    26: '8_KOBOLDS_HAND',
    27: 'NECROKING_10_FAME',
    28: 'COMPLETE_20_REGULAR',
    29: 'WHERED_EVERYBODY_GO',
  };

  const apiName = achievementMap[id];

  if (!apiName) {
    console.log(`[Steam] Unknown achievement ID: ${id}`);
    return false;
  }

  if (!steam.achievement.isActivated(apiName)) {
    steam.achievement.activate(apiName);
    steam.stats.store(); // Save changes to Steam
    console.log(`[Steam] Unlocked achievement: ${apiName}`);
    return true;
  } else {
    console.log(`[Steam] Achievement already unlocked: ${apiName}`);
    return false;
  }
});

ipcMain.on('quit-app', () => {
  app.quit();
  console.log('QUIT ELECTRON')
});



const createWindow = () => {
  const win = new BrowserWindow({
    fullscreen: true,
    icon: path.join(__dirname, '../public/pwa-512x512.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      partition: 'persist:TITLEHERE', // ✅ This ensures persistent storage
      webSecurity: false,
    },
  });

  // important: i cannot recall why i swapped to index, likely a fully offline build and steam may not run with localhost
  // language support only works on localhost build not from index... will need to properly test both offline for steam release. 

  win.loadURL('http://localhost:5173');
  // win.loadFile(path.join(__dirname, '../dist/index.html'));
};

// command option i to open the inspect tab 
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});