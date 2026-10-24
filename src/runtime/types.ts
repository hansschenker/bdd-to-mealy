import type { Observable } from 'rxjs';

export type UnknownTransitionPolicy = 'error' | 'ignore';

export type MachineStep = Readonly<{
  previousState: string;
  event: string;
  actions: readonly string[];
  nextState: string;
}>;

export type MealyMachineRuntime = Readonly<{
  trace$: Observable<MachineStep>;
  state$: Observable<string>;
  action$: Observable<string>;
}>;

export type MealyMachineRuntimeOptions = Readonly<{
  unknownTransition?: UnknownTransitionPolicy;
}>;
