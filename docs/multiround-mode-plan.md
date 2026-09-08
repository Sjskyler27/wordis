# Multi-Round Time Attack Mode Plan

## Mode Goal

Add a new single-player `multi_round` game mode where the player clears a fixed sequence of timed scoring rounds. Each round resets the board score, gives the player a fixed amount of time, and requires a fixed target score. Finishing a round grants one persistent personal modifier chosen from three rewards. Any round can have one or more temporary round modifiers that make scoring harder. Challenge rounds are special fixed rounds that are more likely to have multiple or harder round modifiers and reward stronger personal modifier tiers.

This mode must not change the behavior of timed solo, bot match, multiplayer, or their modifier/card rules.

## Architecture Notes

- `src/states/home/TypeScreen.vue` is the entry point for choosing play modes.
- `src/states/game/play-config.js` owns the `playMode` constants and selected mode state.
- `src/App.vue` wires TypeScreen events into `Game.vue`.
- `src/states/game/Game.vue` owns the main gameplay shell, timer display, submit flow, end conditions, history overlay wiring, and responsive side drawer behavior.
- `src/states/game/useSinglePlayerGame.js` owns local solo/bot state changes: opening racks, score updates, word history, card draws, rack clears, and tile refill.
- `src/states/game/tile-logic.js` exports browser-facing tile/scoring helpers from `shared-tile-logic.cjs`.
- `src/states/game/shared-tile-logic.cjs` owns shared scoring, rack creation, tile modifier rolling, card drawing, and tile replacement logic.

## Data Model Notes

- Round modifier: a temporary rule attached to one round. A round modifier can appear on normal rounds or challenge rounds.
- Challenge round: a round presentation/reward category, not the only place round modifiers can appear. Challenge rounds should usually carry harder or multiple round modifiers and should pull from stronger reward tier pools.
- Personal modifier tier: the reward pool level a round is allowed to offer, such as `common`, `rare`, or `epic`.
- Personal modifier rarity: the weighted chance of a specific reward appearing inside an allowed tier pool.
- A round can allow multiple reward tiers. For example, an early round may offer `['common']`, a mid round may offer `['common', 'rare']`, and a challenge round may offer only `['epic']`.
- Each round defines how many modifiers it gets and which difficulties those modifiers should use. The specific modifier keys are randomly resolved from those difficulty pools at run start.
- Challenge round modifiers are visible to the player in the round progress UI. Regular round modifiers are hidden for now, even though they still apply during their round.

## Parent Task 1: Add Multi-Round Mode Entry And State Boundaries

Core concept: create the new game mode entry point without affecting other game modes.

Files affected:

- Update `src/states/game/play-config.js`
- Update `src/states/home/TypeScreen.vue`
- Update `src/App.vue`
- Update `src/states/game/Game.vue`
- Create `src/states/game/multiround/useMultiRoundRun.js`
- Create `src/states/game/multiround/multi-round-rounds.js`

Subtasks:

- Add `PLAY_MODES.MULTI_ROUND = 'multi_round'` to `play-config.js`.
- Add a new TypeScreen menu option that emits `singleplayer` with `{ mode: 'multi_round' }`.
- Add `isMultiRoundMode` in `Game.vue` as `!props.isMultiplayer && props.playMode === 'multi_round'`.
- Keep `isTimedSoloMode` unchanged so timed solo keeps its current timer/end behavior.
- Create `useMultiRoundRun.js` to own multi-round-only state:
  - Current round index.
  - Current round definition.
  - Current target score.
  - Current round time limit.
  - Timer seconds remaining.
  - Starting score bonus from the previous round.
  - Completed round records.
  - Selected persistent personal modifiers.
  - Active round modifiers.
  - Reward choice state.
  - Run ended state and failure summary.
- Create `multi-round-rounds.js` with the fixed round list. Each round object should include:
  - `id`
  - `label`
  - `targetScore`
  - `timeSeconds`
  - `isChallenge`
  - `modifierBudget`, for randomly generated round modifiers such as `{ easy: 1, medium: 2, hard: 0 }`
  - `rewardTiers`
  - Optional `startingScoreBonusMultiplier`
- Add mode-specific startup/reset behavior in `Game.vue`:
  - On entering `multi_round`, initialize the first round and randomly resolve modifier keys for every round from each round's `modifierBudget`.
  - On play again, reset the multi-round run.
  - On back home, clear multi-round state.
- Ensure `useSinglePlayerGame.js` can initialize host-only state for `multi_round` without enabling bot behavior.

Acceptance criteria:

- TypeScreen can start the new mode.
- `multi_round` reaches `Game.vue` through the existing `playMode` prop.
- Timed solo, bot match, and multiplayer still enter their existing flows.
- Multi-round run state is isolated in its own composable and not stored in multiplayer state.

## Parent Task 2: Build Round Progression, Timer, And Score Reset Rules

Core concept: track the player's progression through the rounds with smooth animations and sounds. A round can have round modifiers without being a challenge round.

Files affected:

- Update `src/states/game/Game.vue`
- Update `src/states/game/useSinglePlayerGame.js`
- Update `src/states/game/components/HistoryOverlay.vue`
- Create `src/states/game/components/MultiRoundProgress.vue`

Subtasks:

- Add a multi-round timer path in `Game.vue` that uses `useMultiRoundRun.js`, not `SOLO_TIMER_SECONDS`.
- Update score ribbon display for `multi_round`:
  - Left score box remains the current round score.
  - Right score box shows time left.
  - Status text shows current round target and challenge status.
- Implement round completion:
  - When host score reaches the current round target before time expires, pause gameplay and show reward choices.
  - Record round result with score, target, time limit, seconds remaining, starting score bonus, active round modifiers, and selected reward after choice.
- Implement round failure:
  - Similar to timed solo, the user gets one final word when the timer reaches 0. If that word reaches the required score, they move to the next round; otherwise, they fail the run.
  - Mark the run as failed at the current round.
  - Show the modified HistoryOverlay with run summary.
- Reset score between rounds:
  - Before starting the next round, set `playerScores.host` to the next round starting score bonus.
  - Starting score bonus should be calculated from seconds remaining on the previous round.
  - Keep selected personal modifiers between rounds.
  - Clear submitted word and current selection.
  - Decide whether to reset or preserve rack each round; default plan is reset rack for readability and balance. Build a simple constant named `RESET_RACK_BETWEEN_ROUNDS_TOGGLE`.
- Incorporate sounds for round complete, next round, and progress bar movement using temporary sounds in assets.
- Prevent existing timed solo final-word behavior from applying to `multi_round`.
- Add `MultiRoundProgress.vue`:
  - Render fixed round indicators in the top bar.
  - Normal rounds use grey glassy circles.
  - Challenge rounds use diamonds colored to their difficulty with a glassy hue. On hover/focus, they display the round modifier list.
  - Normal rounds that have modifiers keep those modifiers hidden for now.
  - A red connecting progress line shows completed, current, and upcoming rounds similar to a thermometer. The bar should have smooth animations as a round completes.
  - Responsive layout must fit mobile and desktop without overlapping the score ribbon.
- Add the progress component to `Game.vue` only for `multi_round`.
- Extend `HistoryOverlay.vue` props to support multi-round run summaries:
  - Rounds completed.
  - Failed round.
  - Time per round.
  - Score vs target per round.
  - Personal modifiers picked.
  - Round modifiers encountered.
- Keep existing HistoryOverlay behavior for timed solo, bot, and multiplayer.

Acceptance criteria:

- Each round has its own timer and target.
- Completing a round opens rewards instead of ending the full run.
- Failing a round ends the run and shows useful run history.
- Score resets between rounds, with a starting score bonus from previous time remaining.
- The round progress indicator is visible only in multi-round mode.

## Parent Task 3: Define And Apply Persistent Personal Modifiers

Files affected:

- Create `src/states/game/multiround/personal-modifier-definitions.js`
- Update `src/states/game/multiround/useMultiRoundRun.js`
- Update `src/states/game/useSinglePlayerGame.js`
- Update `src/states/game/tile-logic.js`
- Update `src/states/game/shared-tile-logic.cjs`
- Create `src/states/game/components/PersonalModifiersDrawer.vue`

Subtasks:

- Create `personal-modifier-definitions.js` with persistent run upgrade definitions. Each definition should include:
  - `key`
  - `label`
  - `description`
  - `rarity`
  - `tier`
  - `tags`
  - `maxStacks`
  - `effects`
- Start with these effect categories:
  - Score transform effects, such as vowels score double.
  - Tile modifier value effects, such as ghost tiles give more bonus score.
  - Modifier odds effects, such as x2/gold tiles appear more often.
  - Modifier cap effects, such as raise good modifier cap or reduce bad modifier cap.
  - Opening rack effects, such as start each round with better good modifiers.
  - Reward economy effects, such as immediately gain 3 boons.
- Add tiers, for example `common`, `rare`, `epic`.
- Add rarity weights to determine how often a specific reward appears within an allowed tier pool.
- Add stack handling in `useMultiRoundRun.js`:
  - Merge duplicate rewards up to `maxStacks`.
  - Expose active modifier effects as a computed summary.
- Add personal modifier hooks to scoring:
  - Update `getWordScoreDetails` in `shared-tile-logic.cjs` to accept an optional `personalModifiers` or `scoreModifiers` options object.
  - Apply effects without changing default scoring when no multi-round modifiers are passed.
  - Ensure existing calls from timed solo, bot, and multiplayer continue to produce the same results.
- Add personal modifier hooks to tile rolling:
  - Extend `rollTileModifier`, `createTile`, `createRack`, `refillTiles`, `replaceSingleTile`, and `rerollRackExceptTile` to accept optional chance/cap adjustments.
  - Keep default odds unchanged when no multi-round effects are passed.
- Update `useSinglePlayerGame.js` to accept optional multi-round effect context from `Game.vue`:
  - Pass effect context into score calculation.
  - Pass effect context into rack creation and refill.
  - Apply one-time immediate effects, such as gaining boons, when a reward is selected rather than during every submit.
- Create `PersonalModifiersDrawer.vue`:
  - Desktop: lives on the right-hand side of the game shell.
  - Mobile: follows the existing drawer pattern so it can be opened without covering core gameplay permanently.
  - Shows active personal modifiers, stack count, rarity, and short effect text.
  - Does not appear in timed solo, bot, or multiplayer.

Acceptance criteria:

- Personal modifiers are separate from boon/attack cards.
- Selected modifiers persist across rounds.
- Scoring and tile odds are affected only in multi-round mode.
- Existing modes keep identical behavior when no personal modifier context is passed.
- The drawer works in both large screen and mobile layouts.

## Parent Task 4: Define And Enforce Round Challenge Modifiers

Rounds can have round modifiers without being challenge rounds. A challenge round is a round category that will more likely have multiple modifiers, harder modifiers, better rewards, or all three.

Files affected:

- Create `src/states/game/multiround/round-modifier-definitions.js`
- Update `src/states/game/multiround/multi-round-rounds.js`
- Update `src/states/game/multiround/useMultiRoundRun.js`
- Update `src/states/game/Game.vue`
- Update `src/states/game/useSinglePlayerGame.js`
- Update `src/states/game/shared-tile-logic.cjs`
- Update `src/states/game/components/WordBuilder.vue`
- Update `src/states/game/components/GameLane.vue`

Subtasks:

- Create `round-modifier-definitions.js` with temporary round modifier definitions. Each definition should include:
  - `key`
  - `label`
  - `description`
  - `difficulty`
  - `rules`
  - Optional `tileEffects`
  - Optional `scoreEffects`
  - Optional `cardRules`
- Start with round modifier rule categories:
  - Word length minimums: must play 5-letter words, must play at least 6-letter words.
  - Letter restrictions: cannot play `S`.
  - Score transforms: highest consonant in the word scores 0.
  - Burn pressure: burns are doubled and appear more often.
  - Tile trait overlays: all tiles gain fleeting behavior on top of their current status.
  - Card restrictions: boons and attacks cannot be played.
- Add modifier budgets to `multi-round-rounds.js`.
- Add modifier resolution in `useMultiRoundRun.js`:
  - Each round's `modifierBudget` entries are resolved randomly at run start.
  - The number and difficulty of modifiers are fixed by the round definition.
  - Multiple modifiers can be active at the same time.
  - Conflicting modifiers should be blocked by tags or explicit incompatibility lists.
  - Challenge round resolved modifiers are exposed to the progress UI.
  - Normal round resolved modifiers are kept hidden from the progress UI for now.
- Add validation hooks in `Game.vue` before dictionary validation:
  - Check active round modifier rules.
  - Show mode-specific error messages.
  - Trigger the existing invalid word pulse when a challenge rule fails.
- Add scoring hooks for round modifiers:
  - Extend `getWordScoreDetails` options to accept active round modifiers.
  - Apply challenge score transforms only when passed.
  - Use this scoring order for all multi-round previews and submissions: base tile values, personal tile score changes, round tile score changes, length bonus, word multipliers, burn penalties.
- Add tile lifecycle hooks for round modifiers:
  - Support temporary effects like all tiles becoming fleeting without permanently overwriting their original status where possible.
  - Support burn chance/penalty adjustments through chance overrides and idle penalty options.
- Add card restriction behavior:
  - Hide or disable card controls when active round modifiers block boons/attacks.
  - Keep the existing `attacksEnabled` behavior intact for other modes.
- Update `WordBuilder.vue` only if needed to show active challenge constraints near the submit controls.
- Ensure `WordBuilder.vue` and `GameLane.vue` receive the same active personal modifier and round modifier scoring context as final submission:
  - The word builder's current score must always match the score the player will receive on submit.
  - Tile displays should reflect applicable personal and round modifier effects when those effects change visible tile value.
  - Do not duplicate score math in components; route preview calculations through shared tile logic or derived values from `Game.vue`.

Acceptance criteria:

- Round modifiers apply only during their assigned round.
- Challenge validation happens before a word is submitted.
- Challenge score/tile/card effects do not leak into the next round.
- Existing modes are unaffected.

## Parent Task 5: Build Reward Choice Flow And Run Summary Polish

Core concept: allow users to choose from 3 rewards. Each round determines which reward tiers can show up, and it may allow multiple tiers. Challenge rounds pull only from the highest allowed tier for that round.

Files affected:

- Create `src/states/game/components/MultiRoundRewardChoice.vue`
- Update `src/states/game/multiround/useMultiRoundRun.js`
- Update `src/states/game/multiround/personal-modifier-definitions.js`
- Update `src/states/game/Game.vue`
- Update `src/states/game/components/HistoryOverlay.vue`
- Update styles in `src/states/game/Game.vue` or component-scoped styles

Subtasks:

- Create `MultiRoundRewardChoice.vue`:
  - Modal or overlay shown after a round is completed.
  - Displays three personal modifier rewards.
  - Shows label, rarity, description, and stack status.
  - Keyboard/controller selectable if practical with the existing controller focus model.
  - Emits the selected reward key.
- Add reward generation to `useMultiRoundRun.js`:
  - Use current round `rewardTiers`.
  - Treat tier as the eligible reward pool and rarity as the weighted chance within that pool.
  - Challenge rounds pull only from the highest allowed tier in `rewardTiers`.
  - Avoid offering rewards already at max stacks.
  - Guarantee three choices when enough eligible rewards exist.
- On reward selection:
  - Add or stack the personal modifier.
  - Apply immediate reward effects once.
  - Record the selected reward in the completed round record.
  - Advance to the next round.
  - Reset score and timer.
  - Create/reset rack according to the round start rules.
- If all rounds are completed:
  - End the run as a victory.
  - Show HistoryOverlay with full run summary.
- Update HistoryOverlay copy for multi-round:
  - Victory title for clearing the final round.
  - Defeat title for failing a round.
  - Summary line with rounds cleared and final failed/completed round score.
  - Detail section for personal modifiers and round records.
- Add visual polish:
  - Reward choices should read as distinct from boon/attack cards.
  - Rarity should be visible without relying only on color.
  - Challenge rounds should feel more dangerous in the progress indicator and reward overlay.

Acceptance criteria:

- Completing a round reliably shows three reward options.
- Choosing a reward advances the run.
- Challenge rounds offer stronger rewards.
- Full run history is visible at game over.
- Reward UI and personal modifier drawer are responsive and do not collide with the existing side drawer.

## Suggested Implementation Order

1. Add mode entry, round data, and isolated multi-round state.
2. Implement timer, round target completion, score reset, and failure flow.
3. Add reward choice UI with simple no-op personal modifiers first.
4. Add real personal modifier effects to scoring and tile rolling.
5. Add round challenge modifiers and validation.
6. Expand HistoryOverlay and responsive modifier drawer polish.

## Testing Checklist

- Start timed solo and confirm the current 3-minute timer behavior still works.
- Start bot match and confirm opponent lane, bot loop, and overtime behavior still work.
- Start multiplayer and confirm no multi-round UI appears.
- Start multi-round and confirm only one lane appears.
- Complete a normal round and confirm score resets, timer resets, and a reward is chosen.
- Complete a challenge round and confirm stronger reward tiers appear.
- Fail a round and confirm run ends with round summary.
- Verify personal modifiers persist into later rounds.
- Verify round modifiers clear after the round ends.
- Verify mobile layout for round progress, personal modifier drawer, and reward overlay.
