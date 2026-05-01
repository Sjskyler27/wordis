<template>
  <TransitionAnimation
  :action="transitionAction"
  :toImage="transitionURL"
  @done="handleTransitionDone"
/>

  <IntroScreen v-if="showIntro" @finished="showHome" />
    <div v-else class="home-container" @click="playMusic">
      <div v-if="!isMobile && enableTitleImg" class="header">
        <img src="/src/assets/images/logos/titlelong.png" alt="title img">
        <h2>Brave the Depths of the Mysterious Dungeon</h2>
      </div>
      <div v-else-if="enableTitleImg" class="header">
        <img src="/src/assets/images/logos/title.png" alt="title img">
        <h2>Brave the Depths of the Mysterious Dungeon</h2>
      </div>
      <div v-else class="header">
        <div class="title">
          <div>
            <h1 class="shadow">WORDIS</h1>
            <h1 class="shimmer">WORDIS</h1>
            <h1 class="base">WORDIS</h1>
          </div>
        </div>
        <h2>Outpace The Machine</h2>
      </div>

      <div class="links">
        <span class="link"><a ref="steamLink" href="https://steampowered.com" target="_blank" rel="noreferrer noopener" @click.prevent="handleSteamClick"><img width="40px" src="/src/assets/images/links/steam.png" alt="steam"></a></span>
        <span class="link"><a ref="discordLink" href="https://discord.gg/h9RmN6ta" target="_blank" rel="noreferrer noopener"><img width="40px" src="/src/assets/images/links/discord.png" alt="discord"></a></span>
        <span class="link" v-if="!isElectron"><a ref="coffeeLink" href="https://buymeacoffee.com/dungeondraft" target="_blank" rel="noreferrer noopener"><img width="40px" src="/src/assets/images/links/coffee.png" alt="buy me a coffee"></a></span>
      </div>
  
      
    <!-- Start Game -->
    <div class="home-buttons">
      <button class="profile-button"  ref="button2" @click="handleProfileClick">Profile</button>
      <button class="play" ref="button1" @click="showType">Play</button>
      <button class="settings" ref="button3" @click="showSettings">Settings</button>
    </div>
    
    <button v-if="isElectron" class="quit animated-fade-in" ref="button4" @click="quitGame">Quit</button>
<!-- 
    <button class="login-button animated-fade-in" v-if="false" ref="button5" @click="handleToggleAuth">
      {{ !user ? "Log In" : "Log Out" }}
    </button> -->

    <div class="profile-tab animated-fade-in">
      <ProfileTab :monsterRoster="monsterRoster"></ProfileTab>
    </div>
  </div>
  <Feedback v-if="showFeedback" @close="showFeedback = false" />
  <ProfileModal
    v-if="showProfile"
    :user="user"
    :savedGameSyncEnabled="savedGameSyncEnabled"
    @close="showProfile = false"
    @logout="handleProfileLogout"
    @savedGameSyncChange="handleSavedGameSyncChange"
  />
 <PWA @close="showPWA = false" v-if="showPWA && isMobile && !wavedash"></PWA>
  <Credit v-if="showCredits" @close="showCredits = false"></Credit>
  <div class="streamer-text" v-if="isStreamer">Streamer Access</div>
  <div class="version-text">Version: {{versionNumber}} · {{ languageLabel }} {{lockContent? 'Demo': ''}}</div>


</template>
  
  <script setup>
  import { ref, defineEmits, defineProps, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
  import homeSoundUrl from '/public/audio/homeSound.mp3';
  import Feedback from "./Feedback.vue"
  import { onAuthStateChanged } from "firebase/auth";
  import PWA from "./PWA.vue";
  import TransitionAnimation from "../../assets/TransitionAnimation.vue";
  import pkg from '../../../package.json';
  import { hideSupportPage, enableTitleImg } from "../../../globalVariables";
  import { getPreferredLanguage } from "../game/language.js";
  import IntroScreen from "./IntroScreen.vue";
  import Credit from './Credits.vue'
  import ProfileModal from './ProfileModal.vue';
  import { auth, firebaseEnabled } from "../../firebaseClient.js";
  import { db } from "../../main.js";
  import { push, get, query, orderByChild, equalTo, ref as dbRef } from "firebase/database";
  import { isSavedGameSyncEnabled, setSavedGameSyncEnabled } from "../../userstate/syncUserState.js";
  
  const props = defineProps({
    monsterRoster: Array, // Expecting an array of monster objects [{ id, actionUsed, ready }]
    isMobile: Boolean,
    settingsShowing: Boolean,
    isStreamer: Boolean,
    volume: Number,
    musicVolume: Number,
    effectsVolume: Number,
    hasSeenIntro: Boolean,
    uiZoom: Number,
    deviceId: String,
  });

  const MACHINE_STYLE = false;
  const showIntro = ref(!props.hasSeenIntro);
  const demoDate = new Date('2025-10-01T00:00:00Z')
  const isDemo = false
  const now = new Date();
  const versionNumber = ref(pkg.version)
  const languageLabel = ref(getPreferredLanguage().label)
  const isVisible = ref(true)
  const wavedash = import.meta.env.VITE_WAVEDASH === 'true';

  const startMusic = new Audio(homeSoundUrl);
  startMusic.currentTime = 0
  startMusic.volume = props.volume * props.musicVolume / 100
  startMusic.loop = true;
  const emit = defineEmits(["type","start", "reset", "feedback", "support", "showSettings", "logIn", "logOut", "nameChange", "backgroundState"]); // Emit event to switch to Shop.vue

  const gameInProgress = ref(localStorage.getItem("gameInProgress")); // Check if game is in progress
  const showProfile = ref(false);
  const showFeedback = ref(false);
  const showCredits = ref(false);
  const hasSeenPWA = ref(JSON.parse(localStorage.getItem('hasSeenPWA')) || false);
  const showPWA = ref(!hasSeenPWA.value);
  const user = ref(null);
  const savedGameSyncEnabled = ref(isSavedGameSyncEnabled());
  const transitionAction = ref('')
  const transitionURL = new URL('../../assets/images/homeScreen.png', import.meta.url).href;
  const homeBackgroundState = computed(() => ({
    transitionKey: 'start-screen',
    isBotMode: false,
    botCogStyle: {
      width: 'min(42vw, 380px)',
      height: 'min(42vw, 380px)',
      right: '6vw',
      bottom: '6vh',
      opacity: '0.8',
      '--machine-cog-duration': '18s'
    },
    playerCogStyle: {
      width: 'min(22vw, 190px)',
      height: 'min(22vw, 190px)',
      left: '8vw',
      top: '12vh',
      opacity: '0.94',
      '--machine-cog-duration': '12s'
    }
  }));

  watch(() => props.volume, async (newVal) => {
    startMusic.volume = newVal * props.musicVolume / 100
    clickSound.volume = newVal * props.effectsVolume / 100
  })
  watch(() => props.musicVolume, async (newVal) => {
    startMusic.volume = props.volume * newVal / 100
  })
  watch(() => props.effectsVolume, async (newVal) => {
    click.volume = props.volume * newVal / 100
  })

  watch(homeBackgroundState, (state) => {
    emit('backgroundState', state);
  }, { immediate: true, deep: true });

  const handleTransitionDone = () =>{
    transitionAction.value = ''
  }
  const showHome = () => {
    showIntro.value = false;
    playMusic();
    focusPlayButton();
  };
  const showType = () => {
    emit('type')
  };

  window.addEventListener("storage", () => {
    gameInProgress.value = localStorage.getItem("gameInProgress") === "true";
  });

  // Set default theme if not set
  if (!localStorage.getItem('theme')) {
    localStorage.setItem('theme', 'day');
  }

  const theme = localStorage.getItem('theme');
  const position = theme === 'night' ? 'right' : 'left';
  const btnColor = theme === 'night' ? 'rgb(59, 99, 159)' : 'rgb(255, 170, 85)';

  document.documentElement.style.setProperty('--bg-position', position);
  document.documentElement.style.setProperty('--btn-color', btnColor);
  function toggleTheme() {
    const newTheme = theme === 'night' ? 'day' : 'night';
    localStorage.setItem('theme', newTheme);
  }
  toggleTheme()
  console.log(props.isStreamer)
  const lockContent = computed(() => (new Date() > demoDate || isDemo) && !props.isStreamer === true);


  const playerKeys = ['player1', 'player2', 'player3', 'player4']
  


  
  startMusic.currentTime = 0
  const playMusic = () => {
    // broken due to chrome not allowing sound until clicked
    // if (props.musicVolume > 0 && props.volume > 0) startMusic.play()
  }

  const showSettings = () => {
    emit("showSettings");
  };

  const handleProfileClick = () => {
    if (!user.value) {
      emit('logIn');
      return;
    }

    showProfile.value = true;
  };

  const handleProfileLogout = () => {
    showProfile.value = false;
    emit('logOut');
  };

  const handleSavedGameSyncChange = (enabled) => {
    setSavedGameSyncEnabled(enabled);
    savedGameSyncEnabled.value = enabled;
  };

  const handleSteamClick = async () => {
    window.open('https://steampowered.com', '_blank', 'noopener,noreferrer');
    await trackSteamClick();
  };

  const trackSteamClick = async () => {
    try {
      if (!firebaseEnabled || !db) {
        throw new Error("Steam interest tracking is unavailable right now.");
      }

      const steamDeviceId = props.deviceId || localStorage.getItem("deviceId");
      if (!steamDeviceId) {
        throw new Error("Missing device ID for steam interest tracking.");
      }

      const steamClicksRef = dbRef(db, "steamClicks");
      // const deviceQuery = query(steamClicksRef, orderByChild("deviceId"), equalTo(steamDeviceId));
      // const snapshot = await get(deviceQuery);
      // if (snapshot.exists()) {
      //   return;
      // }

      const currentUser = user.value || auth?.currentUser || null;
      const now = Date.now();
      await push(steamClicksRef, {
        deviceId: steamDeviceId,
        userId: currentUser?.uid || null,
        email: currentUser?.email || null,
        firstClickedAt: now,
        lastClickedAt: now,
        timesViewed: 1,
        language: navigator.language || '',
        platform: navigator.platform || '',
        userAgent: navigator.userAgent || ''
      });
    } catch (error) {
      console.warn('Steam interest tracking failed.', error);
    }
  };

  const isElectron = navigator.userAgent.toLowerCase().includes('electron');
  const quitGame = () => {

  if (window.electron && window.electron.quitApp) {
    console.log('start screen quit app')
      window.electron.quitApp();
    } else {
      window.close();
    }
  };


  //controller support

const button0 = ref(null);
const button1 = ref(null);
const button2 = ref(null);
const button3 = ref(null);
const button4 = ref(null);
const button5 = ref(null);
const button6 = ref(null);
const button7 = ref(null);
const steamLink = ref(null);
const discordLink = ref(null);
const coffeeLink = ref(null);

const controllerRegion = ref('home');
const homeCursorIndex = ref(0);
const linkCursorIndex = ref(0);

const isControllerTargetVisible = (element) => {
  if (!element || element.disabled) {
    return false;
  }

  const style = window.getComputedStyle(element);
  return element.offsetParent !== null && style.visibility !== 'hidden' && style.display !== 'none';
};

const getHomeTargets = () => [button1, button3, button4]
  .map((button) => button.value)
  .filter(isControllerTargetVisible);

const getLinkTargets = () => [steamLink, discordLink, coffeeLink]
  .map((link) => link.value)
  .filter(isControllerTargetVisible);

const focusHomeTarget = (nextIndex = homeCursorIndex.value) => {
  const targets = getHomeTargets();
  if (!targets.length) {
    return;
  }

  homeCursorIndex.value = Math.max(0, Math.min(nextIndex, targets.length - 1));
  targets[homeCursorIndex.value]?.focus();
};

const focusPlayButton = () => {
  controllerRegion.value = 'home';
  nextTick(() => {
    focusHomeTarget(0);
  });
};

const focusLinkTarget = (nextIndex = linkCursorIndex.value) => {
  const targets = getLinkTargets();
  if (!targets.length) {
    return;
  }

  linkCursorIndex.value = Math.max(0, Math.min(nextIndex, targets.length - 1));
  targets[linkCursorIndex.value]?.focus();
};

const cycleIndex = (currentIndex, direction, total) => {
  if (!total) {
    return 0;
  }

  return (currentIndex + direction + total) % total;
};

const handleKeyDown = (e) => {
  if (showIntro.value || props.settingsShowing || showFeedback.value || showCredits.value || showPWA.value) {
    return;
  }

  const homeTargets = getHomeTargets();
  const linkTargets = getLinkTargets();
  if (!homeTargets.length && !linkTargets.length) {
    return;
  }

  const activeHomeIndex = homeTargets.findIndex((target) => target === document.activeElement);
  const activeLinkIndex = linkTargets.findIndex((target) => target === document.activeElement);
  if (activeHomeIndex >= 0) {
    controllerRegion.value = 'home';
    homeCursorIndex.value = activeHomeIndex;
  } else if (activeLinkIndex >= 0) {
    controllerRegion.value = 'links';
    linkCursorIndex.value = activeLinkIndex;
  }

  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault();
    const direction = e.key === 'ArrowRight' ? 1 : -1;
    if (controllerRegion.value === 'links') {
      linkCursorIndex.value = cycleIndex(linkCursorIndex.value, direction, linkTargets.length);
      focusLinkTarget();
    } else {
      homeCursorIndex.value = cycleIndex(homeCursorIndex.value, direction, homeTargets.length);
      focusHomeTarget();
    }
    return;
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault();
    controllerRegion.value = 'links';
    linkCursorIndex.value = Math.min(homeCursorIndex.value, Math.max(0, linkTargets.length - 1));
    focusLinkTarget();
    return;
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    controllerRegion.value = 'home';
    homeCursorIndex.value = Math.min(linkCursorIndex.value, Math.max(0, homeTargets.length - 1));
    focusHomeTarget();
    return;
  }

  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    document.activeElement?.click();
  }
};

onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibilityChange);
  if (!showIntro.value) {
    focusPlayButton();
  }
  setTimeout(() => {
    window.addEventListener('keydown', handleKeyDown);
  }, 450);
  if(props.hasSeenIntro) startMusic.play()
  
  //check logged in 
  if (firebaseEnabled && auth) {
    onAuthStateChanged(auth, (u) => {
      user.value = u;
    });
  } else {
    user.value = null;
  }
});

onBeforeUnmount(() => {
  startMusic.pause()
  window.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('visibilitychange', handleVisibilityChange);

});
function handleVisibilityChange() {
  if (document.visibilityState === 'hidden') {
    startMusic.pause();
    isVisible.value = false;
  } else if (document.visibilityState === 'visible') {
    isVisible.value = true;
    startMusic.play();
    
  }
}

  </script>
  
  <style lang="scss" scoped>
  .home-container {
    text-align: center;
    font-family: 'Press Start 2P', cursive;
    padding: 50px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 100vh;
    min-height: 100dvh;
  }
  .header{
      position: absolute;
      top: 150px;
    img{
      justify-self: center;
        width: 90%;
      }
      .title{
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        column-gap: 50px;
      }

    .base {
font-family: 'Times New Roman', serif;
      font-size: 9rem;
      font-weight: 900;
      padding: 0px;
      margin: 0px;
      text-transform: uppercase;
      color: transparent;

      background: linear-gradient(to bottom, #f6c637, #8d26ed, #862f00);
      -webkit-background-clip: text;
      background-clip: text;
    }
    .shadow{


      //text-shadow: 2px 2px 6px #eda12690;
      // background: linear-gradient(to bottom, #cdb357, #b97d1d, #521d00);
      -webkit-background-clip: text;
      background-clip: text;  
      position: absolute ;

font-family: 'Times New Roman', serif;
      font-size: 9rem;
      font-weight: 900;
      padding: 0px;
      margin: 0px;
      text-transform: uppercase;
      color: transparent;
      z-index: -1;
    }
    .shimmer{
      position: absolute;
      font-weight: 900;
font-family: 'Times New Roman', serif;
      font-size: 9rem;
      padding: 0px;
      margin: 0px;
      text-transform: uppercase;
    }
    h2 {
      font-size: 1.6rem;
      color: rgb(255, 255, 255);
      text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.8);
      
      
    }
  }
  .login-button {
    position: fixed;
    visibility: hidden;
    top: 20px;
    left: 20px;
    height: 40px;
    width: 120px;
    font-size: 13px;
    padding: 10px 10px;
    color: white;
    border: none;
    border-radius: 5px;
    font-family: 'Press Start 2P', cursive;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out;
  }
  .profile-tab{
    position: fixed;
    visibility: hidden;
    top: 40px;
    left: 40px;
    height: 40px;
    font-size: 13px;
    padding: 10px 10px;
    color: white;
    border: none;
    border-radius: 5px;
    font-family: 'Press Start 2P', cursive;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out;
  }
  .quit {
    position: fixed;
    visibility: hidden;
    bottom: 40px;
    left: 20px;
    height: 40px;
    width: 120px;
    font-size: 13px;
    padding: 10px 10px;
    color: white;
    border: none;
    border-radius: 5px;
    font-family: 'Press Start 2P', cursive;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out;
  }
  .links {
    position: fixed;
    top: 40px;
    right: 20px;
    display: flex;
    gap: 10px;
    z-index: 9999;
    .links img{
      width: 30px;
    }
  }

  .link a {
    display: inline-flex;
    border-radius: 12px;
  }

  .link a:focus-visible {
    outline: 4px solid rgba(130, 253, 238, 0.86);
    outline-offset: 4px;
    box-shadow:
      0 0 0 5px rgba(92, 25, 41, 0.38),
      0 16px 26px rgba(33, 10, 30, 0.28);
  }
  
  label {

    text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.8);
    font-size: 24px;
    color: white;
    margin-bottom: 10px;
  }

  .version-text {
    position: fixed;
    bottom: 10px;
    right: 10px;
    font-size: 10px;
    z-index: 9999;
    color: white;
    font-family: 'Press Start 2P', cursive;
  
    padding: 4px;
  }

  .streamer-text {
    position: fixed;
    bottom: 23px;
    right: 10px;
    font-size: 10px;
    z-index: 9999;
    color: white;
    font-family: 'Press Start 2P', cursive;
  
    padding: 4px;
  }
  
  
  h2, h3{
    text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.8);
    margin-bottom: 10px;
    color: white;
  }
  
  .player-selection {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
  }
  
  button {
    padding: 10px 20px;
    cursor: pointer;
    background: #FFA500;
    border: none;
    border-radius: 5px;
    color: white;
    transition: background 0.2s ease-in-out;
  }
  
  button.selected {
    background:rgb(59, 99, 159); /* Highlight selected players */
  }
  button:focus-visible {
    outline: 4px solid rgba(130, 253, 238, 0.86);
    outline-offset: 4px;
    box-shadow:
      0 0 0 5px rgba(92, 25, 41, 0.38),
      0 16px 26px rgba(33, 10, 30, 0.28);
  }
  button.selected:hover {
    background:rgb(51, 83, 132);
  }
    button:hover {
      filter: brightness(92%);
  }
  
  button:disabled {
    background: #aaa;
    cursor: not-allowed;
  }
  .home-buttons{
    align-items: center;
    background:
      linear-gradient(180deg, rgba(255, 245, 224, 0.1), rgba(255, 245, 224, 0.04)),
      rgba(38, 14, 34, 0.72);
    visibility: hidden;
    padding: 14px 18px;
    border: 1px solid rgba(255, 231, 190, 0.24);
    border-radius: 22px;
    position: fixed;
    left: 50%;
    bottom: 56px;
    transform: translateX(-50%);
    z-index: 100;
    display:flex;
    flex-direction: row;
    gap: 12px;
    animation: homeButtonsIn 0.3s ease-out 0.1s forwards;
    box-shadow:
      inset 0 1px 0 rgba(255, 238, 205, 0.14),
      0 22px 46px rgba(23, 8, 25, 0.36);
    .play{
      background: linear-gradient(180deg, rgba(83, 216, 194, 0.96), rgba(21, 151, 128, 0.94));
    color: #fff4df;

      height: 90px;
      width: 275px;
      border-color: rgba(176, 255, 238, 0.44);
    }
    .profile-button{
      background: #6c345ac7;
    }
    .profile{
      background: linear-gradient(180deg, rgba(255, 189, 101, 0.92), rgba(171, 72, 52, 0.9));
    }
    .disabled{
      background: rgba(255, 245, 224, 0.08);
      color: rgba(255, 244, 223, 0.42);
      border-color: rgba(255, 230, 190, 0.1);
      cursor: not-allowed;
      position: relative;
    }
    .disabled:hover::after{
      content: "Coming Soon";
      position: absolute;
      left: 50%;
      bottom: calc(100% + 10px);
      transform: translateX(-50%);
      background: rgba(35, 10, 31, 0.96);
      border: 1px solid rgba(255, 236, 187, 0.24);
      border-radius: 10px;
      color: rgba(255, 248, 236, 0.92);
      font-size: 0.62rem;
      padding: 8px 10px;
      white-space: nowrap;
      box-shadow: 0 14px 28px rgba(20, 6, 14, 0.28);
    }

    .settings{
      background: linear-gradient(180deg, rgba(185, 55, 80, 0.92), rgba(116, 24, 48, 0.94));

    }
  }

  button {
    background:
      linear-gradient(180deg, rgba(255, 245, 224, 0.13), rgba(255, 245, 224, 0.04)),
      rgba(54, 20, 43, 0.78);
    border: 1px solid rgba(255, 230, 190, 0.18);
    border-radius: 14px;
    width: 250px;
    height: 75px;
    color: #fff4df;
    font-family: 'Press Start 2P', cursive;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.14),
      inset 0 -4px 0 rgba(24, 8, 18, 0.28),
      0 12px 20px rgba(24, 8, 24, 0.22);
  }


  
  button:hover {
    transform: translateY(-2px);
    filter: brightness(1.05);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.18),
      inset 0 -4px 0 rgba(24, 8, 18, 0.26),
      0 16px 26px rgba(24, 8, 24, 0.28);
  }
  
  button:active {
    transform: translateY(1px);
    box-shadow:
      inset 0 2px 8px rgba(24, 8, 18, 0.32),
      0 8px 14px rgba(24, 8, 24, 0.18);
  }

  /*animnation*/
  .header {
    opacity: 0;
    transform: translateY(-20px);
    animation: fadeSlideDown 0.6s ease-out forwards;
  }
  
  @keyframes fadeSlideDown {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .home-buttons button {
    opacity: 0;
    transform: translateY(10px);
    animation: buttonPop 0.4s ease-out forwards;
  }
  
  .home-buttons button:nth-child(0) { animation-delay: 0.2s; }
  .home-buttons button:nth-child(1) { animation-delay: 0.3s; }
  .home-buttons button:nth-child(2) { animation-delay: 0.4s; }
  .home-buttons button:nth-child(3) { animation-delay: 0.5s; }
  .home-buttons button:nth-child(4) { animation-delay: 0.6s; }
  .home-buttons button:nth-child(5) { animation-delay: 0.7s; }
  .home-buttons button:nth-child(6) { animation-delay: 0.8s; }
  .home-buttons button:nth-child(7) { animation-delay: 0.9s; }
  .home-buttons button:nth-child(8) { animation-delay: 1.0s; }
  .home-buttons button:nth-child(9) { animation-delay: 1.1s; }
  
  @keyframes buttonPop {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes homeButtonsIn {
    from {
      opacity: 0;
      visibility: hidden;
      transform: translateX(-50%) translateY(-10px);
    }
    to {
      opacity: 1;
      visibility: visible;
      transform: translateX(-50%) translateY(0);
    }
  }
  @keyframes glowPulse {
    50% { text-shadow: 0 0 12px var(--btn-color); }
  }
  
  h2, .shadow{
    animation: glowPulse 3s infinite ease-in-out;
  }
  @keyframes shadowPulse {
    25% { text-shadow: 0 0 5px rgb(227, 157, 7); }
  }
  
  @keyframes shimmer {
    0% {
      background-position: 100% 100%;
    }
    100% {
      background-position: 00% 00%;
    }
}
.shadow{
  animation: shadowPulse 3s infinite ease-in-out;
}
  .shimmer {
      color: transparent;
      position: absolute;
      background: repeating-linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.0) 0px,
        rgba(255, 255, 255, 0.1) 30px,
        rgba(255, 255, 255, 0.3) 50px,
        rgba(255, 255, 255, 0.1) 70px,
        rgba(255, 255, 255, 0.0) 100px,
        rgba(255, 255, 255, 0.0) 250px
      );
    background-size: 400% 100%;
    animation: shimmer 30s linear infinite;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    z-index: 2;
  }



     /* Responsive adjustments for mobile */
     @media (max-width: 1230px) {

        .link{
          img{
            width: 30px;
          }
        }

       @keyframes shadowPulse {
          25% { text-shadow: 0 0 3px rgb(227, 157, 7); }
        }
        .home-container{
          padding: 0px;
        }
        .title{
          column-gap: 25px !important;
        }
        .header{
          position: inherit;
          margin: 10px;
          .base {
            font-size: 4rem;
          }
          .shadow {
            font-size: 4rem;
          }
          .shimmer {
            font-size: 4rem;
          }
          h2{
            font-size: 12px;
          }
        }
        h3{
          font-size: 12px;
        }
        label {
          font-size: 12px;
        }
        input{
          font-size: 12px; /* Matches button text */
          padding: 5px;
          margin-bottom: 5px;
          width: 180px;
        }
        .home-container{
          gap: 0px;
        }
        .home-buttons {
          gap: 7px;
          font-size: 10px;
        }
        .player-selection {
          display: flex;
          flex-wrap: wrap;
          justify-self: center;
          gap: 6px;
          margin-bottom: 10px;
          font-size: 8px;
        }
        .player-selection-container{
          display: flex;
          justify-content: center;
          margin: 30px 60px;
        }

      }
      @media (max-width: 1230px) and (orientation: landscape) {

      }
      @media (max-width: 1230px) and (orientation: portrait) {
        .home-buttons {
          bottom: 56px;
          flex-direction: column;
          button {
            width: 170px;
            height: 40px;
            font-size: 12px;
            border-radius: 5px;
          }
          .play{width: 170px;
            height: 40px;
            font-size: 12px;
            border-radius: 5px;
          }
        }
        .profile-tab{
          left: 8px;
          top: 8px;
        }
        .header{
          position: absolute;
          top: 100px;
        }
        .home-container{
          gap: 20px;
        }
      }

  </style>
