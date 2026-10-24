import { findRuleConflicts, MealyRule, RuleConflict } from './model.js';

export type TransitionTableRow = MealyRule;

export type MissingTransition = Readonly<{
  state: string;
  event: string;
}>;

export type MachineAnalysisOptions = Readonly<{
  initialState?: string;
  states?: readonly string[];
  events?: readonly string[];
}>;

export type MachineAnalysis = Readonly<{
  states: readonly string[];
  events: readonly string[];
  actions: readonly string[];
  declaredStates: readonly string[];
  declaredEvents: readonly string[];
  undeclaredStates: readonly string[];
  undeclaredEvents: readonly string[];
  transitionTable: readonly TransitionTableRow[];
  conflicts: readonly RuleConflict[];
  reachableStates: readonly string[];
  unreachableStates: readonly string[];
  terminalStates: readonly string[];
  missingTransitions: readonly MissingTransition[];
  complete: boolean;
}>;

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function deriveStates(rules: readonly MealyRule[]): string[] {
  return unique(rules.flatMap((rule) => [rule.currentState, rule.nextState]));
}

function deriveEvents(rules: readonly MealyRule[]): string[] {
  return unique(rules.map((rule) => rule.event));
}

function deriveActions(rules: readonly MealyRule[]): string[] {
  return unique(rules.flatMap((rule) => rule.actions));
}

function reachableFrom(
  rules: readonly MealyRule[],
  initialState: string | undefined,
): string[] {
  if (initialState === undefined) return [];

  const adjacency = new Map<string, Set<string>>();

  for (const rule of rules) {
    const nextStates = adjacency.get(rule.currentState) ?? new Set<string>();
    nextStates.add(rule.nextState);
    adjacency.set(rule.currentState, nextStates);
  }

  const visited = new Set<string>();
  const queue = [initialState];

  while (queue.length > 0) {
    const state = queue.shift();
    if (state === undefined || visited.has(state)) continue;

    visited.add(state);

    for (const nextState of adjacency.get(state) ?? []) {
      if (!visited.has(nextState)) queue.push(nextState);
    }
  }

  return [...visited];
}

function missingPairs(
  rules: readonly MealyRule[],
  states: readonly string[],
  events: readonly string[],
): MissingTransition[] {
  const definedPairs = new Set(
    rules.map((rule) => `${rule.currentState}\u0000${rule.event}`),
  );

  const missing: MissingTransition[] = [];

  for (const state of states) {
    for (const event of events) {
      if (!definedPairs.has(`${state}\u0000${event}`)) {
        missing.push({ state, event });
      }
    }
  }

  return missing;
}

export function analyzeMachine(
  rules: readonly MealyRule[],
  options: MachineAnalysisOptions = {},
): MachineAnalysis {
  const states = deriveStates(rules);
  const events = deriveEvents(rules);
  const actions = deriveActions(rules);

  const declaredStates = unique(options.states ?? states);
  const declaredEvents = unique(options.events ?? events);

  const declaredStateSet = new Set(declaredStates);
  const declaredEventSet = new Set(declaredEvents);

  const undeclaredStates = states.filter(
    (state) => !declaredStateSet.has(state),
  );

  const undeclaredEvents = events.filter(
    (event) => !declaredEventSet.has(event),
  );

  const reachableStates = reachableFrom(rules, options.initialState);
  const reachableSet = new Set(reachableStates);

  const unreachableStates =
    options.initialState === undefined
      ? []
      : states.filter((state) => !reachableSet.has(state));

  const statesWithOutgoing = new Set(
    rules.map((rule) => rule.currentState),
  );

  const terminalStates = states.filter(
    (state) => !statesWithOutgoing.has(state),
  );

  const conflicts = findRuleConflicts(rules);

  const missingTransitions = missingPairs(
    rules,
    declaredStates,
    declaredEvents,
  );

  return {
    states,
    events,
    actions,
    declaredStates,
    declaredEvents,
    undeclaredStates,
    undeclaredEvents,
    transitionTable: [...rules],
    conflicts,
    reachableStates,
    unreachableStates,
    terminalStates,
    missingTransitions,
    complete:
      conflicts.length === 0 &&
      undeclaredStates.length === 0 &&
      undeclaredEvents.length === 0 &&
      missingTransitions.length === 0,
  };
}
