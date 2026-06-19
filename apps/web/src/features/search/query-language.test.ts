import { describe, expect, it } from "vitest";
import { formatQuerySegments, parseDraftToken, tokenizeQuerySegments } from "./query-language";

describe("query language helpers", () => {
  it("tokenizes deck, tag, and negated is terms", () => {
    expect(tokenizeQuerySegments("deck:Spanish tag:verbs -is:suspended")).toEqual([
      { field: "deck", kind: "token", negated: false, text: "deck:Spanish", value: "Spanish" },
      { field: "tag", kind: "token", negated: false, text: "tag:verbs", value: "verbs" },
      { field: "is", kind: "token", negated: true, text: "-is:suspended", value: "suspended" },
    ]);
  });

  it("preserves quoted values", () => {
    expect(tokenizeQuerySegments('deck:"Spanish::Verbs"')).toEqual([
      {
        field: "deck",
        kind: "token",
        negated: false,
        text: 'deck:"Spanish::Verbs"',
        value: "Spanish::Verbs",
      },
    ]);
  });

  it("preserves negation", () => {
    expect(tokenizeQuerySegments("-tag:leech")).toEqual([
      { field: "tag", kind: "token", negated: true, text: "-tag:leech", value: "leech" },
    ]);
  });

  it("preserves free text and quoted phrases", () => {
    expect(tokenizeQuerySegments('hello "exact phrase" front:world')).toEqual([
      { kind: "text", text: "hello" },
      { kind: "text", text: '"exact phrase"' },
      { field: "front", kind: "token", negated: false, text: "front:world", value: "world" },
    ]);
  });

  it("round-trips query string formatting", () => {
    const query = 'deck:"Spanish::Verbs" tag:verbs "exact phrase" -tag:leech';

    expect(formatQuerySegments(tokenizeQuerySegments(query))).toBe(query);
  });

  it("parses draft conditions before a value is present", () => {
    expect(parseDraftToken("deck:")).toEqual({
      field: "deck",
      negated: false,
      text: "deck:",
      value: "",
    });
  });

  it("tokenizes conditions before a value is present", () => {
    expect(tokenizeQuerySegments("deck:")).toEqual([
      { field: "deck", kind: "token", negated: false, text: "deck:", value: "" },
    ]);
  });

  it("parses draft conditions while a value is being typed", () => {
    expect(parseDraftToken("-tag:lee")).toEqual({
      field: "tag",
      negated: true,
      text: "-tag:lee",
      value: "lee",
    });
  });
});
