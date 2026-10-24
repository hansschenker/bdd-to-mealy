# BDD to Mealy

A deterministic refinement pipeline from business behavior to analyzable and executable Mealy-machine semantics.

## Core idea

```text
Domain User
    ↓
Convertible BDD
    ↓
Implementer / Converter
    ↓
Mealy-DSL
    ↓
Mealy Parser
    ↓
Machine-readable model
    ↓
Machine Analysis
    ↓
RxJS State Machine
```

The semantic invariant behind the system is:

```text
(State, Event) -> (Action*, Next State)
```

## Convertible BDD

Canonical form:

```text
Given <Current State>
When  <Event>
Then  <Action>
Then  <Action>
...
And   <Next State>
```

### Hard grammar rule

**`And` is reserved exclusively for the final state of a transition.**

Multiple actions are expressed with repeated `Then` clauses.

```text
Then = Action
And  = Next State only
```

Every scenario must explicitly contain:

1. Current State
2. Exactly one Event
3. One or more Actions
4. Next State

The converter never silently invents missing machine semantics.

## Mealy-DSL

Canonical form:

```text
While <State>
When  <Event>
Then  <Action>
Then  <Action>
...
And   <Next State>
```

| Convertible BDD | Mealy-DSL | Semantic role |
|---|---|---|
| `Given` | `While` | Current State |
| `When` | `When` | Event |
| `Then` | `Then` | Action Policy |
| `And` | `And` | Next State |

Example:

```text
Given order is unpaid
When payment succeeds
Then record payment
Then send receipt
And order is paid
```

becomes:

```text
While order is unpaid
When payment succeeds
Then record payment
Then send receipt
And order is paid
```

and parses to:

```json
{
  "currentState": "order is unpaid",
  "event": "payment succeeds",
  "actions": [
    "record payment",
    "send receipt"
  ],
  "nextState": "order is paid"
}
```

## Semantic model

```ts
type MealyRule = Readonly<{
  currentState: string;
  event: string;
  actions: readonly string[];
  nextState: string;
}>;
```

Both Convertible BDD and Mealy-DSL map to this same model.

## Machine analysis

`analyzeMachine(rules, options)` derives and validates:

- discovered states, events, and actions
- declared states and events
- transition table
- duplicate `State + Event` conflicts
- reachable and unreachable states
- terminal states
- undeclared symbols
- missing `State × Event` transitions
- overall completeness

Completeness currently means:

```text
deterministic
AND alphabet-consistent
AND transition-total
```

Declared and discovered alphabets are intentionally separate so an omitted event cannot make an incomplete machine appear complete.

## RxJS 7.8.2 state-machine runtime

The machine-readable model can now execute directly as an RxJS dataflow:

```text
MealyRule[]
+
initialState
+
event$
      ↓
createMealyMachine$()
      ↓
RxJS Runtime
      ├── state$
      ├── action$
      └── trace$
```

Example:

```ts
const machine = createMealyMachine$(
  rules,
  'off',
  event$,
);
```

### state$

Carries the current machine state over time. It emits the initial state and then distinct resulting states. It uses `shareReplay({ bufferSize: 1, refCount: true })` so active consumers share one execution and can observe the latest state.

### action$

Carries ordered Action Policy values. The runtime does not execute business effects.

For:

```text
Then record payment
Then send receipt
```

the stream emits:

```text
record payment
send receipt
```

Domain code decides what those action values mean.

### trace$

Carries complete successful transitions:

```ts
type MachineStep = Readonly<{
  previousState: string;
  event: string;
  actions: readonly string[];
  nextState: string;
}>;
```

This is intended for debugging, visualization, recording, replay, and generated tests.

### Runtime policies

Conflicting rules for the same `(State, Event)` are rejected before execution with `ConflictingTransitionError`.

Unknown runtime transitions use an explicit policy:

```ts
{ unknownTransition: 'error' } // default
{ unknownTransition: 'ignore' }
```

No missing transition is silently invented.

## RxJS interpretation

```text
event$
  ↓
scan()
  ↓
current machine state
  ↓
lookup (State, Event)
  ↓
(Action*, Next State)
  ├── state$
  ├── action$
  └── trace$
```

Time comes from `event$`; the runtime creates no clock of its own.

The domain can change while the RxJS machine stays the same:

```text
Vending machine
Order workflow
UI state
Game
Protocol
RxJS operator behavior
        ↓
     MealyRule[]

createMealyMachine$()
        ↓
same runtime
```

## Public API

- `parseConvertibleBdd(source)`
- `generateMealyDsl(rules)`
- `parseMealyDsl(source)`
- `bddToMealyDsl(source)`
- `findRuleConflicts(rules)`
- `analyzeMachine(rules, options)`
- `buildTransitionIndex(rules)`
- `findTransition(index, state, event)`
- `createMealyMachine$(rules, initialState, event$, options)`

## Build and test

```bash
npm install
npm test
```

The project targets **RxJS 7.8.2**.

The test suite covers parsing, semantic round trips, machine analysis, runtime state evolution, ordered actions, traces, explicit unknown-transition behavior, and conflict rejection.

## Origin and collaboration

This project grew from a design discussion about expressing Mealy-machine behavior without relying on traditional tuple-symbol vocabulary and creating a deterministic refinement path from business requirements to executable reactive state-machine semantics.

<strong><u>GPT-5.6 Sol</u></strong> (OpenAI) contributed substantially to the Mealy-DSL syntax, Convertible BDD Profile, semantic model, parsers, machine analysis, validation strategy, round-trip tests, and the generic RxJS 7.8.2 runtime.

See [CONTRIBUTORS.md](CONTRIBUTORS.md).

## Documents

- [Convertible BDD Profile](docs/convertible-bdd-profile.md)
- [Mealy-DSL](docs/mealy-dsl.md)
- [Semantic Model](docs/semantic-model.md)
- [Machine Analysis](docs/machine-analysis.md)
- [RxJS Mealy Runtime](docs/rxjs-runtime.md)
- [Order Payment Example](examples/order-payment.md)
