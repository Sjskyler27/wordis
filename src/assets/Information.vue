<template>
  <div class="drawer-backdrop">
    <teleport to="body">
      <transition name="drawer-fade">
        <div
          v-if="monster"
          class="monster-drawer-backdrop"
          @click.self="emit('close')"
        >
          <div
            class="monster-drawer"
            @click="emit('close')"
            ref="drawer"
          >
            <h2 class="monster-name">{{ monster?.name }}</h2>
            <div class="monster-container">
              <div class="monster-preview" :class="{ 'hidden-info': hideInfo }">
                <Monster
                  :monsterValues="monster"
                  :fear="monster.fear"
                  :fame="monster.fame"
                  :gold="monster.gold"
                  :action="monster.action"
                  :uniqueId="monster.uniqueId"
                  :id="monster.id"
                  :inShop="true"
                  :refreshMastery="refreshKey"
                />
              </div>
            </div>

            <p v-if="monster?.description" class="monster-description">{{ monster.description }}</p>

            <div v-if="monster?.action?.name" class="monster-section">
              <h3 class="section-heading">Action: <span class="action-name">{{ monster.action.name }}</span></h3>
              <p>{{ monster.action.description }}</p>
            </div>

            <div v-if="monster?.class" class="monster-section">
              <h3 class="section-heading">Class: <span class="player">{{ className }}</span></h3>
              <p>{{ classDescription }}</p>
            </div>

            <div v-if="monster?.lore" class="monster-section">
              <h3 class="section-heading">Lore</h3>
              <p>{{ (props.hideLore) ? '???' : monster.lore }}</p>
            </div>

            <div v-if="monster?.tips" class="monster-section">
              <h3 class="section-heading">Tips</h3>
              <ul>
                <li v-for="(tip, i) in monsterTips" :key="i">{{ tip }}</li>
              </ul>
            </div>

            <div class="monster-section" v-if="isEligibleForMastery">
              <h3 class="section-heading">Mastery</h3>
              <button class="toggle-button" @click="toggleMastery">
                {{ isMastered ? 'Hide Mastery 1' : 'Show Mastery 1' }}
              </button>
            </div>

            <div class="monster-section" v-if="allowCycle && !hideInfo">
              <h3 class="section-heading">Free Play</h3>
              <p>{{isGreenlisted ? 'This character is guaranteed to show up in free play seeds.' : ( isBlacklisted ? 'This character is blacklisted and will not show up in free play seeds.' : 'This character may show up in free play seeds.')}}</p>
              <button class="toggle-button" @click="emit('cycle')">
                {{ isGreenlisted ? 'Blacklist Character' : isBlacklisted ? 'Remove from blacklist' : 'Guarantee Character'}}
              </button>
            </div>

            <button class="close-button" @click="emit('close')">Close</button>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, computed, onMounted, onUnmounted } from 'vue';
import Monster from '/src/assets/monsters/Monster.vue';

const props = defineProps({
  monsterId: Number,
  monsterValues: Object,
  monsterRoster: Array,
  hideInfo: Boolean,
  showColor: Boolean,
  hideTip: Boolean,
  hideLore: Boolean,
  allowCycle: Boolean,
  isGreenlisted: Boolean,
  isBlacklisted: Boolean,
});
console.log('Information.vue props:', props);

const emit = defineEmits(['close', 'refresh', 'cycle', 'greenlist', 'blacklist', 'noList']);
const refreshKey = ref(0); // Used to force re-computation of monster
const monster = computed(() => {
  const tempMonster = props.monsterRoster.find(m => m.id === props.monsterId) || {};
  const values = props.monsterValues || {};

  refreshKey.value; // dependency

  return {
    ...tempMonster,
    ...values,
  };
});

const classNames = {
  base: ["Base Hand", "This is one of your starting characters."],
  rawstats: ["Basic Stats", 'This character does not have any particularly special abilities'],
  statgiver: ["Stat Giver", 'This character will give you fame or gold directly. '],
  deckmanipulator: ["Deck Manipulator", 'This character can affect your deck in some way.'],
  handmanipulator: ["Hand Manipulator", 'This character can affect your hand in some way.'],
  statmanipulator: ["Stat Manipulator", 'This character can affect the stats or actions of other characters in some way.'],
  selfstatmanipulator: ["Self Stat Manipulator", 'This character can affect the stats or actions of itself in some way.'],
  charactercreator: ["Character Creator", 'This character will create a new character in your hand or deck.']
};

const className = computed(() => classNames[monster.value?.class]?.[0] ?? '');
const classDescription = computed(() => classNames[monster.value?.class]?.[1] ?? '');
const monsterTips = computed(() => {
  if (props.hideInfo) return ['???'];
  return Array.isArray(monster.value?.tips) ? monster.value.tips : [monster.value?.tips];
});

const mastery1Unlocked = ref([]);
const mastery1Set = ref(new Set());

onMounted(() => {
  mastery1Unlocked.value = JSON.parse(localStorage.getItem('monsterMastery1') || '[]');
  const saved = JSON.parse(localStorage.getItem('monsterMastery1Set') || '[]');
  mastery1Set.value = new Set(saved);
  window.addEventListener('keydown', keyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', keyDown);
});

const isEligibleForMastery = computed(() => monster.value?.id && mastery1Unlocked.value.includes(monster.value.id));
const isMastered = computed(() => monster.value?.id && mastery1Set.value.has(monster.value.id));

function toggleMastery() {
  const id = monster.value?.id;
  if (!id) return;
  if (mastery1Set.value.has(id)) {
    mastery1Set.value.delete(id);
  } else {
    mastery1Set.value.add(id);
  }
  refreshKey.value++; // Force re-computation
  emit('refresh');
  localStorage.setItem('monsterMastery1Set', JSON.stringify([...mastery1Set.value]));
}

const drawer = ref(null);
const touchStartX = ref(0);
const touchEndX = ref(0);

// const onTouchStart = (e) => {
//   touchStartX.value = e.changedTouches[0].screenX;
// };
// const onTouchMove = (e) => {
//   touchEndX.value = e.changedTouches[0].screenX;
// };
// const onTouchEnd = () => {
//   const distance = touchStartX.value - touchEndX.value;
//   if (distance > 50) emit('close');
// };

const keyDown = (event) => {
  if (event.key === 'b') emit('close');
};
</script>

<style lang="scss" scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
.drawer-backdrop {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.0);
  z-index: 9998;
}
.monster-drawer-backdrop {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background: rgba(10, 10, 20, 0.85);
  z-index: 9999;
  display: flex;
  justify-content: flex-end;
  font-family: 'Press Start 2P', cursive;
  animation: fadeIn 0.3s ease;
}

.monster-drawer {
  background: #1a1a2d;
  color: #f0f0f0;
  width: 400px;
  height: 100%;
  padding: 2rem;
  overflow-y: auto;
  box-shadow: -2px 0 12px rgba(0,0,0,0.6);
  position: relative;
  display: flex;
  animation: slideIn 0.3s ease;
  flex-direction: column;
  gap: 1.25rem;
  font-size: 12px;
}

.monster-container {
  display: flex;
  justify-content: center;
}

.monster-preview {
  margin-top: 2rem;
  margin-bottom: 2rem;
  scale: 1.2;
  &.hidden-info {
    filter: grayscale(100%) brightness(0.8);
  }
}

.monster-name {
  font-size: 18px;
  margin: 0;
  color: #fdd835;
}

.monster-description {
  font-style: italic;
  color: #ccc;
}

.section-heading {
  font-size: 14px;
  color: #90caf9;
  margin-bottom: 0.25rem;
}

.action-name {
  color: #ffcc00;
}

ul {
  padding-left: 1rem;
  list-style-type: square;
  color: #eee;
}

.close-button {
  margin-top: auto;
  padding: 0.5rem 1rem;
  background: #d32f2f;
  color: white;
  border: none;
  cursor: pointer;
  border-radius: 4px;
  font-size: 12px;
  font-family: 'Press Start 2P', cursive;
}

.toggle-button {
  margin-top: 0.5rem;
  padding: 0.4rem 0.8rem;
  background: rgb(140,10,10);
  color: white;
  border: none;
  cursor: pointer;
  border-radius: 4px;
  font-size: 12px;
  font-family: 'Press Start 2P', cursive;

  &:hover {
  background-color: rgb(120,10,10);

  }
}

.drawer-fade-enter-active {
  animation: slideIn 0.3s ease-out, fadeIn 0.3s ease-out;
}
.drawer-fade-leave-active {
  animation: slideOut 0.2s ease-in forwards;
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes slideOut {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(100%); opacity: 0; }
}
@keyframes fadeIn {
  from { background: rgba(10, 10, 20, 0); }
  to { background: rgba(10, 10, 20, 0.85); }
}

@media (max-width: 800px) {
  .monster-preview {
    margin-top: 0rem;
    margin-bottom: 0rem;
    scale: 1.2;
  }
}
</style>