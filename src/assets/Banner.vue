<template>
  <div v-if="show" class="modal">
    <div :class="['banner', 'animated-slow-slide-up', { blue: blue, orange: !blue, inmonster: inMonster }]" @click="close">
      <slot v-if="$slots.default"></slot>
      <p v-else-if="messageContent" v-html="messageContent"></p>
      <button v-if="dismissible" ref="primaryButton" class="dismiss-btn">X</button>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, onMounted, defineEmits, computed } from "vue";

const emit = defineEmits(['dismiss']);

const props = defineProps({
  messageContent: String,
  dismissible: Boolean,
  blue: Boolean,
  orange: Boolean,
  noFocus: Boolean,
  timer: Number,
  inMonster: Boolean
});

// Check if there's content (either a slot or messageContent)

const primaryButton = ref(null);
const show = ref(false);
onMounted(() => {
  if(props.timer && props.timer > 0) {
    setTimeout(() => {
      show.value = true;
    }, props.timer);
  }
  else {
    show.value = true;
  }

  if (primaryButton.value) {
    if(!props.noFocus){
      primaryButton.value.focus();
    }
  }
  window.addEventListener('keydown', focusPrimaryButton);
});

const focusPrimaryButton = (event) => {
  if (event.key === 'b' && primaryButton.value) {
    close();
    console.log('closed')
  }
};

const close = () => {
  emit('dismiss');
};
</script>

<style scoped>
.modal{
  background-color: rgba(0,0,0,0);  
  pointer-events: none;
  z-index: 9998;
}
.banner {
  visibility: hidden;
  font-family: 'Press Start 2P', cursive;
  color: white;
  padding: 45px;
  text-align: center;
  font-size: 24px;
  border-radius: 8px;
  position: fixed;
  bottom: 25vh;
  width: fit-content;
  min-width: 300px;
  z-index: 900;
  text-shadow: 1px 1px 0px rgba(0, 0, 0, 0.8);
  cursor: pointer;
  pointer-events: auto;
  line-height: 35px;
  margin-left: 60px;
  margin-right: 60px;
}
.inmonster{
  bottom: 2vh;
}

.blue {
  background-color: rgba(59, 99, 159,0.90);
  box-shadow: 4px 4px 0px rgba(59, 99, 159,0.6);
}

.orange {
  background: rgba(235, 155, 70, .8);
  box-shadow: 4px 4px 0px #8B5E3C;
}

/* Dismiss button */
.dismiss-btn {
  position: absolute;
  top: 7px;
  right: 7px;
  font-size: 18px;
  background: transparent;
  color: white;
  border: none;
  cursor: pointer;
  font-family: 'Press Start 2P', cursive;
  padding: 7px;
}

.dismiss-btn:hover {
  color: red;
}
   /* Responsive adjustments for mobile */
@media (max-width: 1230px) {
  .banner {
    padding: 25px;
    font-size: 14px;
    border-radius: 8px;
    bottom: 25vh;
    min-width: 100px;
    z-index: 900;
    line-height: 14px;
    margin: 30px;
  }
}
</style>