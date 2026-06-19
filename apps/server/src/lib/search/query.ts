import { and, eq, gt, gte, inArray, like, lt, lte, ne, not, or, sql, type SQL } from "drizzle-orm";
import { cards } from "../schemas/card.js";
import { decks } from "../schemas/deck.js";
import { noteTypes } from "../schemas/note-type.js";
import { notes } from "../schemas/note.js";
import { nowIso } from "../time.js";

type NumericSearchColumn =
  | typeof cards.ankiDue
  | typeof cards.easeFactor
  | typeof cards.intervalDays
  | typeof cards.lapses
  | typeof cards.repetitions;

export type SearchAst =
  | { type: "and"; children: SearchAst[] }
  | { type: "or"; children: SearchAst[] }
  | { type: "not"; child: SearchAst }
  | { type: "term"; field?: string; operator?: SearchOperator; value: string };

export type SearchOperator = "!=" | "<" | "<=" | "=" | ">" | ">=" | ":";

type SearchToken =
  | { type: "lparen" }
  | { type: "not" }
  | { type: "or" }
  | { type: "rparen" }
  | { type: "word"; value: string };

const operators: SearchOperator[] = ["!=", "<=", ">=", ":", "<", ">", "="];

export function parseSearchQuery(queryText: string): SearchAst | undefined {
  const parser = new SearchParser(lexSearchQuery(queryText));
  return parser.parse();
}

export function translateSearchAst(ast: SearchAst | undefined): SQL | undefined {
  if (!ast) {
    return undefined;
  }

  switch (ast.type) {
    case "and":
      return combineAnd(ast.children.map(translateSearchAst));
    case "or":
      return combineOr(ast.children.map(translateSearchAst));
    case "not": {
      const child = translateSearchAst(ast.child);
      return child ? not(child) : undefined;
    }
    case "term":
      return translateTerm(ast);
  }
}

export function lexSearchQuery(queryText: string): SearchToken[] {
  const tokens: SearchToken[] = [];
  let index = 0;

  while (index < queryText.length) {
    const char = queryText[index];

    if (!char || /\s/.test(char)) {
      index += 1;
      continue;
    }

    if (char === "(") {
      tokens.push({ type: "lparen" });
      index += 1;
      continue;
    }

    if (char === ")") {
      tokens.push({ type: "rparen" });
      index += 1;
      continue;
    }

    if (char === "-") {
      tokens.push({ type: "not" });
      index += 1;
      continue;
    }

    const { nextIndex, value } =
      char === '"' ? readQuoted(queryText, index) : readWord(queryText, index);

    tokens.push(value.toUpperCase() === "OR" ? { type: "or" } : { type: "word", value });
    index = nextIndex;
  }

  return tokens;
}

class SearchParser {
  #index = 0;

  constructor(private readonly tokens: SearchToken[]) {}

  parse() {
    return this.parseOr();
  }

  private parseOr(): SearchAst | undefined {
    const children = compactAst([this.parseAnd()]);

    while (this.match("or")) {
      children.push(...compactAst([this.parseAnd()]));
    }

    return normalizeAst("or", children);
  }

  private parseAnd(): SearchAst | undefined {
    const children: SearchAst[] = [];

    while (!this.isAtEnd() && !this.check("rparen") && !this.check("or")) {
      const child = this.parseUnary();

      if (child) {
        children.push(child);
      } else {
        break;
      }
    }

    return normalizeAst("and", children);
  }

  private parseUnary(): SearchAst | undefined {
    if (this.match("not")) {
      const child = this.parseUnary();
      return child ? { child, type: "not" } : undefined;
    }

    return this.parsePrimary();
  }

  private parsePrimary(): SearchAst | undefined {
    if (this.match("lparen")) {
      const expression = this.parseOr();
      this.match("rparen");
      return expression;
    }

    const token = this.advance();

    if (!token || token.type !== "word") {
      return undefined;
    }

    return parseSearchTerm(token.value);
  }

  private advance() {
    if (this.isAtEnd()) {
      return undefined;
    }

    const token = this.tokens[this.#index];
    this.#index += 1;
    return token;
  }

  private check(type: SearchToken["type"]) {
    return this.tokens[this.#index]?.type === type;
  }

  private isAtEnd() {
    return this.#index >= this.tokens.length;
  }

  private match(type: SearchToken["type"]) {
    if (!this.check(type)) {
      return false;
    }

    this.#index += 1;
    return true;
  }
}

function parseSearchTerm(value: string): SearchAst {
  for (const operator of operators) {
    const index = value.indexOf(operator);

    if (index > 0) {
      return {
        field: value.slice(0, index).toLowerCase(),
        operator,
        type: "term",
        value: value.slice(index + operator.length),
      };
    }
  }

  return { type: "term", value };
}

function translateTerm(term: Extract<SearchAst, { type: "term" }>) {
  const field = term.field?.toLowerCase();

  switch (field) {
    case undefined:
      return textContains(term.value);
    case "back":
      return like(notes.back, contains(term.value));
    case "card":
      return cardOrdinal(term.value);
    case "deck":
      return eq(decks.name, term.value);
    case "front":
      return like(notes.front, contains(term.value));
    case "is":
      return stateFilter(term.value);
    case "note":
      return eq(noteTypes.name, term.value);
    case "prop":
      return propertyFilter(term.value);
    case "rated":
      return ratedFilter(term.value);
    case "tag":
      return tagFilter(term.value);
    default:
      return undefined;
  }
}

function textContains(value: string) {
  return or(like(notes.front, contains(value)), like(notes.back, contains(value)));
}

function stateFilter(value: string) {
  switch (value.toLowerCase()) {
    case "buried":
      return inArray(cards.ankiQueue, [-2, -3]);
    case "due":
      return lte(cards.dueAt, nowIso());
    case "new":
      return eq(cards.repetitions, 0);
    case "review":
      return gt(cards.repetitions, 0);
    case "suspended":
      return eq(cards.ankiQueue, -1);
    default:
      return undefined;
  }
}

function propertyFilter(value: string) {
  const match = /^(due|ease|ivl|lapses|reps)(<=|>=|!=|=|<|>)(-?\d+(?:\.\d+)?)$/i.exec(value);

  if (!match) {
    return undefined;
  }

  const [, property, operator, rawValue] = match;
  const numericValue = Number(rawValue);

  if (!property || !operator || !Number.isFinite(numericValue)) {
    return undefined;
  }

  switch (property.toLowerCase()) {
    case "due":
      return compareNumber(cards.ankiDue, operator as SearchOperator, numericValue);
    case "ease":
      return compareNumber(cards.easeFactor, operator as SearchOperator, numericValue);
    case "ivl":
      return compareNumber(cards.intervalDays, operator as SearchOperator, numericValue);
    case "lapses":
      return compareNumber(cards.lapses, operator as SearchOperator, numericValue);
    case "reps":
      return compareNumber(cards.repetitions, operator as SearchOperator, numericValue);
    default:
      return undefined;
  }
}

function ratedFilter(value: string) {
  const [rawDays, rawRating] = value.split(":");
  const days = Number(rawDays);
  const rating = Number(rawRating);

  if (!Number.isInteger(days) || !Number.isInteger(rating)) {
    return undefined;
  }

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  return sql`exists (
    select 1 from reviews
    where reviews.card_id = ${cards.id}
      and reviews.rating = ${rating}
      and reviews.created_at >= ${since}
  )`;
}

function tagFilter(value: string) {
  return sql`exists (
    select 1 from json_each(${notes.ankiTags})
    where json_each.value = ${value}
  )`;
}

function cardOrdinal(value: string) {
  const ordinal = Number(value);

  if (!Number.isInteger(ordinal) || ordinal < 1) {
    return undefined;
  }

  return eq(cards.ankiOrder, ordinal - 1);
}

function compareNumber(column: NumericSearchColumn, operator: SearchOperator, value: number) {
  switch (operator) {
    case "!=":
      return ne(column, value);
    case "<":
      return lt(column, value);
    case "<=":
      return lte(column, value);
    case "=":
    case ":":
      return eq(column, value);
    case ">":
      return gt(column, value);
    case ">=":
      return gte(column, value);
    default:
      return undefined;
  }
}

function combineAnd(conditions: Array<SQL | undefined>) {
  const filtered = conditions.filter(isSql);
  return filtered.length > 0 ? and(...filtered) : undefined;
}

function combineOr(conditions: Array<SQL | undefined>) {
  const filtered = conditions.filter(isSql);
  return filtered.length > 0 ? or(...filtered) : undefined;
}

function contains(value: string) {
  return `%${value.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
}

function compactAst(children: Array<SearchAst | undefined>) {
  return children.filter((child): child is SearchAst => Boolean(child));
}

function normalizeAst(type: "and" | "or", children: SearchAst[]) {
  if (children.length === 0) {
    return undefined;
  }

  if (children.length === 1) {
    return children[0];
  }

  return { children, type };
}

function isSql(condition: SQL | undefined): condition is SQL {
  return Boolean(condition);
}

function readQuoted(input: string, startIndex: number) {
  let escaping = false;
  let index = startIndex + 1;
  let value = "";

  while (index < input.length) {
    const char = input[index];

    if (escaping) {
      value += char;
      escaping = false;
    } else if (char === "\\") {
      escaping = true;
    } else if (char === '"') {
      index += 1;
      break;
    } else {
      value += char;
    }

    index += 1;
  }

  return { nextIndex: index, value };
}

function readWord(input: string, startIndex: number) {
  let index = startIndex;
  let value = "";

  while (index < input.length) {
    const char = input[index];

    if (!char || /\s|\(|\)/.test(char)) {
      break;
    }

    if (char === '"') {
      const quoted = readQuoted(input, index);
      value += quoted.value;
      index = quoted.nextIndex;
      continue;
    }

    value += char;
    index += 1;
  }

  return { nextIndex: index, value };
}
