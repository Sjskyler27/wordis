<template>
      <TransitionAnimation
  :action="transitionAction"
  :toImage="transitionURL"
  @done="handleTransitionDone"
/>

  <div id="background-layer" :class="{ 'machine-learning-background': isMachineLearningSelected }">
    <div class="shape-layer layer-far"></div>
    <div class="shape-layer layer-near"></div>
    <div class="machine-cogs" aria-hidden="true">
      <span class="cog cog-large machine-cog"></span>
      <span class="cog cog-small machine-cog"></span>
    </div>
  </div>
  <div class="modal animated-fade-in">
    <div class="modal-content animated-slide-up" >
      <h3>Choose How To Play</h3>
      <div class="close-modal">
        <button ref="closeButton" class="modal-button" @click="emit('home')">&times;</button>
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
       <!-- <button tabindex="-1" class="menu-option machine-learning-option" ref="machineLearningButton"
        @click="emit('singleplayer', { mode: 'bot_match' })"
        @keydown.space.prevent="emit('singleplayer', { mode: 'bot_match' })"
        @keydown.enter.prevent="emit('singleplayer', { mode: 'bot_match' })"
        >
        <div class="menu-text">
          <h3>Machine Learning</h3>
          <br>

          <p>Play against a machine that gets better the more you play!</p>
        </div>
      </button> -->


      <button tabindex="-1" class="menu-option" ref="multiRoundButton"
        @click="emit('multiRoundScreen')"
        @keydown.space.prevent="emit('multiRoundScreen')"
        @keydown.enter.prevent="emit('multiRoundScreen')"
        >
        <!-- <img src="/src/assets/images/playTypes/image.png" alt="Expedition" class="menu-img" /> -->
        <div class="menu-text">
          <h3>Single Player</h3>
          <br>

          <p>Meet each rounds required score within the time limit. Gain permanent upgrades to help you get through each round as they scale in difficulty.</p>
        </div>
      </button>

    
      <button tabindex="-1" :class="['menu-option']" ref="multiplayerButton"
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
      </button>

       <button tabindex="-1" class="menu-option" ref="quickPracticeButton"
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
       </button>

       <button
        v-if="hasBotMatchSave"
        tabindex="-1"
        class="menu-option continue-option"
        ref="continueBotButton"
        @click="emit('continue', SAVE_MODES.BOT_MATCH)"
        @keydown.space.prevent="emit('continue', SAVE_MODES.BOT_MATCH)"
        @keydown.enter.prevent="emit('continue', SAVE_MODES.BOT_MATCH)"
        >
        <div class="menu-text">
          <h3>Continue Machine Learning</h3>
          <br>
          <p>Resume your saved bot match.</p>
        </div>
       </button>

       <button
        v-if="hasMultiRoundSave"
        tabindex="-1"
        class="menu-option continue-option"
        ref="continueMultiRoundButton"
        @click="emit('continue', SAVE_MODES.MULTI_ROUND)"
        @keydown.space.prevent="emit('continue', SAVE_MODES.MULTI_ROUND)"
        @keydown.enter.prevent="emit('continue', SAVE_MODES.MULTI_ROUND)"
        >
        <div class="menu-text">
          <h3>Continue Single Player</h3>
          <br>
          <p>Resume your saved multi-round run.</p>
        </div>
       </button>

    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, onMounted, onBeforeUnmount ,ref, computed, nextTick} from "vue";
import { freePlayUnlock,draftingDuelUnlock,dailyChallengeUnlock, draftcomingSoon, dailyComingSoon } from "../../../globalVariables";
import { SAVE_MODES, hasLocalGameSave } from "../game/save-state.js";
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
const closeButton = ref(null)
const machineLearningButton = ref(null)
const multiRoundButton = ref(null)
const multiplayerButton = ref(null)
const quickPracticeButton = ref(null)
const continueBotButton = ref(null)
const continueMultiRoundButton = ref(null)
const isAdmin = (localStorage.getItem('isA') || 'null') === import.meta.env.VITE_AD_C;
const hasBotMatchSave = ref(hasLocalGameSave(SAVE_MODES.BOT_MATCH));
const hasMultiRoundSave = ref(hasLocalGameSave(SAVE_MODES.MULTI_ROUND));



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
const currentIndex = ref(0)
const isMachineLearningSelected = computed(() => currentIndex.value === 0);
const controllerButtons = [
  machineLearningButton,
  multiRoundButton,
  multiplayerButton,
  quickPracticeButton,
  continueBotButton,
  continueMultiRoundButton
];
const getControllerTargets = () => controllerButtons.filter((button) => button.value);
const syncSaveButtons = () => {
  hasBotMatchSave.value = hasLocalGameSave(SAVE_MODES.BOT_MATCH);
  hasMultiRoundSave.value = hasLocalGameSave(SAVE_MODES.MULTI_ROUND);
};
onMounted(() => {
  nextTick(() => {
    updateFocus();
  });

  syncSaveButtons();
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("wordis:saves-changed", syncSaveButtons);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("wordis:saves-changed", syncSaveButtons);
});


function updateFocus() {
  const targets = getControllerTargets();
  targets.forEach((btn, index) => {
    if (btn.value) {
      btn.value.classList.toggle('selected', index === currentIndex.value);
    }
  });
  targets[currentIndex.value]?.value?.focus();
}

const handleKeyDown = (e) => {
  const targets = getControllerTargets();
  if (!targets.length) {
    return;
  }

  if (e.key === "b") {
    e.preventDefault();
    emit('home')
  }
  else if (e.key === "ArrowDown") {
    e.preventDefault();
    currentIndex.value = Math.min(currentIndex.value + 1, targets.length - 1);
    updateFocus();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    currentIndex.value = Math.max(currentIndex.value - 1, 0);
    updateFocus();
  } else if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    targets[currentIndex.value]?.value?.click();
  } else if (e.key === "Escape") {
    e.preventDefault();
    emit('home');
  }
};

const close = () => emit("close");

</script>

<style lang="scss" scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
.modal{
  visibility: hidden;
}

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
    transition: filter 220ms ease;
  }

  #background-layer.machine-learning-background {
    background:
      radial-gradient(circle at 18% 16%, rgba(124, 231, 255, 0.2) 0, rgba(124, 231, 255, 0.16) 11%, transparent 30%),
      radial-gradient(circle at 82% 18%, rgba(255, 255, 255, 0.11) 0, rgba(255, 255, 255, 0.08) 8%, transparent 24%),
      linear-gradient(135deg, #31475e 0%, #22384d 28%, #182535 62%, #101620 100%);
    filter: saturate(0.9) contrast(1.08);
  }

  .machine-cogs {
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 220ms ease;
  }

  .machine-learning-background .machine-cogs {
    opacity: 0.74;
  }

.cog {
  position: absolute;
  border-radius: 50%;
  opacity: 0.88;
  }

.cog::before,
.cog::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
}

.cog::before {
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
  background-image: var(--cog-image);
  filter:
    invert(84%)
    sepia(9%)
    saturate(369%)
    hue-rotate(169deg)
    brightness(1.12)
    contrast(1.18);
}

.cog::after {
  background: var(--cog-image) center / contain no-repeat;
  filter: brightness(0) blur(2px);
  opacity: 0.24;
  transform: translate(-10px, 12px) scale(0.94);
  z-index: -1;
}

  .cog-large {
    --cog-image: url('/src/assets/images/big-cog.png');
    width: min(42vw, 380px);
    height: min(42vw, 380px);
    right: 6vw;
    bottom: 6vh;
    opacity: 0.8;
  }

  .cog-large::before {
    animation: cogSpin 18s linear infinite;
  }

  .cog-large::after {
    animation: cogShadowSpin 18s linear infinite;
  }

  .cog-small {
    --cog-image: url('/src/assets/images/small-cog.png');
    width: min(22vw, 190px);
    height: min(22vw, 190px);
    left: 8vw;
    top: 12vh;
    opacity: 0.94;
  }

  .cog-small::before {
    animation: cogSpinReverse 12s linear infinite;
  }

  .cog-small::after {
    animation: cogShadowSpinReverse 12s linear infinite;
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

  @keyframes cogSpin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes cogSpinReverse {
    to {
      transform: rotate(-360deg);
    }
  }

  @keyframes cogShadowSpin {
    from {
      transform: translate(-10px, 12px) scale(0.94) rotate(0deg);
    }
    to {
      transform: translate(-10px, 12px) scale(0.94) rotate(360deg);
    }
  }

  @keyframes cogShadowSpinReverse {
    from {
      transform: translate(-10px, 12px) scale(0.94) rotate(0deg);
    }
    to {
      transform: translate(-10px, 12px) scale(0.94) rotate(-360deg);
    }
  }


/* Modal Content */
.modal-content {
  visibility: hidden;
  width: min(92vw, 760px);
  max-height: min(86vh, 780px);
  padding: 34px;
  overflow-y: auto;
  border: 1px solid rgba(255, 231, 190, 0.24);
  border-radius: 22px;
  background:
    linear-gradient(180deg, rgba(92, 30, 44, 0.96), rgba(50, 16, 44, 0.96)),
    radial-gradient(circle at 18% 0%, rgba(255, 202, 123, 0.24), transparent 36%);
  box-shadow:
    inset 0 1px 0 rgba(255, 238, 205, 0.14),
    0 24px 54px rgba(23, 8, 25, 0.46);
}

.modal-content > h3 {
  margin: 0 54px 24px;
  color: #fff2ce;
  font-size: 1rem;
  line-height: 1.5;
  letter-spacing: 0;
  text-shadow: 0 3px 0 rgba(41, 10, 22, 0.34);
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
button{
  width: 100%;
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

.close-modal {
  top: 18px;
  left: 18px;
}

.modal-button {
  width: 42px;
  height: 42px;
  border: 1px solid rgba(255, 229, 190, 0.32);
  border-radius: 12px;
  background: rgba(32, 10, 24, 0.74);
  color: #fff2ce;
  font-size: 1.25rem;
  line-height: 1;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.14),
    0 10px 18px rgba(24, 8, 20, 0.28);
}

.modal-button:hover,
.modal-button:focus-visible {
  outline: 3px solid rgba(130, 253, 238, 0.74);
  outline-offset: 2px;
  background: rgba(67, 21, 45, 0.86);
}
.modal-button > * {
  pointer-events: none;
}


.menu-option:focus-visible {
  outline: 4px solid rgba(130, 253, 238, 0.88);
  outline-offset: 3px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    inset 0 -4px 0 rgba(47, 10, 22, 0.3),
    0 0 0 5px rgba(92, 25, 41, 0.45),
    0 18px 28px rgba(33, 10, 30, 0.32);
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

.menu-option > * {
  pointer-events: none;
}
.menu-option {
  display: flex;
  align-items: center;
  background:
    linear-gradient(180deg, rgba(255, 245, 224, 0.13), rgba(255, 245, 224, 0.04)),
    rgba(38, 14, 34, 0.72);
  border: 1px solid rgba(255, 218, 162, 0.22);
  border-left: 5px solid rgba(255, 188, 98, 0.86);
  border-radius: 16px;
  padding: 16px 18px;
  cursor: pointer;
  gap: 16px;
  transition: transform 150ms ease, background 150ms ease, border-color 150ms ease, box-shadow 150ms ease;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    inset 0 -3px 0 rgba(24, 8, 18, 0.24),
    0 12px 20px rgba(24, 8, 24, 0.22);
  margin-bottom: 14px;
}

.menu-option:hover {
  background:
    linear-gradient(180deg, rgba(255, 245, 224, 0.18), rgba(255, 245, 224, 0.06)),
    rgba(54, 20, 43, 0.78);
  border-color: rgba(255, 226, 177, 0.4);
  transform: translateY(-2px);
}

.machine-learning-option.selected,
.machine-learning-option:focus-visible,
.machine-learning-option:hover {
  background:
    linear-gradient(180deg, rgba(174, 231, 244, 0.17), rgba(113, 177, 198, 0.07)),
    rgba(20, 34, 48, 0.88);
  border-color: rgba(166, 230, 244, 0.52);
  border-left-color: rgba(103, 218, 238, 0.95);
  box-shadow:
    inset 0 1px 0 rgba(222, 250, 255, 0.18),
    inset 0 -3px 0 rgba(9, 20, 31, 0.32),
    0 0 0 4px rgba(103, 218, 238, 0.12),
    0 16px 26px rgba(6, 18, 28, 0.34);
}

.machine-learning-option.selected .menu-text h3,
.machine-learning-option:focus-visible .menu-text h3,
.machine-learning-option:hover .menu-text h3 {
  color: #aeefff;
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
  font-size: 0.9rem;
  line-height: 1.45;
  margin: 0;
  color: #ffdc83;
  font-family: 'Press Start 2P', cursive;
  text-transform: uppercase;
}

.menu-text p {
  font-size: 0.68rem;
  line-height: 1.7;
  margin: 8px 0 0;
  color: rgba(255, 247, 230, 0.78);
}

@media screen and (max-width: 1008px) {
  .modal-content {
    width: 80%;
    height: 80%;
    max-height: 80%;
    padding: 24px 18px;
    border-radius: 18px;
  }
  .menu-option {
    align-items: center;
  }
  .menu-img {
    width: 48px;
    height: 48px;
  }
  .menu-text h3 {
    font-size: 0.99rem;
  }
  .menu-text p {
    font-size: 0.89rem;
  }
  
}

</style>
