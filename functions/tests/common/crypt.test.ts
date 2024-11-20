import { decrypt, encrypt } from "../../src/common/crypt";
import { describe, expect, it } from "vitest";

describe("crypt tests", () => {
  it("basic encrypt", () => {
    const msg = encrypt("0", "hi star0 there");
    expect(msg).toBe("0h0i0 0s0t0a0r000 0t0h0e0r0e");
  });
  it("basic decrypt", () => {
    const msg = decrypt("0", "0h0i0 0t0h0e0r0e");
    expect(msg).toBe("hi there");
  });
  it("decrypt failure", () => {
    const msg = decrypt("9", "0h0i0 0t0h0e0r0e");
    expect(msg).toBe(null);
  });
  it("decrypt check", () => {
    const encrypted = "5T5e5s5t5R5o5o5m";
    const decrypted = decrypt("5", encrypted);
    expect(decrypted).toBe("TestRoom");
  });
});
