<template>
      <TransitionAnimation
  :action="transitionAction"
  :toImage="transitionURL"
  @done="handleTransitionDone"
/>

  <div id="background-layer"></div>
  <div class="modal animated-fade-in">
    <div class="modal-content animated-slide-up" >
      <h3>How will you brave the Play</h3>
      <button class="invisible" @focus="button1.focus()" ref="button0"/>
      <div class="close-modal">
        <button ref="button1" class="modal-button" @click="emit('home')">&times;</button>
      </div>
      <!-- <button class="continue" ref="button0" @click="continueGame" v-if="gameInProgress && !gameEnded">Continue</button> -->

      <div v-if="gameInProgress && !gameEnded" tabindex="-1" class="menu-option" ref="button1" 
        @click="emit('Continue')"
        @keydown.space.prevent="emit('Continue')"
        @keydown.enter.prevent="emit('Continue')"
        >
        <img src="/src/assets/images/playTypes/image.png" alt="Knight" class="menu-img" />
        <div class="menu-text">
          <h3>Continue</h3>
          <p>Return to your adventure!</p>
        </div>
      </div>
      <div tabindex="-1" class="menu-option" ref="button2" 
        @click="emit('game')"
        @keydown.space.prevent="emit('game')"
        @keydown.enter.prevent="emit('game')"
        >
        <img src="/src/assets/images/playTypes/image.png" alt="Knight" class="menu-img" />
        <div class="menu-text">
          <h3>Single Player</h3>
          <p>Brave the dungeon and earn fame!</p>
        </div>
      </div>
    
      <div tabindex="-1" :class="['menu-option']" ref="button3" 
        @click="emit('multiplayerScreen')"
        @keydown.space.prevent="emit('multiplayerScreen')"
        @keydown.enter.prevent="emit('multiplayerScreen')"
        >
        <img src="/src/assets/images/playTypes/image.png" alt="Archmage" class="menu-img" />
        <div class="menu-text">
          <h3>MultiPlayer</h3>
          <p v-if="!freePlayLocked">Draft freely with no limits!</p>
          <p v-else>Unlock 12 characters to play free play!</p>
        </div>
      </div>
      <div tabindex="-1" :class="['menu-option', {disabled: draftLocked}]" ref="button4" 
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
      </div>


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


const emit = defineEmits(["game", "multiplayerScreen", "home", "Dungeons", "FreePlay", "continue", "DungeonsCoop", "DraftDungeon", "DailyDungeon", 'EndlessDescent', 'Continue']);
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
    background-image: url('/src/assets/images/homeScreen.png');
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
    pointer-events: none;
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
