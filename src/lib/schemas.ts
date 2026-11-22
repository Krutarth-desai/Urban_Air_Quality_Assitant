import { z } from "zod";

/**
 * Household & lifestyle profile used to personalize air quality advice.
 */
export const HouseholdProfileSchema = z.object({
  city: z.string().trim().min(2).max(100),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  householdMembers: z
    .array(
      z.enum([
        "infants_kids",
        "elderly",
        "asthma_respiratory",
        "pregnant",
        "outdoor_workers",
        "pets",
        "general_adults",
      ])
    )
    .min(1)
    .max(7),
  commuteMode: z.enum([
    "private_car",
    "two_wheeler",
    "public_transit",
    "walk_cycle",
    "work_from_home",
  ]),
  homeType: z.enum([
    "apartment_highrise",
    "independent_house",
    "dense_urban_flat",
  ]),
  hasAirPurifier: z.boolean(),
  cookingFuel: z.enum(["lpg_gas", "electric_induction", "biomass_solid"]),
});

export type HouseholdProfile = z.infer<typeof HouseholdProfileSchema>;

export const PlanRequestSchema = z.object({
  profile: HouseholdProfileSchema,
  aqiData: z.object({
    usAqi: z.number().min(0).max(1000),
    pm25: z.number().min(0).max(2000),
    pm10: z.number().min(0).max(3000),
    no2: z.number().min(0).max(2000),
    o3: z.number().min(0).max(2000),
    category: z.string().max(50),
    safestWindow: z.string().max(100),
    peakSmogWindow: z.string().max(100),
  }),
});

export const ChatRequestSchema = z.object({
  message: z.string().trim().min(2).max(500),
  city: z.string().trim().min(2).max(100),
  usAqi: z.number().min(0).max(1000),
  pm25: z.number().min(0).max(2000),
  householdSummary: z.string().trim().max(300),
});

export interface ActionItem {
  id: string;
  title: string;
  timingOrFrequency: string;
  description: string;
  healthImpact: string;
  emissionImpact: string;
  estimatedCo2SavedKgPerWeek: number;
  estimatedPm25ExposureReductionPct: number;
  difficulty: "Easy" | "Medium" | "High";
}

export interface GeneratedActionPlan {
  severitySummary: string;
  winterSmogInsight: string;
  dailyRoutines: ActionItem[];
  indoorHacks: ActionItem[];
  sustainableAlternatives: ActionItem[];
  communityTip: string;
}

export const SupabaseProfileSchema = z.object({
  city: z.string().trim().min(2).max(100),
  has_kids: z.boolean(),
  has_seniors: z.boolean(),
  has_respiratory_condition: z.boolean(),
  has_hepa_purifier: z.boolean(),
  commute_mode: z.enum([
    "private_car",
    "two_wheeler",
    "public_transit",
    "walk_cycle",
    "work_from_home",
  ]),
});

export type SupabaseProfile = z.infer<typeof SupabaseProfileSchema>;

export const SavePlanRequestSchema = z.object({
  city: z.string().trim().min(2).max(100),
  aqi_value: z.number().min(0).max(1000),
  plan_json: z.record(z.string(), z.unknown()),
  completed_actions: z.array(z.string()).default([]),
});

export type SavePlanRequest = z.infer<typeof SavePlanRequestSchema>;

export interface SavedPlanRow {
  id: string;
  user_id: string;
  city: string;
  aqi_value: number;
  plan_json: GeneratedActionPlan;
  completed_actions: string[];
  created_at: string;
}
