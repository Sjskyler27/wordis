<template>
  <div class="tutorial-modal" role="dialog" aria-modal="true" :aria-labelledby="titleId">
    <div class="tutorial-modal-scrim"></div>
    <section ref="panel" class="tutorial-modal-panel animated-slide-up">
      <span class="tutorial-modal-kicker">Tutorial</span>
      <h2 :id="titleId">{{ hint.title }}</h2>
      <div v-if="hint.imageSrc" class="tutorial-modal-media">
        <img :src="hint.imageSrc" :alt="hint.mediaAlt || ''" />
      </div>
      <p>{{ hint.body }}</p>
      <div class="tutorial-modal-footer">
        <button ref="closeButton" type="button" class="tutorial-modal-button" @click="$emit('close')">
          {{ hint.closeLabel || 'Close' }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

const props = defineProps({
  hint: {
    type: Object,
    required: true
  }
});

defineEmits(['close']);

const closeButton = ref(null);
const panel = ref(null);
const titleId = `tutorial-modal-title-${props.hint.id || 'hint'}`;

const handleKeydown = (event) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeButton.value?.click();
    return;
  }

  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault();
    panel.value?.scrollBy({
      top: event.key === 'ArrowDown' ? 120 : -120,
      behavior: 'smooth'
    });
  }
};

onMounted(() => {
  nextTick(() => closeButton.value?.focus());
  window.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.tutorial-modal {
  position: fixed;
  inset: 0;
  z-index: 1400;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.tutorial-modal-scrim {
  position: absolute;
  inset: 0;
  background: rgba(12, 6, 18, 0.12);
}

.tutorial-modal-panel {
  visibility: hidden;
  position: relative;
  width: min(720px, 100%);
  max-height: min(84vh, 760px);
  overflow: auto;
  padding: 28px;
  border: 1px solid rgba(255, 220, 160, 0.28);
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(77, 24, 43, 0.78), rgba(35, 13, 39, 0.88));
  box-shadow: 0 26px 56px rgba(0, 0, 0, 0.42);
  color: #fff4df;
  font-family: 'Press Start 2P', system-ui, sans-serif;
  text-align: center;
}

.tutorial-modal-kicker {
  display: inline-block;
  margin-bottom: 10px;
  color: #ffd37c;
  font-size: 0.58rem;
  line-height: 1.4;
  text-transform: uppercase;
}

.tutorial-modal-panel h2 {
  margin: 0 0 18px;
  font-size: 1rem;
  line-height: 1.5;
  letter-spacing: 0;
}

.tutorial-modal-panel p {
  margin: 0;
  text-shadow: 2px 2px black;
  color: rgba(255, 246, 226, 0.86);
  font-size: 0.74rem;
  line-height: 1.85;
}

.tutorial-modal-media {
  display: flex;
  justify-content: center;
  margin: 0 auto 20px;
}

.tutorial-modal-media img {
  display: block;
  max-width: min(100%, 520px);
  max-height: 320px;
  object-fit: contain;
  border-radius: 8px;
  border: 1px solid rgba(255, 235, 195, 0.18);
}

.tutorial-modal-footer {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.tutorial-modal-button {
  min-width: 180px;
  padding: 13px 18px;
  border: 1px solid rgba(255, 236, 198, 0.34);
  border-radius: 10px;
  background: linear-gradient(180deg, #ffd37c, #bd4d48);
  color: #25101d;
  font-family: inherit;
  font-size: 0.65rem;
  line-height: 1.5;
  cursor: pointer;
}

.tutorial-modal-button:focus-visible,
.tutorial-modal-button:hover {
  outline: 3px solid rgba(130, 253, 238, 0.76);
  outline-offset: 3px;
}

@media (max-width: 640px) {
  .tutorial-modal-panel {
    padding: 22px;
  }

  .tutorial-modal-panel h2 {
    font-size: 0.82rem;
  }

  .tutorial-modal-panel p {
    font-size: 0.58rem;
  }
}
</style>
