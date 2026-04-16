# Changelog

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
