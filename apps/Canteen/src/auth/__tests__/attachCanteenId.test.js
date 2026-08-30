import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchMe } from "@shared/core/services/canteenApi";

import { attachCanteenId } from "../attachCanteenId";

vi.mock("@shared/core/services/canteenApi");

describe("attachCanteenId", () => {
  const iamUser = { id: 1, username: "testuser", permissions: [] };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("attaches the Canteen user id to the IAM user", async () => {
    fetchMe.mockResolvedValue({ id: "canteen123" });

    await expect(attachCanteenId(iamUser)).resolves.toEqual({
      ...iamUser,
      canteenId: "canteen123",
    });
  });

  it("keeps the session alive with a null id when Canteen is unreachable", async () => {
    fetchMe.mockRejectedValue(new Error("Canteen down"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(attachCanteenId(iamUser)).resolves.toEqual({ ...iamUser, canteenId: null });
    expect(consoleSpy).toHaveBeenCalledWith("Failed to fetch Canteen user", expect.any(Error));

    consoleSpy.mockRestore();
  });
});
