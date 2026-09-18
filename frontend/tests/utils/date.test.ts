import { describe, it, expect } from "vitest";
import { formatDataEvento } from "../../src/utils/date";

describe("formatDataEvento", () => {
  it("formats a date-only UTC-midnight ISO string as the same calendar day, regardless of local timezone", () => {
    expect(formatDataEvento("2026-09-20T00:00:00.000Z")).toBe("20/09/2026");
  });
});
