export type MealyRule = Readonly<{
  currentState: string;
  event: string;
  actions: readonly string[];
  nextState: string;
}>;

export type ParseResult<T> = Readonly<{
  value: T;
}>;

export class ParseError extends Error {
  constructor(
    message: string,
    readonly line: number,
    readonly sourceLine: string,
  ) {
    super(`Line ${line}: ${message}\n> ${sourceLine}`);
    this.name = 'ParseError';
  }
}

export type RuleConflict = Readonly<{
  currentState: string;
  event: string;
  firstIndex: number;
  secondIndex: number;
}>;

export function findRuleConflicts(rules: readonly MealyRule[]): readonly RuleConflict[] {
  const seen = new Map<string, number>();
  const conflicts: RuleConflict[] = [];

  rules.forEach((rule, index) => {
    const key = `${rule.currentState}\u0000${rule.event}`;
    const firstIndex = seen.get(key);

    if (firstIndex === undefined) {
      seen.set(key, index);
      return;
    }

    conflicts.push({
      currentState: rule.currentState,
      event: rule.event,
      firstIndex,
      secondIndex: index,
    });
  });

  return conflicts;
}
