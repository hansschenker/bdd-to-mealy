import {
  concatMap,
  distinctUntilChanged,
  filter,
  from,
  map,
  merge,
  Observable,
  of,
  scan,
  share,
  shareReplay,
} from 'rxjs';

import type { MealyRule } from '../model.js';
import {
  buildTransitionIndex,
  findTransition,
  UnknownTransitionError,
} from './transition.js';
import type {
  MachineStep,
  MealyMachineRuntime,
  MealyMachineRuntimeOptions,
} from './types.js';

type RuntimeAccumulator = Readonly<{
  state: string;
  step: MachineStep | null;
}>;

function isMachineStep(step: MachineStep | null): step is MachineStep {
  return step !== null;
}

export function createMealyMachine$(
  rules: readonly MealyRule[],
  initialState: string,
  event$: Observable<string>,
  options: MealyMachineRuntimeOptions = {},
): MealyMachineRuntime {
  const index = buildTransitionIndex(rules);
  const unknownTransition = options.unknownTransition ?? 'error';

  const machine$ = event$.pipe(
    scan<string, RuntimeAccumulator>(
      (machine, event) => {
        const rule = findTransition(index, machine.state, event);

        if (!rule) {
          if (unknownTransition === 'ignore') {
            return {
              state: machine.state,
              step: null,
            };
          }

          throw new UnknownTransitionError(machine.state, event);
        }

        const step: MachineStep = {
          previousState: machine.state,
          event,
          actions: rule.actions,
          nextState: rule.nextState,
        };

        return {
          state: rule.nextState,
          step,
        };
      },
      {
        state: initialState,
        step: null,
      },
    ),
    share(),
  );

  const trace$ = machine$.pipe(
    map((machine) => machine.step),
    filter(isMachineStep),
    share(),
  );

  const state$ = merge(
    of(initialState),
    trace$.pipe(map((step) => step.nextState)),
  ).pipe(
    distinctUntilChanged(),
    shareReplay({
      bufferSize: 1,
      refCount: true,
    }),
  );

  const action$ = trace$.pipe(
    concatMap((step) => from(step.actions)),
    share(),
  );

  return {
    trace$,
    state$,
    action$,
  };
}
