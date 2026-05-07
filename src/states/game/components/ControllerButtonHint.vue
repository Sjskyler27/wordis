<template>
  <span
    v-if="shouldShow"
    class="controller-button-hint"
    :class="sideClass"
    :style="hintStyle"
    :aria-label="buttonLabel"
  >
    <img v-if="buttonIcon" :src="buttonIcon" :alt="buttonLabel" />
    <span v-else class="controller-button-text">{{ compactLabel }}</span>
  </span>
</template>

<script setup>
import { computed } from 'vue';
import { getButtonForAction } from '../../../controllerMapping.js';

const props = defineProps({
  actionKey: {
    type: String,
    required: true
  },
  controllerMapping: {
    type: Object,
    default: () => ({})
  },
  controllerConnected: {
    type: Boolean,
    default: false
  },
  hide: {
    type: Boolean,
    default: false
  },
  size: {
    type: Number,
    default: 30
  },
  side: {
    type: String,
    default: 'left',
    validator: (value) => ['left', 'right'].includes(value)
  }
});

const button = computed(() => getButtonForAction(props.controllerMapping, props.actionKey));
const buttonIcon = computed(() => button.value?.icon || '');
const buttonLabel = computed(() => button.value?.label || props.actionKey);
const compactLabel = computed(() => buttonLabel.value.split('/')[0].trim());
const shouldShow = computed(() => props.controllerConnected && !props.hide);
const sideClass = computed(() => `controller-button-hint-${props.side}`);
const hintStyle = computed(() => ({
  '--controller-button-hint-size': `${props.size}px`
}));
</script>

<style scoped>
.controller-button-hint {
  position: absolute;
  bottom: -5px;
  z-index: 8;
  width: var(--controller-button-hint-size);
  height: var(--controller-button-hint-size);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  filter: drop-shadow(0 2px 4px rgba(12, 5, 18, 0.42));
}

.controller-button-hint-left {
  left: -5px;
}

.controller-button-hint-right {
  right: -5px;
}

.controller-button-hint img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.controller-button-text {
  min-width: var(--controller-button-hint-size);
  height: var(--controller-button-hint-size);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  border: 1px solid rgba(255, 244, 223, 0.72);
  border-radius: 999px;
  background: rgba(24, 8, 24, 0.86);
  color: #fff4df;
  font-family: inherit;
  font-size: calc(var(--controller-button-hint-size) * 0.28);
  line-height: 1;
  white-space: nowrap;
}
</style>
