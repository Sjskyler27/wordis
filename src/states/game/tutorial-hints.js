export const TUTORIAL_HINTS_STORAGE_KEY = 'wordisTutorialHints';
export const TUTORIAL_COMPLETED_STORAGE_KEY = 'hasCompletedWordisTutorial';

export const DEFAULT_TUTORIAL_HINTS = [
  {
    id: 'welcome',
    title: 'Wordis Run Tutorial',
    body: 'Build words from your rack to score points before the round timer runs out. Longer words and special tiles can swing a run fast.',
    closeLabel: 'Start'
  },
  {
    id: 'plain_tiles',
    title: 'Start With Plain Tiles',
    body: 'Build words from the tiles in front of you. Words must be 4 letters. larger words score more. Beat the score before time runs out!',
    closeLabel: 'Got It'
  },
  {
    id: 'first_good_modifier',
    title: 'Good Modifier Pulled',
    body: 'Nice. Your next pull includes a good modifier. Good modifiers add scoring twists or resources, so try building a word around it.',
    closeLabel: 'Keep Playing'
  },
  {
    id: 'larger_words',
    title: 'Longer Words Give rewards',
    body: 'Larger words will give you benefits such as cards or higher points. Each milestone indicates the reward. covered milestones indicate the reward received.',
    closeLabel: 'Got It'
  },
  {
    id: 'neutral_modifier',
    title: 'Neutral Modifier Pulled',
    body: 'Neutral modifiers change how a tile behaves without being strictly good or bad. Read the tile tooltip and decide whether it fits your word.',
    closeLabel: 'Got It'
  },
  {
    id: 'bad_modifier',
    title: 'Bad Modifier Pulled',
    body: 'Bad modifiers make your rack harder to use. You can often play around them, clear your rack, or use boons to remove the pressure.',
    closeLabel: 'Got It'
  },
  {
    id: 'card_received',
    title: 'Card Received',
    body: 'You gained a card. Boons help you manipulate your tile, while attacks pressure the other side or give run-specific utility.',
    closeLabel: 'Got It'
  },
  {
    id: 'save_letters',
    title: 'Save Letters',
    body: "Close to building a word? Use Save Letters to highlight letters you don't want to accidentally use.",
    closeLabel: 'Got It'
  },
  {
    id: 'clear_rack',
    title: 'Clear Your Rack',
    body: 'If bad modifiers pile up, use Clear Rack to redraw your letters. You only get a few clears, so save them for messy boards.',
    closeLabel: 'Got It'
  },
  {
    id: 'rewards',
    title: 'Round Rewards',
    body: 'After you clear a round, choose a permanent upgrade. These stack for the rest of the run.',
    closeLabel: 'Got It'
  },
  {
    id: 'round_modifiers',
    title: 'Round Modifiers',
    body: 'Challenge rounds add temporary rules. Check the round tracker to preview what is coming next.',
    closeLabel: 'Got It'
  },
  {
    id: 'game_won',
    title: 'Run Complete',
    body: 'You cleared the tutorial run. The full tracks raise targets, add harder modifiers, and ask you to make sharper reward choices.',
    closeLabel: 'Nice'
  },
  {
    id: 'game_lost',
    title: 'Run Failed',
    body: 'A failed run is still useful. Try shorter reliable words when time is low, and save stronger boards for bigger scoring pushes.',
    closeLabel: 'Got It'
  }
];

const cloneDefaultHints = () => DEFAULT_TUTORIAL_HINTS.map((hint) => ({ ...hint, hasSeen: false }));

const normalizeHints = (storedHints) => {
  const storedById = Array.isArray(storedHints)
    ? storedHints.reduce((hints, hint) => {
        if (hint?.id) {
          hints[hint.id] = hint;
        }
        return hints;
      }, {})
    : (storedHints || {});

  return cloneDefaultHints().map((hint) => ({
    ...hint,
    ...(storedById[hint.id] || {}),
    hasSeen: Boolean(storedById[hint.id]?.hasSeen)
  }));
};

export const loadTutorialHints = () => {
  if (typeof localStorage === 'undefined') {
    return cloneDefaultHints();
  }

  try {
    const storedHints = JSON.parse(localStorage.getItem(TUTORIAL_HINTS_STORAGE_KEY) || 'null');
    const hints = normalizeHints(storedHints);
    localStorage.setItem(TUTORIAL_HINTS_STORAGE_KEY, JSON.stringify(hints));
    return hints;
  } catch (error) {
    const hints = cloneDefaultHints();
    localStorage.setItem(TUTORIAL_HINTS_STORAGE_KEY, JSON.stringify(hints));
    return hints;
  }
};

export const getTutorialHint = (hintId) => {
  return loadTutorialHints().find((hint) => hint.id === hintId) || null;
};

export const markTutorialHintViewed = (hintId) => {
  const hints = loadTutorialHints().map((hint) => (
    hint.id === hintId ? { ...hint, hasSeen: true } : hint
  ));
  localStorage.setItem(TUTORIAL_HINTS_STORAGE_KEY, JSON.stringify(hints));
  return hints;
};

export const setAllTutorialHintsViewed = (hasSeen) => {
  const hints = loadTutorialHints().map((hint) => ({ ...hint, hasSeen: Boolean(hasSeen) }));
  localStorage.setItem(TUTORIAL_HINTS_STORAGE_KEY, JSON.stringify(hints));
  return hints;
};
