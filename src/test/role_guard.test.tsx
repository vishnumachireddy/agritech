import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import RoleGuard from "@/components/RoleGuard";

// Mock useAuth hook
import * as useAuthModule from "@/hooks/useAuth";

describe("RoleGuard Component", () => {
  it("renders children when user role matches allowedRole", () => {
    // Mock user authenticated as farmer
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: { id: "test-farmer-1", full_name: "Test Farmer", role: "farmer" },
      role: "farmer",
      token: "mock-jwt-token",
      loading: false,
      login: () => {},
      signOut: async () => {},
      refreshProfile: async () => {}
    });

    render(
      <MemoryRouter>
        <RoleGuard allowedRole="farmer">
          <div data-testid="farmer-content">Farmer Dashboard Content</div>
        </RoleGuard>
      </MemoryRouter>
    );

    expect(screen.getByTestId("farmer-content")).toBeInTheDocument();
  });
});
