import { describe, it, expect } from "vitest";
import { isValidCpf } from "../src/utils/cpf";

describe("isValidCpf", () => {
  it("accepts a CPF with correct check digits", () => {
    expect(isValidCpf("12345678909")).toBe(true);
  });

  it("accepts a formatted CPF with punctuation", () => {
    expect(isValidCpf("123.456.789-09")).toBe(true);
  });

  it("rejects a CPF with an incorrect check digit", () => {
    expect(isValidCpf("12345678901")).toBe(false);
  });

  it("rejects CPFs made of a single repeated digit", () => {
    expect(isValidCpf("11111111111")).toBe(false);
    expect(isValidCpf("00000000000")).toBe(false);
  });

  it("rejects strings with the wrong length", () => {
    expect(isValidCpf("123")).toBe(false);
    expect(isValidCpf("123456789099")).toBe(false);
  });
});
