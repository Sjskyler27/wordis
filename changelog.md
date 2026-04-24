# Changelog

## 2026-04-23 0.0.28

Start: 2026-04-23 22:30:02 EDT
Stop: 2026-04-23 22:32:17 EDT

- Added reward generation from each round's allowed reward tiers, with challenge rounds pulling only from the highest allowed tier.
- Added reward choice selection, personal modifier stacking, and selected reward recording on completed round records.
- Added the MultiRoundRewardChoice overlay for choosing one of three persistent modifiers.
- Changed round completion to pause for reward selection before advancing to the next round.
- Applied immediate boon rewards once when selected.
- Verified the Parent Task 5 changes with `npm run build`.

## 2026-04-23 0.0.27

Start: 2026-04-23 22:26:12 EDT
Stop: 2026-04-23 22:28:48 EDT

- Added separate round modifier definitions with difficulty pools, validation rules, score effects, card rules, and tile lifecycle effects.
- Resolved active round modifier definitions through the multi-round run state.
- Added multi-round word validation for minimum word length and banned-letter round modifiers.
- Added score hooks for highest-consonant-zero and doubled burn penalties.
- Blocked boon/attack card controls during no-card rounds.
- Applied the fleeting round modifier by replacing unused special tiles after submit.
- Verified the Parent Task 4 changes with `npm run build`.

## 2026-04-23 0.0.26

Start: 2026-04-23 22:19:30 EDT
Stop: 2026-04-23 22:24:42 EDT

- Added separate multi-round personal modifier definitions with tiers, rarity weights, stack caps, and effect data.
- Added personal modifier stack tracking and computed effect summaries to the multi-round run state.
- Added shared scoring and tile-roll hooks for personal modifier effects while preserving existing defaults for other modes.
- Routed personal modifier score context through submit scoring, rack generation, WordBuilder previews, and GameLane tile values.
- Added a responsive PersonalModifiersDrawer that appears only in multi-round mode.
- Verified the Parent Task 3 changes with `npm run build`.

## 2026-04-23 0.0.25

Start: 2026-04-23 22:14:42 EDT
Stop: 2026-04-23 22:18:39 EDT

- Added the multi-round countdown, final-word window, round completion, round failure, score reset, and next-round starting score bonus flow.
- Added a host rack reset helper for multi-round round transitions.
- Added the MultiRoundProgress component with circles for normal rounds, diamonds for challenge rounds, animated progress, and challenge modifier tooltips.
- Extended the results overlay with multi-round run summary data, including completed rounds, failed round score, and personal modifier summary.
- Added a temporary round-complete/advance sound cue using the existing tile replacement audio.
- Verified the Parent Task 2 changes with `npm run build`.

## 2026-04-23 0.0.24

Start: 2026-04-23 22:08:24 EDT
Stop: 2026-04-23 22:11:31 EDT

- Added the `multi_round` play mode constant and a TypeScreen entry that starts the mode.
- Added fixed starter round data and an isolated multi-round run state composable.
- Wired Game.vue to recognize multi-round mode, reset multi-round run state, and show basic multi-round mode/status copy.
- Updated single-player initialization so multi-round starts with a host-only solo rack and no bot lane.
- Verified the Parent Task 1 changes with `npm run build`.

## 2026-04-20 0.0.23
- updated yin yang color and display logic
- added animations for gold lock and emerald
- added delay animations between all
- updated overtime label to show correct phrase
- changed ghost tile to be a boon


## 2026-04-20 0.0.21
- mobile description bug
- focus burn tiles 
 
## 2026-04-20 0.0.21
- mobile inspect toggle 

## 2026-04-20 0.0.20
- added tutorial
## 2026-04-20 0.0.19
- added hover to tiles 

## 2026-04-20 0.0.18
# added
- support for wavedash 

## 2026-04-20 0.0.17

Start: 2026-04-20 07:33:00 EDT
Stop: 2026-04-20 07:37:11 EDT

- Paused solo matches properly when the settings/pause state opens by stopping both the bot loop and the countdown timer.
- Reworked the history overlay to fit smaller devices with better scrolling, stacked layout, and smaller result tiles.
- Renamed the old display control from `Dungeon Zoom` to `Game Zoom` and applied that zoom setting directly inside `Game.vue`.
- Fixed timed solo so gaining time after the `Play your final word!` state restarts the timer once the clock is back above zero.
- Added modifier-driven bot thinking pressure so `MUST` tiles heavily hurt bot performance while `wild` tiles improve it.
- Auto-swapped matching `MUST` tiles into the built word on submit when the player had already used the same normal letter.

## 2026-04-18 0.0.16

Start: 2026-04-18 19:51:31 EDT
Stop: 2026-04-18 19:54:04 EDT

- Delayed the history overlay by 1.5 seconds after a match ends so players can actually see their final word land.
- Animated the results panel in with the shared `animated-slide-up` treatment and hidden pre-animation visibility.
- Restricted random attack cards so they only target clean normal tiles instead of stacking onto already modified enemy tiles.

## 2026-04-18 0.0.15

Start: 2026-04-18 19:11:16 EDT
Stop: 2026-04-18 19:16:21 EDT

- Added an overtime toggle to the multiplayer host options and wired that setting through the client and server room state.
- Changed overtime so both sides can keep submitting, and the match now ends when the trailing side answers with one final word.
- Darkened the word console during overtime and added a `Final Word!` banner to make the sudden-death state obvious.
- Moved controller focus back to the rack immediately after selecting a target-based boon.

## 2026-04-17 0.0.14
- fixed controller support and bottom row focus 

## 2026-04-17 0.0.13
- fixed tiles not ending in the correct group by seperating dev mode and test mode logic 

## 2026-04-17

Start: 2026-04-17 11:56:00 EDT
Stop: 2026-04-17 12:18:28 EDT

- Split the comeback modifier caps so good and bad bonus pressure can be tuned independently.
- Made good and bad tile pull chances ramp up as turns are played, including submit refills, rack clears, and boon-driven redraws.
- Restored the neutral modifier pool to a fixed 2% baseline chance while keeping DEV odds logging aligned with the neutral pool.
- Allowed neutral tiles in singleplayer and bot matches, while filtering out modifiers flagged `noSinglePlayer` like `yinYang` and `gainattack`.

## 2026-04-17

Start: 2026-04-17 08:44:00 EDT
Stop: 2026-04-17 08:54:58 EDT

- Added the duel-only neutral `yinYang` tile with its own modifier pool and DEV chance logging, including neutral pull odds.
- Made yin-yang score dynamically flip between `-3`, `0`, and `+3` depending on whether the owning side is ahead, tied, or behind.
- Kept neutral tiles out of singleplayer and bot racks, including testing-mode singleplayer seeds, while preserving them in multiplayer/testing duel racks.

## 2026-04-16 0.0.9
# added
- final score in history 
- controller in game 

# fixed
- Major fix for firebase issues preventing mounting properly
- tile placeholders coming back weird they now stay permenent
- delete boon got rid of two letters
- fixed tile ids sometimes duplicating 

# ADDED
- score animation
- higher score animation 
- big word animation
- vote for next game 
- single player attacks against the time 
- victory and defeat sound placers
- tile placement audio
- moved game music 

## 2026-04-16
# ADDED
- letter shake
- must use tile flash 
- ing 

## 2026-04-16
# ADDED
- ghost tile 
- keep one tile boon
- test mode env 
- milestone rewards

# CHANGED
- updated style for cards 
- updated game view style 
- black tile is now 0 tile 
- milestones now have a gradient 
- milestone now shows bonus 

## 2026-04-16

Start: 2026-04-16 19:29:00 EDT
Stop: 2026-04-16 19:35:53 EDT

- Looped the short in-match music and result audio so they hold up during longer results and play sessions.
- Shortened testing mode thresholds so matches end at 40 points and timed solo starts at 25 seconds.
- Added a new `Cleanse` boon card that removes all negative modifiers from your rack in both solo and multiplayer.
- Made the in-game background shift from bright upbeat colors into a more intense palette as the timer drains or players approach the win score.
- Added `score_built_tile.mp3` to the score-pop sequence so each built tile pop plays with a rising pitch as the chain continues.

## 2026-04-17

Start: 2026-04-17 08:17:00 EDT
Stop: 2026-04-17 08:26:25 EDT

- Added `burningTile`, a negative modifier that loses 3 points every turn you leave it unused and now gets cleared by the cleanse-style negative reset flow.
- Added `bloodTile`, a red-black position-scaling modifier that becomes more valuable the later you place it in a word.
- Added `bankTile`, a rare emerald modifier that starts at 0 and gains value each turn you leave it on your rack.
- Added DEV-only modifier roll logging so each pull shows the current modifier odds, the actual modifier rolled, and the chance that rolled result had.

## 2026-04-16
- adjust word builder styleing
- fix history overlay to be seperate component 
- added one more turn after time runs out in solo
- removed attacks in solo mode


## 2026-04-15

Start: 2026-04-15 01:31:53 EDT
Stop: 2026-04-15 01:48:04 EDT

- Styled the bottom word builder with an 8-slot lane, faint grid placeholders, and visible bonus milestones.
- Added game pause support and then switched the pause flow to the existing settings screen.
- Locked the rack display to a 5x4 board layout.
- Made the in-game multiplayer room code clickable so it copies to the clipboard.
- Enforced a minimum word length of four letters across client, bot, and multiplayer validation.
- Restricted the `mustuse` modifier to low-value tiles only.
- Added a three-turn locked tile modifier with countdown behavior on refill turns.
- Added a wild tile modifier that can stand in for any selected letter and scores 1 point.
- Restyled the multiplayer lobby to match the current game presentation.
- Made the multiplayer room code input normalize to uppercase as you type.

## 2026-04-15

Start: 2026-04-15 21:47:46 EDT
Stop: 2026-04-15 21:53:02 EDT

- Reset multiplayer state before entering singleplayer so solo games no longer get stuck showing the opponent wait state.
- Ended matches at 250 points and blocked further submissions once the finish line is reached.
- Added a postgame results panel that shows the winner plus each side's full word history.
- Balanced opening racks so both sides begin with mirrored modifier slots instead of uneven opening modifier luck.

## 2026-04-15

Start: 2026-04-15 22:00:47 EDT
Stop: 2026-04-15 22:07:30 EDT

- Rebalanced full rack clears so they preserve the same amount of upside while trimming some bad modifiers instead of enabling modifier fishing.
- Forced the game view to remount when switching between multiplayer and singleplayer so solo matches no longer inherit the opponent waiting state.
- Added a Play Again reset flow so finished matches can restart cleanly from the game over panel.
- Added public lobby hosting and open lobby browsing so non-private rooms can be discovered and joined without sharing a room code.

## 2026-04-15

Start: 2026-04-15 22:11:30 EDT
Stop: 2026-04-15 22:13:54 EDT

- Let armed boons target tiles that are already in the built word so modifier plays no longer kick those letters back out of the word strip.
- Capped `mustuse` at one tile per board, including attack usage, so that penalty stays pressuring without stacking into dead racks.
- Switched word validation to prefer the local fallback dictionaries first and only use the dictionary API as a rescue path for misses, while keeping wildcard words on fallback matching.

## 2026-04-15

Start: 2026-04-15 22:25:21 EDT
Stop: 2026-04-15 22:26:15 EDT

- Broke postgame history out into its own overlay component, styled it to match the game, and moved `Play Again` into that results panel.
- Upgraded history entries to track both the word and the points scored for each play so the final board shows the full scoring trail.
- Stopped the singleplayer bot loop as soon as the match ends so it cannot sneak in an extra move after a winning score.

## 2026-04-16

Start: 2026-04-16 00:19:08 EDT
Stop: 2026-04-16 00:19:55 EDT

- Fixed the postgame history overlay so the left history column always renders and solo results no longer collapse into a misleading empty state.
- Removed attacks from timed solo mode, including attack cards, attack-granting tile modifiers, and attack messaging in the solo UI.
- Added a dedicated solo modifier profile so timed solo uses a friendlier positive/negative modifier mix instead of duel-style comeback pressure.

## 2026-04-16

Start: 2026-04-16 21:38:00 EDT
Stop: 2026-04-16 21:48:51 EDT

- Updated the results overlay summary to include the final scoreline instead of only the winner text.
- Added overtime after the score cap so play continues until both sides reach the threshold, while only the trailing side can submit and attacks are disabled.
- Restored the high-score lane flare with a stronger visual treatment and a more reliable burst trigger.
- Let delete boons remove locked tiles so redraw effects still work on trapped letters.
- Hardened local and server tile ids with session-scoped unique generators to prevent duplicate ids after reloads or long play sessions.
