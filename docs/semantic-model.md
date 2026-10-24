# Semantic Model

BDD and Mealy-DSL should not be coupled by direct text rewriting alone.

Both should map to the same semantic intermediate representation.

## Core model

```ts
export type MealyRule = {
  currentState: string;
  event: string;
  actions: readonly string[];
  nextState: string;
};
```

Example:

```json
{
  "currentState": "pending",
  "event": "timer expires",
  "actions": [
    "emit pending value",
    "clear timer"
  ],
  "nextState": "waiting"
}
```

## Architecture

```text
Convertible BDD
      ↓
BDD Parser
      ↓
Semantic Rule
      ↓
Mealy-DSL Generator
      ↓
Mealy-DSL Parser
      ↓
Machine Model
```

An implementation may later simplify this by parsing either syntax directly into the same semantic model.

## Validation opportunities

The semantic model enables detection of:

- duplicate `State + Event` rules
- conflicting transitions
- missing next states
- empty action lists
- malformed clauses
- unreachable states
- terminal states
- incomplete event handling, when the event alphabet is known

## Generated artifacts

The same model can drive:

- transition tables
- state diagrams
- documentation
- test cases
- simulations
- formal checks
- executable state-machine implementations
- RxJS operator test scaffolding

The semantic model should therefore remain small, explicit, and independent from any rendering or runtime framework.
