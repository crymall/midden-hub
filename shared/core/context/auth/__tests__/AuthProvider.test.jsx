import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import AuthProvider from "../AuthProvider";
import AuthContext from "../AuthContext";
import * as iamApi from "../../../services/iamApi";

vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
  useLocation: vi.fn(),
}));

vi.mock("jwt-decode", () => ({
  jwtDecode: vi.fn(),
}));

vi.mock("../../../services/iamApi", () => ({
  login: vi.fn(),
  verify2FA: vi.fn(),
  register: vi.fn(),
}));

describe("AuthProvider", () => {
  const mockNavigate = vi.fn();
  const mockLocation = { pathname: "/dashboard", state: { from: { pathname: "/dashboard" } } };

  beforeEach(() => {
    vi.resetAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useLocation.mockReturnValue(mockLocation);
    
    iamApi.login.mockResolvedValue({});

    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });
  });

  it("initializes with loading true then false", async () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useContext(AuthContext), { wrapper });
    
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("loads user from valid token in localStorage", async () => {
    const token = "valid-token";
    const decoded = { username: "storedUser", exp: Date.now() / 1000 + 1000 };
    
    window.localStorage.getItem.mockReturnValue(token);
    jwtDecode.mockReturnValue(decoded);

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useContext(AuthContext), { wrapper });

    await waitFor(() => expect(result.current.user?.username).toBe("storedUser"));
    expect(window.localStorage.setItem).toHaveBeenCalledWith("token", token);
  });

  it("removes expired token from localStorage", async () => {
    const token = "expired-token";
    const decoded = { username: "expiredUser", exp: Date.now() / 1000 - 1000 };
    
    window.localStorage.getItem.mockReturnValue(token);
    jwtDecode.mockReturnValue(decoded);

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useContext(AuthContext), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(window.localStorage.removeItem).toHaveBeenCalledWith("token");
  });

  it("handles login success", async () => {
    const token = "new-token";
    const decoded = { username: "loggedInUser", exp: Date.now() / 1000 + 1000 };
    
    iamApi.login.mockResolvedValue({ token });
    jwtDecode.mockReturnValue(decoded);

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useContext(AuthContext), { wrapper });

    await act(async () => {
      await result.current.login("testuser", "password");
    });

    expect(iamApi.login).toHaveBeenCalledWith("testuser", "password");
    expect(jwtDecode).toHaveBeenCalledWith(token);
    expect(window.localStorage.setItem).toHaveBeenCalledWith("token", token);
    expect(result.current.user?.username).toBe("loggedInUser");
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });

  it("handles verifyLogin (2FA) success", async () => {
    const token = "2fa-token";
    const decoded = { username: "verifiedUser", exp: Date.now() / 1000 + 1000 };
    
    iamApi.verify2FA.mockResolvedValue({ token });
    jwtDecode.mockReturnValue(decoded);

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useContext(AuthContext), { wrapper });

    await act(async () => {
      await result.current.verifyLogin("123", "123456");
    });

    expect(iamApi.verify2FA).toHaveBeenCalledWith("123", "123456");
    expect(window.localStorage.setItem).toHaveBeenCalledWith("token", token);
    expect(result.current.user?.username).toBe("verifiedUser");
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });

  it("handles logout", async () => {
    const token = "valid-token";
    const decoded = { username: "userToLogout", exp: Date.now() / 1000 + 1000 };
    window.localStorage.getItem.mockReturnValue(token);
    jwtDecode.mockReturnValue(decoded);

    iamApi.login.mockResolvedValue({});

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useContext(AuthContext), { wrapper });

    await waitFor(() => expect(result.current.user?.username).toBe("userToLogout"));

    await act(async () => {
      result.current.logout();
    });

    expect(window.localStorage.removeItem).toHaveBeenCalledWith("token");
    expect(result.current.user).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalledWith("/login");
  });
  
  it("handles register", async () => {
    iamApi.register.mockResolvedValue({ success: true });
    
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useContext(AuthContext), { wrapper });
    
    await act(async () => {
      await result.current.register("newuser", "email@test.com", "password");
    });
    
    expect(iamApi.register).toHaveBeenCalledWith("newuser", "email@test.com", "password");
  });
});
