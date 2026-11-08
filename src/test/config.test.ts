import { describe, it, expect } from "vitest";
import { BACKEND_URL, WS_BACKEND_URL, API_BASE, WS_DB_EVENTS } from "@/config";

describe("Configuration and Environment", () => {
  it("should have correct API and WebSocket base URLs configured", () => {
    expect(BACKEND_URL).toBeDefined();
    expect(API_BASE).toBe(`${BACKEND_URL}/api`);
    expect(WS_DB_EVENTS).toBe(`${WS_BACKEND_URL}/ws/db-events`);
    expect(WS_BACKEND_URL.startsWith("ws")).toBe(true);
  });
});
