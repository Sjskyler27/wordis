<template>
    <div
      v-if="visible"
      class="transition-overlay"
      :class="[`type-${type}`, phase]"
      @animationend="onAnimationEnd"
    >
    <div class="swipe-container">
      <div class="swipe-glow" />
    </div>
  </div>
  </template>
  
  <script setup>
  import { ref, watch, defineProps, defineEmits } from 'vue';
  
  const props = defineProps({
    type: { type: String, default: 'iris' }, // 'iris' or 'swipe'
    action: { type: String, default: 'none' }, // 'open', 'close', 'none'
  });
  
  const emit = defineEmits(['done']);
  
  const visible = ref(false);
  const phase = ref('');
  
  watch(() => props.action, (val) => {
    if (val === 'open' || val === 'close') {
      visible.value = true;
      phase.value = val;
    }
  });
  
  function onAnimationEnd() {
    emit('done');
    if (props.action === 'open') {
      visible.value = false;
    }
  }
  </script>
  
  <style scoped>
  .transition-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    pointer-events: none;
  }
  
  /* === IRIS === */
  .type-iris.close {
    animation: iris-close 0.5s forwards;
    background: radial-gradient(circle, black 0%, black 100%);
  }
  .type-iris.open {
    animation: iris-open 0.5s forwards;
    background: radial-gradient(circle, black 0%, black 100%);
  }
  
  @keyframes iris-close {
    0% {
      clip-path: circle(150% at center);
    }
    100% {
      clip-path: circle(0% at center);
    }
  }
  
  @keyframes iris-open {
    0% {
      clip-path: circle(0% at center);
    }
    100% {
      clip-path: circle(150% at center);
    }
  }
  
  /* === SWIPE === */
  
  /* Animate this instead of the root */
  .swipe-container {
    width: 100%;
    height: 100%;
    background: linear-gradient(
      to right,
      rgba(0, 0, 0, 0.8) 20%,
      rgba(0, 0, 0, 0.9) 50%,
      rgba(0, 0, 0, 1) 68%,
      rgba(128, 0, 0, 1) 100%,
      black 100%
    );
  }
  
  .type-swipe.close .swipe-container {
    animation: swipe-close 0.4s forwards;
  }
  
  .type-swipe.open .swipe-container {
    animation: swipe-open .6s forwards;
  }
  
  /* Glow edge */
  .swipe-glow {
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    width: 16px;
    background: linear-gradient(to left, rgba(160, 0, 0, 0.9), transparent);
    pointer-events: none;
  }
  
  /* Keyframes */
  @keyframes swipe-close {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(0); }
  }
  
  @keyframes swipe-open {
    0% { transform: translateX(0); }
    100% { transform: translateX(100%); }
  }
  </style>
  