import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProfileForm } from "../components/ProfileForm";
import { AqiDashboard } from "../components/AqiDashboard";
import type { HouseholdProfile } from "../lib/schemas";
import type { AirQualityReport } from "../lib/air-quality";

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

  it("renders form sections and resident options", () => {
    render(
      <ProfileForm
        profile={mockProfile}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        loading={false}
      />
    );

    expect(screen.getByText("Household Parameters")).toBeInTheDocument();
    expect(screen.getByText("1. Resident Vulnerabilities")).toBeInTheDocument();
    expect(screen.getByText("Infants / Children")).toBeInTheDocument();
    expect(screen.getByText("Elderly (65+)")).toBeInTheDocument();
  });

  it("invokes onChange when toggling resident vulnerabilities", () => {
    const handleChange = vi.fn();
    render(
      <ProfileForm
        profile={mockProfile}
        onChange={handleChange}
        onSubmit={vi.fn()}
        loading={false}
      />
    );

    const elderlyButton = screen.getByText("Elderly (65+)").closest("button");
    expect(elderlyButton).not.toBeNull();
    if (elderlyButton) {
      fireEvent.click(elderlyButton);
      expect(handleChange).toHaveBeenCalled();
      const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1][0] as HouseholdProfile;
      expect(lastCall.householdMembers).toContain("elderly");
      expect(lastCall.householdMembers).toContain("infants_kids");
    }
  });

  it("invokes onChange when selecting a commute mode", () => {
    const handleChange = vi.fn();
    render(
      <ProfileForm
        profile={mockProfile}
        onChange={handleChange}
        onSubmit={vi.fn()}
        loading={false}
      />
    );

    const carButton = screen.getByTitle("Car");
    fireEvent.click(carButton);
    expect(handleChange).toHaveBeenCalled();
    const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1][0] as HouseholdProfile;
    expect(lastCall.commuteMode).toBe("private_car");
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

  it("renders city telemetry, AQI score, and severity badge", () => {
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

  it("renders pollutant breakdown cards with telemetry units", () => {
    render(
      <AqiDashboard
        cityName="New Delhi"
        report={mockReport}
        loading={false}
        onSelectCity={vi.fn()}
        onUseMyLocation={vi.fn()}
      />
    );

    expect(screen.getByText("PM2.5 (Fine)")).toBeInTheDocument();
    expect(screen.getByText("PM10 (Coarse)")).toBeInTheDocument();
    expect(screen.getByText("NO2 (Dioxide)")).toBeInTheDocument();
    expect(screen.getByText("O3 (Ozone)")).toBeInTheDocument();
  });

  it("fires onSelectCity when a preset demo hotspot button is clicked", () => {
    const handleSelectCity = vi.fn();
    render(
      <AqiDashboard
        cityName="New Delhi"
        report={mockReport}
        loading={false}
        onSelectCity={handleSelectCity}
        onUseMyLocation={vi.fn()}
      />
    );

    const puneButton = screen.getByRole("button", { name: "Pune" });
    fireEvent.click(puneButton);
    expect(handleSelectCity).toHaveBeenCalledTimes(1);
    expect(handleSelectCity.mock.calls[0][0].name).toBe("Pune");
  });
});
