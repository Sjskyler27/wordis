<template>
  <div class="modal-backdrop" @click.self="close">
    <div class="modal-content">
      <button class="close-btn" @click="close">&times;</button>
      <h2>Install App</h2>
      <p>Before You continue feel free to Install our app for a fullscreen experience and offline play capabilities!</p>
      <p>Apple users may have to add to home screen through Safari</p>
      <button class="install-btn" @click="install">Install Now</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, defineEmits } from 'vue';

const emit = defineEmits(['close']);

const deferredPrompt = ref(null);

const close = () => {
  localStorage.setItem('hasSeenPWA', true);
  emit('close');
};

const install = () => {
  if (deferredPrompt.value) {
    deferredPrompt.value.prompt();
    deferredPrompt.value.userChoice.then(choiceResult => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      deferredPrompt.value = null;
      close();
    });
  }
};

onMounted(() => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt.value = e;
    localStorage.setItem('hasSeenPWA', true);
  });
});
</script>
  
  <style scoped>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 10);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1020;
    width: 100vw;
    height: 100vh;
  }
  
  .modal-content {
    padding: 20px;
    border-radius: 8px;
    width: 90%;
    max-width: 400px;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    position: relative;
    text-shadow: 1px 1px 0px rgba(0, 0, 0, 0.8);
    line-height: 1.5;
  }
  
  .close-btn {
    position: absolute;
    top: 8px;
    right: 12px;
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
  }
  
  .install-btn {
    margin-top: 15px;
    padding: 8px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    background-color: rgb(140,10,10);
    text-shadow:2px 2px 2px rgba(0, 0, 0, 0.8);


  }
  
  </style>