<template>
  <div class="profile-modal-backdrop animated-fade-in">
    <div class="profile-modal animated-slide-up">
      <button ref="closeButton" class="profile-close" @click="emit('close')">&times;</button>
      <h2>Profile</h2>

      <div class="profile-details">
        <span>Signed in as</span>
        <strong>{{ user?.email || 'Wordis player' }}</strong>
      </div>

      <label class="sync-toggle">
        <input
          type="checkbox"
          :checked="savedGameSyncEnabled"
          @change="emit('savedGameSyncChange', $event.target.checked)"
        />
        <span>Sync saved games</span>
      </label>

      <div class="profile-actions">
        <button ref="logoutButton" class="profile-button danger" @click="emit('logout')">Log Out</button>
        <button ref="doneButton" class="profile-button" @click="emit('close')">Done</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';

defineProps({
  user: Object,
  savedGameSyncEnabled: Boolean
});

const emit = defineEmits(['close', 'logout', 'savedGameSyncChange']);
const closeButton = ref(null);
const logoutButton = ref(null);
const doneButton = ref(null);

const focusTargets = [closeButton, logoutButton, doneButton];

const focusTarget = (index) => {
  const availableTargets = focusTargets.filter((target) => target.value);
  const targetIndex = (index + availableTargets.length) % availableTargets.length;
  availableTargets[targetIndex]?.value?.focus();
};

const handleKeyDown = (event) => {
  if (event.key === 'Escape' || event.key === 'b') {
    event.preventDefault();
    emit('close');
    return;
  }

  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
    return;
  }

  const availableTargets = focusTargets.filter((target) => target.value);
  const currentIndex = availableTargets.findIndex((target) => target.value === document.activeElement);
  const nextIndex = event.key === 'ArrowDown' ? currentIndex + 1 : currentIndex - 1;
  event.preventDefault();
  focusTarget(currentIndex === -1 ? 0 : nextIndex);
};

onMounted(() => {
  doneButton.value?.focus();
  window.addEventListener('keydown', handleKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.profile-modal-backdrop {
  visibility: hidden;
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 8, 18, 0.76);
}

.profile-modal {
  visibility: hidden;
  position: relative;
  width: min(420px, calc(100vw - 32px));
  border: 4px solid #f7d35d;
  border-radius: 8px;
  padding: 28px;
  color: #fff;
  font-family: 'Press Start 2P', cursive;
  background: linear-gradient(180deg, rgba(36, 46, 62, 0.98), rgba(20, 25, 39, 0.98));
  box-shadow: 0 20px 42px rgba(0, 0, 0, 0.42);
}

.profile-close {
  position: absolute;
  top: 8px;
  right: 10px;
  border: 0;
  color: #fff;
  background: transparent;
  font-size: 28px;
  cursor: pointer;
}

h2 {
  margin: 0 0 22px;
  color: #f7d35d;
  font-size: 22px;
  text-align: center;
}

.profile-details {
  display: grid;
  gap: 10px;
  margin-bottom: 22px;
  font-size: 10px;
  line-height: 1.6;
}

.profile-details strong {
  overflow-wrap: anywhere;
  color: #9ff0ff;
}

.sync-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  font-size: 11px;
  line-height: 1.5;
  cursor: pointer;
}

.sync-toggle input {
  width: 20px;
  height: 20px;
}

.profile-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.profile-button {
  min-height: 44px;
  border: 0;
  border-radius: 6px;
  color: #111827;
  background: #f7d35d;
  font-family: inherit;
  font-size: 10px;
  cursor: pointer;
}

.profile-button.danger {
  color: #fff;
  background: #b83945;
}

.profile-button:focus-visible,
.profile-close:focus-visible {
  outline: 3px solid rgba(130, 253, 238, 0.9);
  outline-offset: 3px;
}
</style>
