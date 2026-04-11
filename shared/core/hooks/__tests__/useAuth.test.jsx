import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as canteenApi from "../../services/canteenApi";
import * as iamApi from "../../services/iamApi";
import { useAuth } from "../useAuth";

vi.mock("../../services/iamApi");
vi.mock("../../services/canteenApi");

describe("useAuth hook", () => {
  let queryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );

  it("should initialize with no user if verify fails", async () => {
    iamApi.verify.mockRejectedValue(new Error("Not authenticated"));

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.user).toBeUndefined();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("should initialize with user if verify succeeds", async () => {
    const mockVerifyResponse = {
      message: "Authenticated",
      user: { id: 1, username: "testuser", role: "user", permissions: [] },
    };
    iamApi.verify.mockResolvedValue(mockVerifyResponse);
    canteenApi.fetchMe.mockResolvedValue({ id: "canteen123" });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.user).toEqual({
      id: 1,
      username: "testuser",
      role: "user",
      permissions: [],
      canteenId: "canteen123",
    });
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("login mutation should call iamApi.login and return data without setting cache", async () => {
    iamApi.verify.mockRejectedValue(new Error("Not authenticated"));
    const mockLoginResponse = { user: { id: 1 }, require2FA: true };
    iamApi.login.mockResolvedValue(mockLoginResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    let response;
    await act(async () => {
      response = await result.current.login({
        username: "testuser",
        password: "password",
      });
    });

    expect(iamApi.login).toHaveBeenCalledWith("testuser", "password");
    expect(response).toEqual(mockLoginResponse);

    expect(queryClient.getQueryData(["currentUser"])).toBeUndefined();
  });

  it("verifyLogin mutation should fetch canteen data and set currentUser cache", async () => {
    iamApi.verify.mockRejectedValue(new Error("Not authenticated"));
    iamApi.verify2FA.mockResolvedValue({
      user: { id: 1, username: "testuser", role: "user", permissions: [] },
    });
    canteenApi.fetchMe.mockResolvedValue({ id: "canteen123" });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.verifyLogin({
        tempToken: "fake-temp-token",
        code: "123456",
        rememberMe: true,
      });
    });

    expect(iamApi.verify2FA).toHaveBeenCalledWith("fake-temp-token", "123456", true);
    expect(canteenApi.fetchMe).toHaveBeenCalled();

    // Now the cache should be set!
    const cachedUser = queryClient.getQueryData(["currentUser"]);
    expect(cachedUser).toEqual({
      id: 1,
      username: "testuser",
      role: "user",
      permissions: [],
      canteenId: "canteen123",
    });
  });

  it("verifyLogin mutation should gracefully handle canteenApi failure", async () => {
    iamApi.verify.mockRejectedValue(new Error("Not authenticated"));
    iamApi.verify2FA.mockResolvedValue({
      user: { id: 1, username: "testuser", role: "user", permissions: [] },
    });
    canteenApi.fetchMe.mockRejectedValue(new Error("Canteen down"));

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.verifyLogin({
        tempToken: "fake-temp-token",
        code: "123456",
        rememberMe: false,
      });
    });

    expect(iamApi.verify2FA).toHaveBeenCalledWith("fake-temp-token", "123456", false);
    expect(consoleSpy).toHaveBeenCalledWith("Failed to fetch Canteen user", expect.any(Error));

    const cachedUser = queryClient.getQueryData(["currentUser"]);
    expect(cachedUser).toEqual({
      id: 1,
      username: "testuser",
      role: "user",
      permissions: [],
      canteenId: null,
    });

    consoleSpy.mockRestore();
  });

  it("logout mutation should call iamApi.logout and clear cache", async () => {
    const mockVerifyResponse = {
      message: "Authenticated",
      user: { id: 1, username: "testuser", role: "user", permissions: [] },
    };
    iamApi.verify.mockResolvedValue(mockVerifyResponse);
    canteenApi.fetchMe.mockResolvedValue({ id: "canteen123" });
    iamApi.logout.mockResolvedValue();

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(queryClient.getQueryData(["currentUser"])).toEqual({
      id: 1,
      username: "testuser",
      role: "user",
      permissions: [],
      canteenId: "canteen123",
    });

    iamApi.verify.mockRejectedValue(new Error("Not authenticated"));

    await act(async () => {
      await result.current.logout();
    });

    await waitFor(() => {
      expect(iamApi.logout).toHaveBeenCalled();
      expect(queryClient.getQueryData(["currentUser"])).toBeUndefined();
    });
  });
});
