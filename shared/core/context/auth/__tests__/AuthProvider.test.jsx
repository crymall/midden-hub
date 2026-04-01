import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AuthProvider from "../AuthProvider";
import AuthContext from "../AuthContext";
import * as iamApi from "../../../services/iamApi";

vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
  useLocation: vi.fn(),
}));

vi.mock("../../../services/iamApi", () => ({
  login: vi.fn(),
  verify2FA: vi.fn(),
  register: vi.fn(),
  verify: vi.fn(),
  logout: vi.fn(),
}));

describe("AuthProvider", () => {
  const mockNavigate = vi.fn();
  const mockLocation = { pathname: "/dashboard", state: { from: { pathname: "/dashboard" } } };

  beforeEach(() => {
    vi.resetAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useLocation.mockReturnValue(mockLocation);
    iamApi.verify.mockRejectedValue(new Error("Unauthorized"));
  });

  it("initializes with loading true then false", async () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useContext(AuthContext), { wrapper });
    
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("verifies user on initial load and sets user", async () => {
    const mockUser = { username: "verifiedUser" };
    iamApi.verify.mockResolvedValue({ user: mockUser });

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useContext(AuthContext), { wrapper });

    await waitFor(() => expect(result.current.user?.username).toBe("verifiedUser"));
    expect(iamApi.verify).toHaveBeenCalled();
  });

  it("sets user to null if verification fails", async () => {
    iamApi.verify.mockRejectedValue(new Error("Unauthorized"));

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useContext(AuthContext), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(iamApi.verify).toHaveBeenCalled();
  });

  it("handles login by calling iamApi.login", async () => {
    const loginResponse = { userId: "123", message: "2FA required" };
    iamApi.login.mockResolvedValue(loginResponse);

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useContext(AuthContext), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    let response;
    await act(async () => {
      response = await result.current.login("testuser", "password");
    });

    expect(iamApi.login).toHaveBeenCalledWith("testuser", "password");
    expect(response).toEqual(loginResponse);
    expect(result.current.user).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("handles verifyLogin (2FA) success", async () => {
    const mockUser = { username: "verifiedUser" };
    iamApi.verify2FA.mockResolvedValue({ user: mockUser });

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useContext(AuthContext), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.verifyLogin("user1", "123456", true);
    });

    expect(iamApi.verify2FA).toHaveBeenCalledWith("user1", "123456", true);
    expect(result.current.user?.username).toBe("verifiedUser");
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });

  it("handles logout", async () => {
    const mockUser = { username: "userToLogout" };
    iamApi.verify.mockResolvedValue({ user: mockUser });

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useContext(AuthContext), { wrapper });

    await waitFor(() => expect(result.current.user?.username).toBe("userToLogout"));

    await act(async () => {
      result.current.logout();
    });

    expect(iamApi.logout).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });
  
  it("handles register", async () => {
    iamApi.register.mockResolvedValue({ success: true });
    
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useContext(AuthContext), { wrapper });
    
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.register("newuser", "email@test.com", "password");
    });
    
    expect(iamApi.register).toHaveBeenCalledWith("newuser", "email@test.com", "password");
  });
});
