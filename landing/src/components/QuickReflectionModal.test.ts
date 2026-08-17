import { describe, expect, it } from "vitest";
import {
  calculateScores,
  explainRule,
  formatScore,
  getResult,
  isValidReflectionState,
  type Scores,
} from "./QuickReflectionModal";

// ── calculateScores ──────────────────────────────────────────────────────────

describe("calculateScores", () => {
  it("averages S (q1-3) and C (q5-6), passes A (q4) and L (q7) through", () => {
    const scores = calculateScores({ 1: 6, 2: 8, 3: 4, 4: 7, 5: 8, 6: 9, 7: 2 });
    expect(scores).toEqual({ S: 6, A: 7, C: 8.5, L: 2 });
  });

  it("defaults every missing answer to 0", () => {
    expect(calculateScores({})).toEqual({ S: 0, A: 0, C: 0, L: 0 });
  });

  it("defaults only the missing questions when answers are partial", () => {
    expect(calculateScores({ 1: 6 })).toEqual({ S: 2, A: 0, C: 0, L: 0 });
  });
});

// ── getResult ─────────────────────────────────────────────────────────────────
// Branch order: support > ok > growth > change (support overrides everything).

describe("getResult", () => {
  describe("support: L >= 8 && C <= 4", () => {
    it("holds at the exact boundary (L=8, C=4)", () => {
      expect(getResult({ S: 0, A: 0, C: 4, L: 8 })).toBe("support");
    });

    it("holds comfortably inside the range", () => {
      expect(getResult({ S: 0, A: 0, C: 0, L: 10 })).toBe("support");
    });

    it("overrides ok even when S/A would otherwise say ok", () => {
      expect(getResult({ S: 10, A: 0, C: 4, L: 8 })).toBe("support");
    });

    it("overrides growth even when S/A would otherwise say growth", () => {
      expect(getResult({ S: 10, A: 10, C: 4, L: 8 })).toBe("support");
    });

    it("overrides change even when S/A would otherwise say change", () => {
      expect(getResult({ S: 0, A: 0, C: 4, L: 8 })).toBe("support");
    });

    it("does not hold when L is just under 8", () => {
      expect(getResult({ S: 8, A: 8, C: 0, L: 7.9 })).not.toBe("support");
    });

    it("does not hold when C is just over 4", () => {
      expect(getResult({ S: 8, A: 8, C: 4.1, L: 10 })).not.toBe("support");
    });
  });

  describe("ok: S >= 7 && A < 6 (support false)", () => {
    it("holds at the exact S boundary (S=7)", () => {
      expect(getResult({ S: 7, A: 0, C: 10, L: 0 })).toBe("ok");
    });

    it("holds just under the A boundary (A=5.9)", () => {
      expect(getResult({ S: 10, A: 5.9, C: 10, L: 0 })).toBe("ok");
    });
  });

  describe("growth: S >= 7 && A >= 6 (support false)", () => {
    it("holds at the exact A boundary (A=6)", () => {
      expect(getResult({ S: 7, A: 6, C: 10, L: 0 })).toBe("growth");
    });

    it("holds comfortably inside the range", () => {
      expect(getResult({ S: 10, A: 10, C: 10, L: 0 })).toBe("growth");
    });
  });

  describe("change: fallback when S < 7 (support false)", () => {
    it("holds just under the S boundary (S=6.9), regardless of A", () => {
      expect(getResult({ S: 6.9, A: 10, C: 10, L: 0 })).toBe("change");
    });

    it("holds for a fully empty/zero answer set", () => {
      expect(getResult({ S: 0, A: 0, C: 0, L: 0 })).toBe("change");
    });
  });
});

// ── explainRule ───────────────────────────────────────────────────────────────
// Traces the same branches as getResult, so its final clause must always
// match whatever getResult() actually decided for the same scores.

describe("explainRule", () => {
  const cases: Array<{ name: string; scores: Scores; expected: ReturnType<typeof getResult> }> = [
    { name: "support (boundary)", scores: { S: 0, A: 0, C: 4, L: 8 }, expected: "support" },
    { name: "support overriding growth-shaped scores", scores: { S: 10, A: 10, C: 4, L: 8 }, expected: "support" },
    { name: "ok (boundary)", scores: { S: 7, A: 0, C: 10, L: 0 }, expected: "ok" },
    { name: "growth (boundary)", scores: { S: 7, A: 6, C: 10, L: 0 }, expected: "growth" },
    { name: "change (boundary)", scores: { S: 6.9, A: 10, C: 10, L: 0 }, expected: "change" },
    { name: "change (all zero)", scores: { S: 0, A: 0, C: 0, L: 0 }, expected: "change" },
  ];

  it.each(cases)("$name: getResult() and explainRule() agree", ({ scores, expected }) => {
    expect(getResult(scores)).toBe(expected);

    const explanation = explainRule(scores);
    if (expected === "support") {
      expect(explanation).toContain("pravidlo pro podporu platí");
    } else if (expected === "ok") {
      expect(explanation).toMatch(/→ OK\.$/);
    } else if (expected === "growth") {
      expect(explanation).toMatch(/→ růst\.$/);
    } else {
      expect(explanation).toContain("zbývá změna");
    }
  });

  it("always states the support step first, even when it doesn't hold", () => {
    const explanation = explainRule({ S: 0, A: 0, C: 0, L: 0 });
    expect(explanation).toContain("zátěž L = 0 < 8 a kapacita C = 0 ≤ 4");
    expect(explanation).toContain("neplatí");
  });

  it("uses the correct comparison glyphs for a passing support step", () => {
    const explanation = explainRule({ S: 0, A: 0, C: 4, L: 8 });
    expect(explanation).toContain("zátěž L = 8 ≥ 8 a kapacita C = 4 ≤ 4");
  });

  it("switches to English phrasing when lang='en'", () => {
    const explanation = explainRule({ S: 0, A: 0, C: 4, L: 8 }, "en");
    expect(explanation).toContain("load L = 8 ≥ 8 and capacity C = 4 ≤ 4");
    expect(explanation).toContain("the support rule applies");
  });

  it.each(cases)("$name: English explainRule() still agrees with getResult()", ({ scores, expected }) => {
    const explanation = explainRule(scores, "en");
    if (expected === "support") {
      expect(explanation).toContain("the support rule applies");
    } else if (expected === "ok") {
      expect(explanation).toMatch(/→ OK\.$/);
    } else if (expected === "growth") {
      expect(explanation).toMatch(/→ growth\.$/);
    } else {
      expect(explanation).toContain("change remains");
    }
  });
});

// ── formatScore ───────────────────────────────────────────────────────────────

describe("formatScore", () => {
  it("formats a whole number without a trailing decimal", () => {
    expect(formatScore(7)).toBe("7");
  });

  it("rounds to one decimal and uses a comma separator", () => {
    expect(formatScore(5.25)).toBe("5,3");
  });

  it("rounds down when the second decimal is under 5", () => {
    expect(formatScore(5.24)).toBe("5,2");
  });

  it("formats zero as a plain 0", () => {
    expect(formatScore(0)).toBe("0");
  });

  it("uses a period separator for English instead of a comma", () => {
    expect(formatScore(5.25, "en")).toBe("5.3");
  });
});

// ── isValidReflectionState ───────────────────────────────────────────────────

describe("isValidReflectionState", () => {
  it("accepts a well-formed state", () => {
    expect(
      isValidReflectionState({ answers: { 1: 6, 4: 7 }, result: "growth" })
    ).toBe(true);
  });

  it("accepts an empty answers object", () => {
    expect(isValidReflectionState({ answers: {}, result: "change" })).toBe(true);
  });

  it("rejects null/undefined", () => {
    expect(isValidReflectionState(null)).toBe(false);
    expect(isValidReflectionState(undefined)).toBe(false);
  });

  it("rejects a non-object value", () => {
    expect(isValidReflectionState("growth")).toBe(false);
  });

  it("rejects an unrecognized result key", () => {
    expect(isValidReflectionState({ answers: {}, result: "bogus" })).toBe(false);
  });

  it("rejects a missing/non-object answers field", () => {
    expect(isValidReflectionState({ answers: null, result: "ok" })).toBe(false);
    expect(isValidReflectionState({ result: "ok" })).toBe(false);
  });

  it("rejects an answer keyed by an unknown question id", () => {
    expect(isValidReflectionState({ answers: { 99: 5 }, result: "ok" })).toBe(false);
  });

  it("rejects a non-numeric answer value", () => {
    expect(isValidReflectionState({ answers: { 1: "6" }, result: "ok" })).toBe(false);
  });

  it("rejects an answer value below 0 or above 10", () => {
    expect(isValidReflectionState({ answers: { 1: -1 }, result: "ok" })).toBe(false);
    expect(isValidReflectionState({ answers: { 1: 11 }, result: "ok" })).toBe(false);
  });
});
