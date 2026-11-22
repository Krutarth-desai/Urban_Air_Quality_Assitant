/**
 * SmogShield Air Quality Utilities & Constants
 *
 * Single source of truth for AQI thresholds, PM2.5 severity breakpoints,
 * semantic styling mappings, and environmental calculation constants.
 */

import type { ActionItem, AqiCategory, AqiColorToken } from "@/types/smogshield";

/**
 * Standard US AQI Category breakpoints.
 */
export const AQI_THRESHOLDS = {
  GOOD: 50,
  MODERATE: 100,
  UNHEALTHY_SENSITIVE: 150,
  UNHEALTHY: 200,
  VERY_UNHEALTHY: 300,
} as const;

/**
 * EPA PM2.5 24-hour concentration breakpoints (µg/m³).
 */
export const PM25_THRESHOLDS = {
  GOOD: 12.0,
  MODERATE: 35.4,
  UNHEALTHY_SENSITIVE: 55.4,
} as const;

/**
 * Environmental impact constants.
 */
export const IMPACT_CONSTANTS = {
  /** Approximate gasoline vehicle kilometers offset per kg of CO2 prevented */
  KM_PER_KG_CO2_OFFSET: 4.2,
  /** Maximum realistic ceiling for combined personal PM2.5 exposure reduction (%) */
  MAX_REALISTIC_EXPOSURE_REDUCTION_PCT: 85,
  /** Weekly CO2 progress bar scale denominator in kg */
  WEEKLY_CO2_BAR_MAX_KG: 25,
} as const;

/**
 * Visual styling tokens for AQI severity levels.
 */
export const AQI_COLOR_MAP: Record<
  AqiColorToken,
  {
    badge: string;
    scoreText: string;
    dot: string;
  }
> = {
  emerald: {
    badge: "bg-emerald-50 text-emerald-900 border-emerald-200",
    scoreText: "text-emerald-900",
    dot: "bg-emerald-600",
  },
  amber: {
    badge: "bg-amber-50 text-amber-900 border-amber-200",
    scoreText: "text-amber-900",
    dot: "bg-amber-600",
  },
  orange: {
    badge: "bg-orange-50 text-orange-900 border-orange-200",
    scoreText: "text-orange-900",
    dot: "bg-orange-600",
  },
  red: {
    badge: "bg-red-50 text-red-900 border-red-200",
    scoreText: "text-red-900",
    dot: "bg-red-600",
  },
  severe: {
    badge: "bg-red-50 text-red-900 border-red-200",
    scoreText: "text-red-900",
    dot: "bg-red-700",
  },
  hazardous: {
    badge: "bg-red-50 text-red-900 border-red-200",
    scoreText: "text-red-900",
    dot: "bg-red-800",
  },
};

/**
 * Styling badges for action item difficulty ratings.
 */
export const DIFFICULTY_STYLES: Record<ActionItem["difficulty"], { badge: string }> = {
  Easy: {
    badge: "border-stone-200 bg-stone-100 text-stone-700",
  },
  Medium: {
    badge: "border-amber-200 bg-amber-50 text-amber-800",
  },
  High: {
    badge: "border-stone-300 bg-stone-200 text-stone-800",
  },
};

/**
 * Classifies a US AQI index value into category name, color token, and styling classes.
 *
 * @param aqi - Numerical US AQI index (0 to 500+)
 * @returns Classification object with category, token, and pre-computed Tailwind class names
 */
export function classifyUsAqi(aqi: number): {
  category: AqiCategory;
  colorToken: AqiColorToken;
  badgeClass: string;
  dotClass: string;
  scoreTextClass: string;
} {
  let category: AqiCategory = "Hazardous";
  let colorToken: AqiColorToken = "hazardous";

  if (aqi <= AQI_THRESHOLDS.GOOD) {
    category = "Good";
    colorToken = "emerald";
  } else if (aqi <= AQI_THRESHOLDS.MODERATE) {
    category = "Moderate";
    colorToken = "amber";
  } else if (aqi <= AQI_THRESHOLDS.UNHEALTHY_SENSITIVE) {
    category = "Unhealthy for Sensitive Groups";
    colorToken = "orange";
  } else if (aqi <= AQI_THRESHOLDS.UNHEALTHY) {
    category = "Unhealthy";
    colorToken = "red";
  } else if (aqi <= AQI_THRESHOLDS.VERY_UNHEALTHY) {
    category = "Very Unhealthy";
    colorToken = "severe";
  }

  const styles = AQI_COLOR_MAP[colorToken];

  return {
    category,
    colorToken,
    badgeClass: styles.badge,
    dotClass: styles.dot,
    scoreTextClass: styles.scoreText,
  };
}

/**
 * Returns the corresponding Tailwind color class for a PM2.5 bar in hourly forecast charts.
 *
 * @param pm25 - Fine particulate concentration in µg/m³
 * @returns Tailwind CSS class string
 */
export function getBarColor(pm25: number): string {
  if (pm25 <= PM25_THRESHOLDS.GOOD) return "bg-emerald-600 hover:bg-emerald-500";
  if (pm25 <= PM25_THRESHOLDS.MODERATE) return "bg-amber-600 hover:bg-amber-500";
  if (pm25 <= PM25_THRESHOLDS.UNHEALTHY_SENSITIVE) return "bg-orange-600 hover:bg-orange-500";
  return "bg-red-700 hover:bg-red-600";
}
