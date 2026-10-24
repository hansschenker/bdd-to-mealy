# Convertible BDD Profile

## Purpose

The Convertible BDD Profile is a deliberately restricted BDD subset designed for deterministic translation into Mealy-DSL.

Canonical form:

```text
Given <Current State>
When  <Event>
Then  <Action>
Then  <Action>
...
And   <Next State>
```

Every scenario MUST completely define:

```text
Current State
+ one Event
+ one or more Actions
+ Next State
```

Equivalently:

```text
(State, Event) -> (Action*, Next State)
```

## Rules

### 1. Given MUST denote current state

The `Given` clause identifies the machine state that is active before the event arrives.

Good:

```text
Given order is unpaid
```

Avoid facts that are merely historical context unless they are explicitly part of machine state.

### 2. When MUST denote exactly one event

Good:

```text
When payment succeeds
```

Not convertible:

```text
When payment succeeds and browser closes
```

One scenario describes one transition trigger.

### 3. Then MUST denote action

`Then` represents observable or internal machine action.

Examples:

```text
Then send receipt
Then emit pending value
Then clear timer
Then emit nothing
```

Multiple actions are represented by repeated `Then` clauses.

### 4. And MUST denote next state

This is a hard grammar rule.

```text
And <Next State>
```

`And` MUST NOT be used as grammatical sugar for additional actions.

Correct:

```text
Given pending
When timer expires
Then emit pending value
Then clear timer
And waiting
```

Rejected:

```text
Given pending
When timer expires
Then emit pending value
And clear timer
And waiting
```

### 5. Next state MUST never be implicit

Insufficient:

```text
Given user is authenticated
When logout is requested
Then show login screen
```

Convertible:

```text
Given user is authenticated
When logout is requested
Then show login screen
And user is unauthenticated
```

A converter MUST NOT silently invent the missing state transition.

### 6. Unchanged state MUST be explicit

```text
Given waiting
When irrelevant event arrives
Then ignore event
And waiting
```

This distinguishes "state unchanged" from "next state omitted".

### 7. Zero observable action MUST still be explicit

```text
Given waiting
When cancel arrives
Then do nothing
And cancelled
```

For RxJS-like semantics this may be:

```text
Then emit nothing
```

### 8. One scenario MUST describe one transition rule

Do not combine multiple independent `When` clauses into one scenario.

### 9. Events SHOULD be atomic

Prefer discrete occurrences:

```text
When source value arrives
When timer expires
When request succeeds
```

Avoid vague intervals such as "when values keep arriving".

### 10. States SHOULD be stable conditions

A useful test:

> Can the machine remain in this condition while waiting for the next event?

If yes, it is probably a valid state.

### 11. Hidden branching is not allowed in actions

Avoid:

```text
Then send receipt if customer has email
```

That introduces an implicit guard.

For version 1, conditional behavior should be represented by distinct states/events or modeled later through an explicit guard extension.

### 12. Canonical domain terms SHOULD be stable

Do not use `logged in` in one scenario and `authenticated` in another if they denote the same state.

Stable vocabulary allows the parser to build finite state, event, and action sets.

### 13. Ambiguous pronouns SHOULD be avoided

Prefer explicit nouns over `it`, `this`, or `that`.

## Minimal grammar

```text
Scenario :=
    Given State
    When Event
    Then Action+
    And NextState
```

The final `And` clause is mandatory and unique.

## Deterministic conversion

```text
Given -> While
When  -> When
Then  -> Then
And   -> And
```

Because the BDD source already contains all machine semantics, translation does not require inference.
