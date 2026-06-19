import { describe, expect, it } from "vitest";
import { lexSearchQuery, parseSearchQuery } from "./query.js";

describe("search query parser", () => {
  it("parses implicit and with negated terms", () => {
    expect(parseSearchQuery("deck:Spanish tag:verbs -is:suspended")).toEqual({
      children: [
        { field: "deck", operator: ":", type: "term", value: "Spanish" },
        { field: "tag", operator: ":", type: "term", value: "verbs" },
        {
          child: { field: "is", operator: ":", type: "term", value: "suspended" },
          type: "not",
        },
      ],
      type: "and",
    });
  });

  it("preserves quoted values", () => {
    expect(parseSearchQuery('deck:"Spanish::Verbs"')).toEqual({
      field: "deck",
      operator: ":",
      type: "term",
      value: "Spanish::Verbs",
    });
  });

  it("parses explicit or groups", () => {
    expect(parseSearchQuery("(tag:verbs OR tag:nouns) deck:Spanish")).toEqual({
      children: [
        {
          children: [
            { field: "tag", operator: ":", type: "term", value: "verbs" },
            { field: "tag", operator: ":", type: "term", value: "nouns" },
          ],
          type: "or",
        },
        { field: "deck", operator: ":", type: "term", value: "Spanish" },
      ],
      type: "and",
    });
  });

  it("lexes quoted exact phrases as one word token", () => {
    expect(lexSearchQuery('"exact phrase" front:hello')).toEqual([
      { type: "word", value: "exact phrase" },
      { type: "word", value: "front:hello" },
    ]);
  });
});
