import { describe, it, expect } from "vitest";
import {
  HouseholdProfileSchema,
  PlanRequestSchema,
  ChatRequestSchema,
  SupabaseProfileSchema,
  SavePlanRequestSchema,
  AuthCredentialsSchema,
} from "../lib/schemas";

describe("HouseholdProfileSchema", () => {
  const validProfile = {
    city: "New Delhi",
    latitude: 28.6139,
    longitude: 77.209,
    householdMembers: ["infants_kids", "asthma_respiratory"],
    commuteMode: "public_transit",
    homeType: "apartment_highrise",
    hasAirPurifier: false,
    cookingFuel: "lpg_gas",
  };

  it("successfully parses a valid household profile", () => {
    const result = HouseholdProfileSchema.safeParse(validProfile);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.city).toBe("New Delhi");
      expect(result.data.householdMembers).toContain("infants_kids");
    }
  });

  it("rejects an empty city or city with less than 2 characters", () => {
    const result = HouseholdProfileSchema.safeParse({
      ...validProfile,
      city: " ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects out-of-range coordinates", () => {
    const invalidLat = HouseholdProfileSchema.safeParse({
      ...validProfile,
      latitude: 95.0,
    });
    expect(invalidLat.success).toBe(false);

    const invalidLon = HouseholdProfileSchema.safeParse({
      ...validProfile,
      longitude: -195.0,
    });
    expect(invalidLon.success).toBe(false);
  });

  it("rejects empty household members array", () => {
    const result = HouseholdProfileSchema.safeParse({
      ...validProfile,
      householdMembers: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid member, commute, and home enum values", () => {
    const invalidMember = HouseholdProfileSchema.safeParse({
      ...validProfile,
      householdMembers: ["invalid_member_type"],
    });
    expect(invalidMember.success).toBe(false);

    const invalidCommute = HouseholdProfileSchema.safeParse({
      ...validProfile,
      commuteMode: "airplane",
    });
    expect(invalidCommute.success).toBe(false);

    const invalidHome = HouseholdProfileSchema.safeParse({
      ...validProfile,
      homeType: "spaceship",
    });
    expect(invalidHome.success).toBe(false);
  });
});

describe("PlanRequestSchema", () => {
  const validPayload = {
    profile: {
      city: "Beijing",
      latitude: 39.9042,
      longitude: 116.4074,
      householdMembers: ["elderly"],
      commuteMode: "private_car",
      homeType: "dense_urban_flat",
      hasAirPurifier: true,
      cookingFuel: "electric_induction",
    },
    aqiData: {
      usAqi: 185,
      pm25: 120.5,
      pm10: 160.2,
      no2: 45.1,
      o3: 20.0,
      category: "Unhealthy",
      safestWindow: "14:00 - 16:00",
      peakSmogWindow: "06:00 - 09:00",
    },
  };

  it("successfully parses a valid plan request payload", () => {
    const result = PlanRequestSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.aqiData.usAqi).toBe(185);
      expect(result.data.profile.hasAirPurifier).toBe(true);
    }
  });

  it("rejects negative or out-of-range telemetry values", () => {
    const negativeAqi = PlanRequestSchema.safeParse({
      ...validPayload,
      aqiData: { ...validPayload.aqiData, usAqi: -10 },
    });
    expect(negativeAqi.success).toBe(false);

    const excessivePm = PlanRequestSchema.safeParse({
      ...validPayload,
      aqiData: { ...validPayload.aqiData, pm25: 99999 },
    });
    expect(excessivePm.success).toBe(false);
  });
});

describe("ChatRequestSchema", () => {
  it("successfully parses valid chat input with optional history", () => {
    const payload = {
      message: "Is it safe for children to run outdoors today?",
      city: "Pune",
      usAqi: 140,
      pm25: 55,
      householdSummary: "Infants, Transit",
      history: [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi, how can I help?" },
      ],
    };

    const result = ChatRequestSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.message).toContain("safe for children");
      expect(result.data.history).toHaveLength(2);
    }
  });

  it("rejects empty message or oversized input exceeding 500 characters", () => {
    const emptyMsg = ChatRequestSchema.safeParse({
      message: "   ",
      city: "London",
      usAqi: 40,
      pm25: 10,
    });
    expect(emptyMsg.success).toBe(false);

    const oversizedMsg = ChatRequestSchema.safeParse({
      message: "a".repeat(501),
      city: "London",
      usAqi: 40,
      pm25: 10,
    });
    expect(oversizedMsg.success).toBe(false);
  });

  it("provides clean defaults for optional fields", () => {
    const minimal = {
      message: "Mask guidelines?",
      city: "Delhi",
      usAqi: 200,
      pm25: 150,
    };

    const result = ChatRequestSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.householdSummary).toBe("");
      expect(result.data.history).toEqual([]);
    }
  });
});

describe("SupabaseProfileSchema and SavePlanRequestSchema", () => {
  it("validates Supabase profile payload", () => {
    const valid = {
      city: "London",
      has_kids: true,
      has_seniors: false,
      has_respiratory_condition: true,
      has_hepa_purifier: true,
      commute_mode: "walk_cycle",
    };
    expect(SupabaseProfileSchema.safeParse(valid).success).toBe(true);

    const invalid = {
      ...valid,
      commute_mode: "helicopter",
    };
    expect(SupabaseProfileSchema.safeParse(invalid).success).toBe(false);
  });

  it("validates SavePlanRequestSchema", () => {
    const valid = {
      city: "New Delhi",
      aqi_value: 250,
      plan_json: { severitySummary: "High alert", routines: [] },
      completed_actions: ["r1", "i2"],
    };
    expect(SavePlanRequestSchema.safeParse(valid).success).toBe(true);

    const missingJson = {
      city: "New Delhi",
      aqi_value: 250,
    };
    expect(SavePlanRequestSchema.safeParse(missingJson).success).toBe(false);
  });
});

describe("AuthCredentialsSchema", () => {
  it("accepts valid email and password >= 8 characters", () => {
    const valid = {
      email: "resident@smogshield.org",
      password: "securePassword123",
    };
    const result = AuthCredentialsSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects invalid email formats", () => {
    const invalidEmail = {
      email: "not-an-email",
      password: "password123",
    };
    expect(AuthCredentialsSchema.safeParse(invalidEmail).success).toBe(false);
  });

  it("rejects passwords under 8 characters", () => {
    const shortPassword = {
      email: "resident@smogshield.org",
      password: "12345",
    };
    expect(AuthCredentialsSchema.safeParse(shortPassword).success).toBe(false);
  });
});
