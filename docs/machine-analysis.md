# Machine Analysis

The semantic model can now be analyzed as a complete Mealy-machine specification rather than treated only as parsed text.

## Input

```ts
type MealyRule = Readonly<{
  currentState: string;
  event: string;
  actions: readonly string[];
  nextState: string;
}>;
```

## Analyzer

```ts
analyzeMachine(rules, {
  initialState,
  states,
  events,
})
```

The optional `states` and `events` arrays are the declared alphabets used for completeness checking.

## Discovered vs declared alphabets

The analyzer deliberately distinguishes two concepts.

### Discovered alphabet

Derived from the rules themselves:

```text
states  = every currentState and nextState used by a rule
events  = every event used by a rule
actions = every action used by a rule
```

### Declared alphabet

The state and event universe the specification claims the machine supports.

```text
Declared States × Declared Events
```

Completeness is checked against this declared Cartesian product.

This prevents an incomplete specification from appearing complete merely because a missing event was never mentioned in the rules.

## Analysis result

The analyzer reports:

- discovered states
- discovered events
- discovered actions
- declared states
- declared events
- undeclared states used by rules
- undeclared events used by rules
- transition table
- duplicate State + Event conflicts
- reachable states from the initial state
- unreachable states
- terminal states
- missing State × Event transitions
- overall completeness

## Completeness

A machine is currently considered complete when all of the following hold:

```text
no duplicate State + Event conflicts
AND no undeclared states
AND no undeclared events
AND no missing DeclaredState × DeclaredEvent transitions
```

Formally:

```text
complete
=
deterministic
∧ alphabet-consistent
∧ transition-total
```

Reachability is reported separately because an unreachable state may be intentionally declared for analysis or future extension.

## Reachability

Given an initial state, the analyzer follows all state transitions and computes:

```text
reachableStates
unreachableStates
```

If no initial state is supplied, reachability analysis is intentionally left empty rather than guessed.

## Terminal states

A terminal state is currently defined structurally:

> a discovered state with no outgoing transition rule.

This does not necessarily mean an RxJS stream has completed. It means only that the Mealy model has no transition defined from that state.

## Missing transitions

For declared states:

```text
S = {s1, s2, ...}
```

and declared events:

```text
E = {e1, e2, ...}
```

the analyzer constructs:

```text
S × E
```

and subtracts the State + Event pairs that have rules.

The remainder is `missingTransitions`.

## Example

```ts
const analysis = analyzeMachine(rules, {
  initialState: 'off',
  states: ['off', 'on'],
  events: ['toggle'],
});
```

For:

```text
(off, toggle) -> (turn on, on)
(on, toggle)  -> (turn off, off)
```

the result is:

```text
reachable: off, on
unreachable: none
terminal: none
missing transitions: none
complete: true
```

## Position in the pipeline

```text
Convertible BDD
      ↓
Semantic Model
      ↓
Mealy-DSL
      ↓
Semantic Model
      ↓
Machine Analysis
      ├── alphabets
      ├── transition table
      ├── determinism
      ├── reachability
      ├── terminal states
      └── completeness
```

This turns the semantic model into an inspectable machine specification and provides the basis for diagrams, generated tests, simulators, and formal verification.
