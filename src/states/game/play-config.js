import { ref } from 'vue';

export const PLAY_MODES = {
  TIMED_SOLO: 'timed_solo',
  BOT_MATCH: 'bot_match',
  MULTI_ROUND: 'multi_round',
  MULTIPLAYER: 'multiplayer'
};

export const BOT_DIFFICULTIES = {
  EASY: 'easy',
  NORMAL: 'normal',
  HARD: 'hard'
};

export const playMode = ref(PLAY_MODES.TIMED_SOLO);
export const botDifficulty = ref(BOT_DIFFICULTIES.EASY);
export const soloTimerSeconds = ref(180);
export const overtimeEnabled = ref(JSON.parse(localStorage.getItem('overtimeEnabled') ?? 'true'));

export const updatePlayConfig = ({
  mode = playMode.value,
  difficulty = botDifficulty.value,
  timerSeconds = soloTimerSeconds.value,
  overtime = overtimeEnabled.value
} = {}) => {
  playMode.value = mode;
  botDifficulty.value = difficulty;
  soloTimerSeconds.value = timerSeconds;
  overtimeEnabled.value = overtime;
  localStorage.setItem('overtimeEnabled', JSON.stringify(overtime));
};
