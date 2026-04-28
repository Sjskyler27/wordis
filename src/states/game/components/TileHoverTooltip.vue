<template>
  <div
    v-if="visible && tile"
    class="tile-hover-tooltip"
    :class="{ 'tile-hover-tooltip-interactive': dismissible }"
    :style="tooltipStyle"
  >
    <button
      v-if="dismissible"
      type="button"
      class="tile-hover-close"
      aria-label="Close tile description"
      @click="$emit('close')"
    >
      x
    </button>
    <span class="tile-hover-badge">{{ overrideBadge || badgeLabel }}</span>
    <strong>{{ title }}</strong>
    <p>{{ overrideMessage || description }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { getModifierBadge, getModifierDefinition, getModifierDescription } from '../tile-logic.js';

defineEmits(['close']);

const props = defineProps({
  tile: {
    type: Object,
    default: null
  },
  visible: {
    type: Boolean,
    default: false
  },
  x: {
    type: Number,
    default: 0
  },
  y: {
    type: Number,
    default: 0
  },
  dismissible: {
    type: Boolean,
    default: false
  },
  overrideMessage: {
    type: Boolean,
    default: false
  },
  overrideBadge: {
    type: Boolean,
    default: false
  }
});

const title = computed(() => {
  if (!props.tile) {
    return '';
  }

  return `${props.tile.letter} Tile`;
});

const badgeLabel = computed(() => {
  if (!props.tile) {
    return '';
  }

  return getModifierBadge(props.tile) || getModifierDefinition(props.tile.status).badge || 'INFO';
});

const description = computed(() => {
  if (!props.tile) {
    return '';
  }

  return getModifierDescription(props.tile.status);
});

const tooltipStyle = computed(() => ({
  left: `${props.x}px`,
  top: `${props.y}px`
}));
</script>

<style scoped>
.tile-hover-tooltip {
  position: fixed;
  z-index: 1200;
  width: min(280px, calc(100vw - 24px));
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(25, 10, 21, 0.96);
  border: 1px solid rgba(255, 214, 132, 0.25);
  box-shadow: 0 16px 28px rgba(0, 0, 0, 0.28);
  color: #f7efe1;
  pointer-events: none;
  transform: translate(14px, 14px);
}

.tile-hover-tooltip-interactive {
  pointer-events: auto;
  transform: none;
}

.tile-hover-close {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  color: #f7efe1;
  cursor: pointer;
  font-size: 0.9rem;
  line-height: 1;
}

.tile-hover-tooltip strong {
  display: block;
  margin-top: 6px;
  font-size: 0.95rem;
}

.tile-hover-tooltip p {
  margin: 8px 0 0;
  font-size: 0.82rem;
  line-height: 1.45;
  color: rgba(247, 239, 225, 0.86);
}

.tile-hover-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(255, 202, 103, 0.16);
  color: #ffca67;
  font-size: 0.68rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
</style>
