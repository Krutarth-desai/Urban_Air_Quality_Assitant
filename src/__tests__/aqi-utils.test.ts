import { describe, it, expect } from "vitest";
import {
  classifyUsAqi,
  getBarColor,
  calculateCollectiveImpact,
  AQI_THRESHOLDS,
  PM25_THRESHOLDS,
  IMPACT_CONSTANTS,
  DIFFICULTY_STYLES,
} from "@/lib/aqi-utils";

describe("AQI Utilities & Constants (aqi-utils.ts)", () => {
  describe("classifyUsAqi", () => {
    it("classifies Good air quality (AQI <= 50)", () => {
      const res = classifyUsAqi(42);
      expect(res.category).toBe("Good");
      expect(res.colorToken).toBe("emerald");
      expect(res.badgeClass).toContain("bg-emerald-50");
      expect(res.dotClass).toContain("bg-emerald-600");
    });

    it("classifies Moderate air quality (AQI 51 - 100)", () => {
      const res = classifyUsAqi(75);
      expect(res.category).toBe("Moderate");
      expect(res.colorToken).toBe("amber");
      expect(res.badgeClass).toContain("bg-amber-50");
    });

    it("classifies Unhealthy for Sensitive Groups (AQI 101 - 150)", () => {
      const res = classifyUsAqi(135);
      expect(res.category).toBe("Unhealthy for Sensitive Groups");
      expect(res.colorToken).toBe("orange");
      expect(res.badgeClass).toContain("bg-orange-50");
    });

    it("classifies Unhealthy air quality (AQI 151 - 200)", () => {
      const res = classifyUsAqi(185);
      expect(res.category).toBe("Unhealthy");
      expect(res.colorToken).toBe("red");
      expect(res.badgeClass).toContain("bg-red-50");
    });

    it("classifies Very Unhealthy air quality (AQI 201 - 300)", () => {
      const res = classifyUsAqi(250);
      expect(res.category).toBe("Very Unhealthy");
      expect(res.colorToken).toBe("severe");
      expect(res.dotClass).toContain("bg-red-700");
    });

    it("classifies Hazardous air quality (AQI > 300)", () => {
      const res = classifyUsAqi(410);
      expect(res.category).toBe("Hazardous");
      expect(res.colorToken).toBe("hazardous");
      expect(res.dotClass).toContain("bg-red-800");
    });
  });

  describe("getBarColor", () => {
    it("returns emerald for PM2.5 <= 12", () => {
      expect(getBarColor(8.5)).toContain("bg-emerald-600");
    });

    it("returns amber for PM2.5 <= 35.4", () => {
      expect(getBarColor(25.0)).toContain("bg-amber-600");
    });

    it("returns orange for PM2.5 <= 55.4", () => {
      expect(getBarColor(45.0)).toContain("bg-orange-600");
    });

    it("returns red for severe PM2.5 > 55.4", () => {
      expect(getBarColor(115.0)).toContain("bg-red-700");
    });
  });

  describe("Constants & Difficulty Mappings", () => {
    it("exports valid EPA threshold constants", () => {
      expect(AQI_THRESHOLDS.GOOD).toBe(50);
      expect(AQI_THRESHOLDS.VERY_UNHEALTHY).toBe(300);
      expect(PM25_THRESHOLDS.GOOD).toBe(12.0);
    });

    it("exports realistic environmental impact constants", () => {
      expect(IMPACT_CONSTANTS.KM_PER_KG_CO2_OFFSET).toBe(4.2);
      expect(IMPACT_CONSTANTS.MAX_REALISTIC_EXPOSURE_REDUCTION_PCT).toBe(85);
      expect(IMPACT_CONSTANTS.COMMUNITY_SCALE_HOUSEHOLDS).toBe(50);
    });

    it("calculates 50-household community collective scale metrics", () => {
      const res = calculateCollectiveImpact(10.0, 50);
      expect(res.collectiveCo2Kg).toBe(500);
      expect(res.vehicleKmEliminated).toBe(2100);
      expect(res.particulatePreventedGrams).toBe(40000);
    });

    it("provides styling for Easy, Medium, High difficulty levels", () => {
      expect(DIFFICULTY_STYLES.Easy.badge).toBeDefined();
      expect(DIFFICULTY_STYLES.Medium.badge).toBeDefined();
      expect(DIFFICULTY_STYLES.High.badge).toBeDefined();
    });
  });
});
