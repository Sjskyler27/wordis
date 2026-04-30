<template>
  <div id="game-root" :class="[{'google-translate-iframe-hide': hideGoogleTranslate === true}]">        
      <component
      :key="currentStateKey" 
      :showSettings="showSettings" 
      @showSettings="showSettings = true" 
      @controllerExecuted="buttonPressed=null"
      :defaultHints="defaultHints"
      :settingsShowing="showSettings"
      :volume="volume" 
      :musicVolume="musicVolume" 
      :effectsVolume="effectsVolume" 
      :buttonPressed="null" 
      :names="names"
      :isControllerConnected="isControllerConnected" 
      :isMobile="isMobile" 
      :monsterRoster="monsterRoster" 
      :is="currentState" 
      :sharedUid="sharedUid"
      :sharedGameId="sharedGameId"
      :deviceId="deviceId"
      :gameZoom="gameZoom"
      :shopZoom="shopZoom"
      :isMultiplayer="isMultiplayer"
      :playMode="playMode"
      :continueSave="continueSave"
      :overtimeEnabled="overtimeEnabled"
      v-model:botDifficulty="botDifficulty"
      :multiRoundDifficulty="multiRoundDifficulty"
      :uiZoom="zoom"
      :isStreamer="validSeed"
      :hasSeenIntro="hasSeenIntro"
      @continue="continueGame" 
      @end="goToShop" 
      @game="goToGame" 
      @multiplayerScreen="goTomultiplayerScreen"
      @multiRoundScreen="goToMultiRoundScreen"
      @singleplayer="goToSingleplayer" 
      @type="goToType"
      @reset="resetGame"
      @logIn="showAuthModal = true"
      @logOut="handleLogout"
      @resetHints="resetHints"
      @nameChange="setNames"
      @home="goToHome"
      @playAgain="playAgain"
      @volumeChange="setVolume"
      @musicVolumeChange="setmusicVolume"
      @effectsVolumeChange="seteffectsVolume"
       />
      
      <banner v-if="message">{{message}}</banner>
      <Settings v-if="showSettings" 
      :volume="volume" 
      :musicVolume="musicVolume" 
      :effectsVolume="effectsVolume" 
      :zoom="zoom"
      :gameZoom="gameZoom"
      :nativeControllerSupport="nativeControllerSupport"
      :canShowHowToPlay="isGameState"
      :names="names"
      @volumeChange="setVolume"
      @musicVolumeChange="setmusicVolume"
      @effectsVolumeChange="seteffectsVolume"
      @zoomChange="setZoom"
      @gameZoomChange="setgameZoom"
      @shopZoomChange="setshopZoom"
      @nativeControllerChange="setNativeControllerSupport"
      @nameChange="setNames"
      @reset="resetGame" 
      @home="goToHome"
      @game="goToGame"
      @type="goToType"
      @feedback="showFeedback = true"
      @showTutorial="showHowToPlay"
      @close="showSettings = false"></Settings>
      <AuthPrompt v-if="showAuthModal" @close="showAuthModal = false" @loggedIn="userLoggedIn" />
      <AssetLoader :monsterRoster="monsterRoster"/>
    </div>
    <StreamerCode v-if="showStreamerModal" @close="showStreamerModal = false" :passedCode="streamerCode" />
    <Feedback v-if="showFeedback" @close="showFeedback = false"/>
  <!-- <GoogleTranslate :hideGoogleTranslate="hideGoogleTranslate" :isMobile="isMobile"/> -->
  </template>
  
<script setup>
import { ref, shallowRef, onMounted, onBeforeUnmount, computed, nextTick } from "vue";
import Game from "/src/states/game/Game.vue";
import MultiplayerScreen from "./states/game/MultiplayerScreen.vue";
import MultiRoundScreen from "./states/game/MultiRoundScreen.vue";
import { resetGame as resetMultiplayerGame } from "./states/game/multiplayer.js";
import { playMode, botDifficulty, multiRoundDifficulty, overtimeEnabled, updatePlayConfig, PLAY_MODES } from "./states/game/play-config.js";
import { SAVE_MODES, loadLocalGame } from "./states/game/save-state.js";
import TypeScreen from "./states/home/TypeScreen.vue";
import StartScreen from "./states/home/StartScreen.vue";
import Admin from "./admin/Admin.vue";
import GoogleTranslate from "/src/assets/GoogleTranslate.vue"
import { hideGoogleTranslateIframesAfterDelay,hideGoogleTranslateExtras } from "./assets/RemoveGoggleIFrame";
import Feedback from "./states/home/Feedback.vue";
import Banner from "/src/assets/Banner.vue";
import Settings from '/src/assets/Settings.vue'
import { initUserSync, logoutCleanup, syncUserState } from "./userstate/syncUserState.js";
import { signOut } from "firebase/auth";
import AuthPrompt from "/src/assets/AuthPrompt.vue";
import { auth as firebaseAuth, firebaseEnabled } from "./firebaseClient.js";
import pkg from '../package.json';
const hasSeenIntro = ref(false);

const demoDate = new Date('2025-10-01T00:00:00Z')
const isDemo = false

const params = new URLSearchParams(window.location.search);
const sharedUid = params.get('uid');
const sharedGameId = params.get('game');
const isShared = sharedUid && sharedUid.length > 20;
const reloader = ref(0)
const streamerCode = params.get('streamerCode');
const showStreamerModal = ref(false);
const loadingAuth = ref(true);
const showAuthModal = ref(false);
const AUTH_PROMPT_SEEN_KEY = "userAgreed";
let stopUserSync = null;

if (streamerCode) {
  showStreamerModal.value = true;
  showAuthModal.value = true;
}

const lastInitSync = localStorage.getItem('lastInitSync');

const createStableId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const cacheSeed = ref(localStorage.getItem("cacheSeed") || null);
const validSeed = ref(false);
const showFeedback = ref(false)




  const handleLogout = async () => {
    console.log('logging out ')
    if (!firebaseEnabled || !firebaseAuth) {
      console.warn('Firebase auth is unavailable; skipping logout.');
      return;
    }
    await logoutCleanup();
    await signOut(firebaseAuth);
    setTimeout(() => {
      reloader.value++;
    }, 200);
  };


  if(!sharedGameId){
    // check last sync time if its been an 10 min then sync again
    if(!lastInitSync || (new Date() - new Date(lastInitSync)) > 600000){
      console.log('time to sync')
      console.log('set', new Date());
      localStorage.setItem('lastInitSync', new Date());
      // initUserSync(() => {
      //   showAuthModal.value = true;
      // });
      
    }
  }
  function waitForUserAuth() {
    return new Promise((resolve) => {
      if (!firebaseEnabled || !firebaseAuth) {
        resolve(null);
        return;
      }

      if (firebaseAuth.currentUser) return resolve(firebaseAuth.currentUser);
      const unsub = firebaseAuth.onAuthStateChanged(user => {
        if (user) {
          unsub();
          resolve(user);
        }
      });
    });
  }
  const checkCacheSeed = async () => {
    return
    if (cacheSeed.value) {
      validSeed.value = await doesUserHaveCacheSeed(cacheSeed.value);
      if (validSeed.value === true) {
        console.log("✅ Key is valid and belongs to this user");
      } else {
        return
        console.warn("❌ Key not found or not valid for current user");
      }
    }
  };

  const checkCacheSeedOnMount = async () => {
    return
    if (cacheSeed.value) {
      console.log('waiting for user auth')
      await waitForUserAuth();
      await checkCacheSeed();
    }
  };


  const isMobile = computed(() => /Mobi|Android/i.test(navigator.userAgent))
  

  const defaultHints = ref([]);
  const resetHints = (setLocalStorage) => {
    defaultHints.value = [
      { hint: "The Alert will notify you when you are in danger!", hasSeen: false },
      { hint: "Press x or tap a character image to view its actions", hasSeen: false },
      { hint: "Right Click the Deck to see your Chances of Breaking!", hasSeen: false },
      { hint: "Using all of your supplies gives bonus fame!", hasSeen: false },
      { hint: "You can buy armor and supplies more than once!", hasSeen: false },
      { hint: "Balance your supplies and armor", hasSeen: false },
      { hint: "A massive Character could overflow your game", hasSeen: false },
      { hint: "Be sure to select a character if it has an active action", hasSeen: false },
      { hint: "Use the Deck to Draw a Character!", hasSeen: false },
      { hint: "Use the Deck to view your cards and their fear.", hasSeen: false },
      { hint: "Right Click on a character to view its action and other information.", hasSeen: false },
    ]
    if(setLocalStorage) localStorage.setItem('defaultHints', JSON.stringify(defaultHints.value));
    localStorage.removeItem('seenHowShop')
    localStorage.removeItem('seenHowToPlay')
  }
  resetHints(false);


  // const gameEnded = localStorage.getItem('gameEnded')
  const isAdminAndLocalHost = (localStorage.getItem('isA') === import.meta.env.VITE_AD_C && location.hostname === 'localhost')
  const currentState = sharedGameId? shallowRef(SharedGame) : isAdminAndLocalHost? shallowRef(Admin) : shallowRef(StartScreen);
  const seed = ref(localStorage.getItem("seed"));
  const gameEnded = ref(localStorage.getItem("gameEnded"));
  const isMultiplayer = ref(false);
  const continueSave = ref(null);
  const currentStateKey = computed(() => {
    const stateName = currentState.value?.__name || currentState.value?.name || 'state';
    const modeName = isMultiplayer.value ? 'multiplayer' : 'singleplayer';
    const playVariant = isMultiplayer.value ? 'live' : `${playMode.value}-${multiRoundDifficulty.value}`;
    return `${stateName}-${modeName}-${playVariant}-${reloader.value}`;
  });
  const message = ref("");
  const hideGoogleTranslate = ref(false)
  let deviceId = localStorage.getItem("deviceId");
  if (!deviceId) {
    deviceId = createStableId();
    localStorage.setItem("deviceId", deviceId);
  }
  const buttonPressed = ref(null)
  const volume = ref(Number(localStorage.getItem('volume') ?? 5))
  const musicVolume = ref(Number(localStorage.getItem('musicVolume') ?? 5))
  const effectsVolume = ref(Number(localStorage.getItem('effectsVolume') ?? 5))
  const nativeControllerSupport = ref(JSON.parse(localStorage.getItem('nativeControllerSupport')))
  const now = new Date();
  const lockContent = computed(() => (new Date() > demoDate || isDemo) && !validSeed);
  const versionNumber = ref(pkg.version)
  let names = localStorage.getItem('names') || '{"player1":"Player 1","player2":"Player 2","player3":"Player 3","player4":"Player 4"}'

  const showSettings = ref(false)
  const isGameState = computed(() => currentState.value === Game);

  function setVolume(val) {
    volume.value = val
    localStorage.setItem('volume', val)
  }
  function setmusicVolume(val) {
    musicVolume.value = val
    localStorage.setItem('musicVolume', val)
  }
  function seteffectsVolume(val) {
    effectsVolume.value = val
    localStorage.setItem('effectsVolume', val)
  }


  const getAutoUiZoom = () => {
    const width = window.innerWidth || window.screen?.width || 1920;
    const stops = [
      { width: 860, zoom: 0.5 },
      { width: 1280, zoom: 0.65 },
      { width: 1700, zoom: 0.8 },
      { width: 1920, zoom: 0.96 }
    ];

    if (width <= stops[0].width) return stops[0].zoom;
    if (width >= stops[stops.length - 1].width) return stops[stops.length - 1].zoom;

    const upperIndex = stops.findIndex((stop) => width <= stop.width);
    const lower = stops[upperIndex - 1];
    const upper = stops[upperIndex];
    const progress = (width - lower.width) / (upper.width - lower.width);
    const tempZoom = Number((lower.zoom + ((upper.zoom - lower.zoom) * progress)).toFixed(2));
    localStorage.setItem('zoom', tempZoom)
    return tempZoom;
  };
  const zoom = ref(parseFloat(localStorage.getItem('zoom') ?? getAutoUiZoom()))
  const gameZoom = ref(parseFloat(localStorage.getItem('gameZoom') ?? 1))
  const shopZoom = ref(parseFloat(localStorage.getItem('shopZoom') ?? 1))
  
  function setZoom(val) {
    if(val){
      zoom.value = val
      localStorage.setItem('zoom', val)
    }

    let root = document.getElementById('game-root') || document.documentElement
    root.style.zoom = val
  }


  function setgameZoom(val) {
    if(val){
      gameZoom.value = val
      localStorage.setItem('gameZoom', val)
    }
  }


  function setNativeControllerSupport(val) {
    nativeControllerSupport.value = val
    localStorage.setItem('nativeControllerSupport', val)
  }
  function setNames(val) {
    console.log(val)
    names = val
    localStorage.setItem('names', val)
  }

  const displayMessage = (msg) => {
    message.value = msg;
      setTimeout(() => {
        message.value = false;
      }, 2000);
      return;
    
  };

  const showFirstRunAuthPrompt = () => {
    if (!firebaseEnabled || streamerCode || localStorage.getItem(AUTH_PROMPT_SEEN_KEY)) {
      return;
    }

    showAuthModal.value = true;
  };

  const userLoggedIn = async () => {
    showAuthModal.value = false
    await syncUserState({ force: true });
    setTimeout(() => {
      reloader.value++
    }, 200);
  }


const continueGame = (mode) => {  
    hideGoogleTranslate.value = true
    hideGoogleTranslateIframesAfterDelay();
    if (mode === SAVE_MODES.MULTI_ROUND || mode === SAVE_MODES.BOT_MATCH) {
      const save = loadLocalGame(mode);
      if (!save) {
        displayMessage('No save found.');
        return;
      }

      continueSave.value = save;
      isMultiplayer.value = false;
      updatePlayConfig({
        mode: mode === SAVE_MODES.MULTI_ROUND ? PLAY_MODES.MULTI_ROUND : PLAY_MODES.BOT_MATCH,
        difficulty: mode === SAVE_MODES.BOT_MATCH ? (save.d || botDifficulty.value) : botDifficulty.value,
        multiRound: mode === SAVE_MODES.MULTI_ROUND ? (save.d || multiRoundDifficulty.value) : multiRoundDifficulty.value
      });
      resetMultiplayerGame();
      currentState.value = Game;
      reloader.value += 1;
      return;
    }

    if(localStorage.getItem('inShop') === 'true'){
      currentState.value = Shop;
    }
    else{
      currentState.value = Game;
  }
  }
  
  const goToShop = () => {
    hideGoogleTranslateIframesAfterDelay();
    hideGoogleTranslateExtras()
    hideGoogleTranslate.value = true
    console.log('set hide',hideGoogleTranslate.value)

    currentState.value = Shop;
  };
  const goToHome = () => {
    hideGoogleTranslateIframesAfterDelay();
    hideGoogleTranslate.value = false
    console.log('takeing you home')
    showSettings.value=false
    continueSave.value = null;
    currentState.value = StartScreen;
  };

  const goToGame = () => {
    hideGoogleTranslateExtras()
    hideGoogleTranslateIframesAfterDelay();
    hideGoogleTranslate.value = true
    console.log('set hide',hideGoogleTranslate.value)
    if (isMultiplayer.value) {
      updatePlayConfig({ mode: PLAY_MODES.MULTIPLAYER });
    }
    continueSave.value = null;
    currentState.value = Game;
  };
  const goToType = () => {
    hideGoogleTranslateExtras()
    hideGoogleTranslateIframesAfterDelay();
    hideGoogleTranslate.value = true
    console.log('set hide',hideGoogleTranslate.value)
    continueSave.value = null;
    currentState.value = TypeScreen;
  };
  const goToAdmin = () => {
    currentState.value = Admin;
  };
  const goTomultiplayerScreen = () => {
    updatePlayConfig({ mode: PLAY_MODES.MULTIPLAYER });
    currentState.value = MultiplayerScreen;
    isMultiplayer.value = true;
  };

  const goToMultiRoundScreen = () => {
    hideGoogleTranslateExtras()
    hideGoogleTranslateIframesAfterDelay();
    hideGoogleTranslate.value = true
    continueSave.value = null;
    currentState.value = MultiRoundScreen;
    isMultiplayer.value = false;
  };

  const goToSingleplayer = (options = {}) => {
    hideGoogleTranslateExtras()
    hideGoogleTranslateIframesAfterDelay();
    hideGoogleTranslate.value = true
    isMultiplayer.value = false;
    continueSave.value = null;
    updatePlayConfig({
      mode: options.mode || PLAY_MODES.TIMED_SOLO,
      difficulty: options.difficulty || botDifficulty.value,
      multiRound: options.multiRoundDifficulty || multiRoundDifficulty.value
    });
    resetMultiplayerGame();
    currentState.value = Game;
  };

  const playAgain = () => {
    hideGoogleTranslateExtras();
    hideGoogleTranslateIframesAfterDelay();
    hideGoogleTranslate.value = true;
    showSettings.value = false;
    continueSave.value = null;
    resetMultiplayerGame();
    reloader.value += 1;
    currentState.value = Game;
  };

  const showHowToPlay = () => {
    showSettings.value = false;
    nextTick(() => {
      window.dispatchEvent(new CustomEvent('wordis:show-tutorial'));
    });
  };
  


  // controller checking logic
  const isControllerConnected = ref(false);

  const checkGamepadConnection = () => {
    console.log('checking for controller')
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    isControllerConnected.value = gamepads.some(gp => gp);
    console.log('gamepads'+ isControllerConnected.value)
  };

  const onGamepadConnected = (event) => {
    console.log("Gamepad connected:", event.gamepad);
    isControllerConnected.value = true;
  };

  const onGamepadDisconnected = () => {
    checkGamepadConnection(); // Update state if no controllers remain
  };



const buttonMap = {
  0: ' ',          // A / Cross
  1: 'b',          // B / Circle
  2: 'x',          // X / Square
  3: 'y',          // Y / Triangle
  4: 'lb',         // Left Bumper (L1)
  5: 'rb',         // Right Bumper (R1)
  6: 'lt',         // Left Trigger (L2) (analog)
  7: 'rt',         // Right Trigger (R2) (analog)
  8: 'select',     // Back / Select / Share
  9: 'Escape',     // Start / Options
  10: 'ls',        // Left Stick Click (L3)
  11: 'rs',        // Right Stick Click (R3)
  12: 'ArrowUp',   // D-pad Up
  13: 'ArrowDown', // D-pad Down
  14: 'ArrowLeft', // D-pad Left
  15: 'ArrowRight',// D-pad Right
  16: 'home'       // Guide / PS button / Xbox button (not always available)

};

  const prevButtonStates = [];
  const buttonCooldowns = [];
  const prevAxisDirections = [];
  const axisCooldowns = [];
  const COOLDOWN_FRAMES = 1; // Tune as needed
  const AXIS_DEADZONE = 0.55;
  const AXIS_REPEAT_FRAMES = 26;
  let gamepadAnimationFrameId = 0;

  const getJoystickDirection = (gamepad) => {
    const horizontal = gamepad.axes?.[0] || 0;
    const vertical = gamepad.axes?.[1] || 0;

    if (Math.abs(horizontal) < AXIS_DEADZONE && Math.abs(vertical) < AXIS_DEADZONE) {
      return '';
    }

    if (Math.abs(horizontal) > Math.abs(vertical)) {
      return horizontal > 0 ? 'ArrowRight' : 'ArrowLeft';
    }

    return vertical > 0 ? 'ArrowDown' : 'ArrowUp';
  };

  const handleJoystickDirection = (gamepad, gamepadIndex) => {
    const direction = getJoystickDirection(gamepad);
    if (!axisCooldowns[gamepadIndex]) {
      axisCooldowns[gamepadIndex] = 0;
    }

    const previousDirection = prevAxisDirections[gamepadIndex] || '';
    const cooldown = axisCooldowns[gamepadIndex] || 0;

    if (!direction) {
      prevAxisDirections[gamepadIndex] = '';
      axisCooldowns[gamepadIndex] = 0;
      return;
    }

    if (direction !== previousDirection || cooldown === 0) {
      dispatchKey(direction);
      axisCooldowns[gamepadIndex] = AXIS_REPEAT_FRAMES;
    } else {
      axisCooldowns[gamepadIndex] = Math.max(0, cooldown - 1);
    }

    prevAxisDirections[gamepadIndex] = direction;
  };

  const checkGamepadInput = () => {
  const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
  if (!gamepads || !nativeControllerSupport.value) {
    gamepadAnimationFrameId = requestAnimationFrame(checkGamepadInput);
    return;
  }

  for (let i = 0; i < gamepads.length; i++) {
    const gamepad = gamepads[i];
    if (!gamepad) continue;

    if (!prevButtonStates[i]) {
      prevButtonStates[i] = [];
    }

    gamepad.buttons.forEach((button, index) => {
  const isPressed = button.pressed;

  if (!buttonCooldowns[i]) buttonCooldowns[i] = [];
  if (!prevButtonStates[i]) prevButtonStates[i] = [];

  const wasPressed = prevButtonStates[i][index];
  const cooldown = buttonCooldowns[i][index] || 0;

  if (isPressed && !wasPressed && cooldown === 0) {
    // console.log(`Button ${index} pressed`);
    buttonPressed.value = null;
    const key = buttonMap[index];
    dispatchKey(key);
    console.log(key)

    buttonCooldowns[i][index] = COOLDOWN_FRAMES;
  }

  if (cooldown > 0) {
    buttonCooldowns[i][index] = cooldown - 1;
  }

  prevButtonStates[i][index] = isPressed;
});
    handleJoystickDirection(gamepad, i);
  }
  
  gamepadAnimationFrameId = requestAnimationFrame(checkGamepadInput);
};


const dispatchKey = (key) => {
  if (!key) return;

  if (key === 'Tab') return simulateTab(false);
  if (key === 'ShiftTab') return simulateTab(true);

  if ((key === 'Enter' || key === ' ') && document.activeElement) {
    const el = document.activeElement;
    const canClickFocusedControl = el.matches?.('button, a, input, textarea, select, [role="button"]');
    if (canClickFocusedControl && typeof el.click === 'function') {
      el.click(); // Trigger real click
      return;
    }
  }

  const event = new KeyboardEvent('keydown', {
    key,
    code: key === ' ' ? 'Space' : key,
    bubbles: true,
    cancelable: true
  });

  window.dispatchEvent(event);
};


const simulateTab = (reverse = false) => {
  const focusable = Array.from(document.querySelectorAll(
    'a, button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
  )).filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);

  const currentIndex = focusable.indexOf(document.activeElement);
  let nextIndex = reverse ? currentIndex - 1 : currentIndex + 1;

  if (nextIndex < 0) nextIndex = focusable.length - 1;
  if (nextIndex >= focusable.length) nextIndex = 0;

  focusable[nextIndex]?.focus();
};



  onMounted( () => {
    console.log('isfirebase enabled'+ firebaseEnabled)
    stopUserSync = initUserSync(showFirstRunAuthPrompt);
    showFirstRunAuthPrompt();
    if(!localStorage.getItem('nativeControllerSupport')){ 
      localStorage.setItem('nativeControllerSupport', true)
      nativeControllerSupport.value = true;
    }

    checkGamepadInput();
    if (isMobile.value && !localStorage.getItem('mobileZoomApplied')) {
      zoom.value = 0.5
      localStorage.setItem('zoom', 0.5)
      localStorage.setItem('mobileZoomApplied', 'true')
    }
    setZoom(zoom.value)
    setgameZoom(gameZoom.value)


    setTimeout(() => {
    window.addEventListener("gamepadconnected", onGamepadConnected);
    }, 300);

    if(!localStorage.getItem('completedGames')) localStorage.setItem('completedGames','[]')
    if(!localStorage.getItem('completedLevel')) localStorage.setItem('completedLevel','Tutorial')
    if(!localStorage.getItem('names')) localStorage.setItem('names','{"player1":"Player 1","player2":"Player 2","player3":"Player 3","player4":"Player 4"}')
    if(!localStorage.getItem('roster')) localStorage.setItem('roster','old')
    if(!localStorage.getItem('theme')) localStorage.setItem('theme',"day")
    if(!localStorage.getItem('unlockSystem')) localStorage.setItem('unlockSystem',"hard")
    if(!localStorage.getItem('unlockedMonsters')) localStorage.setItem('unlockedMonsters','[1,2,3]')
    if(!localStorage.getItem('defaultHints')) localStorage.setItem('defaultHints', JSON.stringify(defaultHints.value))
    else{
      // Load saved user hints (may be partial or missing new keys)
      let seenHints = JSON.parse(localStorage.getItem('defaultHints')) || {};

      // Ensure we don't overwrite existing keys, only add new ones
      for (const key in defaultHints.value) {
        if (!(key in seenHints)) {
          seenHints[key] = defaultHints.value[key];
          console.log(seenHints[key])
        }
      }

      // Save merged version back and set the reactive default
      localStorage.setItem('defaultHints', JSON.stringify(seenHints));
      defaultHints.value = seenHints;
    }
    // hard reset turn if app is exited
    localStorage.removeItem('drawnMonsters')
    
    
    window.addEventListener("gamepaddisconnected", onGamepadDisconnected);
    window.addEventListener('keydown', (e) => {
    // console.log('Key received:', e.key);
    if(e.key === 'Escape' && !e.repeat){
      showSettings.value = !showSettings.value;
    }
});
    
    // Initial check (in case controller was already connected)
    checkGamepadConnection();


    // Poll for changes (some browsers require this)
    // setInterval(checkGamepadConnection, 1000);

    setTimeout(() => {
      hasSeenIntro.value = true;
    }, 2000);
    // Hide Google Translate banner
    hideGoogleTranslateIframesAfterDelay(400);

  });

  onBeforeUnmount(() => {
    stopUserSync?.();
    window.removeEventListener("gamepadconnected", onGamepadConnected);
    window.removeEventListener("gamepaddisconnected", onGamepadDisconnected);
    cancelAnimationFrame(gamepadAnimationFrameId);
  });
  </script>

  <style lang="scss">

  /* Hide scrollbar for Firefox */
html {
  scrollbar-width: none;
  user-select: none;
  background-color: #1c1c1c;
}

  @font-face {
  font-family: 'Press Start 2P';
    src: url('/Press_Start_2P/PressStart2P-Regular.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }
@font-face {
  font-family: 'Cinzel';
  src: url('/Cinzel/Cinzel-VariableFont_wght.ttf') format('truetype');
  font-weight: 400 900; /* variable font range */
  font-style: normal;
  font-display: swap;
}
  /* Style for the scrollbar track */
::-webkit-scrollbar-track {
  background: #222; /* Dark background for the track */
}

/* Style for the scrollbar thumb (the draggable part) */
::-webkit-scrollbar-thumb {
  background: #444; /* Darker thumb */
  border-radius: 6px;
}

/* Optional: hover effect for the thumb */
::-webkit-scrollbar-thumb:hover {
  background: #666;
}

/* Set scrollbar width */
::-webkit-scrollbar {
  width: 8px;
}



/*crt filter start */
.crt {
  --scanline-opacity: 0.05;
  --vignette-opacity: 0.3;
  position: relative;
  overflow: hidden;
}
img {
  -webkit-user-drag: none;
}

.crt::before {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    rgba(255, 255, 255, var(--scanline-opacity)),
    rgba(255, 255, 255, var(--scanline-opacity)) 1px,
    transparent 6px,
    transparent 5px
  );
  pointer-events: none;
  z-index: 99998;
}

.crt::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    transparent 60%,
    rgba(0, 0, 0, var(--vignette-opacity))
  );
  pointer-events: none;
  z-index: 99999;
}
/* crt end */

  .gold {
    color: rgb(228, 194, 1);
  }
  
  .fame {
    color: rgb(255, 136, 0);
  }

  .supplies{
    color: red;
  }
  .armor{
    color: white;
  }
  .armor{
    color: white;
  }
  
  .fear{
  color: rgb(177, 76, 210);
  }
  .player {
    color: white;
  }
  .emerald{
    color: rgb(0, 255, 0);
  }

  button {
    font-size: 20px;
    cursor: pointer;
    border: none;
    border-radius: 5px;
    color: white;
    background-color: rgb(140,10,10);
    padding: 10px;
    font-family: 'Press Start 2P', cursive;
  }
  /* Create a transparent overlay effect */
  button:focus,
  button:focus-visible {
    outline: 3px solid rgba(130, 253, 238, 0.74);
    outline-offset: 3px;
  }

  input[type="checkbox"] {
    appearance: none;
    width: 24px;
    height: 24px;
    flex: 0 0 24px;
    display: inline-grid;
    place-items: center;
    margin: 0;
    border: 2px solid rgba(255, 231, 190, 0.42);
    border-radius: 7px;
    background:
      linear-gradient(180deg, rgba(255, 245, 224, 0.12), rgba(255, 245, 224, 0.04)),
      rgba(38, 14, 34, 0.86);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.12),
      inset 0 -3px 0 rgba(24, 8, 18, 0.24),
      0 6px 12px rgba(24, 8, 24, 0.2);
    cursor: pointer;
  }

  input[type="checkbox"]::after {
    content: "";
    width: 7px;
    height: 12px;
    border: solid #fff4df;
    border-width: 0 3px 3px 0;
    opacity: 0;
    transform: rotate(45deg) translate(-1px, -1px) scale(0.75);
    transition: opacity 120ms ease, transform 120ms ease;
  }

  input[type="checkbox"]:checked {
    border-color: rgba(130, 253, 238, 0.74);
    background:
      linear-gradient(180deg, rgba(83, 216, 194, 0.95), rgba(21, 151, 128, 0.95));
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.24),
      inset 0 -3px 0 rgba(10, 62, 58, 0.32),
      0 0 18px rgba(130, 253, 238, 0.2);
  }

  input[type="checkbox"]:checked::after {
    opacity: 1;
    transform: rotate(45deg) translate(-1px, -1px) scale(1);
  }

  input[type="checkbox"]:focus,
  input[type="checkbox"]:focus-visible {
    outline: 3px solid rgba(130, 253, 238, 0.74);
    outline-offset: 3px;
  }
  
  .loading {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

  button:active {
    transform: scale(0.95); /* Slight press effect */
  }
  .player-stats {
    font-size: 20px;
    font-weight: bold;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center; /* Ensures stats are centered */
    gap: 8px;
    margin-bottom: 0; /* Remove any unnecessary spacing */
    height: 100%; /* Ensure it stretches to match `.top-bar` */

    img {
      width: 30px;
      height: 30px;
    }
  }
  .top-bar {
    display: flex;
    align-items: center;
    padding: 10px;
    background: rgba(149, 149, 149, 0.5); 
    border-radius: 5px;
    align-items: center;
    font-family: 'Press Start 2P', cursive;
    margin: 20px;
    margin-bottom: 0px;
  }
  .top-bar > * {
    display: flex;
    align-items: center;
  }
  
  .seed {
    visibility: hidden;
    position: fixed;
    bottom: 30px;
    left: 20px;
    text-shadow:2px 2px 2px rgba(0, 0, 0, 0.8);
    color: white;
    font-family: 'Press Start 2P', cursive;
    cursor: pointer;
  }

  /* Active effect: Slightly increase size */
  button:active {
    transform: scale(.95); /* 10% size increase */
  }
  .shop-item h3, .top-bar, .shop-item, p, button {
    text-shadow: 1px 1px 0px rgba(0, 0, 0, 0.8);
  }
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
  overflow: hidden;
}
/* Hide scrollbar for Chrome, Safari and Edge */
html::-webkit-scrollbar {
  display: none;
}


.controller-info {
  background-color: blue;
  color: white;
  padding: 10px;
  font-size: 16px;
  cursor: pointer;
  border: none;
  border-radius: 5px;
  color: white;
  font-family: 'Press Start 2P', cursive;
  margin-right: 20px;
}
.controller-info:hover {
  filter: brightness(90%);
  transform: scale(var(--hover-scale));
}
/* Close Button */
.modal-button {
  height:35px;
  background: red;
  color: white;
  background-color: rgb(140,10,10);
  font-size: 18px;
  cursor: pointer;
}

/* Modal Overlay */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* Modal Content */
.modal-content {
  font-family: 'Press Start 2P', cursive;
  
  background: linear-gradient(140deg, rgba(173, 101, 59, 0.92), rgba(121, 42, 15, 0.9));
  color: white;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  width: 80%;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
  position: relative;
}
.close-modal {
  position: absolute;
  top: 10px;
  left: 15px;
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  line-height: 0px;
}

/* Close Button */
.modal-btn {
  position: absolute;
  top: 10px;
  right: 15px;
  background: red;
  color: white;
  font-size: 18px;
  border: none;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 50%;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 15px;
  background: transparent;
  border: none;
  font-size: 1.8rem;
  color: #ccc;
  cursor: pointer;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
    visibility: hidden;
  }
  to {
    opacity: 1;
    transform: translateY(0);
    visibility: visible;
  }
}
@keyframes fadeInRight {
  0% {
    opacity: .2;
    transform: translateX(-250px);
    visibility: hidden;
  }
  100% {
    opacity: 1;
    transform: translateX(0);
    visibility: visible;
  }
}
@keyframes fadeOut {
  from {
    opacity: 1;
    transform: translateY(0px);
    visibility: visible;
  }
  to {
    opacity: 0;
    transform: translateY(-10px);
    visibility: hidden;
  }
}

@keyframes slowSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
    visibility: hidden;
  }
  to {
    opacity: 1;
    transform: translateY(0);
    visibility: visible;
  }
}
@keyframes slideUp {
  0% {
    opacity: 0;
    transform: translateY(40px);
    visibility: hidden;
  }
  60% {
    opacity: 1;
    transform: translateY(-15px);
    visibility: visible;
  }
  80% {
    transform: translateY(5px);
    visibility: visible;
  }
  100% {
    transform: translateY(0);
    visibility: visible;
  }
}
@keyframes shake {
  0%   { transform: translateX(0); opacity: 1; }
  25%  { transform: translateX(-4px); }
  50%  { transform: translateX(4px); }
  75%  { transform: translateX(-2px); }
  100% { transform: translateX(0); }
}
.animated-fade-in {
  animation: fadeIn 0.3s ease-out 0.1s forwards;
}
.animated-fade-right {
  animation: fadeInRight 0.4s ease-out 0.1s forwards;
}
.animated-fade-out {
  animation: fadeOut 0.3s ease-out 0.1s forwards;
}
.animated-slide-up {
  animation: slideUp 0.25s ease-out 0.2s forwards;
}
.animated-slow-slide-up {
  animation: slowSlideUp 0.3s  ease-out 0.1s forwards;
}
.animated-shake {
  animation: shake 0.3s  ease-out 0.02s forwards;
}

@keyframes activeBounce {
    0%   { transform:translateY(0px); }
    10%   { transform:translateY(-2.5%); }
    15%  { transform: translateY(0px); }
    100% { transform: translateY(0px); }
  }

.animated-bounce {
    transform: scale(1.3);
    animation: activeBounce 1s ease-out;
    animation-iteration-count: infinite;
  }
@keyframes activeSelected {
    0%   { transform:translateY(0px); }
    50%   { transform:translateY(-2.5%); }
    100%  { transform: translateY(0px); }
  }

.animated-selected {
    transform: scale(1.3) translateY(-20px);
    animation: activeSelected 1s ease-out;
    animation-iteration-count: infinite;
  }

  @keyframes activePulse {
    0%   { transform:scale(1); }
    10%   { transform:scale(1.1); }
    15%  { transform: scale(1.1); }
    100% { transform: scale(1); }
  }

.animated-pulse {
    transform: scale(1.3);
    animation: activePulse 1.5s ease-out;
    animation-iteration-count: infinite;
  }

/* Hide scrollbar for IE, Edge */
html {
  -ms-overflow-style: none;
}

   /* Responsive adjustments for mobile */
   @media (max-width: 1230px) {
    button{
      font-size: 11px;
    }
    .gold {
      color: rgb(228, 194, 1);
    }
    
    .fame {
      color: rgb(255, 136, 0);
    }

    .player-stats {
      font-size: 10px;
      font-weight: bold;
      display: flex;
      justify-content: center;
      align-items: center; /* Ensures stats are centered */
      gap: 6px;
    }
    .seed{
      visibility: hidden;
      bottom: 0px;
      left: 0px;
      font-size: 10px;
    }
    .mobile-button {
      position: absolute;
      opacity: 0.55;
      font-size: 0.5rem;
      color: lightblue;
      padding: 0.25rem;
      z-index: 10;
      width: 70px;
      height: 70px;
      background-color: rgba(0,0,0,0);
      border: 2px solid lightblue;
      margin: 15px;
    }
    
    .bottom-right { bottom: 0; right: 0; 
      width: 80px;
      height: 80px;
    z-index: 45; }
    .bottom-left  { bottom: 0; left: 0;
    z-index: 45; }
    .top-right    { bottom: 25%; right: 0;
    z-index: 45;}
    .top-left     { 
    top: 0; right: 0; 
    z-index: 45;
    width: 40px;
    height: 40px;
    margin: 2px;
    border: none;
    img{
      width: 22px;
      height: 22px;
    
    }
  }
  .modal-button {
    height:35px;
    font-size: 12px;
  }
      
  }

  </style>
  
