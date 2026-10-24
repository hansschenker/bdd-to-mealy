# RxJS Mealy Runtime

The machine-readable semantic model can now be executed directly as an RxJS dataflow.

## Position in the pipeline

```text
Domain User
    ↓
Convertible BDD
    ↓
Mealy-DSL
    ↓
Mealy Parser
    ↓
Machine-readable model
    ↓
Machine Analysis
    ↓
createMealyMachine$()
    ↓
RxJS Runtime
    ├── state$
    ├── action$
    └── trace$
```

## Runtime boundary

The runtime executes machine semantics, not domain effects.

```text
(State, Event)
      ↓
transition lookup
      ↓
(Action*, Next State)
```

Actions remain values moving through `action$`.

A domain layer may later interpret:

```text
"send receipt"
```

as an actual application function such as:

```text
sendReceipt(...)
```

The generic RxJS machine does not know or care what an action means.

## API

```ts
const machine = createMealyMachine$(
  rules,
  initialState,
  event$,
  {
    unknownTransition: 'error',
  },
);
```

It returns:

```ts
{
  state$,
  action$,
  trace$,
}
```

### state$

Current machine state over time.

The initial state is emitted immediately on subscription, and subsequent distinct next states are emitted after successful transitions.

It is shared with:

```ts
shareReplay({
  bufferSize: 1,
  refCount: true,
})
```

so active consumers observe one shared machine execution and late subscribers can obtain the latest state while that shared connection exists.

### action$

Ordered action values produced by successful transitions.

If one rule contains:

```text
Then record payment
Then send receipt
```

the action stream emits:

```text
record payment
send receipt
```

in that order.

### trace$

Every successful transition as explicit data:

```ts
type MachineStep = {
  previousState: string;
  event: string;
  actions: readonly string[];
  nextState: string;
};
```

This stream is intended for debugging, visualization, recording, replay, and generated tests.

## Unknown transitions

Missing `(State, Event)` combinations are never silently invented.

Default:

```ts
{ unknownTransition: 'error' }
```

A missing rule terminates the runtime with `UnknownTransitionError`.

Optional:

```ts
{ unknownTransition: 'ignore' }
```

The event produces no action, no trace step, and no state change.

This makes the runtime policy explicit.

## Conflicting rules

Two rules for the same:

```text
(State, Event)
```

would make the machine nondeterministic.

The runtime therefore rejects conflicting rules before subscribing to the event source by throwing `ConflictingTransitionError`.

## RxJS interpretation

```text
event$
  ↓
scan()
  ↓
machine state over time
  ↓
successful transition
  ├── state$
  ├── action$
  └── trace$
```

The source of time is `event$`. The runtime does not create its own clock.

The state transition itself is pure lookup over the semantic model. RxJS supplies execution over time, state retention, sharing, and ordered delivery.

## Why this is not source-code generation

The system does not need to emit a different RxJS program for every business machine.

Instead:

```text
Domain changes
    ↓
MealyRule[] changes

RxJS runtime
    ↓
stays the same
```

That gives the project a reusable execution engine:

```text
MealyRule[]
+
initialState
+
event$
      ↓
createMealyMachine$()
      ↓
executable RxJS state machine
```
