# Tutorial Content And QA

## Purpose

This document tracks the tutorial teaching beats, hint timing, and manual QA checks. It is meant to make future tutorial changes easier without digging through every gameplay file first.

## Current Hint List

Hints live in `src/states/game/tutorial-hints.js`.

- `welcome`
  - Introduces Wordis Run.
- `plain_tiles`
  - Explains that the first tutorial rack has no modifiers.
- `first_good_modifier`
  - Shows after the first tutorial submit forces a good modifier.
- `larger_words`
  - Encourages longer words for higher score.
- `neutral_modifier`
  - Shows when a neutral modifier appears.
- `bad_modifier`
  - Shows when a bad modifier appears.
- `card_received`
  - Shows when the player first receives a boon or attack.
- `save_letters`
  - Shows in round 3.
  - Text: close to building a word, use Save Letters to highlight letters you do not want to accidentally use.
- `clear_rack`
  - Shows in round 4 or later when the rack has more than one bad modifier.
- `rewards`
  - Shows when reward choices are generated.
- `round_modifiers`
  - Introduces temporary round rules.
- `game_won`
  - Shows when the tutorial run is completed.
- `game_lost`
  - Shows when the tutorial run fails.

## Teaching Order

The tutorial should introduce complexity in this order:

1. Plain rack and basic word submission.
2. Good modifier pull.
3. Larger words and score growth.
4. Rewards after clearing a round.
5. Neutral modifiers starting in round 2.
6. Save Letters in round 3.
7. Bad modifiers starting in round 3.
8. Clear Rack when bad modifiers stack up in round 4 or later.
9. Win or loss summary.

## Tutorial Rules While Incomplete

The incomplete tutorial intentionally changes the run:

- No starting boons.
- No starting attacks.
- First rack has no modifiers.
- First refill forces one good modifier.
- Neutral modifiers are unavailable until round 2.
- Bad modifiers are unavailable until round 3.
- Tutorial-safe tile, personal, and round modifier pools are used.
- Round target scores are reduced by 10.
- Round timers gain 10 seconds.

These changes are disabled once `hasCompletedWordisTutorial` is `'true'`.

## Manual QA

Before testing, use Settings > `Reset Tutorial`, or clear:

- `hasCompletedWordisTutorial`
- `wordisTutorialHints`
- `hasSeenWordisGameTutorial`

### Incomplete Tutorial Run

1. Start `Wordis Run` with `Tutorial` difficulty.
2. Confirm the first rack has no tile modifiers.
3. Confirm the player starts with no boons or attacks.
4. Submit the first word.
5. Confirm a good modifier appears in the refill.
6. Confirm the good modifier hint appears.
7. Confirm the timer does not tick while the hint is open.
8. Continue into round 2.
9. Confirm neutral modifiers may now appear.
10. Continue into round 3.
11. Confirm the Save Letters hint appears.
12. Confirm bad modifiers may now appear.
13. Continue into round 4 or later.
14. Get more than one bad modifier in rack.
15. Confirm the Clear Rack hint appears.

### Completed Tutorial Run

1. Use Settings > `Set Tutorial Complete`.
2. Start `Wordis Run` with `Tutorial` difficulty.
3. Confirm starting cards are not suppressed.
4. Confirm the first rack is not forced to all normal tiles.
5. Confirm tile modifiers are not restricted to only tutorial-safe definitions.
6. Confirm neutral and bad modifiers are not delayed by tutorial round gates.
7. Confirm tutorial hints do not appear as scripted flow.

### Settings

1. When tutorial is incomplete, Settings should show `Set Tutorial Complete`.
2. Click it.
3. Settings should now show `Reset Tutorial`.
4. Click it.
5. Settings should now show `Set Tutorial Complete`.

### Controller

1. Open a hint modal.
2. Confirm focus starts on the close button.
3. Press controller confirm.
4. Confirm the modal closes.
5. Open a long hint or reduce viewport height.
6. Confirm up/down scroll the modal.

## Content Guidelines

Keep hint text short. Each hint should teach one idea:

- What just happened.
- Why it matters.
- What the player can do next.

Avoid explaining every edge case in a modal. If a tile or modifier needs more detail, rely on existing tile and modifier tooltips.

## Future Ideas

- Add image or GIF examples to `TutorialHintModal.vue` hints through `imageSrc`.
- Add a small hint progress debug panel in dev mode.
- Add an explicit tutorial completion achievement.
- Add deterministic tutorial letters for the first two turns if the opening word experience feels too variable.
