<template>
  <div class="transition-wrapper" v-if="visible">
    <img
      :src="toImage"
      class="bg-image"
      :class="{ revealed: showTo }"
    />
    <div class="fire-bar animate-fire" />
  </div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue';

const props = defineProps({
  action: { type: String, default: 'none' }, // 'start' to trigger
  toImage: String // image to be revealed (e.g. /shop.png)
});

const emit = defineEmits(['done']);

const visible = ref(false);
const showTo = ref(false);
const clipPercent = ref(0);

watch(() => props.action, (val) => {
  if (val === 'start') {
    visible.value = true;
    showTo.value = true;

    setTimeout(() => {
      visible.value = false;
      emit('done');
    },window.innerWidth < 800 ? 200 : 500)
  }
});
</script>

<style scoped>
.transition-wrapper {
  position: fixed;
  inset: 0;
  z-index: 9999;
  overflow: hidden;
}
.bg-image {
  position: absolute;
  inset: 0;
  object-fit: cover;
  width: 100%;
  height: 100%;
  opacity: 1; /* we’ll reveal via clip instead */
  z-index: 2;
  clip-path: inset(0 100% 0 0); /* Start fully hidden */
}

.bg-image.revealed {
  animation: clip-reveal 0.5s ease-out forwards;
}

@keyframes clip-reveal {
  from {
    clip-path: inset(0 100% 0 0);
  }
  to {
    clip-path: inset(0 0% 0 0);
  }
}

.fire-bar {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 80px;
  transform: translateX(-80px);
  background: url('/src/assets/images/fire.png') repeat-y;
  background-size: contain;
  background-position: right;
  z-index: 3;
}

.animate-fire {
  animation: fire-swipe-smooth 0.5s ease-out forwards; 
}

@keyframes fire-swipe-smooth {
  from {
    left: 0%;
  }
  to {
    left: 100%;
  }
}

@media (max-width: 800px) {
  .bg-image.revealed {
    animation: clip-reveal 0.2s ease-out forwards;
  }
  
  .animate-fire {
    animation: fire-swipe-smooth 0.2s ease-out forwards; 
  }
  
}
</style>