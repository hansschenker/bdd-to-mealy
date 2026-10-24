import assert from 'node:assert/strict';
import test from 'node:test';

import {
  bddToMealyDsl,
  findRuleConflicts,
  generateMealyDsl,
  parseConvertibleBdd,
  parseMealyDsl,
  ParseError,
} from '../dist/src/index.js';

const bdd = `
Given order is unpaid
When payment succeeds
Then record payment
Then send receipt
And order is paid

Given order is paid
When shipment starts
Then notify customer
And order is shipping
`;

test('Convertible BDD parses into semantic Mealy rules', () => {
  assert.deepEqual(parseConvertibleBdd(bdd), [
    {
      currentState: 'order is unpaid',
      event: 'payment succeeds',
      actions: ['record payment', 'send receipt'],
      nextState: 'order is paid',
    },
    {
      currentState: 'order is paid',
      event: 'shipment starts',
      actions: ['notify customer'],
      nextState: 'order is shipping',
    },
  ]);
});

test('BDD -> Mealy-DSL generation is deterministic', () => {
  assert.equal(
    bddToMealyDsl(bdd),
    `While order is unpaid\nWhen payment succeeds\nThen record payment\nThen send receipt\nAnd order is paid\n\nWhile order is paid\nWhen shipment starts\nThen notify customer\nAnd order is shipping`,
  );
});

test('BDD -> model -> Mealy-DSL -> model preserves semantics', () => {
  const model = parseConvertibleBdd(bdd);
  const dsl = generateMealyDsl(model);
  assert.deepEqual(parseMealyDsl(dsl), model);
});

test('And is final and cannot be followed by another action', () => {
  const invalid = `
Given pending
When timer expires
Then emit pending value
And clear timer
Then cleanup
`;

  assert.throws(() => parseConvertibleBdd(invalid), (error) => {
    assert.ok(error instanceof ParseError);
    assert.match(error.message, /And is the final clause/u);
    return true;
  });
});

test('a rule requires at least one Then action', () => {
  const invalid = `
Given waiting
When cancel arrives
And cancelled
`;

  assert.throws(() => parseConvertibleBdd(invalid), /expected at least one Then action/u);
});

test('a rule requires a final And next state', () => {
  const invalid = `
Given waiting
When cancel arrives
Then cancel request
`;

  assert.throws(() => parseConvertibleBdd(invalid), /missing final And <Next State> clause/u);
});

test('duplicate State + Event pairs are reported as conflicts', () => {
  const rules = parseConvertibleBdd(`
Given waiting
When start arrives
Then begin work
And active

Given waiting
When start arrives
Then reject duplicate start
And waiting
`);

  assert.deepEqual(findRuleConflicts(rules), [
    {
      currentState: 'waiting',
      event: 'start arrives',
      firstIndex: 0,
      secondIndex: 1,
    },
  ]);
});
