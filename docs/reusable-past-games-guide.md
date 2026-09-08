# Reusable Past Games Guide

This guide describes a profile history pattern for games with local storage and Firebase Realtime Database.

## Goals

- Save one compact record per completed game.
- Keep detailed play logs out of profile history.
- Group records by game mode.
- Allow mode-by-mode save and display toggles.
- Sync only when the player opens history or explicitly requests sync.

## Recommended Paths

Local:

- `localStorage.my-game:pstgms`

Cloud:

- `users/${uid}/gameData/pstgms/${mode}/${gameId}`

Mode subpaths keep profile history easy to query, disable, and render in tabs.

## Compact Record

Use short keys for repeated profile records:

- `v`: schema version.
- `id`: unique game id.
- `m`: mode.
- `rs`: result.
- `ca`: completed timestamp.
- `uat`: updated timestamp.
- `sc`: score.
- `bw`: best word or best move summary.
- `rds`: round/level summaries.

Store summaries rather than full logs. For a word game, keep the best word and score, not every word played. For a run-based game, keep round score, target, duration, chosen reward, and modifiers.

## Sync

When history opens:

1. Load local records.
2. Read cloud records.
3. Merge by `mode/id`.
4. If both sides have the id, keep the newest `uat`.
5. Write missing/newer local records to cloud.
6. Write the merged result back to local storage.

Avoid syncing profile history on every login if the data can grow large.

## UI

Use tabs by game mode. Empty modes should show a short empty state. Controller support should allow:

- Up/down through controls and records.
- Left/right between mode tabs.
- Escape/back to close the modal or screen.
