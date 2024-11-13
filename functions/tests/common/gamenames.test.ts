import { randomName } from "../../src/common/gamenames.ts";
import { describe, expect, it } from "vitest";

describe("gamename tests", () => {
  it("generates a name", () => {
    const name = randomName();
    const parts = name.split(" ");
    expect(parts.length).toBe(2);
    expect(parts[0].length).toBeGreaterThan(3);
    expect(parts[1].length).toBeGreaterThan(3);
  });
});
