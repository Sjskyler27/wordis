<template>
  <div v-if="unlock" class="modifier-unlock-backdrop">
    <section class="modifier-unlock-modal animated-slide-up" role="dialog" aria-modal="true">
      <span class="reward-kicker">Modifier Unlocked</span>
      <strong>{{ unlock.label }}</strong>
      <div
        class="modifier-unlock-card"
        :class="[
          unlock.type === 'card' ? 'action-card modifier-unlock-action-card' : 'reward-card',
          unlock.group || unlock.type
        ]"
        :style="unlock.type === 'card' ? unlock.preview?.style : null"
      >
        <template v-if="unlock.type === 'card'">
          <span class="action-card-type">{{ formatCardKind(unlock.group) }}</span>
          <strong>{{ unlock.label }}</strong>
          <span class="modifier-unlock-card-description">{{ unlock.description }}</span>
        </template>
        <template v-else>
          <div
            v-if="unlock.type === 'tile'"
            class="modifier-preview-tile"
            :style="unlock.preview?.style"
          >
            <span
              v-if="unlock.preview?.badge && !unlock.preview?.hideBadge"
              class="modifier-preview-tile-badge"
              :style="unlock.preview?.badgeStyle"
            >
              {{ unlock.preview.badge }}
            </span>
            <span class="modifier-preview-tile-score">{{ unlock.preview?.score }}</span>
            <span class="modifier-preview-tile-letter">{{ unlock.preview?.letter }}</span>
          </div>
          <span>{{ unlock.group || unlock.type }}</span>
          <strong>{{ unlock.label }}</strong>
          <p>{{ unlock.description }}</p>
        </template>
      </div>
      <p class="modifier-unlock-reason">{{ unlock.reason }}</p>
      <div class="modifier-unlock-meta">
        <span>{{ unlock.type }}</span>
        <span>{{ currentIndex + 1 }} / {{ total }}</span>
      </div>
      <div class="modifier-unlock-actions">
        <button type="button" @click="$emit('previous')">Prev</button>
        <button type="button" class="primary" @click="$emit('next')">Next</button>
        <button type="button" @click="$emit('close')">Skip</button>
      </div>

    </section>
  </div>
</template>

<script setup>
defineProps({
  unlock: {
    type: Object,
    default: null
  },
  currentIndex: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  }
});

defineEmits(['previous', 'next', 'close', 'unlock-all']);

const formatCardKind = (kind = '') => {
  if (kind === 'trayModifier') return 'Tray Modifier';
  if (kind === 'tactic') return 'Tactic';
  if (kind === 'attack') return 'Attack';
  return kind || 'Card';
};
</script>

<style scoped>
.modifier-unlock-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9500;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(8, 6, 18, 0.72);
}

.modifier-unlock-modal {
  visibility: hidden;
  width: min(620px, calc(100vw - 32px));
  display: grid;
  gap: 14px;
  padding: 28px;
  border-radius: 24px;
  color: #fff7e8;
  background: rgba(72, 22, 48, 0.96);
  border: 2px solid rgba(255, 220, 144, 0.22);
  box-shadow: 0 24px 50px rgba(20, 6, 18, 0.34);
  font-family: 'Press Start 2P', cursive;
}

.modifier-unlock-modal .reward-kicker,
.modifier-unlock-meta,
.modifier-unlock-modal small {
  display: inline-block;
  color: #fff7e8;
  font-size: 0.72rem;
  letter-spacing: 0.16em;
  line-height: 1.4;
  opacity: 0.76;
  text-transform: uppercase;
}

.modifier-unlock-modal > strong {
  display: block;
  color: #ffd265;
  font-size: 1.5rem;
  line-height: 1.35;
}

.modifier-unlock-reason {
  margin: 0;
  color: #fff7e8;
  font-size: 0.76rem;
  line-height: 1.7;
  opacity: 0.78;
}

.modifier-unlock-meta,
.modifier-unlock-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.modifier-unlock-actions button,
.modifier-unlock-all {
  min-height: 38px;
  border: 1px solid rgba(255, 220, 144, 0.3);
  border-radius: 999px;
  padding: 0 14px;
  color: #ffe3a3;
  background: rgba(255, 202, 103, 0.14);
  font-family: inherit;
  font-size: 9px;
  cursor: pointer;
}

.modifier-unlock-actions .primary {
  color: #161827;
  background: #ffd265;
}

.modifier-unlock-all {
  justify-self: center;
  color: #fff;
  background: #b83945;
}

.modifier-unlock-card.reward-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-areas:
    "tile kind"
    "tile title"
    "tile body";
  gap: 8px 18px;
  min-height: 180px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 18px;
  color: #fff7e8;
  background: linear-gradient(180deg, rgba(76, 156, 138, 0.96), rgba(43, 92, 98, 0.94));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 14px 24px rgba(20, 6, 18, 0.22);
}

.modifier-unlock-card.reward-card.rare,
.modifier-unlock-card.reward-card.medium,
.modifier-unlock-card.reward-card.neutral {
  background: linear-gradient(180deg, rgba(82, 136, 215, 0.96), rgba(50, 62, 148, 0.94));
}

.modifier-unlock-card.reward-card.epic,
.modifier-unlock-card.reward-card.hard,
.modifier-unlock-card.reward-card.bad {
  background: linear-gradient(180deg, rgba(215, 151, 68, 0.98), rgba(142, 62, 72, 0.96));
}

.modifier-unlock-card.reward-card > span {
  grid-area: kind;
  font-size: 0.66rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.76;
}

.modifier-unlock-card.reward-card > strong {
  grid-area: title;
  color: #fff2bd;
  font-size: 1.1rem;
  line-height: 1.35;
}

.modifier-unlock-card.reward-card > p {
  grid-area: body;
  margin: 0;
  line-height: 1.42;
  opacity: 0.86;
}

.modifier-unlock-card.action-card {
  --card-glow: rgba(255, 255, 255, 0.16);
  --card-edge: rgba(255, 255, 255, 0.22);
  --card-pattern: rgba(255, 255, 255, 0.08);
  --card-background: linear-gradient(180deg, rgba(119, 206, 113, 0.96), rgba(63, 129, 84, 0.96));
  --card-badge-background: rgba(24, 8, 22, 0.26);
  --card-ink: #fff7ee;
  position: relative;
  display: grid;
  gap: 12px;
  min-height: 190px;
  padding: 20px;
  overflow: hidden;
  border: 1px solid var(--card-edge);
  border-radius: 22px;
  color: var(--card-ink);
  background: var(--card-background);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    inset 0 -3px 0 rgba(39, 11, 25, 0.28),
    0 14px 24px rgba(20, 6, 18, 0.22);
}

.modifier-unlock-card.action-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 18% 20%, var(--card-glow) 0, transparent 36%),
    linear-gradient(135deg, var(--card-pattern) 0%, transparent 35%, var(--card-pattern) 100%);
  opacity: 0.9;
  pointer-events: none;
}

.modifier-unlock-card.action-card::after {
  content: '';
  position: absolute;
  inset: 7px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.01));
  pointer-events: none;
}

.modifier-unlock-card.action-card > * {
  position: relative;
  z-index: 1;
}

.modifier-unlock-card.action-card > strong {
  color: #fff7ee;
  font-size: 1.28rem;
  line-height: 1.1;
  text-shadow: 0 1px 0 rgba(48, 18, 8, 0.28);
}

.modifier-unlock-card-description {
  color: rgba(255, 248, 236, 0.84);
  font-size: 0.9rem;
  line-height: 1.45;
}

.action-card-type {
  justify-self: start;
  padding: 5px 9px 4px;
  border-radius: 999px;
  color: rgba(255, 248, 236, 0.92);
  background: var(--card-badge-background);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
  font-size: 0.68rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.modifier-preview-tile {
  grid-area: tile;
  align-self: center;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 94px;
  height: 94px;
  border-radius: 16px;
  background: var(--tile-bg, linear-gradient(180deg, #fffef8 0%, #f2ebe0 70%, #d9cec0 100%));
  color: var(--tile-text-color, #1c1930);
  box-shadow: var(--tile-shadow, inset 0 -4px 0 rgba(0, 0, 0, 0.12), 0 10px 18px rgba(45, 10, 24, 0.16));
}

.modifier-preview-tile-letter {
  position: relative;
  z-index: 3;
  font-size: 2.4rem;
  font-weight: 900;
  line-height: 1;
  -webkit-text-stroke: var(--tile-letter-stroke, 0 transparent);
  paint-order: stroke fill;
}

.modifier-preview-tile-score {
  position: absolute;
  z-index: 5;
  top: 8px;
  right: 10px;
  font-size: 0.95rem;
  font-weight: 800;
}

.modifier-preview-tile-badge {
  position: absolute;
  z-index: 6;
  top: 6px;
  left: 7px;
  min-width: 30px;
  padding: 3px 7px;
  border-radius: 999px;
  font-size: 0.58rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-align: center;
  text-transform: uppercase;
  box-shadow: 0 4px 10px rgba(27, 11, 20, 0.18);
}
</style>
