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
  activeBoonCardId,
  cardControlsDisabled
}) {
  const groupedBoonCards = computed(() => groupCardsByKey(myCards.value.boons));
  const groupedAttackCards = computed(() => attacksEnabled.value ? groupCardsByKey(myCards.value.attacks) : []);
  const controllerCards = computed(() => {
    return [
      ...groupedBoonCards.value.map((group) => group.card),
      ...groupedAttackCards.value.map((group) => group.card)
    ];
  });
  const activeBoonCard = computed(() => {
    return myCards.value.boons.find((card) => card.id === activeBoonCardId.value) || null;
  });
  const visibleAttackCount = computed(() => attacksEnabled.value ? myCards.value.attacks.length : 0);
  const cardSummary = computed(() => {
    if (cardControlsDisabled.value) {
      return 'Cards blocked';
    }

    return attacksEnabled.value
      ? `${myCards.value.boons.length} Boon · ${visibleAttackCount.value} Attack`
      : `${myCards.value.boons.length} Boon`;
  });
  const hasCardsInHand = computed(() => myCards.value.boons.length > 0 || visibleAttackCount.value > 0);

  return {
    groupedBoonCards,
    groupedAttackCards,
    controllerCards,
    activeBoonCard,
    visibleAttackCount,
    cardSummary,
    hasCardsInHand
  };
}
