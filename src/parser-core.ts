import { MealyRule, ParseError } from './model.js';

type Prefixes = Readonly<{
  state: 'Given' | 'While';
  event: 'When';
  action: 'Then';
  nextState: 'And';
}>;

type SourceLine = Readonly<{
  number: number;
  text: string;
}>;

function meaningfulLines(source: string): SourceLine[] {
  return source
    .split(/\r?\n/u)
    .map((text, index) => ({ number: index + 1, text: text.trim() }))
    .filter(({ text }) => text.length > 0 && !text.startsWith('#'));
}

function payload(line: SourceLine, prefix: string): string {
  const expected = `${prefix} `;
  if (!line.text.startsWith(expected)) {
    throw new ParseError(`expected "${prefix} <...>"`, line.number, line.text);
  }

  const value = line.text.slice(expected.length).trim();
  if (value.length === 0) {
    throw new ParseError(`${prefix} clause cannot be empty`, line.number, line.text);
  }

  return value;
}

function isStart(line: SourceLine, statePrefix: Prefixes['state']): boolean {
  return line.text.startsWith(`${statePrefix} `);
}

export function parseRules(source: string, prefixes: Prefixes): readonly MealyRule[] {
  const lines = meaningfulLines(source);
  const rules: MealyRule[] = [];
  let index = 0;

  while (index < lines.length) {
    const stateLine = lines[index];
    if (!stateLine) break;

    if (!isStart(stateLine, prefixes.state)) {
      throw new ParseError(
        `expected a rule to start with "${prefixes.state}"`,
        stateLine.number,
        stateLine.text,
      );
    }

    const currentState = payload(stateLine, prefixes.state);
    index += 1;

    const eventLine = lines[index];
    if (!eventLine) {
      throw new ParseError(`missing ${prefixes.event} clause`, stateLine.number, stateLine.text);
    }
    const event = payload(eventLine, prefixes.event);
    index += 1;

    const actions: string[] = [];
    while (index < lines.length) {
      const line = lines[index];
      if (!line || !line.text.startsWith(`${prefixes.action} `)) break;
      actions.push(payload(line, prefixes.action));
      index += 1;
    }

    if (actions.length === 0) {
      const line = lines[index] ?? eventLine;
      throw new ParseError(
        `expected at least one ${prefixes.action} action before ${prefixes.nextState}`,
        line.number,
        line.text,
      );
    }

    const nextStateLine = lines[index];
    if (!nextStateLine) {
      const lastActionLine = lines[index - 1] ?? eventLine;
      throw new ParseError(
        `missing final ${prefixes.nextState} <Next State> clause`,
        lastActionLine.number,
        lastActionLine.text,
      );
    }

    const nextState = payload(nextStateLine, prefixes.nextState);
    index += 1;

    const following = lines[index];
    if (following && !isStart(following, prefixes.state)) {
      throw new ParseError(
        `${prefixes.nextState} is the final clause; expected the next rule to start with "${prefixes.state}"`,
        following.number,
        following.text,
      );
    }

    rules.push({ currentState, event, actions, nextState });
  }

  return rules;
}
