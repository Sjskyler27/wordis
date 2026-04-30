# Reusable Save State Guide

This guide describes a compact save-state pattern that can be reused in games with local saves, optional cloud saves, and multiple game modes.

## Core Principles

- Save by mode, not by screen.
- Keep one active continue slot per mode unless the game explicitly supports multiple save slots.
- Use a schema version from day one.
- Keep the local save complete enough for exact resume.
- Keep the cloud save smaller and purpose-specific.
- Make cloud saves optional behind an environment flag or remote config flag.
- Clear saves on terminal outcomes such as win, loss, or completed run.

## Save Module Shape

Create a dedicated save module with functions like:

- `saveLocal(mode, data)`.
- `loadLocal(mode)`.
- `hasLocal(mode)`.
- `clearLocal(mode)`.
- `saveCloud(mode, data, context)`.
- `loadCloud(mode, context)`.
- `clearCloud(mode, context)`.
- `packGameState(mode, state, options)`.
- `unpackGameState(save)`.

The game should pass state into the save module. The save module should not reach deeply into UI components.

## Compact Schema

Use short keys for frequently repeated structures:

- `v`: schema version.
- `m`: mode.
- `ts`: timestamp.
- `s`: score.
- `t`: tiles.
- `c`: cards.
- `h`: history.
- `p`: progress.

Short keys are most useful in arrays of tiles, cards, events, or history entries. Keep top-level names readable enough that debugging local storage is still possible.

## Local Versus Cloud

Local saves can include:

- Exact board state.
- Current timers.
- Current input or selected pieces.
- Animation-relevant state if needed.
- Full inventory.
- Recent history.

Cloud saves should usually include:

- Progress checkpoints.
- Inventory.
- Stable upgrade choices.
- Current level or round index.
- Enough data to resume at a safe checkpoint.

Avoid frequent cloud writes during live play unless the game truly needs cross-device mid-action resume.

## Save Timing

Good local save moments:

- After a player commits an action.
- After completing a level or round.
- Before returning to the main menu.
- On app visibility change or quit, if the platform supports it.

Good cloud save moments:

- After checkpoint.
- After level completion.
- After inventory or upgrade selection.
- After a paid or scarce resource changes.

Avoid saving during every animation frame or every reactive state change.

## Anti-Cheat And Fairness

If rerolling randomness would help the player, save after the random result is known. For example:

- Save after drawing cards.
- Save after replacing tiles.
- Save after generating round modifiers.

For timer games, decide whether closing the app should preserve time exactly or treat the game as abandoned. Write that rule down before implementation.

## Restore Flow

Restore in this order:

1. Validate schema version and mode.
2. Hydrate stable game state.
3. Hydrate board/inventory.
4. Hydrate timers.
5. Rebuild derived UI state.
6. Start loops, AI, or timers last.

Never start a timer, AI loop, or network loop before the saved board is hydrated.

## Versioning

Use `v` in every save. When the schema changes:

- Add a small migration if practical.
- Otherwise ignore old saves and clear them safely.
- Prefer clearing an incompatible continue save over crashing the game.

## Testing Checklist

- Save exists after expected events.
- Continue button appears only when a compatible save exists.
- Continue restores the correct mode.
- Win/loss clears the matching save.
- Cloud save no-ops when disabled.
- Bad or old save data does not crash the app.
- Dynamic timers and delayed effects resume in a predictable state.
