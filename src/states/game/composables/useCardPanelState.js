import { computed } from 'vue';

const groupCardsByKey = (cards = []) => {
  const groupedCards = [];
  const groupByKey = new Map();

  cards.forEach((card) => {
    const groupKey = card.key || card.id;
    if (!groupByKey.has(groupKey)) {
      const group = {
        key: groupKey,
        card,
        cards: [],
        count: 0
      };
      groupByKey.set(groupKey, group);
      groupedCards.push(group);
    }

    const group = groupByKey.get(groupKey);
    group.cards.push(card);
    group.count = group.cards.length;
  });

  return groupedCards;
};

export function useCardPanelState({
  myCards,
  attacksEnabled,
  actionCardKind,
  activeTrayModifierCardId,
  cardControlsDisabled
}) {
  const groupedTrayModifierCards = computed(() => groupCardsByKey(myCards.value.trayModifiers || []));
  const actionCards = computed(() => {
    const handKey = actionCardKind.value === 'tactic' ? 'tactics' : 'attacks';
    return myCards.value[handKey] || [];
  });
  const groupedAttackCards = computed(() => attacksEnabled.value ? groupCardsByKey(actionCards.value) : []);
  const controllerCards = computed(() => {
    return [
      ...groupedTrayModifierCards.value.map((group) => group.card),
      ...groupedAttackCards.value.map((group) => group.card)
    ];
  });
  const activeTrayModifierCard = computed(() => {
    return (myCards.value.trayModifiers || []).find((card) => card.id === activeTrayModifierCardId.value) || null;
  });
  const visibleAttackCount = computed(() => attacksEnabled.value ? actionCards.value.length : 0);
  const cardSummary = computed(() => {
    if (cardControlsDisabled.value) {
      return 'Cards blocked';
    }

    const actionLabel = actionCardKind.value === 'tactic' ? 'Tactic' : 'Attack';
    return attacksEnabled.value
      ? `${(myCards.value.trayModifiers || []).length} Tray Modifier · ${visibleAttackCount.value} ${actionLabel}`
      : `${(myCards.value.trayModifiers || []).length} Tray Modifier`;
  });
  const hasCardsInHand = computed(() => (myCards.value.trayModifiers || []).length > 0 || visibleAttackCount.value > 0);

  return {
    groupedTrayModifierCards,
    groupedAttackCards,
    controllerCards,
    activeTrayModifierCard,
    visibleAttackCount,
    cardSummary,
    hasCardsInHand
  };
}
