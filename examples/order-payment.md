# Example: Order Payment

## Convertible BDD

```text
Given order is unpaid
When payment succeeds
Then record payment
Then send receipt
And order is paid
```

## Mealy-DSL

```text
While order is unpaid
When payment succeeds
Then record payment
Then send receipt
And order is paid
```

## Semantic model

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

## Transition table

| Current State | Event | Actions | Next State |
|---|---|---|---|
| order is unpaid | payment succeeds | record payment; send receipt | order is paid |

This example shows the intended refinement path without requiring any inferred machine semantics.
