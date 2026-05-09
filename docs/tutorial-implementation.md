# Tutorial Implementation

## Goal

Add a guided tutorial layer for Wordis Run without changing normal play once the tutorial is complete. The tutorial should teach core Wordis Run concepts through small pop-up hints and controlled early pulls, then step out of the way permanently after completion.

The tutorial is considered active only when all of these are true:

- The current mode is `multi_round`.
- The selected multi-round difficulty is `tutorial`.
- `localStorage.hasCompletedWordisTutorial` is not `'true'`.

When the tutorial is complete, Tutorial difficulty should behave like a regular run track. It should not suppress cards, restrict modifier pools, force pulls, adjust tutorial hints, or lock modifier timing.

## Key Files

- `src/states/game/tutorial-hints.js`
  - Owns default tutorial hint content.
  - Owns tutorial hint viewed state storage.
  - Exports `TUTORIAL_COMPLETED_STORAGE_KEY`.
- `src/states/game/components/TutorialHintModal.vue`
  - Displays one tutorial hint at a time.
  - Supports optional image or GIF content through `hint.imageSrc`.
  - Focuses the close button for keyboard/controller dismissal.
- `src/states/game/Game.vue`
  - Decides whether tutorial scripting is active.
  - Opens tutorial hints and queues overlapping hint requests.
  - Pauses timers while hint modals are visible.
  - Supplies tutorial tile plans to single-player game state.
- `src/states/game/useSinglePlayerGame.js`
  - Calls tutorial tile-plan hooks during opening rack creation, round reset, and refill.
  - Suppresses starting cards when the incomplete tutorial asks for it.
- `src/states/game/shared-tile-logic.cjs`
  - Supports forced modifier groups such as `['good']`.
  - Supports `allowedModifierKeys` to restrict tile modifier pools.
- `src/states/game/multiround/useMultiRoundRun.js`
  - Filters round modifiers and personal rewards to `includeInTutorial` while tutorial is incomplete.
  - Applies incomplete tutorial round easing.
- `src/assets/Settings.vue`
  - Shows one tutorial state button:
    - `Set Tutorial Complete` when incomplete.
    - `Reset Tutorial` when complete.
- `src/App.vue`
  - Owns the reactive tutorial completion flag passed into Settings.

## Storage

- `wordisTutorialHints`
  - JSON array of tutorial hint records.
  - Each record includes `id`, display text, and `hasSeen`.
- `hasCompletedWordisTutorial`
  - `'true'` after the player completes the tutorial run or manually sets tutorial complete in Settings.
- `hasSeenWordisGameTutorial`
  - Legacy first-match tutorial flag.
  - Keep synchronized with tutorial reset/complete controls for now.

## Tutorial Flow

When the tutorial is incomplete:

- Opening tutorial rack starts with plain tiles.
- Starting boons and attacks are suppressed.
- The first refill after the first submitted word forces one good modifier.
- Neutral modifiers are disabled until round 2.
- Bad modifiers are disabled until round 3.
- Tile modifier pulls are restricted to tile definitions with `includeInTutorial: true`.
- Round modifiers are restricted to round definitions with `includeInTutorial: true`.
- Personal modifier rewards are restricted to personal definitions with `includeInTutorial: true`.
- Each generated round gets:
  - `targetScore - 10`
  - `timeSeconds + 10`

When the tutorial is complete:

- The same Tutorial difficulty round list is used.
- No tutorial-only conditionals apply.
- Normal card starts, modifier odds, reward pools, and round modifier pools are restored.

## Tutorial-Safe Flags

Use `includeInTutorial: true` on simple concepts only.

Current tile modifier examples:

- `gold`
- `firsttile`
- `twinTile`
- `wild`
- `ghostTile`
- `zeroTile`
- `burningTile`

Current personal modifier examples:

- `first_focus`
- `five_letter_form`
- `better_odds`
- `cleaner_rack`
- `time_reserve`
- `boon_cache`

Current round modifier examples:

- `min_word_5`
- `four_letter_sap`
- `less_reward_options`
- `pressure_timer_easy`

## Controller Behavior

`TutorialHintModal.vue` works with the existing controller-to-keyboard bridge because the close button receives focus. The modal can be dismissed by:

- Button click.
- Keyboard/controller confirm on the focused close button.
- `Escape`.

Arrow up/down scrolls the modal panel if content exceeds the visible height.

## Timer Behavior

Hints must pause timed gameplay.

The implementation does this in two ways:

- `showTutorialHint()` calls `syncTutorialPauseState(true)` immediately.
- Solo and multi-round timer ticks check `canRunTimedModeTimer()` before decrementing time and stop themselves if a hint appears mid-interval.

## Extension Notes

To add a new hint:

1. Add a record to `DEFAULT_TUTORIAL_HINTS` in `tutorial-hints.js`.
2. Choose an `id` that is stable and search-friendly.
3. Trigger it from `Game.vue` using `showTutorialHint('hint_id')`.
4. Use `{ force: true }` only for manual UI actions, not normal tutorial flow.

To add a tutorial-safe modifier:

1. Add `includeInTutorial: true` to the definition.
2. Prefer effects that are easy to understand from a single tooltip.
3. Avoid modifiers that add real-time chaos before the player understands base scoring.

## Acceptance Criteria

- Incomplete tutorial runs are guided and restricted.
- Completed tutorial runs do not use tutorial restrictions.
- Settings shows exactly one tutorial state button.
- Hints pause timers and are dismissable by controller.
- Timed solo, bot match, multiplayer, and completed tutorial behavior remain unchanged.
