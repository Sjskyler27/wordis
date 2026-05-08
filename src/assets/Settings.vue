<template>
  <div class="modal animated-fade-in">
    <div ref="modalContent" class="modal-content animated-slide-up">
      <div class="close-modal">
        <button ref="button1" class="modal-button" @click="close">&times;</button>
      </div>
      <h1>Settings</h1>

      <!-- Tab Buttons -->
      <div class="tab-buttons">
        <button :class="{ active: activeTab === 'game' }" @click="activeTab = 'game'">Game</button>
        <button :class="{ active: activeTab === 'controller' }" @click="activeTab = 'controller'">Controller</button>
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
          <input id="zoom" type="range" min="0.4" max="1.7" step="0.01" :value="props.zoom" @input="onZoomInput" />
        </div>
        <div class="setting">
          <label for="gameZoom">Game Zoom: {{ Math.round(props.gameZoom * 100) }}%</label>
          <input id="gameZoom" type="range" min="0.4" max="1.7" step="0.01" :value="props.gameZoom" @input="ongameZoomInput" />
        </div>
        <!-- <div class="setting">
          <label for="shopZoom">Shop Zoom: {{ Math.round(props.shopZoom * 100) }}%</label>
          <input id="shopZoom" type="range" min="0.5" max="1.5" step="0.01" :value="props.shopZoom" @input="onshopZoomInput" />
        </div> -->
      </section>

      <!-- Game -->
      <section v-if="activeTab === 'game'" class="settings-group">
        <div class="menu-section">
          <button ref="button2" class="modal-button" @click="goHome">Main Menu</button>
        </div>
        <div v-if="props.canShowHowToPlay" class="menu-section">
          <button type="button" class="modal-button" @click="emit('quickRestart')">Quick Restart</button>
        </div>
        <div class="menu-section">
          <button ref="button3" class="modal-button" @click="emit('feedback')">Feedback</button>
        </div>
        <div v-if="props.canShowHowToPlay" class="menu-section">
          <button ref="button5" class="modal-button" @click="emit('showTutorial')">How To Play</button>
        </div>
        <div class="menu-section">
          <button type="button" class="modal-button" @click="emit('setTutorialHintsViewed', true)">Set Hints Viewed</button>
          <button type="button" class="modal-button" @click="emit('setTutorialHintsViewed', false)">Set Hints Unviewed</button>
        </div>
        <div v-if="!hideControllerSupport" class="menu-section">
          <button title="requires refresh" ref="button4" class="modal-button" @click="toggleController">
            Native Controller: {{ nativeControllerSupport }}
          </button>
        </div>
        <div class="setting">
          <label for="joystickSensitivity">Joystick Sensitivity</label>
          <input id="joystickSensitivity" type="range" min="10" max="60" step="1" :value="joystickSensitivitySliderValue" @input="onJoystickSensitivityInput" />
        </div>
      </section>

      <!-- Controller -->
      <section v-if="activeTab === 'controller'" class="settings-group">
        <div class="mapping-header">
          <span>Action</span>
          <span>Button</span>
        </div>
        <div v-for="action in controllerActions" :key="action.key" class="mapping-row">
          <label :for="`controller-action-${action.key}`">{{ action.label }}</label>
          <select
            :id="`controller-action-${action.key}`"
            :data-controller-action-select="action.key"
            :value="controllerMappingValue[action.key]"
            @change="onControllerMappingInput(action.key, $event)"
          >
            <option v-for="button in controllerButtons" :key="button.index" :value="button.index">
              {{ button.label }}
            </option>
          </select>
          <ControllerButtonHint
            :action-key="action.key"
            :controller-mapping="controllerMappingValue"
            :controller-connected="isControllerConnected"
            :size="24"
            side="right"
          />
        </div>
        <div class="menu-section controller-actions">
          <button type="button" class="modal-button" @click="emit('resetControllerMapping')">Reset Buttons</button>
        </div>
      </section>

      <button class="invisible" @focus="focusRelativeControl(-1)" ref="button0" />
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, onMounted, onBeforeUnmount, computed } from "vue";
import Feedback from "../states/home/Feedback.vue";
import { hideControllerSupport } from "../../globalVariables";
import {
  CONTROLLER_ACTIONS,
  CONTROLLER_BUTTONS,
  DEFAULT_CONTROLLER_ACTION_MAPPING,
  normalizeControllerMapping
} from "../controllerMapping.js";
import ControllerButtonHint from "../states/game/components/ControllerButtonHint.vue";

const props = defineProps({
  volume: Number,
  musicVolume: Number,
  effectsVolume: Number,
  zoom: Number,
  gameZoom: Number,
  shopZoom: Number,
  joystickSensitivity: Number,
  nativeControllerSupport: Boolean,
  isControllerConnected: Boolean,
  controllerMapping: {
    type: Object,
    default: () => ({ ...DEFAULT_CONTROLLER_ACTION_MAPPING })
  },
  canShowHowToPlay: Boolean,
});

const emit = defineEmits([
  "close",
  "volumeChange",
  "musicVolumeChange",
  "effectsVolumeChange",
  "zoomChange",
  "gameZoomChange",
  "shopZoomChange",
  "joystickSensitivityChange",
  "reset",
  "NativeControllerChange",
  "controllerMappingChange",
  "resetControllerMapping",
  "home",
  "quickRestart",
  "feedback",
  "showTutorial",
  "setTutorialHintsViewed"
]);

const activeTab = ref("game");
const controllerActions = CONTROLLER_ACTIONS;
const controllerButtons = CONTROLLER_BUTTONS;
const controllerMappingValue = computed(() => normalizeControllerMapping(props.controllerMapping));
const JOYSTICK_SENSITIVITY_MIN = 10;
const JOYSTICK_SENSITIVITY_MAX = 60;
const joystickSensitivitySliderValue = computed(() => (
  JOYSTICK_SENSITIVITY_MAX + JOYSTICK_SENSITIVITY_MIN - props.joystickSensitivity
));

const button1 = ref(null);
const button2 = ref(null);
const button3 = ref(null);
const button4 = ref(null);
const button5 = ref(null);
const modalContent = ref(null);

const getFocusableControls = () => Array.from(modalContent.value?.querySelectorAll(
  'button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]'
) || []).filter((element) => element.offsetParent !== null);

const focusRelativeControl = (direction) => {
  const focusableControls = getFocusableControls();
  if (!focusableControls.length) {
    return;
  }

  const currentIndex = focusableControls.findIndex((control) => control === document.activeElement);
  const nextIndex = (currentIndex + direction + focusableControls.length) % focusableControls.length;
  focusableControls[nextIndex].focus();
};

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

  const actionSelect = document.activeElement?.dataset?.controllerActionSelect;
  if (actionSelect && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
    e.preventDefault();
    cycleControllerMapping(actionSelect, e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1);
    return;
  }

  if (e.key === "ArrowDown") {
    e.preventDefault();
    focusRelativeControl(1);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    focusRelativeControl(-1);
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
const onJoystickSensitivityInput = (e) => {
  const nextValue = JOYSTICK_SENSITIVITY_MAX + JOYSTICK_SENSITIVITY_MIN - Number(e.target.value);
  emit("joystickSensitivityChange", nextValue);
};
const onControllerMappingInput = (actionKey, e) => {
  assignControllerButton(actionKey, Number(e.target.value));
};
const cycleControllerMapping = (actionKey, direction) => {
  const currentButtonIndex = controllerButtons.findIndex((button) => button.index === controllerMappingValue.value[actionKey]);
  const nextButton = controllerButtons[(currentButtonIndex + direction + controllerButtons.length) % controllerButtons.length];
  assignControllerButton(actionKey, nextButton.index);
};
const assignControllerButton = (actionKey, nextButtonIndex) => {
  const nextMapping = { ...controllerMappingValue.value };
  const previousButtonIndex = nextMapping[actionKey];
  const conflictingActionKey = Object.entries(nextMapping).find(([mappedActionKey, mappedButtonIndex]) => (
    mappedActionKey !== actionKey && mappedButtonIndex === nextButtonIndex
  ))?.[0];

  nextMapping[actionKey] = nextButtonIndex;
  if (conflictingActionKey) {
    nextMapping[conflictingActionKey] = previousButtonIndex;
  }

  emit("controllerMappingChange", nextMapping);
};
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
  padding: 18px;
  background:
    radial-gradient(circle at 22% 18%, rgba(255, 203, 121, 0.18), transparent 32%),
    rgba(15, 6, 20, 0.74);
}

.modal-content {
  visibility: hidden;
  font-family: 'Press Start 2P', cursive;
  color: #fff4df;
  padding: 34px;
  border: 1px solid rgba(255, 231, 190, 0.24);
  border-radius: 22px;
  text-align: center;
  max-width: 980px;
  width: min(92vw, 980px);
  max-height: 86vh;
  overflow-y: auto;
  position: relative;
  background:
    linear-gradient(180deg, rgba(78, 25, 43, 0.97), rgba(42, 15, 40, 0.97)),
    radial-gradient(circle at 18% 0%, rgba(255, 202, 123, 0.2), transparent 38%);
  box-shadow:
    inset 0 1px 0 rgba(255, 238, 205, 0.14),
    0 24px 54px rgba(23, 8, 25, 0.46);
}

.modal-content h1 {
  margin: 0 52px 24px;
  color: #fff2ce;
  font-size: 1.05rem;
  line-height: 1.5;
  letter-spacing: 0;
  text-shadow: 0 3px 0 rgba(41, 10, 22, 0.34);
}

.tab-buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 22px;
  padding: 5px;
  border: 1px solid rgba(255, 225, 180, 0.18);
  border-radius: 16px;
  background: rgba(28, 10, 28, 0.46);

  button {
    font-family: 'Press Start 2P', cursive;
    flex: 1 1 0;
    min-width: 0;
    font-size: 0.66rem;
    line-height: 1.4;
    padding: 11px 12px;
    border: 1px solid rgba(255, 230, 190, 0.16);
    border-radius: 12px;
    background: rgba(255, 245, 224, 0.08);
    color: rgba(255, 244, 223, 0.72);
    text-shadow: none;
    cursor: pointer;
    transition: background 140ms ease, border-color 140ms ease, color 140ms ease, transform 140ms ease;
  }

  button:hover,
  button:focus-visible {
    outline: 3px solid rgba(130, 253, 238, 0.72);
    outline-offset: 2px;
    color: #fff4df;
    border-color: rgba(255, 226, 177, 0.34);
  }

  .active {
    background: linear-gradient(180deg, rgba(255, 189, 101, 0.92), rgba(171, 72, 52, 0.9));
    color: #e8e7e8;
    border-color: rgba(255, 231, 190, 0.46);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.24),
      0 8px 16px rgba(28, 8, 26, 0.24);
  }
}

.settings-group {
  margin-bottom: 12px;
  padding: 18px;
  border: 1px solid rgba(255, 225, 180, 0.16);
  border-radius: 18px;
  background: rgba(28, 10, 28, 0.38);
  text-align: left;
    max-height: 400px;

  overflow: hidden;
  overflow: auto;
}

.setting {
  margin-bottom: 22px;

  &:last-child {
    margin-bottom: 0;
  }

  label {
    display: block;
    margin-bottom: 10px;
    color: rgba(255, 244, 223, 0.86);
    font-size: 0.66rem;
    line-height: 1.6;
  }
}

.menu-section {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }

  button {
    min-width: min(100%, 260px);
  }
}

.mapping-header,
.mapping-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(190px, 0.8fr);
  gap: 14px;
  align-items: center;

}

.mapping-header {
  margin-bottom: 10px;
  color: rgba(255, 244, 223, 0.62);
  font-size: 0.55rem;
  line-height: 1.5;
}

.mapping-row {
  margin-bottom: 12px;
  padding: 10px;
  border: 1px solid rgba(255, 225, 180, 0.12);
  border-radius: 12px;
  background: rgba(18, 8, 20, 0.3);
  position: relative;

  label {
    color: rgba(255, 244, 223, 0.88);
    font-size: 0.6rem;
    line-height: 1.5;
  }

  select {
    min-height: 38px;
    width: 100%;
    border: 1px solid rgba(255, 229, 190, 0.28);
    border-radius: 10px;
    background: rgba(32, 10, 24, 0.9);
    color: #fff2ce;
    font-family: 'Press Start 2P', cursive;
    font-size: 0.56rem;
    line-height: 1.4;
    padding: 8px 10px;
  }

  select:focus-visible {
    outline: 3px solid rgba(130, 253, 238, 0.74);
    outline-offset: 2px;
  }
}

.controller-actions {
  margin-top: 18px;
}

input[type="range"] {
  -webkit-appearance: none;
  width: 100%;
  height: 10px;
  background: rgba(21, 9, 22, 0.72);
  border: 1px solid rgba(255, 226, 177, 0.18);
  border-radius: 999px;
  outline: none;
  cursor: pointer;
}

input[type="range"]::-webkit-slider-runnable-track {
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(90deg, #ffd36f, #cf5d50);
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 22px;
  width: 22px;
  background: #fff4df;
  border: 3px solid #78304a;
  border-radius: 50%;
  cursor: pointer;
  margin-top: -6px;
  box-shadow: 0 5px 10px rgba(21, 8, 20, 0.34);
}

.modal-button {
  min-height: 42px;
  margin-top: 0;
  padding: 10px 14px;
  border: 1px solid rgba(255, 229, 190, 0.28);
  border-radius: 12px;
  background: rgba(32, 10, 24, 0.74);
  color: #fff2ce;
  font-family: 'Press Start 2P', cursive;
  font-size: 0.68rem;
  line-height: 1.5;
  cursor: pointer;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.14),
    0 10px 18px rgba(24, 8, 20, 0.24);
  transition: background 140ms ease, transform 140ms ease, box-shadow 140ms ease;
}

.modal-button:hover,
.modal-button:focus-visible {
  outline: 3px solid rgba(130, 253, 238, 0.74);
  outline-offset: 2px;
  background: rgba(67, 21, 45, 0.86);
  transform: translateY(-1px);
}

.close-modal {
  top: 18px;
  left: 18px;
}

.close-modal .modal-button {
  width: 42px;
  min-width: 42px;
  height: 42px;
  padding: 0;
  font-size: 1.25rem;
  line-height: 1;
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

@media (max-width: 560px) {
  .modal-content {
    padding: 24px 18px;
    border-radius: 18px;
  }

  .modal-content h1 {
    margin-bottom: 18px;
    font-size: 0.9rem;
  }

  .tab-buttons {
    gap: 5px;
  }

  .tab-buttons button,
  .setting label,
  .mapping-header,
  .mapping-row label,
  .mapping-row select,
  .modal-button {
    font-size: 0.56rem;
  }

  .mapping-header,
  .mapping-row {
    grid-template-columns: 1fr;
  }
}
</style>
