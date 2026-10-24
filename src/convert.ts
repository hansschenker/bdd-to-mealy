import { parseConvertibleBdd } from './convertible-bdd.js';
import { generateMealyDsl } from './mealy-dsl.js';

export function bddToMealyDsl(source: string): string {
  return generateMealyDsl(parseConvertibleBdd(source));
}
