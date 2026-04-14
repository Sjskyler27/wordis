<template>
  <div v-if="show" class="intro-screen" @click="skip">
    <div class="overlay" :class="{ 'fade-overlay': phase === 'done' }"></div>
    <img
      src="/src/assets/images/logos/SkyKing.gif"
      alt="Dungeon Draft Logo"
      class="logo"
      :class="{
        'fade-in': phase === 'fadeIn',
        'hold': phase === 'hold',
        'fade-out': phase === 'fadeOut'
      }"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, defineEmits } from 'vue'

const emit = defineEmits(['finished'])

const show = ref(true)

const phase = ref('')
const skipPhase = ref(false)

const skip = () => {
  phase.value = 'done'
  skipPhase.value = true
  setTimeout(() => {  
    emit('finished')
  }, 500);
  // show.value = false
  // emit('finished')
}
onMounted(() => {
  setTimeout(() => {
    if(!skipPhase.value) phase.value = 'fadeIn'
    setTimeout(() => {
      if(!skipPhase.value) phase.value = 'hold'
      setTimeout(() => {
        if(!skipPhase.value) phase.value = 'fadeOut'
        setTimeout(() => {
          if(!skipPhase.value) phase.value = 'done'
          setTimeout(() => {
            emit('finished')
          }, 500);
        }, 600)
      }, 800)
    }, 1400)
  }, 800)
})
</script>

<style scoped lang="scss">
.intro-screen {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  overflow: hidden;
  cursor: pointer;

  .overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 22, 0.99);
    transition: opacity 0.9s ease;
    z-index: 1;
    opacity: 1;

    &.fade-overlay {
      opacity: 0;
    }
  }

  .logo {
    position: relative;
    z-index: 2;
    width: 40%;
    height: auto;
    opacity: 0;
    transform: scale(0.95);
    transition: opacity 0.8s ease, transform 0.8s ease;

    &.fade-in {
      opacity: 1;
      transform: scale(1);
    }

    &.hold {
      opacity: 1;
      transform: scale(1);
      transition: none;
    }

    &.fade-out {
      opacity: 0;
      transform: scale(1.05);
      transition: opacity 0.8s ease, transform 0.8s ease;
    }
  }
}
</style>