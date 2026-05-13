<template>
  <div class="screen-bounds-overlay">
    <div class="screen-bounds-frame" :style="frameStyle">
      <span class="screen-bounds-corner top-left"></span>
      <span class="screen-bounds-corner top-right"></span>
      <span class="screen-bounds-corner bottom-left"></span>
      <span class="screen-bounds-corner bottom-right"></span>
    </div>

    <section class="screen-bounds-controls">
      <span>Screen Bounds</span>
      <label for="screen-bounds-zoom">Game Zoom: {{ zoomPercent }}%</label>
      <input
        id="screen-bounds-zoom"
        type="range"
        min="0.4"
        max="1.7"
        step="0.01"
        :value="gameZoom"
        @input="$emit('gameZoomChange', parseFloat($event.target.value))"
      />
      <button type="button" @click="$emit('close')">Done</button>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  gameZoom: {
    type: Number,
    default: 1
  }
});

defineEmits(['gameZoomChange', 'close']);

const zoomPercent = computed(() => Math.round((props.gameZoom || 1) * 100));
const frameStyle = computed(() => ({
  '--bounds-zoom': props.gameZoom || 1
}));
</script>

<style scoped>
.screen-bounds-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  pointer-events: auto;
  background: rgba(9, 7, 10, 0.18);
}

.screen-bounds-frame {
  position: absolute;
  inset: 24px;
  transform: scale(var(--bounds-zoom));
  transform-origin: center;
  pointer-events: none;
}

.screen-bounds-corner {
  position: absolute;
  width: 72px;
  height: 72px;
  border-color: #ff2338;
  filter: drop-shadow(0 0 10px rgba(255, 35, 56, 0.65));
}

.top-left {
  top: 0;
  left: 0;
  border-top: 6px solid;
  border-left: 6px solid;
}

.top-right {
  top: 0;
  right: 0;
  border-top: 6px solid;
  border-right: 6px solid;
}

.bottom-left {
  bottom: 0;
  left: 0;
  border-bottom: 6px solid;
  border-left: 6px solid;
}

.bottom-right {
  right: 0;
  bottom: 0;
  border-right: 6px solid;
  border-bottom: 6px solid;
}

.screen-bounds-controls {
  position: absolute;
  left: 50%;
  bottom: 36px;
  display: grid;
  width: min(420px, calc(100vw - 32px));
  gap: 10px;
  padding: 16px;
  border: 2px solid rgba(255, 210, 101, 0.32);
  border-radius: 8px;
  color: #fff7e8;
  background: rgba(50, 12, 31, 0.94);
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.3);
  font-family: 'Press Start 2P', system-ui, sans-serif;
  transform: translateX(-50%);
}

.screen-bounds-controls span,
.screen-bounds-controls label {
  font-size: 0.68rem;
  line-height: 1.6;
}

.screen-bounds-controls span {
  color: #ffd265;
}

.screen-bounds-controls input {
  width: 100%;
}

.screen-bounds-controls button {
  min-height: 36px;
  border: 0;
  border-radius: 6px;
  color: #321723;
  background: #ffd265;
  font: inherit;
  font-size: 0.68rem;
  cursor: pointer;
}
</style>
