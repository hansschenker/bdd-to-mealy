# Mealy-DSL

## Canonical syntax

```text
While <State>
When  <Event>
Then  <Action>
Then  <Action>
...
And   <Next State>
```

The DSL directly expresses one complete Mealy transition rule.

## Semantic form

```text
(State, Event) -> (Action*, Next State)
```

## Clause meanings

| Clause | Meaning |
|---|---|
| `While` | Current State |
| `When` | Incoming Event |
| `Then` | Action Policy |
| `And` | Next State |

The word `While` emphasizes the currently active machine condition.

## Example

```text
While pending
When timer expires
Then emit pending value
Then clear timer
And waiting
```

Equivalent semantic rule:

```text
(pending, timer expires)
->
([emit pending value, clear timer], waiting)
```

## Why `And` is special

`And` has exactly one semantic meaning in Mealy-DSL:

> the resulting state after the event and actions.

It is not general grammatical glue.

That restriction gives the parser a strong invariant:

- zero or more? No — at least one `Then`
- exactly one final `And`
- the `And` clause terminates the rule
- no clauses may follow the final-state clause

## RxJS specialization

For RxJS operator behavior, the same grammar can be read as:

```text
While <State Pattern>
When  <Event>
Then  <Action Policy>
And   <Next State>
```

Actions may include:

- emit value
- emit nothing
- complete
- error
- remember value
- replace pending value
- schedule timer
- cancel timer
- subscribe to inner source
- unsubscribe from inner source

This keeps domain logic and stream-machine semantics distinct.
