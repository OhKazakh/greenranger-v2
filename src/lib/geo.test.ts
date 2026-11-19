import { describe, expect, it } from "vitest";
import { nearestOpenFirst } from "@/lib/geo";
import type { Location, Schedule } from "@/types";

const point = (id: string, lat: number, schedule: Schedule | null) =>
  ({ id, position: { lat, lng: 71.43 }, schedule }) as Location;

// Wednesday 12:00 in Astana (UTC+5).
const noon = new Date("2026-12-16T07:00:00Z");
const origin = { lat: 51.1, lng: 71.43 };

describe("nearestOpenFirst", () => {
  it("puts open points before closer closed ones", () => {
    const closedNear = point("closed", 51.101, { weekdays: "14:00–18:00", saturday: null, sunday: null });
    const unknownMid = point("unknown", 51.11, null);
    const openFar = point("open", 51.2, { weekdays: "09:00–18:00", saturday: null, sunday: null });

    const ranked = nearestOpenFirst(origin, [closedNear, unknownMid, openFar], 3, noon);
    expect(ranked.map((r) => r.location.id)).toEqual(["open", "unknown", "closed"]);
    expect(ranked[0].status).toBe("open");
  });

  it("sorts by distance within the same status", () => {
    const hours = { weekdays: "09:00–18:00", saturday: null, sunday: null };
    const ranked = nearestOpenFirst(origin, [point("far", 51.3, hours), point("near", 51.12, hours)], 2, noon);
    expect(ranked.map((r) => r.location.id)).toEqual(["near", "far"]);
  });
});
