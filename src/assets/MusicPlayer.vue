<template>
  <div class="music-player">
    <div class="music-player-header">
      <span>Background Music</span>
      <button
        type="button"
        class="shuffle-button"
        :class="{ active: shuffleEnabled }"
        :aria-pressed="shuffleEnabled"
        @click="emit('shuffleChange', !shuffleEnabled)"
      >
        Shuffle
      </button>
    </div>

    <div v-if="currentTrack" class="now-playing">
      <span class="track-label">Now Playing</span>
      <strong>{{ currentTrack.title }}</strong>
    </div>

    <div v-else class="now-playing empty">
      <span>No tracks found</span>
    </div>

    <div class="player-controls">
      <button type="button" :disabled="!tracks.length" @click="emit('previous')">Prev</button>
      <button
        type="button"
        class="primary-control"
        :disabled="!tracks.length"
        @click="isPlaying ? emit('pause') : emit('play')"
      >
        {{ isPlaying ? 'Pause' : 'Play' }}
      </button>
      <button type="button" :disabled="!tracks.length" @click="emit('next')">Next</button>
    </div>

    <div v-if="tracks.length > 1" class="track-list">
      <button
        v-for="track in tracks"
        :key="track.id"
        type="button"
        :class="{ active: track.id === currentTrackId }"
        @click="emit('trackSelect', track.id)"
      >
        {{ track.title }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  tracks: {
    type: Array,
    default: () => []
  },
  currentTrackId: {
    type: String,
    default: ''
  },
  isPlaying: Boolean,
  shuffleEnabled: Boolean
});

const emit = defineEmits([
  'play',
  'pause',
  'next',
  'previous',
  'shuffleChange',
  'trackSelect'
]);

const currentTrack = computed(() => props.tracks.find((track) => track.id === props.currentTrackId));
</script>

<style scoped lang="scss">
.music-player {
  display: grid;
  gap: 14px;
  padding: 14px;
  border: 1px solid rgba(255, 225, 180, 0.14);
  border-radius: 14px;
  background: rgba(18, 8, 20, 0.32);
}

.music-player-header,
.player-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.music-player-header {
  justify-content: space-between;
  color: rgba(255, 244, 223, 0.9);
  font-size: 0.62rem;
  line-height: 1.5;
}

.now-playing {
  display: grid;
  gap: 7px;
  min-height: 54px;
  padding: 12px;
  border: 1px solid rgba(255, 229, 190, 0.16);
  border-radius: 12px;
  background: rgba(32, 10, 24, 0.56);
  color: #fff2ce;

  strong {
    font-size: 0.72rem;
    line-height: 1.6;
  }
}

.now-playing.empty {
  place-items: center;
  color: rgba(255, 244, 223, 0.62);
  font-size: 0.6rem;
}

.track-label {
  color: rgba(255, 244, 223, 0.62);
  font-size: 0.52rem;
  line-height: 1.5;
}

.player-controls {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

button {
  min-height: 38px;
  padding: 9px 10px;
  border: 1px solid rgba(255, 229, 190, 0.24);
  border-radius: 10px;
  background: rgba(32, 10, 24, 0.74);
  color: #fff2ce;
  font-family: 'Press Start 2P', cursive;
  font-size: 0.54rem;
  line-height: 1.5;
  cursor: pointer;
}

button:hover,
button:focus-visible {
  outline: 3px solid rgba(130, 253, 238, 0.74);
  outline-offset: 2px;
  background: rgba(67, 21, 45, 0.86);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.42;
}

.primary-control,
.shuffle-button.active,
.track-list button.active {
  background: linear-gradient(180deg, rgba(255, 189, 101, 0.92), rgba(171, 72, 52, 0.9));
  color: #e8e7e8;
}

.shuffle-button {
  min-height: 34px;
}

.track-list {
  display: grid;
  gap: 8px;
  max-height: 158px;
  overflow: auto;
}

.track-list button {
  text-align: left;
}

@media (max-width: 560px) {
  .music-player-header,
  .player-controls {
    grid-template-columns: 1fr;
  }

  button,
  .now-playing strong,
  .music-player-header {
    font-size: 0.52rem;
  }
}
</style>
