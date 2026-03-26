import { describe, it, expect, vi, beforeEach } from "vitest";
import * as api from "../iamApi";

const { mockGet, mockPost, mockPatch, mockDelete, mockUse } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPatch: vi.fn(),
  mockDelete: vi.fn(),
  mockUse: vi.fn(),
}));

vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => ({
      get: mockGet,
      post: mockPost,
      patch: mockPatch,
      delete: mockDelete,
      interceptors: {
        request: { use: mockUse },
      },
    })),
  },
}));

describe("iamApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: {} });
    mockPost.mockResolvedValue({ data: {} });
    mockPatch.mockResolvedValue({ data: {} });
    mockDelete.mockResolvedValue({ data: {} });
  });

  describe("Interceptors", () => {
    it("adds Authorization header when token is present", async () => {
      vi.resetModules();
      await import("../iamApi");

      const interceptor = mockUse.mock.calls[0][0];
      const config = { headers: {} };
      
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('test-token');
      
      const result = interceptor(config);
      expect(result.headers.Authorization).toBe('Bearer test-token');
    });

    it("does not add Authorization header when token is missing", async () => {
      vi.resetModules();
      await import("../iamApi");

      const interceptor = mockUse.mock.calls[0][0];
      const config = { headers: {} };
      
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
      
      const result = interceptor(config);
      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  describe("Auth", () => {
    it("login calls post with credentials", async () => {
      await api.login("user", "pass");
      expect(mockPost).toHaveBeenCalledWith("/login", { username: "user", password: "pass" });
    });

    it("verify2FA calls post with code", async () => {
      await api.verify2FA("u1", "123456");
      expect(mockPost).toHaveBeenCalledWith("/verify-2fa", { userId: "u1", code: "123456" });
    });

    it("register calls post with user details", async () => {
      await api.register("user", "email@test.com", "pass");
      expect(mockPost).toHaveBeenCalledWith("/register", { username: "user", email: "email@test.com", password: "pass" });
    });
  });

  describe("Users", () => {
    it("fetchUsers calls get", async () => {
      await api.fetchUsers();
      expect(mockGet).toHaveBeenCalledWith("/users");
    });

    it("updateUserRole calls patch", async () => {
      await api.updateUserRole("u1", "admin");
      expect(mockPatch).toHaveBeenCalledWith("/users/u1/role", { roleId: "admin" });
    });

    it("deleteUser calls delete", async () => {
      await api.deleteUser("u1");
      expect(mockDelete).toHaveBeenCalledWith("/users/u1");
    });
  });
});