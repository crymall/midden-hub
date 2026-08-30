import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as iamApi from "../../services/iamApi";
import { useAuth } from "../useAuth";
import { UserEnrichmentContext } from "../userEnrichment";

vi.mock("../../services/iamApi");

const iamUser = { id: 1, username: "testuser", role: "user", permissions: [] };

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

  const wrapperEnrichedWith = (enrichUser) =>
    function EnrichedWrapper({ children }) {
      return (
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <UserEnrichmentContext.Provider value={enrichUser}>
              {children}
            </UserEnrichmentContext.Provider>
          </MemoryRouter>
        </QueryClientProvider>
      );
    };

  it("should initialize with no user if verify fails", async () => {
    iamApi.verify.mockRejectedValue(new Error("Not authenticated"));

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.user).toBeUndefined();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("should initialize with the IAM user if verify succeeds", async () => {
    iamApi.verify.mockResolvedValue({ message: "Authenticated", user: iamUser });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.user).toEqual(iamUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("applies the enrichment from context to the verified user", async () => {
    iamApi.verify.mockResolvedValue({ message: "Authenticated", user: iamUser });
    const enrichUser = vi.fn(async (user) => ({ ...user, appScopedId: "abc" }));

    const { result } = renderHook(() => useAuth(), { wrapper: wrapperEnrichedWith(enrichUser) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(enrichUser).toHaveBeenCalledWith(iamUser);
    expect(result.current.user).toEqual({ ...iamUser, appScopedId: "abc" });
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

  it("verifyLogin mutation should set the currentUser cache", async () => {
    iamApi.verify.mockRejectedValue(new Error("Not authenticated"));
    iamApi.verify2FA.mockResolvedValue({ user: iamUser });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.verifyLogin({
        tempToken: "fake-temp-token",
        code: "123456",
        rememberMe: true,
      });
    });

    expect(iamApi.verify2FA).toHaveBeenCalledWith("fake-temp-token", "123456", true);
    expect(queryClient.getQueryData(["currentUser"])).toEqual(iamUser);
  });

  it("verifyLogin mutation should cache the enriched user", async () => {
    iamApi.verify.mockRejectedValue(new Error("Not authenticated"));
    iamApi.verify2FA.mockResolvedValue({ user: iamUser });
    const enrichUser = vi.fn(async (user) => ({ ...user, appScopedId: "abc" }));

    const { result } = renderHook(() => useAuth(), { wrapper: wrapperEnrichedWith(enrichUser) });

    await act(async () => {
      await result.current.verifyLogin({
        tempToken: "fake-temp-token",
        code: "123456",
        rememberMe: false,
      });
    });

    expect(enrichUser).toHaveBeenCalledWith(iamUser);
    expect(queryClient.getQueryData(["currentUser"])).toEqual({ ...iamUser, appScopedId: "abc" });
  });

  it("logout mutation should call iamApi.logout and clear cache", async () => {
    iamApi.verify.mockResolvedValue({ message: "Authenticated", user: iamUser });
    iamApi.logout.mockResolvedValue();

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(queryClient.getQueryData(["currentUser"])).toEqual(iamUser);

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
