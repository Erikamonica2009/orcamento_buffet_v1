import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// vitest.config.ts sets `globals: false`, so @testing-library/react's
// built-in auto-cleanup (which looks for a global `afterEach`) never runs.
// Register it explicitly so the DOM is reset between tests in the same file.
afterEach(() => {
  cleanup();
});
