import { GoogleGenAI, Type } from "@google/genai";
import type { GeneratedActionPlan, HouseholdProfile } from "./schemas";
import type { AqiSnapshot } from "@/types/smogshield";

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === "your_google_ai_studio_api_key_here" || apiKey === "") {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

function getModelName(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
}

const actionItemSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    title: { type: Type.STRING },
    timingOrFrequency: { type: Type.STRING },
    description: { type: Type.STRING },
    healthImpact: { type: Type.STRING },
    emissionImpact: { type: Type.STRING },
    estimatedCo2SavedKgPerWeek: { type: Type.NUMBER },
    estimatedPm25ExposureReductionPct: { type: Type.NUMBER },
    difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "High"] },
  },
  required: [
    "id",
    "title",
    "timingOrFrequency",
    "description",
    "healthImpact",
    "emissionImpact",
    "estimatedCo2SavedKgPerWeek",
    "estimatedPm25ExposureReductionPct",
    "difficulty",
  ],
};

/**
 * Generates a tailored mitigation action plan for a household navigating urban air pollution.
 * Uses Google Gemini structured output when available, with automatic fallback to a deterministic engine.
 *
 * @param profile - Resident vulnerabilities, commute, housing, and cooking parameters
 * @param aqi - Real-time atmospheric pollutant concentrations and inversion windows
 * @returns Object with the parsed plan and generation source ("gemini" | "fallback")
 */
export async function generateTailoredAirPlan(
  profile: HouseholdProfile,
  aqi: AqiSnapshot
): Promise<{ plan: GeneratedActionPlan; source: "gemini" | "fallback" }> {
  const client = getGeminiClient();
  if (!client) {
    return { plan: buildFallbackPlan(profile, aqi), source: "fallback" };
  }

  const prompt = `
You are SmogShield, an expert urban environmental health and low-emission lifestyle advisor.
Generate a hyper-practical, scientifically accurate action plan for a household navigating urban air pollution and winter smog.

<LIVE_AIR_QUALITY>
City: ${profile.city}
US AQI: ${aqi.usAqi} (${aqi.category})
PM2.5: ${aqi.pm25} ug/m3 | PM10: ${aqi.pm10} ug/m3 | NO2: ${aqi.no2} ug/m3 | O3: ${aqi.o3} ug/m3
Safest Outdoor Window Today: ${aqi.safestWindow}
Peak Smog Window Today: ${aqi.peakSmogWindow}
</LIVE_AIR_QUALITY>

<HOUSEHOLD_PROFILE>
Members: ${profile.householdMembers.join(", ")}
Primary Commute: ${profile.commuteMode}
Home Type: ${profile.homeType}
Has HEPA Air Purifier: ${profile.hasAirPurifier ? "Yes" : "No"}
Cooking Fuel: ${profile.cookingFuel}
</HOUSEHOLD_PROFILE>

REQUIREMENTS:
1. Provide exactly 3 "dailyRoutines" timed specifically around the safestWindow and peakSmogWindow.
2. Provide exactly 3 "indoorHacks" tailored to their homeType, cookingFuel, and whether they own a HEPA purifier (if No, include affordable DIY or low-cost ventilation/cleaning hacks).
3. Provide exactly 3 "sustainableAlternatives" tailored to their commuteMode and household habits.
4. For EVERY item, clearly explain BOTH:
   - "healthImpact": Direct, tangible health benefit (e.g., % reduction in inhaled PM2.5 or reduced airway irritation).
   - "emissionImpact": Direct community/environmental impact (e.g., grams of PM2.5 or kg of CO2 prevented).
5. Keep numbers realistic (estimatedCo2SavedKgPerWeek between 0 and 25; estimatedPm25ExposureReductionPct between 2 and 45).
6. Provide 1 actionable "communityTip" they can share with neighbors or their residential society.
`;

  try {
    const response = await client.models.generateContent({
      model: getModelName(),
      contents: prompt,
      config: {
        temperature: 0.4,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            severitySummary: { type: Type.STRING },
            winterSmogInsight: { type: Type.STRING },
            dailyRoutines: { type: Type.ARRAY, items: actionItemSchema },
            indoorHacks: { type: Type.ARRAY, items: actionItemSchema },
            sustainableAlternatives: {
              type: Type.ARRAY,
              items: actionItemSchema,
            },
            communityTip: { type: Type.STRING },
          },
          required: [
            "severitySummary",
            "winterSmogInsight",
            "dailyRoutines",
            "indoorHacks",
            "sustainableAlternatives",
            "communityTip",
          ],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty Gemini response");
    const parsed = JSON.parse(text) as GeneratedActionPlan;
    return { plan: parsed, source: "gemini" };
  } catch (err) {
    console.error("[Gemini Plan Fallback Triggered]:", err);
    return { plan: buildFallbackPlan(profile, aqi), source: "fallback" };
  }
}

/**
 * Context-aware deterministic fallback reply when Gemini API is unavailable or rate-limited.
 */
export function buildFallbackChatReply(params: {
  message: string;
  city: string;
  usAqi: number;
  pm25: number;
  householdSummary?: string;
}): string {
  const query = params.message.toLowerCase();
  const { city, usAqi, pm25 } = params;

  // 1. Kids / Outdoor Exertion / Sports / Exercise
  if (
    /kid|child|infant|baby|school|outdoor|play|exercise|run|walk|jog|sport|gym|cycling/i.test(
      query
    )
  ) {
    if (usAqi > 150) {
      return `In ${city} today, US AQI is ${usAqi} (PM2.5: ${pm25} µg/m³), which is Unhealthy. Children have higher ventilation rates relative to body weight, meaning active outdoor play pulls high concentrations of fine soot deep into alveolar tissue. Strenuous outdoor exertion should be avoided or replaced with indoor activities in a filtered room until ground-level inversions dissipate.`;
    }
    if (usAqi > 100) {
      return `At US AQI ${usAqi} (PM2.5: ${pm25} µg/m³) in ${city}, sensitive groups including children and individuals with asthma should curtail prolonged or heavy exertion outdoors. If children do play outside, schedule it during mid-afternoon (14:00 - 16:00) when solar heating breaks nocturnal inversion layers, and avoid proximity to major roadways.`;
    }
    return `At US AQI ${usAqi} in ${city}, outdoor activity is generally acceptable. However, keep active play away from busy traffic corridors during morning and evening rush hours to avoid localized NO2 and fresh tailpipe soot spikes.`;
  }

  // 2. Window Sealing / Drafts / Room Sanctuary
  if (
    /seal|window|draft|door|apartment|leak|infiltrat|balcony|gap|weatherstrip/i.test(
      query
    )
  ) {
    return `To prevent outdoor smog infiltration in ${city} (AQI ${usAqi}): Apply self-adhesive EPDM or silicone weatherstripping tape along window sash perimeters and sliding doors. Place a rolled damp towel or silicone door sweep along exterior thresholds. Establish one primary bedroom as a sealed 'clean air sanctuary' with doors and windows closed, as this concentrates any indoor filtration efficiency where you spend 8 continuous breathing hours.`;
  }

  // 3. Mask / N95 / KF94 / Respirator Fit
  if (/mask|n95|kn95|kf94|cloth|surgical|wear|face/i.test(query)) {
    return `Standard surgical and cloth masks offer negligible protection against PM2.5, typically leaking 50–70% of fine soot through perimeter gaps. For reliable protection at AQI ${usAqi} in ${city}, use a certified N95, KN95, or KF94 respirator. Ensure the metal nose clip is crimped firmly against the nasal bridge with both headstraps/earloops adjusted to achieve a tight seal without facial gaps.`;
  }

  // 4. Air Purifiers / HEPA / Corsi-Rosenthal / DIY Box Fan / Filtration
  if (
    /purifier|hepa|filter|corsi|box fan|rosenthal|merv|cleaning/i.test(
      query
    )
  ) {
    return `For indoor air filtration: A certified True HEPA purifier removes 99.97% of particles down to 0.3 microns. If commercial purifiers are cost-prohibitive, a DIY Corsi-Rosenthal box built using a standard 20-inch box fan and MERV 13 furnace filters delivers comparable Clean Air Delivery Rates (CADR) at a fraction of the cost. Keep filters running continuously on low-medium speed in sealed living areas.`;
  }

  // 5. Ventilation / Fresh Air / Timing
  if (/ventilat|fresh air|open|airing|inversion|time|window/i.test(query)) {
    return `In ${city}, never open windows during early morning (05:00 - 09:00) or late evening (20:00 - 02:00) when surface cooling creates nocturnal temperature inversions that trap soot near the ground. The optimal time for brief 10–15 minute cross-ventilation is typically 14:00–16:00 when solar convective heating mixes the atmospheric boundary layer.`;
  }

  // 6. Commute / Vehicles / Driving
  if (
    /commute|traffic|car|metro|bus|transit|drive|bike|motorcycle|scooter/i.test(
      query
    )
  ) {
    return `When commuting during high smog in ${city} (AQI ${usAqi}): In cars, switch HVAC to internal air recirculation mode to block intake of roadway particulate plumes. If commuting by two-wheeler, bicycle, or walking, always wear a snug N95/KF94 mask, and consider shifting travel times away from peak congestion hours.`;
  }

  // 7. General Environmental Health Advisory
  return `In ${city} with US AQI at ${usAqi} (PM2.5: ${pm25} µg/m³), prioritize three core defenses: 1) Keep windows sealed during morning and evening inversion hours; 2) Damp-mop hard floors rather than dry sweeping to prevent resuspended PM10 spikes; and 3) Use an authentic N95 respirator whenever traveling outdoors. ${
    params.householdSummary
      ? `Given your household context (${params.householdSummary}), minimizing indoor infiltration is especially crucial.`
      : ""
  }`;
}

/**
 * Generates an environmental health consultation reply using Gemini 2.5 Flash,
 * with conversational context awareness, strict scope enforcement, and offline fallback.
 *
 * @param params - User question, telemetry metrics (city, AQI, PM2.5), and conversation history
 * @returns Object containing the assistant reply string and whether fallback was used
 */
export async function generateSmogChatReply(params: {
  message: string;
  city: string;
  usAqi: number;
  pm25: number;
  householdSummary?: string;
  history?: Array<{ role: string; content: string }>;
}): Promise<{ reply: string; fallback?: boolean }> {
  const client = getGeminiClient();
  if (!client) {
    return {
      reply: buildFallbackChatReply(params),
      fallback: true,
    };
  }

  const systemInstruction = `You are SmogShield Environmental Health Assistant, an expert in urban atmospheric aerosols, winter temperature inversions, and particulate exposure mitigation.
STRICT SCOPE & SAFETY RULES:
- Only answer questions related to air quality, particulate matter (PM2.5/PM10), smog, indoor air filtration, ventilation timing, mask standards, and low-emission lifestyle choices.
- If the user asks off-topic questions, politely decline and refocus on environmental air quality and smog protection.
- Never provide clinical medical diagnosis or prescribe medications; recommend emergency medical care for acute respiratory distress.
- Keep responses practical, concise (under 130 words), scientifically grounded, and tailored to the user's specific city and live AQI levels.`;

  try {
    // Build multi-turn content array formatted for @google/genai
    // Roles MUST strictly be 'user' or 'model' (never 'assistant')
    // First message MUST have role 'user'
    const contents: Array<{
      role: "user" | "model";
      parts: Array<{ text: string }>;
    }> = [];

    if (params.history && params.history.length > 0) {
      for (const item of params.history) {
        if (!item.content?.trim()) continue;
        const role: "user" | "model" =
          item.role === "assistant" || item.role === "model" ? "model" : "user";

        // Gemini requires the first turn in contents to be from 'user'
        if (contents.length === 0 && role === "model") {
          continue; // Strip initial client-side greeting
        }

        contents.push({
          role,
          parts: [{ text: item.content.trim() }],
        });
      }
    }

    const contextualUserPrompt = `
<CONTEXT>
City: ${params.city} | Live US AQI: ${params.usAqi} | PM2.5: ${params.pm25} µg/m³
Household Context: ${params.householdSummary || "Standard household baseline"}
</CONTEXT>
<USER_QUESTION>
${params.message.trim()}
</USER_QUESTION>
`.trim();

    contents.push({
      role: "user",
      parts: [{ text: contextualUserPrompt }],
    });

    const response = await client.models.generateContent({
      model: getModelName(),
      contents,
      config: {
        systemInstruction,
        temperature: 0.4,
        maxOutputTokens: 350,
      },
    });

    const text = response.text?.trim();
    if (!text) {
      throw new Error("Empty text returned from Gemini API");
    }

    return { reply: text, fallback: false };
  } catch (err) {
    console.error("[SmogCoach API Error]", err);
    return {
      reply: buildFallbackChatReply(params),
      fallback: true,
    };
  }
}

function buildFallbackPlan(
  profile: HouseholdProfile,
  aqi: AqiSnapshot
): GeneratedActionPlan {
  return {
    severitySummary: `${profile.city} is currently experiencing ${aqi.category} air quality (US AQI ${aqi.usAqi}, PM2.5 ${aqi.pm25} ug/m3). Tailored precautions are recommended for your household.`,
    winterSmogInsight: `Winter temperature inversions trap vehicle exhaust and dust close to the ground overnight. Avoid outdoor exertion around ${aqi.peakSmogWindow} and schedule ventilation near ${aqi.safestWindow}.`,
    dailyRoutines: [
      {
        id: "r1",
        title: "Time-Shift Outdoor Errands & Ventilation",
        timingOrFrequency: aqi.safestWindow,
        description: `Cross-ventilate your home for 15 minutes during ${aqi.safestWindow} and keep windows sealed during ${aqi.peakSmogWindow}.`,
        healthImpact:
          "Cuts indoor fine-particle infiltration during peak inversion hours by up to 30%.",
        emissionImpact:
          "Reduces unnecessary AC/purifier runtime, saving household electricity emissions.",
        estimatedCo2SavedKgPerWeek: 1.5,
        estimatedPm25ExposureReductionPct: 25,
        difficulty: "Easy",
      },
      {
        id: "r2",
        title: "Smog-Safe Commute & N95 Protocol",
        timingOrFrequency: "Daily commute",
        description:
          "Keep vehicle windows rolled up with AC on recirculation mode, or wear a well-fitted N95/KF94 respirator when outdoors.",
        healthImpact:
          "Filters over 90% of hazardous PM2.5 particles before they reach deep lung tissue.",
        emissionImpact:
          "Combining errands into a single trip reduces cold-start tailpipe emissions.",
        estimatedCo2SavedKgPerWeek: 3.0,
        estimatedPm25ExposureReductionPct: 35,
        difficulty: "Easy",
      },
      {
        id: "r3",
        title: "Zero-Dust Evening Reset",
        timingOrFrequency: "Every evening",
        description:
          "Leave outdoor shoes at the entrance, change outer layers after returning home, and rinse eyes/nose with saline if irritated.",
        healthImpact:
          "Prevents tracked-in heavy metals and PM10 road dust from resuspending indoors.",
        emissionImpact:
          "Zero-energy habit that keeps indoor air cleaner without chemical sprays.",
        estimatedCo2SavedKgPerWeek: 0.5,
        estimatedPm25ExposureReductionPct: 10,
        difficulty: "Easy",
      },
    ],
    indoorHacks: [
      {
        id: "i1",
        title: "Switch from Dry Sweeping to Damp Mopping",
        timingOrFrequency: "Daily cleaning",
        description:
          "Use a damp microfiber cloth or wet mop instead of dry brooms or feather dusters, which kick settled PM10 back into breathing zones.",
        healthImpact:
          "Eliminates indoor dust spikes that trigger coughing and asthma flare-ups.",
        emissionImpact:
          "Replaces electric vacuuming and aerosol cleaners with a zero-emission routine.",
        estimatedCo2SavedKgPerWeek: 0.8,
        estimatedPm25ExposureReductionPct: 15,
        difficulty: "Easy",
      },
      {
        id: "i2",
        title: profile.hasAirPurifier
          ? "Create a Sealed Clean-Air Bedroom Zone"
          : "Build a Low-Cost DIY Box-Fan Filter (Corsi-Rosenthal)",
        timingOrFrequency: "Nighttime / High-smog days",
        description: profile.hasAirPurifier
          ? "Close bedroom doors, seal bottom gaps with a damp towel, and run your HEPA purifier on medium 1 hour before sleep."
          : "Tape a MERV-13 HVAC filter securely to the intake side of a standard box fan to create an affordable high-CADR air cleaner.",
        healthImpact:
          "Lowers overnight sleeping PM2.5 exposure by 40-60%, giving lungs 8 hours of recovery.",
        emissionImpact:
          "Uses less than 45W of power—far cleaner and cheaper than whole-home HVAC filtration.",
        estimatedCo2SavedKgPerWeek: 1.0,
        estimatedPm25ExposureReductionPct: 35,
        difficulty: "Medium",
      },
      {
        id: "i3",
        title: "Capture Cooking Fumes at the Source",
        timingOrFrequency: "Every meal",
        description:
          "Always run the kitchen exhaust chimney/fan while cooking, cover pots with lids, and avoid burning incense or scented candles during smog alerts.",
        healthImpact:
          "Prevents indoor NO2 and ultrafine particle spikes that often exceed outdoor smog levels.",
        emissionImpact:
          "Cooking with lids reduces cooking gas/electricity consumption by up to 25%.",
        estimatedCo2SavedKgPerWeek: 2.2,
        estimatedPm25ExposureReductionPct: 20,
        difficulty: "Easy",
      },
    ],
    sustainableAlternatives: [
      {
        id: "s1",
        title: "Replace 2 Solo Trips/Week with Transit or Carpool",
        timingOrFrequency: "2+ days per week",
        description:
          "Coordinate a neighborhood carpool or use metro/bus for regular work or school runs during peak winter smog months.",
        healthImpact:
          "Directly lowers local street-level NO2 and diesel particulate concentrations.",
        emissionImpact:
          "Saves ~8-12 kg of CO2 and significant tailpipe PM2.5 every single week.",
        estimatedCo2SavedKgPerWeek: 10.0,
        estimatedPm25ExposureReductionPct: 8,
        difficulty: "Medium",
      },
      {
        id: "s2",
        title: "Eliminate Engine Idling & Check Tire Pressure",
        timingOrFrequency: "Every drive",
        description:
          "Turn off your engine at traffic lights longer than 30 seconds and keep tires inflated to manufacturer specs.",
        healthImpact:
          "Cuts concentrated exhaust fumes around schools, intersections, and pedestrians.",
        emissionImpact:
          "Improves fuel efficiency by 5-8%, cutting ~3.5 kg of CO2 per week.",
        estimatedCo2SavedKgPerWeek: 3.5,
        estimatedPm25ExposureReductionPct: 5,
        difficulty: "Easy",
      },
      {
        id: "s3",
        title: "Shift One Daily Meal to Electric Induction / No-Smoke Prep",
        timingOrFrequency: "Daily",
        description:
          "Use an induction cooktop, electric kettle, or pressure cooker instead of open-flame simmering to cut indoor NO2 and fossil fuel use.",
        healthImpact:
          "Reduces indoor nitrogen dioxide exposure linked to pediatric asthma.",
        emissionImpact:
          "Induction transfers ~84% of energy directly to food vs ~40% for gas flames.",
        estimatedCo2SavedKgPerWeek: 2.5,
        estimatedPm25ExposureReductionPct: 12,
        difficulty: "Medium",
      },
    ],
    communityTip: `Share today's safest outdoor window (${aqi.safestWindow}) in your apartment or neighborhood WhatsApp group, and organize a no-idling zone outside local school gates.`,
  };
}
