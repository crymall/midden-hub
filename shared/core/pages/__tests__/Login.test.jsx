import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Login from "../Login";
import useAuth from "../../context/auth/useAuth";

vi.mock("../../context/auth/useAuth");

describe("Login Component", () => {
  const mockLogin = vi.fn();
  const mockVerifyLogin = vi.fn();
  const mockRegister = vi.fn();
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      login: mockLogin,
      verifyLogin: mockVerifyLogin,
      register: mockRegister,
      logout: mockLogout,
      user: null,
    });
  });

  it("renders login form by default", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^login$/i })).toBeInTheDocument();
  });

  it("switches to register mode", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const createAccountBtn = screen.getByRole("button", { name: /create account/i });
    await user.click(createAccountBtn);

    expect(screen.getByRole("heading", { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^register$/i })).toBeInTheDocument();
  });

  it("calls login function on form submission", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ token: "fake-token" });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/username/i), "testuser");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /^login$/i }));

    expect(mockLogin).toHaveBeenCalledWith("testuser", "password123");
  });

  it("transitions to 2FA mode when login requires it", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ userId: "123", message: "Enter code" });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/username/i), "testuser");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /^login$/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /2-factor verification/i })).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/remember this device/i)).toBeInTheDocument();
  });

  it("submits 2FA code with rememberMe checked", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ userId: "123", message: "Enter code" });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/username/i), "testuser");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /^login$/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /2-factor verification/i })).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/verification code/i), "123456");
    await user.click(screen.getByLabelText(/remember this device/i));
    await user.click(screen.getByRole("button", { name: /^verify$/i }));

    expect(mockVerifyLogin).toHaveBeenCalledWith("123", "123456", true);
  });

  it("submits 2FA code with rememberMe unchecked by default", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ userId: "123", message: "Enter code" });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/username/i), "testuser");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /^login$/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /2-factor verification/i })).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/verification code/i), "123456");
    await user.click(screen.getByRole("button", { name: /^verify$/i }));

    expect(mockVerifyLogin).toHaveBeenCalledWith("123", "123456", false);
  });

  it("displays error message on login failure", async () => {
    const user = userEvent.setup();
    const errorMsg = "Invalid credentials";
    mockLogin.mockRejectedValue({ response: { data: { error: errorMsg } } });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    await user.type(screen.getByLabelText(/username/i), "testuser");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /^login$/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMsg)).toBeInTheDocument();
    });
  });
});