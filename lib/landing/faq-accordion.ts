export type FaqAccordionState = string | null;

export type FaqAccordionAction = Readonly<{
  type: "activate";
  id: string;
}>;

export type FaqAccordionReducer = (
  state: FaqAccordionState,
  action: FaqAccordionAction,
) => FaqAccordionState;

export const INITIAL_FAQ_ACCORDION_STATE: FaqAccordionState = null;

export function createFaqAccordionReducer(
  faqIds: readonly string[],
): FaqAccordionReducer {
  const validIds = new Set(faqIds);

  return (state, action) => {
    const currentState =
      state !== null && validIds.has(state) ? state : null;

    if (action.type !== "activate" || !validIds.has(action.id)) {
      return currentState;
    }

    return currentState === action.id ? null : action.id;
  };
}
