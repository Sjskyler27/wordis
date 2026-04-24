<template>
  <aside class="personal-modifiers-drawer" aria-label="Personal modifiers">
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
  </aside>
</template>

<script setup>
defineProps({
  modifiers: {
    type: Array,
    default: () => []
  }
});
</script>

<style scoped>
.personal-modifiers-drawer {
  width: min(260px, 100%);
  align-self: stretch;
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

@media (max-width: 1250px) {
  .personal-modifiers-drawer {
    width: 100%;
    max-width: 720px;
    align-self: center;
  }
}
</style>
