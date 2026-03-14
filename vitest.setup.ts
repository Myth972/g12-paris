import "dotenv/config";
import { vi } from "vitest";

// Mock fetch for storage tests
global.fetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ url: "https://dummy.api/mocked-url" }),
    text: () => Promise.resolve("OK"),
  })
);
