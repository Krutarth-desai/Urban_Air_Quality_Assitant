import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProfileForm } from "../components/ProfileForm";
import { AqiDashboard } from "../components/AqiDashboard";
import { ActionPlanView } from "../components/ActionPlanView";
import { SmogCoachChat } from "../components/SmogCoachChat";
import type { HouseholdProfile } from "../lib/schemas";
import type { AirQualityReport, GeneratedActionPlan } from "@/types/smogshield";

describe("ProfileForm Component", () => {
  const mockProfile: HouseholdProfile = {
    city: "New Delhi",
    latitude: 28.6139,
    longitude: 77.209,
    householdMembers: ["infants_kids"],
    commuteMode: "public_transit",
    homeType: "apartment_highrise",
    hasAirPurifier: false,
    cookingFuel: "lpg_gas",
  };

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders accessible landmarks, field groups, and headings", () => {
    render(
      <ProfileForm
        profile={mockProfile}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        loading={false}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Household Parameters" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Household resident vulnerabilities" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Primary commute mode" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Housing building structure" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "HEPA air purifier availability" })
    ).toBeInTheDocument();
  });

  it("exposes correct aria-pressed states and toggles resident vulnerabilities", () => {
    const handleChange = vi.fn();
    render(
      <ProfileForm
        profile={mockProfile}
        onChange={handleChange}
        onSubmit={vi.fn()}
        loading={false}
      />
    );

    const infantsBtn = screen.getByRole("button", {
      name: /Infants \/ Children/i,
    });
    const elderlyBtn = screen.getByRole("button", {
      name: /Elderly \(65\+\)/i,
    });

    // Selected member has aria-pressed="true", unselected has aria-pressed="false"
    expect(infantsBtn).toHaveAttribute("aria-pressed", "true");
    expect(elderlyBtn).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(elderlyBtn);
    expect(handleChange).toHaveBeenCalled();
    const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1][0] as HouseholdProfile;
    expect(lastCall.householdMembers).toContain("elderly");
    expect(lastCall.householdMembers).toContain("infants_kids");
  });

  it("exposes aria-pressed states across commute mode options", () => {
    const handleChange = vi.fn();
    render(
      <ProfileForm
        profile={mockProfile}
        onChange={handleChange}
        onSubmit={vi.fn()}
        loading={false}
      />
    );

    const transitBtn = screen.getByRole("button", { name: "Transit" });
    const carBtn = screen.getByRole("button", { name: "Car" });

    expect(transitBtn).toHaveAttribute("aria-pressed", "true");
    expect(carBtn).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(carBtn);
    expect(handleChange).toHaveBeenCalled();
    const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1][0] as HouseholdProfile;
    expect(lastCall.commuteMode).toBe("private_car");
  });

  it("indicates aria-busy when asynchronous plan calibration is active", () => {
    const { container } = render(
      <ProfileForm
        profile={mockProfile}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        loading={true}
      />
    );

    const rootCard = container.firstChild as HTMLElement;
    expect(rootCard).toHaveAttribute("aria-busy", "true");

    const submitBtn = screen.getByRole("button", {
      name: /Calibrating Forecast.../i,
    });
    expect(submitBtn).toHaveAttribute("aria-busy", "true");
    expect(submitBtn).toBeDisabled();
  });

  it("calls onSubmit when clicking the update routine button", () => {
    const handleSubmit = vi.fn();
    render(
      <ProfileForm
        profile={mockProfile}
        onChange={vi.fn()}
        onSubmit={handleSubmit}
        loading={false}
      />
    );

    const submitBtn = screen.getByRole("button", {
      name: /Update Routine & Forecast/i,
    });
    fireEvent.click(submitBtn);
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });
});

describe("AqiDashboard Component", () => {
  const mockReport: AirQualityReport = {
    usAqi: 185,
    pm25: 121.4,
    pm10: 175.2,
    no2: 44.8,
    o3: 21.0,
    category: "Unhealthy",
    colorToken: "red",
    safestWindow: "14:00 - 16:00",
    peakSmogWindow: "06:00 - 09:00",
    hourlyForecast: [
      { time: "2026-11-22T00:00", pm25: 110, usAqi: 170, hourLabel: "00:00" },
      { time: "2026-11-22T06:00", pm25: 160, usAqi: 210, hourLabel: "06:00" },
      { time: "2026-11-22T14:00", pm25: 45, usAqi: 110, hourLabel: "14:00" },
    ],
    updatedAt: "2026-11-22T20:00:00Z",
  };

  it("renders city telemetry, AQI score, and severity badge with live region", () => {
    render(
      <AqiDashboard
        cityName="New Delhi"
        report={mockReport}
        loading={false}
        onSelectCity={vi.fn()}
        onUseMyLocation={vi.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: "New Delhi" })).toBeInTheDocument();
    expect(screen.getByText("185")).toBeInTheDocument();
    expect(screen.getByText("Unhealthy")).toBeInTheDocument();
    expect(screen.getByText("Safest Ventilation Window")).toBeInTheDocument();
    expect(screen.getByText("14:00 - 16:00")).toBeInTheDocument();
  });

  it("renders accessible controls for geolocation and preset city switching", () => {
    const handleSelectCity = vi.fn();
    const handleUseMyLocation = vi.fn();

    render(
      <AqiDashboard
        cityName="New Delhi"
        report={mockReport}
        loading={false}
        onSelectCity={handleSelectCity}
        onUseMyLocation={handleUseMyLocation}
      />
    );

    const myLocBtn = screen.getByRole("button", {
      name: /Detect air quality using my current location/i,
    });
    expect(myLocBtn).toBeInTheDocument();
    fireEvent.click(myLocBtn);
    expect(handleUseMyLocation).toHaveBeenCalledTimes(1);

    const puneButton = screen.getByRole("button", { name: "Pune" });
    expect(puneButton).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(puneButton);
    expect(handleSelectCity).toHaveBeenCalledTimes(1);
    expect(handleSelectCity.mock.calls[0][0].name).toBe("Pune");
  });
});

describe("ActionPlanView Component", () => {
  const mockPlan: GeneratedActionPlan = {
    severitySummary: "High winter particulate levels require strict indoor isolation.",
    winterSmogInsight: "Thermal inversion traps smoke particles in ground boundary.",
    dailyRoutines: [
      {
        id: "r1",
        title: "Morning Routine: Postpone Outdoor Exertion",
        timingOrFrequency: "06:00 - 09:00",
        description: "Avoid peak morning particle spike during thermal stagnation.",
        healthImpact: "Cuts inhaled combustion particles into deep lung alveoli.",
        emissionImpact: "Zero motorized transit.",
        estimatedCo2SavedKgPerWeek: 2.0,
        estimatedPm25ExposureReductionPct: 20,
        difficulty: "Easy",
      },
      {
        id: "r2",
        title: "Midday Window: Filtered Ventilation",
        timingOrFrequency: "14:00 - 16:00",
        description: "Ventilate when boundary layer rises.",
        healthImpact: "Flushes indoor CO2 buildup without excessive fine soot.",
        emissionImpact: "Saves purifier motor energy.",
        estimatedCo2SavedKgPerWeek: 1.5,
        estimatedPm25ExposureReductionPct: 15,
        difficulty: "Medium",
      },
    ],
    indoorHacks: [
      {
        id: "i1",
        title: "DIY Corsi-Rosenthal Box Air Purifier",
        timingOrFrequency: "Continuous operation",
        description: "High CADR filtration using MERV-13 filters and box fan.",
        healthImpact: "Removes 80%+ of fine airborne PM2.5 in sealed rooms.",
        emissionImpact: "Low embodied carbon vs new appliance manufacturing.",
        estimatedCo2SavedKgPerWeek: 3.0,
        estimatedPm25ExposureReductionPct: 35,
        difficulty: "Easy",
      },
    ],
    sustainableAlternatives: [
      {
        id: "s1",
        title: "Induction Cooking Alternative",
        timingOrFrequency: "All meal preparation",
        description: "Eliminate unvented gas combustion fumes.",
        healthImpact: "Prevents bronchial irritation from NO2 byproduct.",
        emissionImpact: "Direct fossil fuel reduction.",
        estimatedCo2SavedKgPerWeek: 4.0,
        estimatedPm25ExposureReductionPct: 15,
        difficulty: "Medium",
      },
    ],
    communityActions: [
      {
        id: "c1",
        title: "Neighborhood School Anti-Idling Zone",
        timingOrFrequency: "07:30 - 08:30",
        description: "Enforce 1-minute engine shutoff at school drop-off gates.",
        healthImpact: "Protects children from concentrated ground-level diesel soot.",
        emissionImpact: "Prevents localized cold-start vehicular emissions.",
        estimatedCo2SavedKgPerWeek: 5.0,
        estimatedPm25ExposureReductionPct: 20,
        difficulty: "Easy",
      },
    ],
    communityTip: "Share inversion advisory with your apartment RWA board.",
  };

  it("renders tablist with 4 core pillars and updates ImpactMeter when committing to actions", () => {
    render(
      <ActionPlanView
        plan={mockPlan}
        cityName="New Delhi"
        usAqi={190}
        safestWindow="14:00 - 16:00"
      />
    );

    // Verify accessible tablist
    expect(
      screen.getByRole("tablist", { name: "Action plan category pillars" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /Low-Emission Routines/i })
    ).toHaveAttribute("aria-selected", "true");

    // Verify initial commitments count
    const meterReadout = screen.getByText(/commitments active/i);
    expect(meterReadout).toBeInTheDocument();

    // r1 is initially committed, r2 is not
    const r1Checkbox = screen.getByRole("checkbox", {
      name: /Commit to action: Morning Routine: Postpone Outdoor Exertion/i,
    });
    const r2Checkbox = screen.getByRole("checkbox", {
      name: /Commit to action: Midday Window: Filtered Ventilation/i,
    });

    expect(r1Checkbox).toHaveAttribute("aria-checked", "true");
    expect(r2Checkbox).toHaveAttribute("aria-checked", "false");

    // Toggle r2 to committed
    fireEvent.click(r2Checkbox);
    expect(r2Checkbox).toHaveAttribute("aria-checked", "true");

    // Impact meter displays updated active commitments
    expect(screen.getByText(/4 of 5 commitments active/i)).toBeInTheDocument();
  });
});

describe("SmogCoachChat Component", () => {
  it("renders role='alert' when chat consultation encounter an error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    // Mock fetch failure
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: "Consultation endpoint unavailable" }),
        { status: 500 }
      )
    );

    render(
      <SmogCoachChat
        city="New Delhi"
        usAqi={180}
        pm25={120}
        householdSummary="Infants, High-Rise"
      />
    );

    const input = screen.getByPlaceholderText(/Ask regarding ventilation/i);
    fireEvent.change(input, {
      target: { value: "Is it safe to open windows now?" },
    });

    const sendBtn = screen.getByRole("button", {
      name: /Send consultation query/i,
    });
    fireEvent.click(sendBtn);

    const alertElement = await screen.findByRole("alert");
    expect(alertElement).toBeInTheDocument();
    expect(alertElement).toHaveTextContent("Consultation endpoint unavailable");
  });
});
