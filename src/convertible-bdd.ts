import { MealyRule } from './model.js';
import { parseRules } from './parser-core.js';

export function parseConvertibleBdd(source: string): readonly MealyRule[] {
  return parseRules(source, {
    state: 'Given',
    event: 'When',
    action: 'Then',
    nextState: 'And',
  });
}
