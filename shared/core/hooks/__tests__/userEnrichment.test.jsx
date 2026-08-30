import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { UserEnrichmentContext, useUserEnrichment } from "../userEnrichment";

describe("useUserEnrichment", () => {
  const user = { id: 1, username: "testuser" };

  it("returns the user unchanged when no provider is present", () => {
    const { result } = renderHook(() => useUserEnrichment());

    expect(result.current(user)).toEqual(user);
  });

  it("returns the enrichment supplied by the nearest provider", () => {
    const enrichUser = (u) => ({ ...u, appScopedId: "abc" });
    const wrapper = ({ children }) => (
      <UserEnrichmentContext.Provider value={enrichUser}>{children}</UserEnrichmentContext.Provider>
    );

    const { result } = renderHook(() => useUserEnrichment(), { wrapper });

    expect(result.current(user)).toEqual({ ...user, appScopedId: "abc" });
  });
});
