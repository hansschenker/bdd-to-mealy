import { MealyRule } from './model.js';
import { parseRules } from './parser-core.js';

export function generateMealyDsl(rules: readonly MealyRule[]): string {
  return rules
    .map((rule) => [
      `While ${rule.currentState}`,
      `When ${rule.event}`,
      ...rule.actions.map((action) => `Then ${action}`),
      `And ${rule.nextState}`,
    ].join('\n'))
    .join('\n\n');
}

export function parseMealyDsl(source: string): readonly MealyRule[] {
  return parseRules(source, {
    state: 'While',
    event: 'When',
    action: 'Then',
    nextState: 'And',
  });
}
