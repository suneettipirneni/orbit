export type QuerySegment =
  | {
      kind: "token";
      field: QueryTokenField;
      negated: boolean;
      value: string;
      text: string;
    }
  | {
      kind: "text";
      text: string;
    };

export type QueryTokenField =
  | "back"
  | "card"
  | "deck"
  | "front"
  | "is"
  | "note"
  | "prop"
  | "rated"
  | "tag";

export interface QueryDraftToken {
  field: QueryTokenField;
  negated: boolean;
  text: string;
  value: string;
}

const tokenFields = new Set<QueryTokenField>([
  "back",
  "card",
  "deck",
  "front",
  "is",
  "note",
  "prop",
  "rated",
  "tag",
]);

export function tokenizeQuerySegments(queryText: string): QuerySegment[] {
  return splitQueryText(queryText).map((text) => {
    const token = parseTokenSegment(text);
    return token ?? { kind: "text", text };
  });
}

export function formatQuerySegments(segments: QuerySegment[], draft = "") {
  return [...segments.map((segment) => segment.text), draft]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
}

export function parseTokenSegment(text: string): Extract<QuerySegment, { kind: "token" }> | null {
  const negated = text.startsWith("-");
  const term = negated ? text.slice(1) : text;
  const delimiterIndex = term.indexOf(":");

  if (delimiterIndex <= 0) {
    return null;
  }

  const field = term.slice(0, delimiterIndex).toLowerCase();

  if (!isTokenField(field)) {
    return null;
  }

  return {
    field,
    kind: "token",
    negated,
    value: normalizeTokenValue(term.slice(delimiterIndex + 1)),
    text,
  };
}

export function parseDraftToken(text: string): QueryDraftToken | null {
  if (/\s/.test(text.trim())) {
    return null;
  }

  const negated = text.startsWith("-");
  const term = negated ? text.slice(1) : text;
  const delimiterIndex = term.indexOf(":");

  if (delimiterIndex <= 0) {
    return null;
  }

  const field = term.slice(0, delimiterIndex).toLowerCase();

  if (!isTokenField(field)) {
    return null;
  }

  return {
    field,
    negated,
    text,
    value: normalizeTokenValue(term.slice(delimiterIndex + 1)),
  };
}

function isTokenField(field: string): field is QueryTokenField {
  return tokenFields.has(field as QueryTokenField);
}

function normalizeTokenValue(value: string) {
  if (!value.startsWith('"') || !value.endsWith('"')) {
    return value;
  }

  let normalized = "";
  let escaping = false;

  for (const char of value.slice(1, -1)) {
    if (escaping) {
      normalized += char;
      escaping = false;
    } else if (char === "\\") {
      escaping = true;
    } else {
      normalized += char;
    }
  }

  return normalized;
}

function splitQueryText(queryText: string) {
  const segments: string[] = [];
  let current = "";
  let inQuote = false;
  let escaping = false;

  for (const char of queryText.trim()) {
    if (escaping) {
      current += char;
      escaping = false;
      continue;
    }

    if (char === "\\") {
      current += char;
      escaping = true;
      continue;
    }

    if (char === '"') {
      current += char;
      inQuote = !inQuote;
      continue;
    }

    if (!inQuote && /\s/.test(char)) {
      if (current) {
        segments.push(current);
        current = "";
      }
      continue;
    }

    current += char;
  }

  if (current) {
    segments.push(current);
  }

  return segments;
}
