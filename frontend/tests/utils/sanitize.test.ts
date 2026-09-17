import { describe, it, expect } from "vitest";
import { sanitizeText } from "../../src/utils/sanitize";

describe("sanitizeText", () => {
  it("strips script tags from free-text input", () => {
    expect(sanitizeText('<script>alert("xss")</script>Sem glúten, por favor')).toBe("Sem glúten, por favor");
  });

  it("strips all HTML tags, keeping only text content", () => {
    expect(sanitizeText("<b>Negrito</b> e <i>itálico</i>")).toBe("Negrito e itálico");
  });

  it("leaves plain text untouched", () => {
    expect(sanitizeText("Sem restrições alimentares")).toBe("Sem restrições alimentares");
  });
});
