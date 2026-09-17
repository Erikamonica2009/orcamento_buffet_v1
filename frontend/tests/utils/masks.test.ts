import { describe, it, expect } from "vitest";
import { maskCpf, maskTelefone, unmask } from "../../src/utils/masks";

describe("maskCpf", () => {
  it("formats 11 digits as ###.###.###-##", () => {
    expect(maskCpf("12345678901")).toBe("123.456.789-01");
  });

  it("formats partial input progressively", () => {
    expect(maskCpf("123")).toBe("123");
    expect(maskCpf("1234")).toBe("123.4");
  });

  it("strips non-digit characters before formatting", () => {
    expect(maskCpf("123.456.789-01")).toBe("123.456.789-01");
  });
});

describe("maskTelefone", () => {
  it("formats a mobile number with 9 digits", () => {
    expect(maskTelefone("11999990000")).toBe("(11) 99999-0000");
  });

  it("formats a landline with 8 digits", () => {
    expect(maskTelefone("1133334444")).toBe("(11) 3333-4444");
  });
});

describe("unmask", () => {
  it("removes all non-digit characters", () => {
    expect(unmask("(11) 99999-0000")).toBe("11999990000");
  });
});
