// import { getAuth, onAuthStateChanged } from "firebase/auth";
// import { db } from "./main";
// import { retryPendingNameRefactors } from "./assets/refactor_player1_stats";
// import { retryPendingDBMerges } from "./assets/merge_player_stats";
// import { ref as dbRef, get, update, push, child,
//   query,
//   limitToLast,
//   getDatabase,
// ref, 
// remove } from "firebase/database"; 
// const deviceId = localStorage.getItem("deviceId");

// export function logReadSize(label, dataOrSnapshot) {
//   const data = typeof dataOrSnapshot.val === 'function' ? dataOrSnapshot.val() : dataOrSnapshot;
//   const json = JSON.stringify(data);
//   const bytes = new TextEncoder().encode(json).length;
//   const kb = (bytes / 1024).toFixed(2);
//   const cost = (bytes / 1_000_000 * 0.12).toFixed(5);

//   let logFn = console.log;
//   if (bytes > 2000) logFn = console.error;     // > 8 KB = ⚠️ expensive
//   else if (bytes > 500) logFn = console.warn; // > 4 KB = moderate

//   logFn(`📦 [${label}] ${bytes} bytes (~${kb} KB)`);
//   logFn(`→ Est. Blaze cost: $${cost}`);
// }

// const STORAGE_KEYS = [
//   "completedGames",
//   "completedLevel",
//   "names",
//   "roster",
//   "unlockSystem",
//   "unlockedMonsters",
//   "uAchi",
//   "monsterMastery1",
//   "monsterMastery1Set",
//   "isA",
// ];

// function getLevelIndex(value) {
//   return seeds.findIndex(lvl => lvl.name === value);
// }

// function getLocalData() {
//   const data = {};
//   STORAGE_KEYS.forEach(key => {
//     const val = localStorage.getItem(key);
//     if (val !== null) {
//       try {
//         data[key] = JSON.parse(val);
//       } catch {
//         data[key] = val;
//       }
//     }
//   });
//   return data;
// }

// function setLocalData(data) {
//   Object.entries(data).forEach(([key, val]) => {
//     if (val !== undefined) {
//       const toStore = typeof val === "object" ? JSON.stringify(val) : val;
//       localStorage.setItem(key, toStore);
//     }
//   });
// }

// function clearLocalData() {
//   STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
// }

// /**
//  * Push unsynced games from "gamesToPush" (if any) and update
//  * completedGames on remote via individual updates.
//  */
// let isPushing = false;

// async function pushUnsyncedGames(uid) {
//   if (isPushing) return;
//   isPushing = true;

//   try {
//     const raw = localStorage.getItem("gamesToPush");
//     if (!raw) return;

//     let toPush = JSON.parse(raw);
//     if (!Array.isArray(toPush) || !toPush.length) {
//       localStorage.removeItem("gamesToPush");
//       return;
//     }

//     localStorage.removeItem("gamesToPush");

//     const failed = [];
//     const completedGamesRef = dbRef(db, `users/${uid}/gameData/completedGames`);
//     logReadSize('complete games by user', completedGamesRef)
    
//     for (const game of toPush) {
//       try {
//         await push(completedGamesRef, game);
//       } catch (err) {
//         console.warn("Push failed:", err);
//         failed.push(game);
//       }
//     }

//     if (failed.length) {
//       console.log('REINSERTING')
//       // Reinsert only failed ones
//       const existing = JSON.parse(localStorage.getItem("gamesToPush") || "[]");
//       const merged = [...failed, ...existing];
//       localStorage.setItem("gamesToPush", JSON.stringify(merged));
//     }

//   } catch (err) {
//     console.error("Push failed critically:", err);
//   } finally {
//     isPushing = false;
//   }
// }

// // function to push completed Levels to db 
// async function syncCompletedLevels(uid) {
//   const local = JSON.parse(localStorage.getItem("completedLevels") || "{}");
//   const ref = dbRef(db, `users/${uid}/gameData/completedLevels`);

//   try {
//     const snap = await get(ref);
//     const remote = snap.exists() ? snap.val() : {};
//     logReadSize('completedLevels', snap);

//     const toUpdate = {};
//     const merged = { ...remote };

//     for (const [level, localVal] of Object.entries(local)) {
//       const remoteVal = remote[level] ?? -1;

//       if (localVal > remoteVal) {
//         toUpdate[level] = localVal;
//         merged[level] = localVal;
//       } else {
//         merged[level] = remoteVal;
//       }
//     }

//     if (Object.keys(toUpdate).length) {
//       await update(ref, toUpdate);
//     }

//     localStorage.setItem("completedLevels", JSON.stringify(merged));
//   } catch (err) {
//     console.error("Failed to sync completedLevels:", err);
//   }
// }

// // we want to update the stats with stats to update 
// const STATS_KEY = "statsToUpdate";

// async function syncStatsToDB(uid) {
//   console.log('sync stats to db called ')
//   // try to squash any unsynced names 
//   retryPendingDBMerges()
//   retryPendingNameRefactors()
//   const localRaw = localStorage.getItem(STATS_KEY);
//   if (!localRaw) return;

//   let localStats;
//   try {
//     localStats = JSON.parse(localRaw);
//   } catch {
//     console.warn("Corrupted statsToUpdate, removing...");
//     localStorage.removeItem(STATS_KEY);
//     return;
//   }

//   const statsRef = dbRef(db, `users/${uid}/playerStats`);
//   logReadSize('user stats ref', statsRef)
//   let remoteStats = {};

//   try {
//     const snap = await get(statsRef);
//     remoteStats = snap.exists() ? snap.val() : {};
//   } catch (err) {
//     console.warn("Failed to fetch remote stats:", err);
//     return;
//   }

//   // Merge incremental stats (localStats) into remoteStats
//   for (const [name, statGroup] of Object.entries(localStats)) {
//     if (!remoteStats[name]) remoteStats[name] = {};

//     for (const [statKey, amount] of Object.entries(statGroup)) {
//       if (typeof amount === 'object' && amount !== null) {
//         remoteStats[name][statKey] = remoteStats[name][statKey] || {};
//         for (const [innerKey, innerVal] of Object.entries(amount)) {
//           remoteStats[name][statKey][innerKey] =
//             (remoteStats[name][statKey][innerKey] || 0) + innerVal;
//         }
//       } else {
//         remoteStats[name][statKey] = (remoteStats[name][statKey] || 0) + amount;
//       }
//     }
//   }

//   try {
//     await update(statsRef, remoteStats);
//     localStorage.removeItem(STATS_KEY);  // Successfully synced, clear incremental stats

//     // update local to match db 
//     console.log(remoteStats)
//     localStorage.setItem('playerStats', JSON.stringify(remoteStats))
//     console.log("Stats synced successfully.");
//   } catch (err) {
//     console.warn("Stats sync failed:", err);
//   }
// }


// async function getLeaderboardForDate(date) {
//   const db = getDatabase();
//   const usersSnap = await get(ref(db, "users"));

//   const leaderboard = [];

//   const dateStr = date.toISOString().split("T")[0]; // "2025-05-17"

//   const userPromises = Object.keys(usersSnap.val() || {}).map(async userId => {
//     const gamesRef = ref(db, `users/${userId}/gameData/completedGames`);
//     const gamesSnap = await get(gamesRef);
//     const games = gamesSnap.val();

//     if (!games) return;

//     // Search games in reverse order
//     const gameEntries = Object.entries(games).reverse();
//     for (const [gameId, game] of gameEntries) {
//       const time = new Date(game.timeCompleted);
//       const gameDate = time.toISOString().split("T")[0];

//       if (gameDate === dateStr) {
//         leaderboard.push({
//           userId,
//           ...game,
//         });
//         break; // Stop once we find the first for this date
//       }
//       if (gameDate < dateStr) break; // No need to look further
//     }
//   });

//   await Promise.all(userPromises);
//   return leaderboard;
// }

// async function syncToDB(uid) {
//   if (!navigator.onLine) {
//     console.warn("Offline – skipping pushUnsyncedGames");
//     return;
//   }
//   const userRef = dbRef(db, `users/${uid}/gameData`);

//   const localData = getLocalData();

//   // First, push unsynced games individually
//   await pushUnsyncedGames(uid);
//   await syncStatsToDB(uid);
//   await syncCompletedLevels(uid);

//   // Get current remote data
//   const snapshot = await get(userRef);
//   const remoteData = snapshot.exists() ? snapshot.val() : {};

//   // Merge unlockedMonsters
//   const localUnlocked = new Set(localData.unlockedMonsters || []);
//   const remoteUnlocked = new Set(remoteData.unlockedMonsters || []);
//   const localAchievements = new Set(localData.uAchi || []);
//   const remoteAchievements = new Set(remoteData.uAchi || []);
//   const localMastery1 = new Set(localData.monsterMastery1 || []);
//   const remoteMastery1 = new Set(remoteData.monsterMastery1 || []);
//   const localMastery1Set = new Set(localData.monsterMastery1Set || []);
//   const remoteMastery1Set = new Set(remoteData.monsterMastery1Set || []);
//   const combinedUnlocked = Array.from(new Set([...localUnlocked, ...remoteUnlocked]));
//   const combinedAchievements = Array.from(new Set([...localAchievements, ...remoteAchievements]));
//   const safeUnlocked = combinedUnlocked.length ? combinedUnlocked : [];
//   const safeUnlockedAchievements = combinedAchievements.length ? combinedAchievements : [];
//   const combinedMastery1 = Array.from(new Set([...localMastery1, ...remoteMastery1]));
//   const safeMastery1 = combinedMastery1.length ? combinedMastery1 : [];
//   const combinedMastery1Set = Array.from(new Set([...localMastery1Set, ...remoteMastery1Set]));
//   const safeMastery1Set = combinedMastery1Set.length ? combinedMastery1Set : [];
//   // console.log('safeMastery1Set', safeMastery1Set)

//   // For completedLevel, choose the further level
//   const localLevel = localData.completedLevel || '';
//   const remoteLevel = remoteData.completedLevel || '';
//   const localIndex = getLevelIndex(localLevel);
//   const remoteIndex = getLevelIndex(remoteLevel);
//   const completedLevel = localIndex > remoteIndex ? localLevel : remoteLevel;

//   // === Set defaults for other synced fields ===
//   const names = localData.names || {};
//   const roster = localData.roster || "old";
//   const isAdmin = localData.isA || "";
//   const unlockSystem = localData.unlockSystem || "regular";

//    // === Final object to update ===
//    const updates = {
//     unlockedMonsters: safeUnlocked,
//     uAchi: safeUnlockedAchievements,
//     monsterMastery1: safeMastery1,
//     monsterMastery1Set: safeMastery1Set,
//     completedLevel: completedLevel,
//     names,
//     roster,
//     isA: isAdmin,
//     unlockSystem,
//   };

//   // === Remove any undefined (shouldn’t happen, but safety first) ===
//   for (const key in updates) {
//     if (updates[key] === undefined) {
//       delete updates[key];
//       console.warn(`Skipping undefined update for ${key}`);
//     }
//   }
  
//   if (Object.keys(updates).length > 0) {
//     console.log("Syncing to remote with data:", updates);
//     await update(userRef, updates);
//   } else {
//     console.log("Nothing to update to remote.");
//   }
// }


// const LOCAL_STATS_KEY = "playerStats";


// function mergeNames(remoteNames = {}, localNames = {}) {
//   const merged = {};
//   const defaultNames = {
//     player1: "Player 1",
//     player2: "Player 2",
//     player3: "Player 3",
//     player4: "Player 4",
//   };

//   for (const key of Object.keys(defaultNames)) {
//     const local = localNames?.[key] ?? defaultNames[key];
//     const remote = remoteNames?.[key];

//     // If local is just a default value, and remote exists, use remote
//     if (local === defaultNames[key] && remote) {
//       merged[key] = remote;
//     }
//     // Otherwise prefer local if it's set
//     else if (local && local !== defaultNames[key]) {
//       merged[key] = local;
//     }
//     // Fall back to remote if local is missing
//     else if (remote) {
//       merged[key] = remote;
//     }
//     // Otherwise default
//     else {
//       merged[key] = defaultNames[key];
//     }
//   }

//   return merged;
// }


// export async function syncStatsFromDB (uid){
//     // update local stats with new stats from db after syncing
//     const statsSnap = await get(dbRef(db, `users/${uid}/playerStats`));
//     logReadSize('stats', statsSnap)
//     const remoteStats = statsSnap.exists() ? statsSnap.val() : {};
//     const localStatsRaw = localStorage.getItem(LOCAL_STATS_KEY);
//     let localStats = {};
//     await syncCompletedLevels(uid);

//     try {
//       localStats = localStatsRaw ? JSON.parse(localStatsRaw) : {};
//     } catch {
//       localStats = {};
//     }
//     localStorage.setItem(LOCAL_STATS_KEY, JSON.stringify(remoteStats));
// }
// export async function syncFromDB(uid) {
//   if (!navigator.onLine) {
//     console.warn("Offline – skipping pushUnsyncedGames");
//     return;
//   }
//     try{

//     const dbRoot = dbRef(db, `users/${uid}/gameData`);
//     logReadSize('user game data', dbRoot)

//     // Fetch small user settings
//     const [
//       levelSnap,
//       unlockedMonstersSnap,
//       unlockedAchievementsSnap,
//       mastery1Snap,
//       mastery1SetSnap,
//       namesSnap,
//       rosterSnap,
//       isAdminSnap,
//       unlockSystemSnap
//     ] = await Promise.all([
//       get(child(dbRoot, "completedLevel")),
//       get(child(dbRoot, "unlockedMonsters")),
//       get(child(dbRoot, "uAchi")),
//       get(child(dbRoot, "monsterMastery1")),
//       get(child(dbRoot, "monsterMastery1Set")),
//       get(child(dbRoot, "names")),
//       get(child(dbRoot, "roster")),
//       get(child(dbRoot, "isA")),
//       get(child(dbRoot, "unlockSystem"))
//     ]);

//     console.log(levelSnap.val())

//     logReadSize('completedLevel', levelSnap);
//     logReadSize('unlockedMonsters', unlockedMonstersSnap);
//     logReadSize('unlockedAchievements', unlockedAchievementsSnap);
//     logReadSize('monsterMastery1', mastery1Snap);
//     logReadSize('monsterMastery1Set', mastery1SetSnap);
//     logReadSize('names', namesSnap);
//     logReadSize('roster', rosterSnap);
//     logReadSize('isA', isAdminSnap);
//     logReadSize('unlockSystem', unlockSystemSnap);

//     const localData = getLocalData();

//     // Pull last 10 completedGames to expensive we will no longer load them just store them locally 
//     // const recentGamesQuery = query(child(dbRoot, "completedGames"), limitToLast(90));
//     // const recentGamesSnap = await get(recentGamesQuery);

//     // logReadSize('completedGames', recentGamesSnap);
//     // console.log('gmsnap',recentGamesSnap.val())

//     // const remoteGames = Object.values(recentGamesSnap.val() || {}).map(game => {
//     //   if (!game.id) game.id = crypto.randomUUID();
//     //   return game;
//     // });

//     // Merge unlockedMonsters
//     const localUnlocked = new Set(localData.unlockedMonsters || []);
//     const remoteUnlocked = new Set(unlockedMonstersSnap.val() || []);
//     const combinedUnlocked = Array.from(new Set([...localUnlocked, ...remoteUnlocked]));
    
//     // Merge unlockedAchievements
//     const localAchievements = new Set(localData.uAchi || []);
//     const remoteAchievements = new Set(unlockedAchievementsSnap.val() || []);
//     const combinedAchievements = Array.from(new Set([...localAchievements, ...remoteAchievements]));

//     // Merge monsterMastery1
//     const localMastery1 = new Set(localData.monsterMastery1 || []);
//     const remoteMastery1 = new Set(mastery1Snap.val() || []);
//     const combinedMastery1 = Array.from(new Set([...localMastery1, ...remoteMastery1]));
//     const localMastery1Set = new Set(localData.monsterMastery1Set || []);
//     const remoteMastery1Set = new Set(mastery1SetSnap.val() || []);

//     const combinedMastery1Set = localMastery1Set.size
//       ? localMastery1Set  // ✅ prefer local if not empty
//       : remoteMastery1Set; // 🔁 fallback to remote if local is empty
      
//     // Determine furthest level
//     const localLevel = localData.completedLevel;
//     const remoteLevel = levelSnap.val();
//     const localIndex = getLevelIndex(localLevel);
//     const remoteIndex = getLevelIndex(remoteLevel);
//     const completedLevel = localIndex > remoteIndex ? localLevel : remoteLevel;

//     // names: namesSnap.exists() ? namesSnap.val() : localData.names || {"player1":"Player 1","player2":"Player 2","player3":"Player 3","player4":"Player 4"},

//     const remoteNames = namesSnap.exists() ? namesSnap.val() : {"player1":"Player 1","player2":"Player 2","player3":"Player 3","player4":"Player 4"};
//     const localNames = localData.names || {"player1":"Player 1","player2":"Player 2","player3":"Player 3","player4":"Player 4"};
//     const mergedNames = mergeNames(remoteNames, localNames);

//     const newLocalData = {
//       unlockedMonsters: combinedUnlocked,
//       uAchi: combinedAchievements,
//       monsterMastery1: combinedMastery1,
//       monsterMastery1Set: Array.from(combinedMastery1Set),
//       completedLevel,
//       names: mergedNames,
//       roster: rosterSnap.exists() ? rosterSnap.val() : localData.roster || "old",
//       isA: isAdminSnap.exists() ? isAdminSnap.val() : localData.isA || "",
//       unlockSystem: unlockSystemSnap.exists() ? unlockSystemSnap.val() : localData.unlockSystem || "regular",
//     };

//     console.log("Syncing to local (partial):", newLocalData);
//     setLocalData(newLocalData);
//   }
//   catch (err) {
//     console.error("syncFromDB error:", err);
//   }finally {
//     console.log("Sync from DB completed.");
//   }
// }

// export async function getAllArchivedGames(uid) {
//   const archiveRef = dbRef(db, `archivedGames/${uid}`);

//   try {
//     const snapshot = await get(archiveRef);
//     logReadSize('getAllArchivedGames', snapshot);
//     return snapshot.exists() ? snapshot.val() : {};
//   } catch (error) {
//     console.error('Error fetching archived games:', error);
//     return {};
//   }
// }

// /**
//  * Fetches a publicly shared game by its shareId.
//  * @param {string} shareId - The public share identifier.
//  * @returns {Promise<object|null>} The full game object or null if not found.
//  */
// export async function getSharedGame(uid, gameId) {
//   console.log('searching', uid, gameId);

//   const fullRef = dbRef(db, `users/${uid}/gameData/completedGames/${gameId}`);
//   const archiveRef = dbRef(db, `archivedGames/${uid}/${gameId}`);

//   // Try full game (has turn data)
//   const fullSnap = await get(fullRef);
//   if (fullSnap.exists()) {
//     const gameData = fullSnap.val();
//     const jsonString = JSON.stringify(gameData);
//     const byteSize = new Blob([jsonString]).size;

//     console.log(`📦 Game byte size: ${byteSize} bytes (~${(byteSize / 1024).toFixed(2)} KB)`);

//     logReadSize('check completed', fullSnap);
//     console.log("✅ Found in completedGames");
//     return { game: fullSnap.val(), isArchived: false };
//   }

//   // Only fetch archive if full game not found
//   const archivedSnap = await get(archiveRef);
//   if (archivedSnap.exists()) {


//     const gameData = archivedSnap.val();
//     const jsonString = JSON.stringify(gameData);
//     const byteSize = new Blob([jsonString]).size;

//     console.log(`📦 Game byte size: ${byteSize} bytes (~${(byteSize / 1024).toFixed(2)} KB)`);

//     logReadSize('sharedGame archivedGames', archivedSnap);
//     console.log("🗂️ Found in archivedGames");
//     return { game: archivedSnap.val(), isArchived: true };
//   }

//   console.warn("❌ Game not found in either location.", gameId);
//   return null;
// }
// /**
//  * Deletes player stats for a given player name under the specified user UID.
//  * 
//  * @param {string} uid - Firebase auth UID of the user
//  * @param {string} playerName - Name key under playerStats (e.g., "Skyler", "Player 1")
//  */
// export async function deletePlayerStats(uid, playerName) {
//   try {
//     const path = `users/${uid}/playerStats/${playerName}`;
//     const playerRef = ref(db, path);
//     await remove(playerRef);
//     console.log(`[deletePlayerStats] Removed stats for ${playerName} under uid ${uid}`);
//   } catch (err) {
//     console.error(`[deletePlayerStats] Failed to remove ${playerName}:`, err);
//   }
// }

// export function initUserSync(showAuthPrompt) {

//   const auth = getAuth();
//   console.log('init sync get auth',auth)

//   onAuthStateChanged(auth, async (user) => {
//     if(!user) return
//     await syncFromDB(user.uid);
//     if (user) {
//       await syncToDB(user.uid);
//     } else {
//       const agreed = localStorage.getItem("userAgreed");
//       if (!agreed) showAuthPrompt();
//     }
//   });
//   window.addEventListener("online", async () => {
//     const user = getAuth().currentUser;
//     if (user) await syncToDB(user.uid);
//   });
//   window.addEventListener("beforeunload", () => {
//     window.alert("Syncing your data before leaving...");
//     const user = getAuth().currentUser;
//     if (user) syncToDB(user.uid);
//   });
// }

// export async function logoutCleanup() {
//   const auth = getAuth();
//   const user = auth.currentUser;
//   if (user) {
//     try {
//       await syncToDB(user.uid);
//     } catch (err) {
//       console.warn("Failed to sync on logout:", err);
//     }
//   }
//   // do not clear the chacheSeed for streamers if they log out. keep that on the device
//   let cacheSeed = localStorage.getItem("cacheSeed");

//   clearLocalData();
//   localStorage.clear();

//   if (cacheSeed) {
//     localStorage.setItem("cacheSeed", cacheSeed);
//   }
//   if ( deviceId) {
//     localStorage.setItem("deviceId", deviceId);
//   }
// }

// export async function manualSync() {
//   const auth = getAuth();
//   console.log('manual sync get auth',auth)

//   const user = auth.currentUser;
//   if (user) {
//     try {
//       await syncToDB(user.uid);
//     } catch (err) {
//       console.warn("Manual sync failed:", err);
//     }
//   }
// }