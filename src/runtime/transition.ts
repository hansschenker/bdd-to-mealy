import type { MealyRule } from '../model.js';
import { findRuleConflicts } from '../model.js';

export class ConflictingTransitionError extends Error {
  constructor(
    readonly currentState: string,
    readonly event: string,
  ) {
    super(
      `Conflicting Mealy rules for state "${currentState}" and event "${event}"`,
    );
    this.name = 'ConflictingTransitionError';
  }
}

export class UnknownTransitionError extends Error {
  constructor(
    readonly currentState: string,
    readonly event: string,
  ) {
    super(
      `No Mealy rule for state "${currentState}" and event "${event}"`,
    );
    this.name = 'UnknownTransitionError';
  }
}

export type TransitionIndex = ReadonlyMap<string, MealyRule>;

function transitionKey(state: string, event: string): string {
  return `${state}\u0000${event}`;
}

export function buildTransitionIndex(
  rules: readonly MealyRule[],
): TransitionIndex {
  const conflicts = findRuleConflicts(rules);

  if (conflicts.length > 0) {
    const conflict = conflicts[0];
    if (!conflict) {
      throw new Error('Expected at least one transition conflict');
    }

    throw new ConflictingTransitionError(
      conflict.currentState,
      conflict.event,
    );
  }

  return new Map(
    rules.map((rule) => [
      transitionKey(rule.currentState, rule.event),
      rule,
    ]),
  );
}

export function findTransition(
  index: TransitionIndex,
  state: string,
  event: string,
): MealyRule | undefined {
  return index.get(transitionKey(state, event));
}
