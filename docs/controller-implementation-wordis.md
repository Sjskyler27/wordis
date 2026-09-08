# Controller Implementation in WORDIS

This document describes the current controller implementation in WORDIS: where controller input enters the app, how it becomes game actions, and which components need to participate for controller play to work.

## High-level Flow

WORDIS uses the browser Gamepad API at the app shell level in `src/App.vue`.

1. `navigator.getGamepads()` is polled with `requestAnimationFrame`.
2. Button presses and left-stick axis movement are detected once per press or cooldown tick.
3. Physical buttons are translated into controller action names through `src/controllerMapping.js`.
4. Controller actions are translated into the keyboard-style tokens the app already understands.
5. A synthetic `keydown` event is dispatched, or the focused control is clicked for select-style actions.
6. The active screen handles those keyboard-style tokens.

This keeps controller hardware details out of most screens. Game screens continue to work with inputs such as `ArrowLeft`, `ArrowRight`, `Escape`, `x`, `b`, `lb`, and `rt`.

## Xbox Button Assets

The current visual button prompts are Xbox-only. PlayStation art is intentionally out of scope for this pass.

Xbox SVGs live in `src/assets/images/xbox-buttons/` and are named to match the current button labels:

- `a-cross.svg`
- `b-circle.svg`
- `x-square.svg`
- `y-triangle.svg`
- `left-bumper.svg`
- `right-bumper.svg`
- `left-trigger.svg`
- `right-trigger.svg`
- `view-select.svg`
- `menu-start.svg`

The shared mapping module imports these SVGs and attaches them to the matching `CONTROLLER_BUTTONS` entries. D-pad, stick press, and guide/home entries currently fall back to text because no SVGs exist for them yet.

## Shared Mapping Layer

The shared mapping lives in `src/controllerMapping.js`.

It defines:

- `CONTROLLER_BUTTONS`: physical Gamepad API button indexes, user-facing labels, and Xbox icon URLs when available.
- `CONTROLLER_ACTIONS`: game/action concepts and the keyboard token each action emits.
- `DEFAULT_CONTROLLER_ACTION_MAPPING`: the default action-to-button assignments.
- `loadControllerMapping()`: loads and normalizes mappings from `localStorage`.
- `saveControllerMapping()`: normalizes and persists mappings.
- `getActionForButton()`: resolves a physical button index to an action key.
- `getInputKeyForAction()`: resolves an action key to the existing input token.

The current storage key is `wordis:controllerButtonMapping`.

## Default Actions

The current configurable actions are intentionally limited to actions that matter to controller play:

- Select focused item
- Back / pause
- Move up, down, left, and right
- Undo last letter
- Clear word
- Submit word
- Save letters
- Clear rack
- Toggle side drawer
- Toggle modifiers drawer

Not every game behavior needs to be bindable. Keeping the list focused makes the settings easier to use and reduces accidental breakage.

## App Shell Responsibilities

`src/App.vue` owns hardware polling and global controller settings.

It tracks:

- `nativeControllerSupport`: whether native controller polling is enabled.
- `joystickSensitivity`: stick repeat cooldown.
- `controllerMapping`: the persisted action-to-button mapping.
- Per-gamepad previous button state and cooldown state.
- Per-gamepad previous axis direction and cooldown state.

The left stick is treated as navigation input. It dispatches the navigation actions directly, so stick navigation keeps working even when D-pad buttons are remapped.

## Settings Responsibilities

`src/assets/Settings.vue` owns the user-facing controller configuration.

The Controller tab lets players assign a physical controller button to each configurable action. Mapping changes emit `controllerMappingChange` to `App.vue`, which saves the normalized mapping. The Reset Buttons control emits `resetControllerMapping`, restoring the defaults.

The settings modal also handles controller-style focus movement across buttons, inputs, and selects. When a mapping select has focus, directional input cycles that action through available controller buttons. If a player chooses a button already used by another action, the settings UI swaps those two assignments so one button does not secretly control multiple actions.

Each mapping row displays the current Xbox button image through `ControllerButtonHint`. Rows use the right side so the icon does not cover the action label or select text.

## Game Screen Responsibilities

`src/states/game/Game.vue` owns in-game controller behavior after actions have been translated into keyboard-style tokens.

Important controller state includes:

- `controllerRegion`: the currently controlled area, such as rack, cards, builder, actions, rounds, or reward.
- Cursor indexes for each region.
- Computed focused IDs passed into child components.

Important child components expose focusable controller targets with data attributes:

- `GameLane.vue`: rack tiles via `data-controller-tile`.
- `WordBuilder.vue`: built tiles and action buttons via `data-controller-built` and `data-controller-action`.
- `GameCardsPanel.vue`: cards via `data-controller-card`.
- `MultiRoundProgress.vue`: rounds via `data-controller-round`.
- `MultiRoundRewardChoice.vue`: reward cards via `data-controller-reward`.

`Game.vue` listens for the keyboard-style tokens and performs the actual behavior:

- Arrows move focus between regions and items.
- Select chooses the focused tile, action, card, or reward.
- `b`, `y`, and `x` perform undo, clear word, and submit.
- `lb`, `rb`, `lt`, and `rt` trigger save letters, clear rack, side drawer, and modifiers drawer.
- `Escape` is allowed to continue to the broader pause/settings behavior.

## Button Prompt Overlay

Controller prompts are rendered by `src/states/game/components/ControllerButtonHint.vue`.

The component accepts:

- `actionKey`: the controller action to display.
- `controllerMapping`: the current action-to-button mapping.
- `controllerConnected`: whether a controller is currently connected.
- `hide`: optional boolean override that suppresses the prompt.
- `size`: optional pixel size, defaulting to `30`.
- `side`: optional overlay side, defaulting to `left`; supported values are `left` and `right`.

The hint renders in the bottom-left corner by default and can be moved to bottom-right with `side="right"`. It renders nothing unless `controllerConnected` is true, and it also renders nothing when `hide` is true. The hint is absolutely positioned, so it should not reserve layout space in the element that owns it.

If the mapped Xbox button has an SVG, the SVG is displayed. If no Xbox SVG exists, a small text fallback displays the mapped button label.

Current prompt placement:

- Rack tiles, built tiles, cards, rounds, and reward cards show the mapped Select button only when they have controller focus.
- Word builder action buttons always show their mapped action button.
- Settings controller rows show their mapped Xbox button image.

## Other Screens

Home, game mode selection, multiplayer setup, and multi-round setup screens also listen for keyboard-style events. Because the app shell now maps controller buttons to actions before dispatching those events, these screens benefit from remapped select, back, and navigation buttons without needing to know about physical Gamepad API indexes.

## Adding a New Bindable Action

To add a new bindable controller action:

1. Add the action to `CONTROLLER_ACTIONS` in `src/controllerMapping.js`.
2. Add its default button to `DEFAULT_CONTROLLER_ACTION_MAPPING`.
3. Make sure the emitted `inputKey` is handled by the relevant screen.
4. If the action should appear in settings, no extra UI work is needed; the Controller tab renders `CONTROLLER_ACTIONS`.

Prefer reusing an existing keyboard-style token when possible. Add a new token only when the behavior is genuinely new.
