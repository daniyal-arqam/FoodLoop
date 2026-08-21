import { describe, expect, it } from "vitest";
import { formatMatchScore, isAiMode, matchScorePercent } from "./aiModes.js";

describe("aiModes", () => {
  it("accepts only the three workspace modes", () => {
    expect(isAiMode("advisor")).toBe(true);
    expect(isAiMode("safety")).toBe(true);
    expect(isAiMode("matching")).toBe(true);
    expect(isAiMode("chatbot")).toBe(false);
  });

  it("formats matcher scores from the API without inventing values", () => {
    expect(formatMatchScore(0.8125)).toBe("0.8125");
    expect(matchScorePercent(0.8125)).toBe(81);
    expect(formatMatchScore(undefined)).toBe("—");
  });
});
