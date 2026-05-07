# Reusable Controller Implementation Guide

This guide describes the generic controller pattern extracted from WORDIS. Use it when implementing controller support in a future game.

## Core Idea

Do not make gameplay code ask, "Was button 2 pressed?"

Instead, use this chain:

Physical button -> configurable action -> game input event -> screen behavior

That gives players control over bindings and keeps hardware details away from gameplay code.

## Required Pieces

A flexible controller implementation needs these pieces:

- A hardware input layer.
- A controller button catalog.
- A bindable action catalog.
- A persisted action-to-button mapping.
- A translator from physical button to action.
- A translator from action to the app's input event.
- Screen-level focus and behavior handlers.
- A settings UI for remapping.

## Hardware Input Layer

Use the browser Gamepad API or the platform equivalent.

The input layer should:

- Detect connected controllers.
- Poll current controller state.
- Track previous button state so a held button does not fire every frame.
- Apply cooldowns for repeatable input.
- Apply a deadzone to analog sticks.
- Convert analog stick direction into navigation actions.

Keep this layer at the app shell or engine level. Screens should not poll hardware directly.

## Button Catalog

Create a stable list of physical buttons:

```js
const CONTROLLER_BUTTONS = [
  { index: 0, label: 'A / Cross' },
  { index: 1, label: 'B / Circle' },
  { index: 2, label: 'X / Square' },
  { index: 3, label: 'Y / Triangle' }
];
```

The `index` should match the platform API. The `label` is for settings UI.

## Action Catalog

Create a list of actions the game allows players to bind:

```js
const CONTROLLER_ACTIONS = [
  { key: 'select', label: 'Select', inputKey: ' ' },
  { key: 'back', label: 'Back', inputKey: 'Escape' },
  { key: 'submit', label: 'Submit', inputKey: 'x' }
];
```

The `key` is the stable action identifier. The `label` is for settings. The `inputKey` is the screen-level event or token the game already understands.

Do not make every internal behavior bindable. Expose the actions players actually need to operate the game.

## Default Mapping

Store defaults as action-to-button assignments:

```js
const DEFAULT_CONTROLLER_ACTION_MAPPING = {
  select: 0,
  back: 1,
  submit: 2
};
```

Action-to-button storage makes settings screens easy to render because each row is one action with one selected button.

## Persistence

Save mappings in local storage, a profile save, cloud settings, or a platform settings store.

Always normalize loaded mappings:

- Ignore unknown actions.
- Ignore unknown button indexes.
- Fill missing actions from defaults.
- Recover gracefully from invalid JSON or corrupted settings.

## Dispatching Actions

When a physical button is pressed:

1. Look up which action is assigned to that button.
2. Look up the screen input token for that action.
3. Dispatch the token into the existing input system.

In a web app, that can be a synthetic keyboard event. In an engine, it might be an input bus event such as `controllerAction:submit`.

The important part is that game screens consume actions or normalized input tokens, not raw button indexes.

## Screen Focus Model

Controller play needs a focus model, even if mouse play does not.

Each screen should know:

- Which region is active.
- Which item inside that region is focused.
- How directional input moves within or between regions.
- What select does for the focused item.
- What back does from the current state.

For UI-heavy games, add stable attributes, refs, or IDs to focusable elements so controller state can highlight and activate the correct element.

## Settings UI

A remapping UI should include:

- One row per bindable action.
- A button selector for each action.
- A reset-to-defaults control.
- Labels that match player intent, not code names.

If the UI must work with a controller, make sure the selector can be changed without a mouse. For example, focused rows can cycle through available buttons with left/right input.

Decide how to handle duplicate assignments. A simple default is to swap assignments when a player picks a button that is already in use. That keeps every action reachable and avoids hidden priority rules.

## Accessibility Notes

Flexible controller binding helps players who:

- Use non-standard controllers.
- Prefer different console layouts.
- Have limited access to specific buttons.
- Need high-frequency actions moved to easier buttons.

Avoid hard-coding essential gameplay to one physical button. Keep defaults familiar, but let players move critical actions.

## Implementation Checklist

1. Add a controller mapping module.
2. Replace raw button checks with action lookup.
3. Route actions through the existing input system.
4. Add settings for action-to-button assignment.
5. Persist and normalize settings.
6. Verify default controls still work.
7. Verify remapping a critical action changes runtime behavior.
8. Document the current game's action list and focus model.
