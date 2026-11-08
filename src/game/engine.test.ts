import { describe, expect, it } from "vitest";
import * as engine from "./engine";

describe("Requested expedition rules", () => {
  it("every destination has its own final boss", () => {
    for (const place of engine.PLACES) expect(place).toHaveProperty("boss");
  });
  it("adds expeditions beyond the original three", () => {
    expect(engine.PLACES.length).toBeGreaterThan(3);
  });
  it("adds transformative cards beyond the original ten", () => {
    expect(engine.CARD_POOL.length).toBeGreaterThan(10);
  });
  it("offers difficulty and movement settings", () => {
    expect(engine).toHaveProperty("DIFFICULTIES");
    expect(engine).toHaveProperty("DEFAULT_SETTINGS");
  });
});