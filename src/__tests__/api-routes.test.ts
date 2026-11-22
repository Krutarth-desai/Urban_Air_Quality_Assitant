import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as aqiHandler } from "../app/api/aqi/route";
import { POST as chatHandler } from "../app/api/chat/route";
import { POST as planHandler } from "../app/api/plan/route";
import { GET as profileGetHandler, POST as profilePostHandler } from "../app/api/profile/route";
import {
  GET as plansGetHandler,
  POST as plansPostHandler,
  DELETE as plansDeleteHandler,
} from "../app/api/plans/route";

// Mock Supabase server client for protected routes testing
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: new Error("No active session"),
      }),
    },
  }),
}));

describe("API Route: /api/aqi", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 400 when neither query nor coordinates are provided", async () => {
    const req = new Request("http://localhost:3000/api/aqi");
    const res = await aqiHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Provide either ?q=city or ?lat=...&lon=...");
  });

  it("returns 400 when query exceeds 80 characters", async () => {
    const longQuery = "a".repeat(85);
    const req = new Request(`http://localhost:3000/api/aqi?q=${longQuery}`);
    const res = await aqiHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Query too long");
  });

  it("returns 400 on invalid latitude or longitude", async () => {
    const req = new Request("http://localhost:3000/api/aqi?lat=999&lon=50");
    const res = await aqiHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid coordinates");
  });

  it("returns 200 with city search matches for known cities", async () => {
    // Mock global fetch for geocoding
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          results: [
            {
              name: "Pune",
              country: "India",
              admin1: "Maharashtra",
              latitude: 18.5204,
              longitude: 73.8567,
            },
          ],
        }),
        { status: 200 }
      )
    );

    const req = new Request("http://localhost:3000/api/aqi?q=Pune");
    const res = await aqiHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.cities).toBeDefined();
    expect(data.cities[0].name).toBe("Pune");
  });

  it("returns 200 with normalized air quality report for coordinates", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          current: {
            us_aqi: 145,
            pm2_5: 55.4,
            pm10: 75.0,
            nitrogen_dioxide: 32.1,
            ozone: 18.0,
          },
          hourly: {
            time: ["2026-11-22T00:00", "2026-11-22T01:00"],
            pm2_5: [50.0, 55.4],
            us_aqi: [140, 145],
          },
        }),
        { status: 200 }
      )
    );

    const req = new Request("http://localhost:3000/api/aqi?lat=18.52&lon=73.85");
    const res = await aqiHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.report).toBeDefined();
    expect(data.report.usAqi).toBe(145);
    expect(data.report.category).toBe("Unhealthy for Sensitive Groups");
  });
});

describe("API Route: /api/chat", () => {
  it("returns 400 on malformed or empty request payload", async () => {
    const req = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "" }),
    });

    const res = await chatHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it("returns 200 with context-aware guidance when valid question is submitted", async () => {
    const payload = {
      message: "Is it safe for children to run outdoors today?",
      city: "New Delhi",
      usAqi: 220,
      pm25: 170,
      householdSummary: "Infants, Asthma",
    };

    const req = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await chatHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.reply).toBeDefined();
    expect(typeof data.reply).toBe("string");
    expect(data.reply.length).toBeGreaterThan(20);
  });
});

describe("API Route: /api/plan", () => {
  it("returns 400 when plan request body fails Zod validation", async () => {
    const req = new Request("http://localhost:3000/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: { city: "" } }),
    });

    const res = await planHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid request payload");
  });

  it("returns 200 with structured plan and source flag for valid payload", async () => {
    const payload = {
      profile: {
        city: "Pune",
        latitude: 18.52,
        longitude: 73.85,
        householdMembers: ["asthma_respiratory"],
        commuteMode: "public_transit",
        homeType: "apartment_highrise",
        hasAirPurifier: false,
        cookingFuel: "lpg_gas",
      },
      aqiData: {
        usAqi: 110,
        pm25: 45,
        pm10: 60,
        no2: 25,
        o3: 15,
        category: "Unhealthy for Sensitive Groups",
        safestWindow: "14:00 - 16:00",
        peakSmogWindow: "06:00 - 09:00",
      },
    };

    const req = new Request("http://localhost:3000/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await planHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.plan).toBeDefined();
    expect(data.plan.dailyRoutines).toHaveLength(3);
    expect(data.plan.indoorHacks).toHaveLength(3);
    expect(data.plan.sustainableAlternatives).toHaveLength(3);
    expect(["gemini", "fallback"]).toContain(data.source);
  });
});

describe("Protected Routes: /api/profile & /api/plans", () => {
  it("returns 401 Unauthorized for unauthenticated GET /api/profile", async () => {
    const req = new Request("http://localhost:3000/api/profile");
    const res = await profileGetHandler(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 401 Unauthorized for unauthenticated POST /api/profile", async () => {
    const req = new Request("http://localhost:3000/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        city: "London",
        has_kids: true,
        has_seniors: false,
        has_respiratory_condition: false,
        has_hepa_purifier: true,
        commute_mode: "walk_cycle",
      }),
    });
    const res = await profilePostHandler(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 Unauthorized for unauthenticated GET /api/plans", async () => {
    const req = new Request("http://localhost:3000/api/plans");
    const res = await plansGetHandler(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 Unauthorized for unauthenticated POST /api/plans", async () => {
    const req = new Request("http://localhost:3000/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        city: "New Delhi",
        aqi_value: 200,
        plan_json: {},
      }),
    });
    const res = await plansPostHandler(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 Unauthorized for unauthenticated DELETE /api/plans", async () => {
    const req = new Request("http://localhost:3000/api/plans?id=plan-123", {
      method: "DELETE",
    });
    const res = await plansDeleteHandler(req);
    expect(res.status).toBe(401);
  });
});
