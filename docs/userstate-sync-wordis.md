# Wordis User State Sync

This document describes how Wordis creates and syncs Firebase user state without Cloud Functions.

## Firebase Shape

Wordis stores per-user data under `users/${uid}`:

- `gameData.completedGames`: Reserved for completed game records.
- `gameData.botDifficultyCompletion`: The highest bot difficulty the player has unlocked.
- `gameData.multiRoundHighScores`: Best Wordis Run score per difficulty.
- `svgms`: Saved game payloads, created only when a save exists.

The first login/sign-up initializer writes the blank user shell:

```json
{
  "gameData": {
    "completedGames": {},
    "pstgms": {},
    "multiRoundHighScores": {}
  }
}
```

Realtime Database may omit empty child objects in the console until a real completed game is written.

## Files

- `src/userstate/initializeNewUser.js`: Ensures `users/${uid}` exists after sign-up or login.
- `src/userstate/syncUserState.js`: Handles up/down sync for saved games, bot difficulty progress, and multi-round high scores.
- `src/userstate/multiRoundHighScores.js`: Calculates, stores, and merges Wordis Run high scores.
- `src/userstate/pastGames.js`: Saves completed game summaries and lazily syncs profile history.
- `src/states/game/save-state.js`: Owns save validation, local save keys, and import/export helpers.

The old `src/syncUserState.js` remains a reference only. New user-state behavior should live under `src/userstate`.

## Saved Games

Local saves live under:

- `wordis:save:mr`
- `wordis:save:bt`

Cloud saves live under:

- `users/${uid}/svgms/mr`
- `users/${uid}/svgms/bt`

Each save has `v`, `m`, and `ts`. Sync compares local and remote `ts`:

- Remote newer: import the remote save into local storage.
- Local newer: upload the local save to Firebase.
- Same or missing: leave the newer known copy alone.

Saved-game sync can be disabled per device with `wordis:sync:saved-games-enabled=false`. Bot difficulty progress and multi-round high scores still sync.

## Multi-Round High Scores

Local high scores live under:

- `wordis:mr-high-scores`

Cloud high scores live under:

- `users/${uid}/gameData/multiRoundHighScores/${difficulty}`

Each difficulty keeps its own best score. A run score is the sum of each recorded round's remaining seconds, points scored above that round's target, and the run's highest single-word score. Sync resolves conflicts by keeping the larger score for each difficulty; if scores tie, the newer `updatedAt` record wins.

## Sync Timing

`syncUserState()` runs after auth is available and on online events. It is rate-limited by `wordis:userstate:last-sync-at` so normal sync runs no more than once every ten minutes.

Manual sync, logout cleanup, and account creation can force a sync.

## Bot Difficulty Progress

The current progression source is `localStorage.botDefaultDifficulty`.

Sync stores the highest unlocked difficulty in:

```json
{
  "gameData": {
    "botDifficultyCompletion": {
      "maxUnlocked": "normal",
      "updatedAt": 1710000000000
    }
  }
}
```

When local and remote differ, the higher ranked difficulty wins.

## Past Games

Completed game summaries live under `gameData/pstgms/${mode}/${gameId}` and local storage key `wordis:pstgms`.

Past games are not synced on login. They sync when the player opens the Past Games tab in the profile modal. See `docs/past-games-wordis.md` for the record shape.
