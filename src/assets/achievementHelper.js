export function unlockAchievementWithTracking(id, achievementIdsRef, unlockedAchievementsRef) {
  if (!id || !achievementIdsRef || !unlockedAchievementsRef) return;
  if (unlockedAchievementsRef.value.includes(id)) return;

  achievementIdsRef.value.push(id);
  unlockedAchievementsRef.value.push(id);

  if (typeof window !== 'undefined' && window.steam && typeof window.steam.unlockAchievement === 'function') {
    return window.steam.unlockAchievement(id);
  }
}
