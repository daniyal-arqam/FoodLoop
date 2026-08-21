import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginPage } from "./LoginPage.jsx";
import { ToastProvider } from "../context/ToastContext.jsx";
import { USER_ROLES } from "../utils/constants.js";

const login = vi.fn();

vi.mock("../hooks/useAuth.js", () => ({
  useAuth: () => ({ login, loginWithGoogle: vi.fn() }),
}));

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/provider/dashboard" element={<p>provider-home</p>} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    login.mockReset();
  });

  it("signs in and sends a Provider to the dashboard", async () => {
    login.mockResolvedValue({ id: "p1", role: USER_ROLES.PROVIDER, name: "Ayesha" });
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText("Email"), "ayesha@example.com");
    await user.type(screen.getByLabelText("Password"), "Password1");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(login).toHaveBeenCalledWith({ email: "ayesha@example.com", password: "Password1" });
    expect(await screen.findByText("provider-home")).toBeInTheDocument();
  });

  it("shows invalid credential errors from the API", async () => {
    login.mockRejectedValue(new Error("Invalid email or password"));
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText("Email"), "ayesha@example.com");
    await user.type(screen.getByLabelText("Password"), "WrongPass1");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
  });
});
