import aCrossIcon from './assets/images/xbox-buttons/a-cross.svg';
import bCircleIcon from './assets/images/xbox-buttons/b-circle.svg';
import xSquareIcon from './assets/images/xbox-buttons/x-square.svg';
import yTriangleIcon from './assets/images/xbox-buttons/y-triangle.svg';
import leftBumperIcon from './assets/images/xbox-buttons/left-bumper.svg';
import rightBumperIcon from './assets/images/xbox-buttons/right-bumper.svg';
import leftTriggerIcon from './assets/images/xbox-buttons/left-trigger.svg';
import rightTriggerIcon from './assets/images/xbox-buttons/right-trigger.svg';
import viewSelectIcon from './assets/images/xbox-buttons/view-select.svg';
import menuStartIcon from './assets/images/xbox-buttons/menu-start.svg';

export const CONTROLLER_MAPPING_STORAGE_KEY = 'wordis:controllerButtonMapping';

export const CONTROLLER_BUTTONS = [
  { index: 0, label: 'A / Cross', icon: aCrossIcon },
  { index: 1, label: 'B / Circle', icon: bCircleIcon },
  { index: 2, label: 'X / Square', icon: xSquareIcon },
  { index: 3, label: 'Y / Triangle', icon: yTriangleIcon },
  { index: 4, label: 'Left Bumper', icon: leftBumperIcon },
  { index: 5, label: 'Right Bumper', icon: rightBumperIcon },
  { index: 6, label: 'Left Trigger', icon: leftTriggerIcon },
  { index: 7, label: 'Right Trigger', icon: rightTriggerIcon },
  { index: 8, label: 'View / Select', icon: viewSelectIcon },
  { index: 9, label: 'Menu / Start', icon: menuStartIcon },
  { index: 10, label: 'Left Stick Press' },
  { index: 11, label: 'Right Stick Press' },
  { index: 12, label: 'D-pad Up' },
  { index: 13, label: 'D-pad Down' },
  { index: 14, label: 'D-pad Left' },
  { index: 15, label: 'D-pad Right' },
  { index: 16, label: 'Guide / Home' }
];

export const CONTROLLER_ACTIONS = [
  { key: 'select', label: 'Select focused item', inputKey: ' ' },
  { key: 'back', label: 'Back / pause', inputKey: 'Escape' },
  { key: 'navigateUp', label: 'Move up', inputKey: 'ArrowUp' },
  { key: 'navigateDown', label: 'Move down', inputKey: 'ArrowDown' },
  { key: 'navigateLeft', label: 'Move left', inputKey: 'ArrowLeft' },
  { key: 'navigateRight', label: 'Move right', inputKey: 'ArrowRight' },
  { key: 'undoLetter', label: 'Undo last letter', inputKey: 'b' },
  { key: 'clearWord', label: 'Clear word', inputKey: 'y' },
  { key: 'submitWord', label: 'Submit word', inputKey: 'x' },
  { key: 'saveLetters', label: 'Save letters', inputKey: 'lb' },
  { key: 'clearRack', label: 'Clear rack', inputKey: 'rb' },
  { key: 'toggleSideDrawer', label: 'Toggle side drawer', inputKey: 'lt' },
  { key: 'toggleModifiersDrawer', label: 'Toggle modifiers drawer', inputKey: 'rt' }
];

export const DEFAULT_CONTROLLER_ACTION_MAPPING = {
  select: 0,
  back: 9,
  navigateUp: 12,
  navigateDown: 13,
  navigateLeft: 14,
  navigateRight: 15,
  undoLetter: 1,
  clearWord: 3,
  submitWord: 2,
  saveLetters: 4,
  clearRack: 5,
  toggleSideDrawer: 6,
  toggleModifiersDrawer: 7
};

const validButtonIndexes = new Set(CONTROLLER_BUTTONS.map((button) => button.index));
const validActionKeys = new Set(CONTROLLER_ACTIONS.map((action) => action.key));

export const normalizeControllerMapping = (mapping = {}) => {
  const normalized = { ...DEFAULT_CONTROLLER_ACTION_MAPPING };

  Object.entries(mapping || {}).forEach(([actionKey, buttonIndex]) => {
    const numericButtonIndex = Number(buttonIndex);
    if (validActionKeys.has(actionKey) && validButtonIndexes.has(numericButtonIndex)) {
      normalized[actionKey] = numericButtonIndex;
    }
  });

  const usedButtonIndexes = new Set();
  CONTROLLER_ACTIONS.forEach((action) => {
    const mappedButtonIndex = normalized[action.key];
    if (!usedButtonIndexes.has(mappedButtonIndex)) {
      usedButtonIndexes.add(mappedButtonIndex);
      return;
    }

    const defaultButtonIndex = DEFAULT_CONTROLLER_ACTION_MAPPING[action.key];
    if (!usedButtonIndexes.has(defaultButtonIndex)) {
      normalized[action.key] = defaultButtonIndex;
      usedButtonIndexes.add(defaultButtonIndex);
      return;
    }

    const availableButton = CONTROLLER_BUTTONS.find((button) => !usedButtonIndexes.has(button.index));
    if (availableButton) {
      normalized[action.key] = availableButton.index;
      usedButtonIndexes.add(availableButton.index);
    }
  });

  return normalized;
};

export const loadControllerMapping = () => {
  if (typeof localStorage === 'undefined') {
    return { ...DEFAULT_CONTROLLER_ACTION_MAPPING };
  }

  try {
    return normalizeControllerMapping(JSON.parse(localStorage.getItem(CONTROLLER_MAPPING_STORAGE_KEY) || '{}'));
  } catch (error) {
    return { ...DEFAULT_CONTROLLER_ACTION_MAPPING };
  }
};

export const saveControllerMapping = (mapping) => {
  const normalized = normalizeControllerMapping(mapping);
  localStorage.setItem(CONTROLLER_MAPPING_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
};

export const getActionForButton = (mapping, buttonIndex) => {
  const numericButtonIndex = Number(buttonIndex);
  return Object.entries(normalizeControllerMapping(mapping)).find(([, mappedButtonIndex]) => (
    mappedButtonIndex === numericButtonIndex
  ))?.[0] || '';
};

export const getInputKeyForAction = (actionKey) => (
  CONTROLLER_ACTIONS.find((action) => action.key === actionKey)?.inputKey || ''
);

export const getButtonForAction = (mapping, actionKey) => {
  const buttonIndex = normalizeControllerMapping(mapping)[actionKey];
  return CONTROLLER_BUTTONS.find((button) => button.index === buttonIndex) || null;
};
