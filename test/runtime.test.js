import assert from 'node:assert/strict';
import test from 'node:test';
import { Subject } from 'rxjs';

import {
  ConflictingTransitionError,
  createMealyMachine$,
  UnknownTransitionError,
} from '../dist/src/index.js';

const toggleRules = [
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

test('executes Mealy rules as one shared RxJS machine', () => {
  const event$ = new Subject();
  const machine = createMealyMachine$(toggleRules, 'off', event$);

  const states = [];
  const actions = [];
  const trace = [];

  const subscriptions = [
    machine.state$.subscribe((state) => states.push(state)),
    machine.action$.subscribe((action) => actions.push(action)),
    machine.trace$.subscribe((step) => trace.push(step)),
  ];

  event$.next('toggle');
  event$.next('toggle');

  assert.deepEqual(states, ['off', 'on', 'off']);
  assert.deepEqual(actions, ['turn on', 'turn off']);
  assert.deepEqual(trace, [
    {
      previousState: 'off',
      event: 'toggle',
      actions: ['turn on'],
      nextState: 'on',
    },
    {
      previousState: 'on',
      event: 'toggle',
      actions: ['turn off'],
      nextState: 'off',
    },
  ]);

  subscriptions.forEach((subscription) => subscription.unsubscribe());
});

test('emits multiple actions in rule order', () => {
  const event$ = new Subject();
  const machine = createMealyMachine$(
    [
      {
        currentState: 'unpaid',
        event: 'payment succeeds',
        actions: ['record payment', 'send receipt'],
        nextState: 'paid',
      },
    ],
    'unpaid',
    event$,
  );

  const actions = [];
  const subscription = machine.action$.subscribe((action) => actions.push(action));

  event$.next('payment succeeds');

  assert.deepEqual(actions, ['record payment', 'send receipt']);
  subscription.unsubscribe();
});

test('unknown transitions error by default', () => {
  const event$ = new Subject();
  const machine = createMealyMachine$(toggleRules, 'off', event$);

  let receivedError;
  machine.trace$.subscribe({
    error: (error) => {
      receivedError = error;
    },
  });

  event$.next('unknown');

  assert.ok(receivedError instanceof UnknownTransitionError);
  assert.equal(receivedError.currentState, 'off');
  assert.equal(receivedError.event, 'unknown');
});

test('unknown transitions can be ignored explicitly', () => {
  const event$ = new Subject();
  const machine = createMealyMachine$(toggleRules, 'off', event$, {
    unknownTransition: 'ignore',
  });

  const states = [];
  const actions = [];
  const trace = [];

  const subscriptions = [
    machine.state$.subscribe((state) => states.push(state)),
    machine.action$.subscribe((action) => actions.push(action)),
    machine.trace$.subscribe((step) => trace.push(step)),
  ];

  event$.next('unknown');
  event$.next('toggle');

  assert.deepEqual(states, ['off', 'on']);
  assert.deepEqual(actions, ['turn on']);
  assert.equal(trace.length, 1);

  subscriptions.forEach((subscription) => subscription.unsubscribe());
});

test('conflicting rules are rejected before runtime execution', () => {
  const event$ = new Subject();

  assert.throws(
    () =>
      createMealyMachine$(
        [
          ...toggleRules,
          {
            currentState: 'off',
            event: 'toggle',
            actions: ['stay off'],
            nextState: 'off',
          },
        ],
        'off',
        event$,
      ),
    ConflictingTransitionError,
  );
});
