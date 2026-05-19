import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ProtectedRoute from "../ProtectedRoute";

const { navigateMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(({ to }: { to: string }) => <div data-testid="navigate">{to}</div>),
}));

vi.mock("react-router-dom", () => ({
  Navigate: navigateMock,
}));

describe("ProtectedRoute", () => {
  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("redirects guests to login", () => {
    render(
      <ProtectedRoute>
        <div>private content</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId("navigate")).toHaveTextContent("/");
    expect(navigateMock).toHaveBeenCalledWith(expect.objectContaining({ to: "/", replace: true }), undefined);
  });

  it("renders children when logged in and role is allowed", () => {
    localStorage.setItem("role", "manager");

    render(
      <ProtectedRoute requiredRole={["manager", "assistant manager"]}>
        <div>manager content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText("manager content")).toBeInTheDocument();
    expect(screen.queryByTestId("navigate")).not.toBeInTheDocument();
  });

  it("redirects logged-in users to their own dashboard when role is not allowed", () => {
    localStorage.setItem("role", "lead");

    render(
      <ProtectedRoute requiredRole="admin">
        <div>admin content</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId("navigate")).toHaveTextContent("/lead");
    expect(screen.queryByText("admin content")).not.toBeInTheDocument();
  });
});
