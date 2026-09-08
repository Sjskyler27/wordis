# Wordis Past Games

This document describes how Wordis saves completed games to a player profile.

## Storage

Local past games live at:

- `localStorage.wordis:pstgms`

Cloud past games live at:

- `users/${uid}/gameData/pstgms/${mode}/${gameId}`

Modes use short keys:

- `mr`: multi-round runs.
- `bt`: bot matches.
- `ts`: timed solo, reserved.
- `mp`: multiplayer, reserved.

## Feature Flags

Past-game saving and display are controlled in `globalVariables.js`:

- `savePastGamesMultiRound`
- `savePastGamesBotMatch`
- `savePastGamesTimedSolo`
- `savePastGamesMultiplayer`
- `showPastGamesMultiRound`
- `showPastGamesBotMatch`
- `showPastGamesTimedSolo`
- `showPastGamesMultiplayer`

This lets heavy modes be disabled independently if the profile data gets too large.

## Record Shape

Past-game records use compact keys:

- `v`: schema version.
- `id`: game id.
- `m`: mode.
- `d`: difficulty.
- `rs`: result, such as `won`, `failed`, or `lost`.
- `ca`: completed/created timestamp.
- `uat`: updated timestamp for sync conflict resolution.
- `dur`: total game duration in seconds.
- `sc`: player score.
- `os`: opponent score, for bot or multiplayer modes.
- `bw`: best player word `{ w, sc, rn }`.
- `obw`: best opponent word for bot/multiplayer.
- `rds`: compact round records.
- `fr`: failed round record.
- `rwds`: selected rewards.

Round records use:

- `rn`: round number.
- `id`: round id.
- `lb`: round label.
- `trg`: target score.
- `sc`: final score.
- `ts`: round time limit.
- `sr`: seconds remaining.
- `su`: seconds used.
- `sb`: starting score bonus.
- `mods`: active round modifier keys.
- `rw`: selected reward key.
- `rwl`: selected reward label.

## Save Timing

Multi-round records are saved for both won and failed runs. Failed runs include `fr` for the failed round.

Bot match records are saved when the match ends.

Each completed game is saved locally first, then written to Firebase when the user is signed in and online.

## Sync Timing

Past games do not sync on login. They sync lazily when the player opens the Past Games tab in the profile modal.

Sync merges local and cloud records by `mode/id`. If both sides have the same id, the record with the newest `uat` wins.

There is no record cap yet.
