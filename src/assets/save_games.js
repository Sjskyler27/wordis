import { ref as dbRef, remove, set } from 'firebase/database';
import { auth, db, firebaseEnabled } from '../firebaseClient.js';

/**
 * Prunes a user's completed games down to the last 5 (from localStorage),
 * deletes all remote completed games, then re-uploads the last 5 by ID.
 */
export async function pruneCompletedGames() {
  if (!firebaseEnabled || !db || !auth) {
    console.warn("⏩ Skipping archive — Firebase is unavailable");
    return false;
  }

  const user = auth.currentUser;

  if (!navigator.onLine) {
    console.warn("⏩ Skipping archive — offline or not logged in or missing game ID");
    return false;
  }


  if (!user) {
    console.warn("User not logged in");
    return;
  }

  const uid = user.uid;
  const path = dbRef(db, `users/${uid}/gameData/completedGames`);

  // Get completedGames from localStorage
  const raw = localStorage.getItem("completedGames");
  if (!raw) {
    console.warn("No local completedGames found");
    return;
  }

  let localGames;
  try {
    localGames = JSON.parse(raw);
  } catch (err) {
    console.error("Failed to parse local completedGames");
    return;
  }

  const validGames = localGames.filter(g => g.id && g.timeCompleted && g.level && Array.isArray(g.players)).reverse();
  const toKeep = validGames.slice(0, 3);

  // Delete all remote completed games
  try {
    await remove(path);

    // Upload the 3 kept games by their ID, but only a trimmed version of each
    for (const game of toKeep) {
      const trimmedGame = {
        id: game.id,
        level: game.level,
        seed: game.seed,
        timeCompleted: game.timeCompleted,
        rounds: game.rounds,
        ...(game.masteryLevel != null && { m: game.masteryLevel }),
        players: game.players.map(p => ({
          name: p.name,
          emerald: p.emerald,
          bust: p.bust,
          totalRiskyPulls: p.totalRiskyPulls,
          deck: (p.deck || []).map(monster => ({
            name: monster.name,
            fame: monster.fame,
            fear: monster.fear,
            gold: monster.gold,
            emerald: monster.emerald,
            class: monster.class ? `${monster.class}` : 'base',
            action: monster.action ? { name: monster.action.name } : undefined,
          }))
        }))
      };

      const gameRef = dbRef(db, `users/${uid}/gameData/completedGames/${game.id}`);
      await set(gameRef, trimmedGame);
    }
  } catch (error) {
    console.warn("Failed to prune completed games in Firebase.", error);
    return false;
  }

  console.log(`✅ Replaced completedGames with ${toKeep.length} most recent from localStorage`);
  return true;
} 
