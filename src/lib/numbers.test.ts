import { describe, expect, it } from "vitest";
import {
  parseCourtScoreField,
  parseScoreInput,
  sanitizeScoreTyping,
} from "@/lib/numbers";
import { validateMatchScore } from "@/lib/queue/queue-engine";

describe("sanitizeScoreTyping", () => {
  it("preserves zero for shutout scores", () => {
    expect(sanitizeScoreTyping("0")).toBe("0");
    expect(sanitizeScoreTyping("15")).toBe("15");
  });
});

describe("parseCourtScoreField", () => {
  it("treats blank as zero", () => {
    expect(parseCourtScoreField("")).toBe(0);
    expect(parseCourtScoreField("0")).toBe(0);
    expect(parseCourtScoreField("15")).toBe(15);
  });
});

describe("parseScoreInput", () => {
  it("returns null for blank but parses zero", () => {
    expect(parseScoreInput("")).toBeNull();
    expect(parseScoreInput("0")).toBe(0);
  });
});

describe("validateMatchScore shutouts", () => {
  it("accepts 15-0 when game is to 15", () => {
    expect(validateMatchScore(15, 0, 15, 2)).toMatchObject({
      valid: true,
      winner: "A",
    });
  });

  it("accepts 11-0 when game is to 11", () => {
    expect(validateMatchScore(11, 0, 11, 2)).toMatchObject({
      valid: true,
      winner: "A",
    });
  });
});
