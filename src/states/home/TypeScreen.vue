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
  <div class="modal animated-fade-in">
    <div class="modal-content animated-slide-up" >
      <h3>Choose How To Play</h3>
      <button class="invisible" @focus="button1.focus()" ref="button0"/>
      <div class="close-modal">
        <button ref="button1" class="modal-button" @click="emit('home')">&times;</button>
      </div>
      <!-- <button class="continue" ref="button0" @click="continueGame" v-if="gameInProgress && !gameEnded">Continue</button> -->

      <!-- <div v-if="gameInProgress && !gameEnded" tabindex="-1" class="menu-option" ref="button1" 
        @click="emit('Continue')"
        @keydown.space.prevent="emit('Continue')"
        @keydown.enter.prevent="emit('Continue')"
        >
        <img src="/src/assets/images/playTypes/image.png" alt="Knight" class="menu-img" />
        <div class="menu-text">
          <h3>Continue</h3>
          <p>Return to your adventure!</p>
        </div>
      </div> -->
       <div tabindex="-1" class="menu-option" ref="button6"
        @click="emit('singleplayer', { mode: 'bot_match' })"
        @keydown.space.prevent="emit('singleplayer', { mode: 'bot_match' })"
        @keydown.enter.prevent="emit('singleplayer', { mode: 'bot_match' })"
        >
        <!-- <img src="/src/assets/images/playTypes/image.png" alt="Bot Duel" class="menu-img" /> -->
        <div class="menu-text">
          <h3>Machine Learning</h3>
          <br>

          <p>Play against a machine that gets better the more you play!</p>
        </div>
      </div>


      <div tabindex="-1" class="menu-option" ref="button5"
        @click="emit('multiRoundScreen')"
        @keydown.space.prevent="emit('multiRoundScreen')"
        @keydown.enter.prevent="emit('multiRoundScreen')"
        >
        <!-- <img src="/src/assets/images/playTypes/image.png" alt="Expedition" class="menu-img" /> -->
        <div class="menu-text">
          <h3>BALATRO STYLE</h3>
          <br>

          <p>Meet each rounds required score within the time limit. Gain permanent upgrades to help you get through each round as they scale in difficulty.</p>
        </div>
      </div>

    
      <div tabindex="-1" :class="['menu-option']" ref="button3" 
        @click="emit('multiplayerScreen')"
        @keydown.space.prevent="emit('multiplayerScreen')"
        @keydown.enter.prevent="emit('multiplayerScreen')"
        >
        <!-- <img src="/src/assets/images/playTypes/image.png" alt="Archmage" class="menu-img" /> -->
        <div class="menu-text">
          <h3>MultiPlayer</h3>
          <br>

          <p>Play head to head against your Friends</p>
        </div>
      </div>

       <div tabindex="-1" class="menu-option" ref="button2" 
        @click="emit('singleplayer', { mode: 'timed_solo' })"
        @keydown.space.prevent="emit('singleplayer', { mode: 'timed_solo' })"
        @keydown.enter.prevent="emit('singleplayer', { mode: 'timed_solo' })"
        >
        <!-- <img src="/src/assets/images/playTypes/image.png" alt="Knight" class="menu-img" /> -->
        <div class="menu-text">
          <h3>Quick Practice</h3>
          <br>
          <p>Race the clock and stack the highest score you can.</p>
        </div>
      </div>

      <!-- <div tabindex="-1" :class="['menu-option', {disabled: draftLocked}]" ref="button4" 
        @click="emit('multiplayerScreen')"
        @keydown.space.prevent="emit('multiplayerScreen')"
        @keydown.enter.prevent="emit('multiplayerScreen')"
        >
        <img src="/src/assets/images/playTypes/image.png" alt="Summoner" class="menu-img" />
        <div class="menu-text">
          <h3>Drafting Duel</h3>
          <p v-if="!draftLocked">Draft the Best Team and defeat your opponent?</p>
          <p v-else-if="draftcomingSoon">Coming Soon!</p>
          <p v-else>unlock 30 characters to unlock play Draft mode!</p>
        </div>
      </div> -->


      <button class="invisible" @focus="button1.focus()" ref="button0"/>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, onMounted, onBeforeUnmount ,ref, computed} from "vue";
import { freePlayUnlock,draftingDuelUnlock,dailyChallengeUnlock, draftcomingSoon, dailyComingSoon } from "../../../globalVariables";
const props = defineProps({
  isStreamer: Boolean
});

const demoDate = new Date('2155-10-01T00:00:00Z')
const isDemo = false
const now = new Date();
const lockContent = computed(() => (new Date() > demoDate || isDemo) && !props.isStreamer === true);


const emit = defineEmits(["game", "singleplayer", "multiplayerScreen", "multiRoundScreen", "home", "Dungeons", "FreePlay", "continue", "DungeonsCoop", "DraftDungeon", "DailyDungeon", 'EndlessDescent', 'Continue']);
const gameInProgress = ref(localStorage.getItem("gameInProgress")); // Check if game is in progress
const gameEnded = JSON.parse(localStorage.getItem('gameEnded'))
const button0 =ref(null)
const button1 =ref(null)
const button2 =ref(null)
const button3 =ref(null)
const button4 =ref(null)
const button5 =ref(null)
const button6 =ref(null)
const button7 =ref(null)
const isAdmin = (localStorage.getItem('isA') || 'null') === import.meta.env.VITE_AD_C;



const freePlayLocked = computed(() => {
  const charactersUnlocked = JSON.parse(localStorage.getItem("unlockedMonsters")) || [];
  return charactersUnlocked.length < freePlayUnlock;
});
const draftLocked = computed(() => {
  if(draftcomingSoon) return true
  const charactersUnlocked = JSON.parse(localStorage.getItem("unlockedMonsters")) || [];
  return charactersUnlocked.length < draftingDuelUnlock;
});
const endlessLocked = computed(() => {
  if(isAdmin) return false
  if(!isAdmin) return true
  const charactersUnlocked = JSON.parse(localStorage.getItem("unlockedMonsters")) || [];
  return charactersUnlocked.length < 36;
});
const dailyLocked = computed(() => {
  if(dailyComingSoon) return true
  if(lockContent.value) return true
  const charactersUnlocked = JSON.parse(localStorage.getItem("unlockedMonsters")) || [];
  return charactersUnlocked.length < dailyChallengeUnlock;
});
const buttons = [button0,button1, button2, button3, button4,button5,button6, button7];

const currentIndex = ref(1)
onMounted(() => {
  button0.value.focus();

  window.addEventListener("keydown", handleKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeyDown);
});


function updateFocus() {
  buttons.forEach((btn, index) => {
    if (btn.value) {
      btn.value.classList.toggle('selected', index === currentIndex.value);
    }
  });
  buttons[currentIndex.value].value?.focus();
}

const handleKeyDown = (e) => {
  if (e.key === "ArrowDown") {
    currentIndex.value = (currentIndex.value + 1) % buttons.length;
    e.preventDefault();
    updateFocus();
  } else if (e.key === "ArrowUp") {
    currentIndex.value = (currentIndex.value - 1 + buttons.length) % buttons.length;
    e.preventDefault();
    updateFocus();
  }
};

const close = () => emit("close");

</script>

<style lang="scss" scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

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


/* Modal Content */
.modal-content {
  visibility: hidden;
  max-width: 600px;
  padding: 90px;
  overflow-y:auto;
}

input[type="range"] {
  -webkit-appearance: none;
  width: 100%;
  height: 8px;
  background: #333;
  border-radius: 4px;
  outline: none;
  margin-top: 10px;
}

/* Track */
input[type="range"]::-webkit-slider-runnable-track {
  height: 8px;
  background: darkred;
  border-radius: 4px;
}

/* Thumb */
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 16px;
  width: 16px;
  background: white;
  border: 2px solid darkred;
  border-radius: 50%;
  cursor: pointer;
  margin-top: -4px; /* Align with track */
}

.invisible {
  position: absolute;
  width: 185px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
  background-color: rgba(250,250,250,0.9);
}
.menu-section{
  display: flex;
  justify-content: center;
  align-content: center;
  gap:2px;
  flex-wrap: wrap;
  button{
    width: 200px
  }
}
.menu-option:focus-visible {
  outline: 2px solid yellow;
  box-shadow: 0 0 15px rgba(255, 255, 0, 6); /* Stronger glow */
}

.menu-option.disabled {
  opacity: 0.5;
  pointer-events: none;
  cursor: default;

  h3,
  img {
    filter: grayscale(100%);
    color: grey ;
  }
  p{
    color: rgb(255, 46, 46);
  }
}

input {
  font-family: 'Press Start 2P', cursive;
  font-size: 12px; /* Matches button text */
  text-wrap: wrap;
  padding: 10px;
  margin-bottom: 20px;
  width: 380px;
  text-align: center;
  background: #F5F5DC; /* Light beige */
  border: 4px solid darkred; /* Pixelated effect */
  color: #4B3A2F; /* Dark brown text */
  outline: none;
  margin: 5px;
}

.landscape-menu {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  align-items: stretch;
  max-width: 720px;
  margin: auto;
  background: #111;
  border: 4px solid #444;
  border-radius: 12px;
}

.menu-option {
  display: flex;
  align-items: center;
  background: #1a1a1a;
  border: 3px solid darkred;
  padding: 12px;
  cursor: pointer;
  gap: 16px;
  transition: background 0.2s;
  box-shadow: 2px 2px 0 #000;
  margin-bottom: 20px;
}

.menu-option:hover {
  background: #2c2c2c;
}

.menu-img {
  width: 64px;
  height: 64px;
  image-rendering: pixelated;
}
.menu-text{
  width: 100%;
  justify-content: center;
}

.menu-text h3 {
  font-size: 16px;
  margin: 0;
  color: #f5d76e;
  font-family: 'Press Start 2P', cursive;
}

.menu-text p {
  font-size: 12px;
  margin: 4px 0 0;
  color: #ccc;
}

@media screen and (max-width: 768px) {
  .modal-content {
    width: 90%;
    padding: 20px;
  }
  .menu-option {
    align-items: center;
  }
  .menu-img {
    width: 48px;
    height: 48px;
  }
  .menu-text h3 {
    font-size: 14px;
  }
  .menu-text p {
    font-size: 10px;
  }
  
}

</style>
