<template>
  <div class="menu-option animated-fade-in" style="transform: translateX(-50%)" :class="[ fadeOut ? 'animated-fade-out':'', visible ? 'visible': '' ]">
    <img class="menu-img" :src="icon" alt="Achievement Icon">
    <div class="menu-text">
      <h3>{{ title }}</h3>
      <p>{{ description }}</p>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref } from 'vue';
import { achievements } from './achievements';
const props = defineProps({
  id: Number
});
const emit = defineEmits(['close']);
const fadeOut = ref(false);
const visible = ref(false);

console.log("AchievementNotification loaded");
const achievement = achievements.find(a => a.id === props.id);
if (!achievement) {
  console.error(`Achievement with id ${props.id} not found`);
}
const title = achievement ? achievement.title : 'Unknown Achievement';
const description = achievement ? achievement.description : 'No description available';
const defaultIcon = new URL('/src/assets/emojis/supplies.png', import.meta.url).href;
const icon = ref(defaultIcon);

if (achievement) {
  const testImage = new Image();
  testImage.src = achievement.path;
  console.log('testing img path', testImage.src)
  testImage.onload = () => { icon.value = achievement.path };
  testImage.onerror = () => { icon.value = defaultIcon };
}

console.log(`AchievementNotification: title=${title}, description=${description}, icon=${icon}`);

setTimeout(() => {
  visible.value = true;
  fadeOut.value = true;
  setTimeout(() => {
    visible.value = false;
  }, 200);
  setTimeout(() => {
    emit('close')
  }, 1000);
}, 5000);

</script>

<style lang="css" scoped>
.menu-option {
  position: absolute;
  visibility: hidden;
  top: 90px;
  left: 50%;
  transform: translateX(-50%) !important;
  z-index: 100;
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
.visible {
  visibility: visible !important;
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
  text-align: center;
  font-size: 16px;
  margin: 0;
  color: #f5d76e;
  font-family: 'Press Start 2P', cursive;
}

.menu-text p {
  text-align: center;
  font-size: 12px;
  margin: 4px 0 0;
  color: #ccc;
  font-family: 'Press Start 2P', cursive;
}

</style>