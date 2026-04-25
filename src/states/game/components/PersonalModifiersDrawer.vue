<template>
  <button
    type="button"
    class="personal-modifiers-handle"
    :class="{ open: isOpen }"
    :aria-expanded="isOpen"
    aria-controls="personal-modifiers-drawer"
    @click="toggleDrawer"
  >
    <span class="personal-modifiers-handle-grip"></span>
    <strong>{{ modifiers.length }}</strong>
  </button>
  <button
    v-if="isOpen"
    type="button"
    class="personal-modifiers-scrim"
    aria-label="Close personal modifiers"
    @click="closeDrawer"
  ></button>
  <aside
    id="personal-modifiers-drawer"
    class="personal-modifiers-drawer"
    :class="{ open: isOpen }"
    aria-label="Personal modifiers"
  >
    <div class="personal-modifiers-drawer-content">
      <div class="personal-modifiers-header">
        <span>Personal Modifiers</span>
        <strong>{{ modifiers.length }}</strong>
      </div>
      <ul v-if="modifiers.length" class="personal-modifier-list">
        <li
          v-for="modifier in modifiers"
          :key="modifier.key"
          class="personal-modifier"
          :class="modifier.tier"
        >
          <div>
            <span>{{ modifier.tier }}</span>
            <strong>{{ modifier.label }}</strong>
          </div>
          <small>{{ modifier.description }}</small>
          <em v-if="modifier.stacks > 1">x{{ modifier.stacks }}</em>
        </li>
      </ul>
      <p v-else>No modifiers yet.</p>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  modifiers: {
    type: Array,
    default: () => []
  }
});

const isOpen = ref(false);

const closeDrawer = () => {
  isOpen.value = false;
};

const toggleDrawer = () => {
  isOpen.value = !isOpen.value;
};

defineExpose({
  closeDrawer,
  toggleDrawer
});
</script>

<style scoped>
.personal-modifiers-handle,
.personal-modifiers-scrim {
  display: none;
}

.personal-modifiers-drawer {
  width: min(260px, 100%);
  align-self: stretch;
}

.personal-modifiers-drawer-content {

  max-height: 1000px;
  height: 100%;
  padding: 18px;
  border-radius: 24px;
  color: #fff7e8;
  background: rgba(56, 19, 48, 0.84);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 18px 38px rgba(35, 8, 27, 0.2);
}

.personal-modifiers-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.personal-modifiers-header span {
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.76;
}

.personal-modifiers-header strong {
  color: #ffd265;
}

.personal-modifier-list {
  list-style: none;
  display: grid;
  gap: 10px;
  margin: 14px 0 0;
  padding: 0;
}

.personal-modifier {
  position: relative;
  display: grid;
  gap: 6px;
  padding: 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.personal-modifier.rare {
  border-color: rgba(91, 218, 255, 0.34);
}

.personal-modifier.epic {
  border-color: rgba(255, 206, 102, 0.42);
  background: rgba(255, 188, 83, 0.12);
}

.personal-modifier span {
  display: block;
  font-size: 0.62rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.72;
}

.personal-modifier strong {
  display: block;
  margin-top: 4px;
  color: #fff2bd;
}

.personal-modifier small {
  line-height: 1.35;
  opacity: 0.82;
}

.personal-modifier em {
  position: absolute;
  top: 10px;
  right: 10px;
  font-style: normal;
  font-weight: 900;
  color: #6ff5dd;
}

.personal-modifiers-drawer p {
  margin: 14px 0 0;
  opacity: 0.74;
}

@media (max-width: 1249px) {
  .personal-modifiers-handle {
    height: 70px;
    position: fixed;
    top: 25%;
    right: 0;
    z-index: 31;
    transform: translateY(-50%);
    border: 1px solid rgba(255, 238, 214, 0.16);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 50px;
    padding: 10px 8px 10px 10px;
    border-radius: 14px 0 0 14px;
    background: rgba(55, 13, 31, 0.94);
    color: rgba(255, 244, 228, 0.86);
    font-family: inherit;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    box-shadow: 0 12px 28px rgba(30, 8, 22, 0.22);
    transition: right 220ms ease, transform 180ms ease, background 180ms ease, color 180ms ease;
  }

  .personal-modifiers-handle.open {
    right: min(320px, calc(100vw - 52px));
  }

  .personal-modifiers-handle strong {
    color: #ffd265;
    line-height: 1;
  }

  .personal-modifiers-handle-grip {
    width: 11px;
    height: 35px;
    border-radius: 999px;
    background: rgba(111, 245, 221, 0.82);
    flex: 0 0 auto;
  }

  .personal-modifiers-scrim {
    position: fixed;
    inset: 0;
    display: block;
    z-index: 29;
    border: none;
    background: rgba(18, 6, 17, 0.28);
  }

  .personal-modifiers-drawer {
    position: fixed;
    top: 18px;
    right: 0;
    bottom: 18px;
    z-index: 30;
    width: min(320px, calc(100vw - 52px));
    max-width: none;
    padding: 18px 16px 22px;
    border-left: 2px solid rgba(255, 255, 255, 0.12);
    background: linear-gradient(180deg, rgba(63, 18, 58, 0.94), rgba(37, 12, 36, 0.96));
    box-shadow: -24px 0 42px rgba(18, 6, 17, 0.24);
    overflow-y: auto;
    transform: translateX(calc(100% + 16px));
    transition: transform 220ms ease;
  }

  .personal-modifiers-drawer.open {
    transform: translateX(0);
  }

  .personal-modifiers-drawer-content {
    max-height: 1000px;
    padding: 0;
    border: none;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }
}
</style>
