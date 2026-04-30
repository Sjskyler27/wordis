# Wordis Save State Implementation

This document describes how Wordis saves resumable game state for multi-round and bot matches.

## Goals

- Keep one active continue save per mode.
- Save locally with compact but readable keys.
- Optionally save multi-round cloud continue data to Firebase.
- Keep local saves richer than cloud saves when needed.
- Clear the save immediately on win or loss.
- Keep save writes deterministic enough that continuing a run cannot be used to reroll after a bad result.

## Save Modes

Use one local save key per mode:

- `wordis:save:mr` for multi-round.
- `wordis:save:bt` for bot match.

Cloud saves are synced by the user-state module and should live under:

- `users/${uid}/svgms/mr` for multi-round.
- `users/${uid}/svgms/bt` for bot match.

Bot match uses the same local-first save shape so account sync can compare timestamps across devices.

## Environment Toggles

Use an env flag to disable Firebase save writes:

- `VITE_ENABLE_CLOUD_SAVES=true`

If the flag is not true, local save still works and cloud save calls should quietly no-op.

Use a local constant or exported setting for local word-submit saves:

- `SAVE_ON_WORD_SUBMIT = true`

Keep a comment near this toggle explaining that word-submit saves are intentional for anti-cheat consistency, but may be revisited if the write cost or timing gets heavy.

## Data Tiers

Multi-round save data has three practical tiers.

In-round data:

- Time remaining.
- Current round index.
- Current score.
- Current rack.
- Selected/built letters if needed.
- Cards in hand.
- Submitted word/history state needed to render correctly.

Between-round data:

- Completed round progress.
- Pending reward choices.
- Whether reward choice UI is open.
- Starting score bonus for the next round.
- Current cards and modifiers.

Game data:

- Difficulty.
- Round list identity.
- Completed rounds.
- Personal modifiers and stacks.
- Current round modifiers.
- Run end state.

Local multi-round saves can include all three tiers. Cloud multi-round saves should be saved after a round is completed, before reward choice, and should omit in-round data unless we later decide cloud resume needs exact mid-round recovery.

## Compact Save Shape

Every save should include:

- `v`: schema version.
- `m`: mode, such as `mr` or `bt`.
- `ts`: timestamp.

Suggested shared fields:

- `s`: scores.
- `t`: tiles by side.
- `c`: cards by side.
- `h`: word history.
- `w`: submitted words.
- `r`: rack clears.

Suggested multi-round fields:

- `mr.i`: current round index.
- `mr.t`: timer remaining.
- `mr.pm`: personal modifiers.
- `mr.rr`: resolved rounds.
- `mr.cr`: completed rounds.
- `mr.rc`: reward choices.
- `mr.pe`: pending starting score.
- `mr.fs`: failure summary.
- `mr.end`: run ended.

Suggested bot fields:

- `bt.d`: difficulty.
- `bt.o`: overtime state.

Tile objects should be compact but complete enough to restore exact behavior. Preserve timer fields for dynamic tiles such as shimmer and lightning.

## Save Timing

Multi-round local:

- Save on word submit, behind the save-on-submit toggle.
- Save on round complete before reward choice.
- Save on reward choice / next round transition.
- Save when returning to main menu.

Multi-round cloud:

- Save after each round is completed and before reward choice.
- Do not include in-round state in the first implementation.
- No-op unless env flag is enabled and a user is authenticated.

Bot local:

- Save on word submit, behind the save-on-submit toggle.
- Save when returning to main menu.
- Clear on win or loss.

## Continue UI

The type screen should show separate continue buttons when saves exist:

- Continue Multi-Round.
- Continue Bot Match.

Controller focus should still begin on the first real game mode button for simplicity. Continue buttons should be reachable through normal controller navigation, but should not steal initial focus.

## Clear Rules

Clear the matching save immediately when:

- Multi-round run is won.
- Multi-round run is failed.
- Bot match reaches a win/loss state.

Do not clear a save simply because the player returns to main menu. Save first, then let the continue button restore it later.

## Restore Rules

Restoring should hydrate game state before starting timers or bot loops. For bot matches, do not preserve bot thinking delay; restart normal scheduling after the board and scores are restored.

For multi-round, restore the current run state and let existing timer startup rules decide when the clock begins again.
