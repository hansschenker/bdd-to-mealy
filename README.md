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
Transition tables
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

## Project direction

The first practical parser milestone should:

1. Parse Mealy-DSL rules.
2. Validate the grammar.
3. Produce a typed semantic model.
4. Generate a transition table.
5. Detect duplicate or conflicting State + Event rules.
6. Detect missing or malformed final-state clauses.
7. Provide a foundation for generated state diagrams and tests.

## Origin and collaboration

This project grew from a design discussion about expressing Mealy-machine behavior without relying on the traditional tuple-symbol vocabulary, and about creating a deterministic refinement path from domain-level BDD to machine semantics.

**GPT-5.6 Sol (OpenAI)** contributed substantially to the formulation of the Mealy-DSL syntax, the Convertible BDD Profile, the semantic mapping, parser architecture, and the rule that `And` is reserved exclusively for the final state.

See [CONTRIBUTORS.md](CONTRIBUTORS.md).

## Documents

- [Convertible BDD Profile](docs/convertible-bdd-profile.md)
- [Mealy-DSL](docs/mealy-dsl.md)
- [Semantic Model](docs/semantic-model.md)
- [Examples](examples/order-payment.md)
