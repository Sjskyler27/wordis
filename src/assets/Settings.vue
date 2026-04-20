<template>
  <div class="modal animated-fade-in">
    <div class="modal-content animated-slide-up">
      <div class="close-modal">
        <button ref="button1" class="modal-button" @click="close">&times;</button>
      </div>
      <h1>Settings</h1>

      <!-- Tab Buttons -->
      <div class="tab-buttons">
        <button :class="{ active: activeTab === 'game' }" @click="activeTab = 'game'">Game</button>
        <button :class="{ active: activeTab === 'sound' }" @click="activeTab = 'sound'">Sound</button>
        <button :class="{ active: activeTab === 'display' }" @click="activeTab = 'display'">Display</button>
      </div>

      <!-- Sound -->
      <section v-if="activeTab === 'sound'" class="settings-group">
        <div class="setting">
          <label for="volume">Master Volume: {{ props.volume }}</label>
          <input id="volume" type="range" min="0" max="10" :value="props.volume" @input="onVolumeInput" />
        </div>
        <div class="setting">
          <label for="musicVolume">Music Volume: {{ props.musicVolume }}</label>
          <input id="musicVolume" type="range" min="0" max="10" :value="props.musicVolume" @input="onmusicVolumeInput" />
        </div>
        <div class="setting">
          <label for="effectsVolume">Effects Volume: {{ props.effectsVolume }}</label>
          <input id="effectsVolume" type="range" min="0" max="10" :value="props.effectsVolume" @input="oneffectsVolumeInput" />
        </div>
      </section>

      <!-- Display -->
      <section v-if="activeTab === 'display'" class="settings-group">
        <div class="setting">
          <label for="zoom">UI Zoom: {{ Math.round(props.zoom * 100) }}%</label>
          <input id="zoom" type="range" min="0.5" max="1.5" step="0.01" :value="props.zoom" @input="onZoomInput" />
        </div>
        <div class="setting">
          <label for="gameZoom">Game Zoom: {{ Math.round(props.gameZoom * 100) }}%</label>
          <input id="gameZoom" type="range" min="0.5" max="1.5" step="0.01" :value="props.gameZoom" @input="ongameZoomInput" />
        </div>
        <div class="setting">
          <label for="shopZoom">Shop Zoom: {{ Math.round(props.shopZoom * 100) }}%</label>
          <input id="shopZoom" type="range" min="0.5" max="1.5" step="0.01" :value="props.shopZoom" @input="onshopZoomInput" />
        </div>
      </section>

      <!-- Game -->
      <section v-if="activeTab === 'game'" class="settings-group">
        <div class="menu-section">
          <button ref="button2" class="modal-button" @click="goHome">Main Menu</button>
        </div>
        <div class="menu-section">
          <button ref="button3" class="modal-button" @click="emit('feedback')">Feedback</button>
        </div>
        <div v-if="!hideControllerSupport" class="menu-section">
          <button title="requires refresh" ref="button4" class="modal-button" @click="toggleController">
            Native Controller: {{ nativeControllerSupport }}
          </button>
        </div>
      </section>

      <button class="invisible" @focus="button4.focus()" ref="button0" />
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, onMounted, onBeforeUnmount } from "vue";
import Feedback from "../states/home/Feedback.vue";
import { hideControllerSupport } from "../../globalVariables";

const props = defineProps({
  volume: Number,
  musicVolume: Number,
  effectsVolume: Number,
  zoom: Number,
  gameZoom: Number,
  shopZoom: Number,
  nativeControllerSupport: Boolean,
});

const emit = defineEmits([
  "close",
  "volumeChange",
  "musicVolumeChange",
  "effectsVolumeChange",
  "zoomChange",
  "gameZoomChange",
  "shopZoomChange",
  "reset",
  "NativeControllerChange",
  "home",
  "feedback"
]);

const activeTab = ref("game");

const button1 = ref(null);
const button2 = ref(null);
const button3 = ref(null);
const button4 = ref(null);
const buttons = [button1, button2, button3, button4];

onMounted(() => {
  button1.value.focus();
  window.addEventListener("keydown", handleKeyDown);
});
onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeyDown);
});

const handleKeyDown = (e) => {
  if (e.key === "Escape") {
    e.preventDefault();
    close();
    return;
  }

  const currentIndex = buttons.findIndex((btn) => btn.value === document.activeElement);
  if (e.key === "ArrowDown") {
    e.preventDefault();
    const nextIndex = (currentIndex + 1) % buttons.length;
    buttons[nextIndex].value.focus();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    const prevIndex = (currentIndex - 1 + buttons.length) % buttons.length;
    buttons[prevIndex].value.focus();
  }
};

const close = () => emit("close");
const refresh = () => window.location.reload();
const goHome = () => emit('home')
const toggleController = () => emit("NativeControllerChange", !props.nativeControllerSupport);
const onVolumeInput = (e) => emit("volumeChange", Number(e.target.value));
const onmusicVolumeInput = (e) => emit("musicVolumeChange", Number(e.target.value));
const oneffectsVolumeInput = (e) => emit("effectsVolumeChange", Number(e.target.value));
const onZoomInput = (e) => emit("zoomChange", parseFloat(e.target.value));
const ongameZoomInput = (e) => emit("gameZoomChange", parseFloat(e.target.value));
const onshopZoomInput = (e) => emit("shopZoomChange", parseFloat(e.target.value));
</script>

<style scoped lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

.modal {
  visibility: hidden;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  visibility: hidden;
  font-family: 'Press Start 2P', cursive;
  color: white;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  max-width: 600px;
  width: 90%;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
  position: relative;
  background: #222;
}

.tab-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;

  button {
    font-family: 'Press Start 2P', cursive;
    font-size: 12px;
    padding: 10px 20px;
    border: 2px solid darkred;
    background-color: #F5F5DC;
    color: #4B3A2F;
    text-shadow: none;
    cursor: pointer;
  }

  .active {
    background-color: darkred;
    color: white;
  }
}

.settings-group {
  margin-bottom: 30px;
  padding-top: 10px;
  text-align: left;
}

.setting {
  margin-bottom: 20px;
  label {
    display: block;
    margin-bottom: 6px;
  }
}

.menu-section {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  button {
    min-width: 200px;
  }
}

input[type="range"] {
  -webkit-appearance: none;
  width: 100%;
  height: 8px;
  background: #333;
  border-radius: 4px;
  outline: none;
}

input[type="range"]::-webkit-slider-runnable-track {
  height: 8px;
  background: darkred;
  border-radius: 4px;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 16px;
  width: 16px;
  background: white;
  border: 2px solid darkred;
  border-radius: 50%;
  cursor: pointer;
  margin-top: -4px;
}

.modal-button {
  margin-top: 10px;
}

.invisible {
  position: absolute;
  width: 185px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
  background-color: rgba(250, 250, 250, 0.9);
}
</style>
