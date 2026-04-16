<template>
  <TransitionAnimation
  :action="transitionAction"
  :toImage="transitionURL"
  @done="handleTransitionDone"
/>

  <div id="background-layer">
    <div class="shape-layer layer-far"></div>
    <div class="shape-layer layer-near"></div>
  </div>
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
        <h2>SUBTITLE</h2>
      </div>

      <div class="links">
        <span class="link"><a href="https://steampowered.com" target="_blank"><img width="40px" src="/src/assets/images/links/steam.png" alt="steam"></a></span>
        <span class="link"><a href="https://discord.gg/fBjAxWE3Ev" target="_blank"><img width="40px" src="/src/assets/images/links/discord.png" alt="discord"></a></span>
        <span class="link" v-if="!isElectron"><a href="https://buymeacoffee.com/dungeondraft" target="_blank"><img width="40px" src="/src/assets/images/links/coffee.png" alt="buy me a coffee"></a></span>
      </div>
  
      
    <!-- Start Game -->
    <div class="home-buttons animated-fade-in">
      <button class="profile" ref="button2" @click="showProfile = true">Profile</button>
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
 <PWA @close="showPWA = false" v-if="showPWA && isMobile"></PWA>
  <Credit v-if="showCredits" @close="showCredits = false"></Credit>
  <div class="streamer-text" v-if="isStreamer">Streamer Access</div>
  <div class="version-text">Version: {{versionNumber}} · {{ languageLabel }} {{lockContent? 'Demo': ''}}</div>


</template>
  
  <script setup>
  import { ref, defineEmits, defineProps, computed, onMounted, onBeforeUnmount, watch } from "vue";
  import Feedback from "./Feedback.vue"
  import { getAuth, onAuthStateChanged } from "firebase/auth";
  import PWA from "./PWA.vue";
  import TransitionAnimation from "../../assets/TransitionAnimation.vue";
  import pkg from '../../../package.json';
  import { hideSupportPage, enableTitleImg } from "../../../globalVariables";
  import { getPreferredLanguage } from "../game/language.js";
  import IntroScreen from "./IntroScreen.vue";
  import Credit from './Credits.vue'
  
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
  });

  const showIntro = ref(!props.hasSeenIntro);
  const demoDate = new Date('2025-10-01T00:00:00Z')
  const isDemo = false
  const now = new Date();
  const versionNumber = ref(pkg.version)
  const languageLabel = ref(getPreferredLanguage().label)
  const isVisible = ref(true)

  const startMusic = new Audio('audio/homeSound.mp3');
  startMusic.currentTime = 0
  startMusic.volume = props.volume * props.musicVolume / 100
  startMusic.loop = true;
  const emit = defineEmits(["type","start", "reset", "feedback", "support", "showSettings", "logIn", "logOut", "nameChange"]); // Emit event to switch to Shop.vue

  const gameInProgress = ref(localStorage.getItem("gameInProgress")); // Check if game is in progress
  const showProfile = ref(false);
  const showFeedback = ref(false);
  const showCredits = ref(false);
  const hasSeenPWA = ref(JSON.parse(localStorage.getItem('hasSeenPWA')) || false);
  const showPWA = ref(!hasSeenPWA.value);
  const user = ref(true);
  const transitionAction = ref('')
  const transitionURL = new URL('../../assets/images/homeScreen.png', import.meta.url).href;

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

  const handleTransitionDone = () =>{
    transitionAction.value = ''
  }
  const showHome = () => {
    showIntro.value = false;
    playMusic();
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

const buttons = [button0, button1, button2, button3, button4, button5, button6, button7];

const handleKeyDown = (e) => {
  const activeIndex = buttons.findIndex((btn) => btn.value === document.activeElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (activeIndex + 1) % buttons.length;
      buttons[nextIndex]?.value?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (activeIndex - 1 + buttons.length) % buttons.length;
      buttons[prevIndex]?.value?.focus();
    } else if (e.key === 'Enter') {
      document.activeElement?.click();
    }
  
};

onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibilityChange);
  setTimeout(() => {
    window.addEventListener('keydown', handleKeyDown);
    if(buttons[0].value){
      buttons[0].value.focus();
    } else {
      buttons[1].value.focus();
    }
  }, 450);
  if(props.hasSeenIntro) startMusic.play()
  
  //check logged in 
  const auth = getAuth();
  onAuthStateChanged(auth, (u) => {
    user.value = u;
  });
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
  #background-layer {
    position: absolute;
    inset: 0;
    z-index: -1;
    background:
      radial-gradient(circle at 14% 18%, rgba(255, 228, 168, 0.2) 0, rgba(255, 228, 168, 0.2) 12%, transparent 30%),
      radial-gradient(circle at 82% 14%, rgba(255, 255, 255, 0.09) 0, rgba(255, 255, 255, 0.09) 8%, transparent 24%),
      linear-gradient(135deg, #f39a54 0%, #ca6937 24%, #b63e3b 58%, #341137 100%);
    filter: saturate(1.08);
    overflow: hidden;
    pointer-events: none;
  }

  .shape-layer {
    position: absolute;
    inset: -10%;
    pointer-events: none;
    mix-blend-mode: screen;
    background-repeat: repeat;
    background-size: 280px 280px;
  }

  .layer-far {
    opacity: 0.24;
    background-position: 0 0;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='280' viewBox='0 0 280 280'%3E%3Cg fill='none' stroke='%23fff4dc' stroke-width='2.6' stroke-opacity='.34'%3E%3Cpolygon points='40,24 68,74 12,74'/%3E%3Crect x='106' y='18' width='46' height='46' rx='4'/%3E%3Cpolygon points='217,22 245,38 245,70 217,86 189,70 189,38'/%3E%3Cpolygon points='44,118 72,134 72,166 44,182 16,166 16,134'/%3E%3Crect x='108' y='110' width='54' height='54' rx='6'/%3E%3Cpolygon points='214,110 246,164 182,164'/%3E%3Crect x='28' y='204' width='50' height='50' rx='5'/%3E%3Cpolygon points='136,198 164,214 164,246 136,262 108,246 108,214'/%3E%3Cpolygon points='220,198 248,248 192,248'/%3E%3C/g%3E%3C/svg%3E");
    animation: driftLayerFar 25s linear infinite;
  }

  .layer-near {
    inset: -6%;
    opacity: 0.18;
    background-size: 190px 190px;
    background-position: 28px 40px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='190' height='190' viewBox='0 0 190 190'%3E%3Cg fill='rgba(255,244,220,.14)' stroke='rgba(255,255,255,.16)' stroke-width='1.8'%3E%3Cpolygon points='26,20 52,64 0,64'/%3E%3Crect x='74' y='20' width='34' height='34' rx='3'/%3E%3Cpolygon points='150,18 170,30 170,54 150,66 130,54 130,30'/%3E%3Crect x='18' y='92' width='38' height='38' rx='4'/%3E%3Cpolygon points='96,88 118,126 74,126'/%3E%3Cpolygon points='152,86 174,98 174,124 152,136 130,124 130,98'/%3E%3Ccircle cx='42' cy='156' r='12'/%3E%3Crect x='82' y='144' width='28' height='28' rx='4'/%3E%3Cpolygon points='152,142 174,180 130,180'/%3E%3C/g%3E%3C/svg%3E");
    animation: driftLayerNear 30s linear infinite;
  }

  @keyframes driftLayerFar {
    0% {
      background-position: 0 0;
    }
    100% {
      background-position: 280px -140px;
    }
  }

  @keyframes driftLayerNear {
    0% {
      background-position: 28px 40px;
    }
    100% {
      background-position: -67px 420px;
    }
  }
  .home-container {
    text-align: center;
    font-family: 'Press Start 2P', cursive;
    padding: 50px;
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 100vh;
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
    background-color: rgba(36, 36, 36, 0.9);
    visibility: hidden;
    padding: 20px 50px;
    border-radius: 10px;
    position: absolute;
    bottom: 200px;
    display:flex;
    flex-direction: row;
    gap: 35px;
    .play{
      background-color: rgb(59, 99, 159);
      height: 90px;
      width: 275px;
    }
    .profile{
      background-color: rgb(255, 170, 85);

    }
    .settings{
      background-color: darkred;

    }
  }

  button {
    background: var(--btn-color, rgb(59, 99, 159));
    border-radius: 15px;
    width: 250px;
    height: 75px;
    box-shadow: -4px 4px 4px 0px #3e3232; /* shadow = depth */
  }


  
  button:hover {
    transform: translateY(2px) translateX(-3px);
    box-shadow: -1px 2px 4px #4b2e1e;
  }
  
  button:active {
    transform: translateY(4px);
    box-shadow: none;
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
        #background-layer {
          position: fixed;
          inset: 0;
         background-size: cover;
          background-repeat: no-repeat;
          background-position: var(--bg-position, right);
      
        }
        .home-container{
          gap: 20px;
        }
      }

  </style>
