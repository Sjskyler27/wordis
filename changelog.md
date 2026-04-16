# Changelog

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
