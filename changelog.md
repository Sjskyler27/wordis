# Changelog

## 0.0.51 - 2026-05-06
- 

## 0.0.50 - 2026-05-06

Start: 2026-05-06 12:31:00 EDT
Stop: 2026-05-06 12:46:39 EDT

- Added an Extra Clear boon that grants one additional rack clear immediately.
- Added covered reward indicators above built tiles on milestone slots, including score difference, card rewards, and time/score modifier rewards.
- Added an epic one-stack reward-choice modifier for one extra upgrade option.
- Made personal modifier rarity easier to scan in the upgrades drawer with rarity badges.
- Stopped multi-round mode from offering an upgrade reward after completing the final round.
- Added a Main Menu action to the history/results overlay.

## 0.0.49 - 2026-05-05
- style changes 
- reward amount modifiers 
- disabled some modifiers 
- mobile work
- hide clock in mobile 

## 0.0.48 - 2026-05-04
- glass tile style change bag AFTER fixes need to do more of them 
- fix compact multipliers on the wrong ones, need to round still
- mobile screen adjustments
- settings blur letters removed sparks 
-  fixed score z index on mobile
- removed blood tile, attack and boon tile. 


## 0.0.47 - 2026-05-04

Start: 09:35 EDT
Stop: 10:02 EDT

- Added the Glass good tile with +6 score, cracked-zero scoring, and rack/builder crack styling when moved or removed before submit.
- Added the Hourglass neutral tile with rack/builder styling and timed-mode +5/-5 second submit effects.
- Updated Bag so adjacent tiles stay selectable, submit is blocked only when bagged tiles are used without the Bag, and rack/builder bagged visuals hide once the Bag is in the word.
- Verified the changes with `npm run build`.

## 0.0.46 - 2026-05-02
- fix speedy modifiers 
- fix description 
- balance changes 
- pause game on close 
- 
## 0.0.45 - 2026-05-02

Start: 17:42 EDT
Stop: 18:17 EDT

- Fixed Lockstep so the opening locked column advances after the first submitted word instead of staying on the first column for two turns.
- Changed the Profile button to open the profile modal for signed-out players, with signup and login available inside the account tab.
- Made Speedy Addition tick down during word building and added an in-lane countdown badge for its remaining bonus.
- Renamed Speedy to Speedy Multiplier and added an in-lane countdown badge for its current multiplier.
- Added the easy Short Sap round modifier, making four-letter words remove 4 seconds from the multi-round clock.
- Added active length modifier labels to word-builder milestones, including time bonuses, time penalties, score bonuses, and length multipliers.
- Verified the changes with `npm run build`.

## 0.0.44 - 2026-05-02
- fixed the in use layer to be on top of all tiles 
- auto focus the current dificulty on the actual dificulty 

## 0.0.43 - 2026-05-02
- added new tiles: 
leacher neutral: leach adj tiles and gain value
bag bad: adj tiles are in the bag and cannot be played unless the bag is played
baricade bad: cards cannot be played while this tile is out.
void: neutral tile worth plus 12 but all other letters in word are 0 
- updated file size for pwa
- added sparks to lightining may remove them 
- header alignment
- pause button and card view fix
- drawers can stay open on mobile
- added controller sensitivity

## 0.0.42 - 2026-05-01
MAJOR CHANGES
- pulled background out of every component and put it top level out side of app zoom. 
- added watcher for app width and auto update app zoom based off of width. 
- lifted history and choice overlay out cause i thought it would fix zoom issues, put them back and just updated style to fixed, dumb ai.
- fixed no events on choice overlay. fixed button select to use global button highlight
- made the transition between background collors smooth over 2 seconds 
- the show tile info is fixed to top left for now 

## 0.0.41 - 2026-04-30

Start: 12:55 EDT
Stop: 13:45 EDT

- Added compact past-game profile storage under `gameData/pstgms` and local key `wordis:pstgms`.
- Added mode-level save/show toggles for past games.
- Added lazy past-game sync that merges local and cloud records when the Past Games profile tab opens.
- Saved multi-round wins, failed runs, round summaries, selected rewards, elapsed time, scores, and best word summaries.
- Saved bot match summaries with score, machine score, duration, and best words.
- Added a Profile modal Past Games tab view with mode tabs and controller navigation.
- Added Wordis-specific and reusable past-game documentation.
- Verified the changes with `npm run build`.

## 0.0.40 - 2026-04-30

Start: 11:47 EDT
Stop: 12:29 EDT

- Added Wordis user-state sync docs and a reusable Firebase user-state guide.
- Added save-state helpers so account sync can list, validate, and import local saves by mode.
- Added `src/userstate` with first-login user initialization, ten-minute account sync, saved-game up/down timestamp comparison, and bot difficulty progression sync.
- Added a per-device saved-game sync toggle.
- Re-enabled the start-screen Profile button, prompting auth for signed-out players and showing a profile modal with logout for signed-in players.
- Wired signup, login, app startup, online events, and logout cleanup into the new user-state sync flow.
- Verified the changes with `npm run build`.

## 0.0.39 - 2026-04-30

Start: 10:20 EDT
Stop: 11:03 EDT

- Added Wordis-specific save-state implementation notes and a reusable save-state guide for similar games.
- Added compact local save infrastructure for multi-round and bot match saves with schema versioning.
- Added optional Firebase cloud checkpoint saving behind `VITE_ENABLE_CLOUD_SAVES`.
- Saved multi-round progress locally on word submit, after round transitions, and before leaving the game.
- Saved multi-round cloud checkpoints after completed rounds before reward selection, without in-round data.
- Saved bot match progress locally on word submit and before leaving the game.
- Cleared matching saves immediately on bot match end and multi-round run end.
- Added separate type-screen continue buttons for saved bot match and multi-round runs.
- Restored saved racks, scores, cards, history, multi-round progress, reward choices, and bot match overtime state.
- Verified the changes with `npm run build`.

## 0.0.38 - 2026-04-29

Start: 13:30 EDT
Stop: 13:52 EDT

- Tracked multi-round turn count per round instead of using full word history.
- Enabled shared tile dev logging from local storage in multiplayer-safe shared logic.
- Forced production mode for build scripts that call Vite.
- Included burn penalties in the word builder preview score.
- Updated lockstep to apply immediately and restore original tiles after locks expire.
- Reworked Constant Demand so the first eligible pulled tile is guaranteed MUST when needed, including the opening rack, without converting existing special tiles.
- Prevented double-letter tiles from becoming MUST tiles.
- Split Loose Rack into Loose Letters, Disorganised, and Chaotic Board with configurable intervals and countdown indicators.
- Added round modifier incompatibility rules so mutually exclusive pressure and board modifiers do not combine.
- Added the Shimmer neutral tile modifier with timed letter shifting, rack-only shifting, magic-oil styling, and letter +1 scoring.
- Added the Rusting bad tile modifier with four-turn score decay and progressive rust styling.

## 2026-04-29 0.0.37

Start: 2026-04-29 00:15 EDT
Stop: 2026-04-29 01:10 EDT

- Moved the Game.vue scoped styles into Game.scss.
- Extracted MachineBackground, GameCardsPanel, ScoreRibbon, and GameStatusCards from Game.vue without changing gameplay behavior.
- Extracted side drawer state, card panel state, and score ribbon state into small composables in separate commits.
- Verified the refactor slices with `npm run build`.

## 4-26 10:33am 0.35
- fixed my typos from 3am coding bot now auto updates difficulty

## 4-26 0.34
- revert bot cogs fix card balance and pulling only bank tiles 
adjust delays added diferent scores per bot dificulty 
## 2026-04-26 0.0.33

Start: 2026-04-26 07:45:00 EDT
Stop: 2026-04-26 08:08:14 EDT

- Smoothed the Machine Learning bot cog so it ramps up before a bot word and eases back down afterward.
- Smoothed player cog speed changes so scoring pace transitions do not jump.
- Changed Loose Rack to shuffle tiles every 8 seconds and updated its description.
- Reduced duplicate card draw odds when a player already holds that card, and added card chance logs showing effective weights and chances.
- Verified the changes with `npm run build`.

## 2026-04-26 0.0.31 6am 0.32
skip intro
dificulty balance changes 
cog dynamic speed 
word pool for bot 
update dificulty on win
auth prompt view
card hover style

## 2026-04-26 0.0.31

Start: 2026-04-26 03:18:00 EDT
Stop: 2026-04-26 03:24:10 EDT

- Restyled checkbox controls globally to match the current Wordis button/focus treatment.
- Fixed StartScreen controller focus after the intro finishes and filtered controller navigation to visible, enabled targets.
- Tuned the Machine Learning cogs to render the black PNG assets with a brighter steel finish in the type screen and game screen.
- Verified the changes with `npm run build`.

## 2026-04-26 0.0.30

Start: 2026-04-26 02:35:00 EDT
Stop: 2026-04-26 02:47:10 EDT

- Restyled the auth prompt to match the settings modal and added controller-friendly focus navigation.
- Added click, Space, Enter, and controller-dispatched skip support for the intro animation.
- Added a mechanical Machine Learning presentation on the play-type screen with spinning cogs.
- Updated bot match gameplay visuals with a cooler machine-themed background and cog animation.
- Opened the card drawer automatically on mobile game start.
- Prevented round modifier descriptions in the bonus card from being clipped.
- Raised word-builder point labels above tile and score-pop layers.
- Made mobile magnifier mode turn off when tapping anywhere other than a tile or the magnifier button.
- Verified the changes with `npm run build`.

## 2026-04-23 0.0.29
 litterally so many changes

114  7cd057b feat: add home screen controller rows              ()
113  768b8e4 feat: add multi-round screen controller focus      ()
112  0462d29 feat: add multiplayer screen controller focus      ()
111  4f44670 squahs settings style                              ()
110  0888d9b feat: add type screen controller focus             ()
109  9bf5897 style: refresh settings modal                      ()
108  c67f69d style: refresh play type modal                     ()
107  c25868e refactor: share modifier starting score logic      ()
106  d24edd4 blood and bank start at half value down and up res ()
105  729efb6 style: show loose rack shuffle cue                 ()
104  653c743 style: mark rusting idle tiles                     ()
103  e7c6cda style: show vowel toll progress                    ()
102  5c2f871 style: mark fleeting round tiles                   ()
101  2f6c657 style: mark doubled burn tiles                     ()
100  dba09e3 style: show blocked card panel                     ()
99   60e7a84 style: mark muted consonant scoring                ()
98   daccb8d style: mark required word length slots             ()
97   60de15b style: mark banned letter tiles                    ()
96   25dffdc hide kind of the modifier tag on the round bubbles ()
95   baff0e0 adjust cards view                                  ()
94   0cc3c2a show footer                                        ()
93   020216c comment on spasiming curser                        ()
92   6f2db68 add new attack  for solo play                      ()
91   54c3aab swap word milestions                               ()
90   eaef114 new pair boon                                      ()
89   aeb864d fix gold debuf                                     ()
88   8c159e5 added tile raritiy weight adjustmeant per tile alr ()
87   ed0660f header change                                      ()
86   47c02ac add control up to round modifiers in upgrades      ()
85   8850032 style                                              ()
84   938c944 reward controls with cintroller                    ()
83   5d81b5b deeper pair purple                                 ()
82   09eee09 tile modifier style                                ()
81   6f7ad4f show all modifiers                                 ()
80   7108cd1 seven second modiffy                               ()
79   e762482 contrast for tile select                           ()
78   49288a3 pair badge                                         ()
77   7d021c1 tiel tutorial size                                 ()
76   547819d chore: rename crowded bag modifier                 ()
75   7bd57fb feat: add royal pear tile combo                    ()
74   9fa771f feat: add seven letter time refund modifier        ()
73   fffff53 feat: add round time reserve modifier              ()
72   6669e94 feat: add must tile shield modifier                ()
71   0751e58 feat: expand multi-round modifiers and controller  ()
70   ae79bab adjust mobile styling                              ()
69   0875a23 overlay drawer z index                             ()
68   a1a691f fix scroll in multiplayer and handles              ()
67   bb80208 added multi rounds select                          ()
66   525b5e8 lower bot more                                     ()
65   e8bcc8c move images for pwa                                ()
64   d25709d lower bot dificulty                                ()
63   67173e6 adjust text accross screens                        ()
62   b5e0d11 fix controller native start                        ()
61   3aa6383 set native controller and change background for mo ()
60   9d7c881 new images                                         ()
59   f5d18b3 disable profile                                    ()
58   857c666 update auto zoom values                            ()
57   db243e3 fixed boon and attack cache                        ()
56   cd4a55a comment out continue                               ()
55   9bd2bc6 remove log                                         ()
54   ea8433c updated to default to solo profile over duel profi ()
53   8247c58 adjust all round times and scores                  ()
52   fc1945c drawer style                                       ()
51   f164c92 adjustment to multiplayer swing for pulling good o ()
50   e8e6bdd modifier cap adjust                                ()
49   0605f16 updated logic for the neutral bad and good modific ()
48   7b6c062 fix: keep specific modifier odds within pool       ()
47   68905f0 added tiles and letter pull chance                 ()
46   47e3d58 fix: limit strong start to opening rack            ()
45   4527bb7 fix: include normal modifier chance in logs        ()
44   12597a2 fix: log accurate modifier chances                 ()
43   fd9a6a4 feat: add neutral chance personal modifier         ()
42   b1141d6 feat: seed starting personal modifiers             ()
41   9267f93 blank sound                                        ()
40   ebbfb75 audio playing after every round                    ()
39   a11f517 balance                                            ()
38   237f59e feat: force test round modifiers                   ()
37   257318c balancing                                          ()
36   e597ba9 feat: boost ghost tile odds with ghost charge      ()
35   9b1f99c fix: collapse personal modifiers on mobile         ()
34   1e9ef5c feat: highlight round modifier details             ()
33   0fdd883 fix: disable overtime banner in multi-round        ()
32   f718f22 fix: center multi-round progress numbers           ()
31   3abce92 feat: show active round modifiers                  ()
30   a558ee6 feat: delay multi-round reward reveal              ()
29   185d3b2 doc                                                ()
28   72955da feat: expand multi-round run to thirteen rounds    ()
27   fc0a123 fix: preserve multi-round cards between rounds     ()
26   441b058 fix: show multi-round score target                 ()

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
