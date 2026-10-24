import assert from 'node:assert/strict';
import test from 'node:test';

import { analyzeMachine } from '../dist/src/index.js';

const rules = [
  {
    currentState: 'unpaid',
    event: 'payment succeeds',
    actions: ['record payment'],
    nextState: 'paid',
  },
  {
    currentState: 'paid',
    event: 'shipment starts',
    actions: ['notify customer'],
    nextState: 'shipping',
  },
  {
    currentState: 'orphan',
    event: 'reset',
    actions: ['clear'],
    nextState: 'unpaid',
  },
];

test('derives discovered alphabets and transition table', () => {
  const result = analyzeMachine(rules, { initialState: 'unpaid' });

  assert.deepEqual(result.states, ['unpaid', 'paid', 'shipping', 'orphan']);
  assert.deepEqual(result.events, [
    'payment succeeds',
    'shipment starts',
    'reset',
  ]);
  assert.deepEqual(result.actions, [
    'record payment',
    'notify customer',
    'clear',
  ]);
  assert.equal(result.transitionTable.length, 3);
});

test('computes reachability and terminal states', () => {
  const result = analyzeMachine(rules, { initialState: 'unpaid' });

  assert.deepEqual(result.reachableStates, [
    'unpaid',
    'paid',
    'shipping',
  ]);
  assert.deepEqual(result.unreachableStates, ['orphan']);
  assert.deepEqual(result.terminalStates, ['shipping']);
});

test('checks completeness against declared State x Event alphabet', () => {
  const result = analyzeMachine(rules.slice(0, 2), {
    initialState: 'unpaid',
    states: ['unpaid', 'paid', 'shipping'],
    events: ['payment succeeds', 'shipment starts'],
  });

  assert.deepEqual(result.missingTransitions, [
    { state: 'unpaid', event: 'shipment starts' },
    { state: 'paid', event: 'payment succeeds' },
    { state: 'shipping', event: 'payment succeeds' },
    { state: 'shipping', event: 'shipment starts' },
  ]);

  assert.equal(result.complete, false);
});

test('reports states and events used outside declared alphabets', () => {
  const result = analyzeMachine(rules, {
    states: ['unpaid', 'paid', 'shipping'],
    events: ['payment succeeds', 'shipment starts'],
  });

  assert.deepEqual(result.undeclaredStates, ['orphan']);
  assert.deepEqual(result.undeclaredEvents, ['reset']);
});

test('reports duplicate state-event conflicts', () => {
  const result = analyzeMachine([
    ...rules,
    {
      currentState: 'unpaid',
      event: 'payment succeeds',
      actions: ['reject duplicate'],
      nextState: 'unpaid',
    },
  ]);

  assert.deepEqual(result.conflicts, [
    {
      currentState: 'unpaid',
      event: 'payment succeeds',
      firstIndex: 0,
      secondIndex: 3,
    },
  ]);
});

test('recognizes a total deterministic machine as complete', () => {
  const total = [
    {
      currentState: 'off',
      event: 'toggle',
      actions: ['turn on'],
      nextState: 'on',
    },
    {
      currentState: 'on',
      event: 'toggle',
      actions: ['turn off'],
      nextState: 'off',
    },
  ];

  const result = analyzeMachine(total, {
    initialState: 'off',
    states: ['off', 'on'],
    events: ['toggle'],
  });

  assert.equal(result.complete, true);
  assert.deepEqual(result.missingTransitions, []);
  assert.deepEqual(result.unreachableStates, []);
  assert.deepEqual(result.terminalStates, []);
});
