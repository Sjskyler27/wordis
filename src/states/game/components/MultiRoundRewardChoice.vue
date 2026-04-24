<template>
  <div class="reward-choice-overlay">
    <div class="reward-choice-scrim"></div>
    <section class="reward-choice-panel animated-slide-up">
      <span class="reward-kicker">Round Complete</span>
      <strong>Choose a modifier</strong>
      <div class="reward-choice-grid">
        <button
          v-for="reward in rewards"
          :key="reward.key"
          type="button"
          class="reward-card"
          :class="reward.tier"
          @click="$emit('choose', reward.key)"
        >
          <span>{{ reward.tier }}</span>
          <strong>{{ reward.label }}</strong>
          <p>{{ reward.description }}</p>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
defineProps({
  rewards: {
    type: Array,
    required: true
  }
});

defineEmits(['choose']);
</script>

<style scoped>
.reward-choice-overlay {
  position: absolute;
  inset: 16px;
  z-index: 7;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reward-choice-scrim {
  position: absolute;
  inset: 0;
  border-radius: 30px;
  background: rgba(24, 8, 24, 0.72);
  backdrop-filter: blur(4px);
}

.reward-choice-panel {
  position: relative;
  z-index: 1;
  visibility: hidden;
  width: min(100%, 820px);
  padding: 24px;
  border-radius: 24px;
  color: #fff7e8;
  background: rgba(72, 22, 48, 0.96);
  border: 2px solid rgba(255, 220, 144, 0.22);
  box-shadow: 0 24px 50px rgba(20, 6, 18, 0.34);
}

.reward-kicker {
  display: inline-block;
  font-size: 0.72rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  opacity: 0.76;
}

.reward-choice-panel > strong {
  display: block;
  margin-top: 10px;
  color: #ffd265;
  font-size: 1.5rem;
}

.reward-choice-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.reward-card {
  appearance: none;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 18px;
  min-height: 190px;
  padding: 16px;
  text-align: left;
  color: #fff7e8;
  cursor: pointer;
  font: inherit;
  background: linear-gradient(180deg, rgba(76, 156, 138, 0.96), rgba(43, 92, 98, 0.94));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 14px 24px rgba(20, 6, 18, 0.22);
  transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
}

.reward-card.rare {
  background: linear-gradient(180deg, rgba(82, 136, 215, 0.96), rgba(50, 62, 148, 0.94));
}

.reward-card.epic {
  background: linear-gradient(180deg, rgba(215, 151, 68, 0.98), rgba(142, 62, 72, 0.96));
}

.reward-card:hover,
.reward-card:focus-visible {
  outline: none;
  transform: translateY(-3px);
  border-color: rgba(255, 236, 187, 0.62);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 18px 28px rgba(20, 6, 18, 0.28);
}

.reward-card span {
  display: inline-block;
  font-size: 0.66rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.76;
}

.reward-card strong {
  display: block;
  margin-top: 10px;
  font-size: 1.1rem;
  color: #fff2bd;
}

.reward-card p {
  margin: 12px 0 0;
  line-height: 1.42;
  opacity: 0.86;
}

@media (max-width: 720px) {
  .reward-choice-overlay {
    inset: 0;
    align-items: stretch;
  }

  .reward-choice-scrim {
    border-radius: 0;
  }

  .reward-choice-panel {
    width: 100%;
    max-height: 100%;
    overflow-y: auto;
    border-radius: 0;
  }

  .reward-choice-grid {
    grid-template-columns: 1fr;
  }

  .reward-card {
    min-height: 0;
  }
}
</style>
