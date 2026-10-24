# BDD to Mealy

A small specification project for translating a restricted, machine-convertible BDD profile into **Mealy-DSL**, and then parsing Mealy-DSL into a machine-readable state-machine model.

## Core idea

A domain user describes business behavior in BDD.

An implementer refines that behavior into Mealy-DSL.

A Mealy parser translates Mealy-DSL into a machine-readable representation that can drive validation, transition tables, diagrams, tests, simulation, verification, and eventually code generation.

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
```

The semantic invariant behind both textual forms is:

```text
(Current State, Event) -> (Action*, Next State)
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

Multiple actions are expressed using repeated `Then` clauses.

Therefore:

```text
Then = Action
And  = Next State only
```

Every scenario must end with exactly one `And` clause, and that clause must identify the resulting state.

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

Semantic mapping:

| Convertible BDD | Mealy-DSL | Semantic role |
|---|---|---|
| `Given` | `While` | Current State |
| `When` | `When` | Event |
| `Then` | `Then` | Action Policy |
| `And` | `And` | Next State |

## Example

Business-level BDD:

```text
Given order is unpaid
When payment succeeds
Then record payment
Then send receipt
And order is paid
```

Mealy-DSL:

```text
While order is unpaid
When payment succeeds
Then record payment
Then send receipt
And order is paid
```

Machine-readable model:

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

## Why restrict BDD?

General BDD is intentionally flexible and may omit machine semantics that humans can infer.

A deterministic BDD → Mealy conversion cannot safely infer missing state transitions, hidden conditions, multiple simultaneous events, or ambiguous pronouns.

The Convertible BDD Profile therefore requires every scenario to state explicitly:

1. Current State
2. Exactly one Event
3. One or more Actions
4. Next State

The converter must never silently invent machine semantics.

## Refinement pipeline

```text
Business meaning
    ↓
Convertible BDD
    ↓
Behavioral semantic model
    ↓
Mealy-DSL
    ↓
Parser AST / machine model
    ↓
Machine Analysis
    ├── alphabets
    ├── transition table
    ├── determinism
    ├── reachability
    ├── terminal states
    └── completeness
    ↓
State diagrams
Generated tests
Simulation
Verification
Code generation
```

BDD and Mealy-DSL can ultimately be treated as two projections of the same semantic rule:

```text
(State, Event) -> (Action*, Next State)
```

## Reference implementation

The repository now contains a dependency-light TypeScript reference implementation of the complete first pipeline:

```text
Convertible BDD
    ↓ parseConvertibleBdd()
MealyRule[]
    ↓ generateMealyDsl()
Mealy-DSL
    ↓ parseMealyDsl()
MealyRule[]
```

The shared semantic model is:

```ts
type MealyRule = Readonly<{
  currentState: string;
  event: string;
  actions: readonly string[];
  nextState: string;
}>;
```

Public functions:

- `parseConvertibleBdd(source)` — parses strict Convertible BDD into semantic rules.
- `generateMealyDsl(rules)` — renders semantic rules as canonical Mealy-DSL.
- `parseMealyDsl(source)` — parses Mealy-DSL back into the same semantic model.
- `bddToMealyDsl(source)` — direct convenience pipeline.
- `findRuleConflicts(rules)` — reports duplicate `State + Event` rule pairs.
- `analyzeMachine(rules, options)` — derives alphabets, transition tables, reachability, terminal states, conflicts, undeclared symbols, missing transitions, and completeness.

The parser reports source line numbers and rejects malformed rule ordering, missing actions, missing final-state clauses, and clauses appearing after the final `And`.

### Build and test

```bash
npm install
npm test
```

The reference tests include the invariant:

```text
Convertible BDD
    ↓
Semantic Model
    ↓
Mealy-DSL
    ↓
Semantic Model

result before == result after
```

This round-trip property ensures that Mealy-DSL generation does not lose or invent machine semantics.

## Project direction

The first parser milestone is now implemented:

1. Parse Convertible BDD rules.
2. Produce a typed semantic model.
3. Generate canonical Mealy-DSL.
4. Parse Mealy-DSL back into the same semantic model.
5. Validate clause ordering and mandatory final-state semantics.
6. Detect duplicate/conflicting `State + Event` pairs.
7. Verify semantic round trips with tests.

## Machine analysis

The semantic model is now executable as a machine specification:

```ts
const analysis = analyzeMachine(rules, {
  initialState: 'off',
  states: ['off', 'on'],
  events: ['toggle'],
});
```

The analyzer distinguishes **discovered alphabets** from **declared alphabets**. Completeness is checked against the declared Cartesian product:

```text
Declared States × Declared Events
```

It reports:

- discovered states, events, and actions
- undeclared states and events
- transition table
- duplicate State + Event conflicts
- reachable and unreachable states
- terminal states
- missing transitions
- a `complete` result

Current completeness means:

```text
deterministic
AND alphabet-consistent
AND transition-total
```

See [Machine Analysis](docs/machine-analysis.md).

Natural next milestones are state-diagram generation, generated transition-based tests, and an executable simulator.

## Origin and collaboration

This project grew from a design discussion about expressing Mealy-machine behavior without relying on the traditional tuple-symbol vocabulary, and about creating a deterministic refinement path from domain-level BDD to machine semantics.

**GPT-5.6 Sol (OpenAI)** contributed substantially to the formulation of the Mealy-DSL syntax, the Convertible BDD Profile, the semantic mapping, parser architecture, reference TypeScript implementation, validation strategy, round-trip tests, and the rule that `And` is reserved exclusively for the final state.

See [CONTRIBUTORS.md](CONTRIBUTORS.md).

## Documents

- [Convertible BDD Profile](docs/convertible-bdd-profile.md)
- [Mealy-DSL](docs/mealy-dsl.md)
- [Semantic Model](docs/semantic-model.md)
- [Machine Analysis](docs/machine-analysis.md)
- [Examples](examples/order-payment.md)
