import { describe, it, expect, vi, beforeEach } from "vitest";
import * as api from "../canteenApi";

const { mockGet, mockPost, mockPut, mockDelete, mockPatch, mockUse } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPut: vi.fn(),
  mockDelete: vi.fn(),
  mockPatch: vi.fn(),
  mockUse: vi.fn(),
}));

vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => ({
      get: mockGet,
      post: mockPost,
      put: mockPut,
      delete: mockDelete,
      patch: mockPatch,
      interceptors: {
        request: { use: mockUse },
      },
    })),
  },
}));

describe("canteenApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: {} });
    mockPost.mockResolvedValue({ data: {} });
    mockPut.mockResolvedValue({ data: {} });
    mockDelete.mockResolvedValue({ data: {} });
    mockPatch.mockResolvedValue({ data: {} });
  });

  describe("Recipes", () => {
    it("fetchRecipes calls get with correct params", async () => {
      await api.fetchRecipes(10, 5, ['tag1'], ['ing1'], 'soup');
      expect(mockGet).toHaveBeenCalledWith("/recipes", {
        params: { limit: 10, offset: 5, tags: ['tag1'], ingredients: ['ing1'], title: 'soup' },
      });
    });

    it("fetchUserRecipes calls get with correct params", async () => {
      await api.fetchUserRecipes("u1", 10, 5);
      expect(mockGet).toHaveBeenCalledWith("/recipes/user/u1", {
        params: { limit: 10, offset: 5 },
      });
    });

    it("fetchPopularRecipes calls get with correct params", async () => {
      await api.fetchPopularRecipes(10, 0);
      expect(mockGet).toHaveBeenCalledWith("/recipes/popular", {
        params: { limit: 10, offset: 0 },
      });
    });

    it("fetchRecipe calls get with correct url", async () => {
      await api.fetchRecipe("123");
      expect(mockGet).toHaveBeenCalledWith("/recipes/123");
    });

    it("createRecipe calls post with data", async () => {
      const data = { title: "New" };
      await api.createRecipe(data);
      expect(mockPost).toHaveBeenCalledWith("/recipes", data);
    });

    it("likeRecipe calls post", async () => {
      await api.likeRecipe("123");
      expect(mockPost).toHaveBeenCalledWith("/recipes/123/likes");
    });

    it("updateRecipe calls put", async () => {
      const data = { title: "Updated" };
      await api.updateRecipe("123", data);
      expect(mockPut).toHaveBeenCalledWith("/recipes/123", data);
    });

    it("deleteRecipe calls delete", async () => {
      await api.deleteRecipe("123");
      expect(mockDelete).toHaveBeenCalledWith("/recipes/123");
    });

    it("unlikeRecipe calls delete", async () => {
      await api.unlikeRecipe("123");
      expect(mockDelete).toHaveBeenCalledWith("/recipes/123/likes");
    });

    it("addRecipeIngredient calls post", async () => {
      const data = { name: "Salt" };
      await api.addRecipeIngredient("123", data);
      expect(mockPost).toHaveBeenCalledWith("/recipes/123/ingredients", data);
    });

    it("addRecipeTag calls post", async () => {
      await api.addRecipeTag("123", "tag1");
      expect(mockPost).toHaveBeenCalledWith("/recipes/123/tags", { tag_id: "tag1" });
    });

    it("removeRecipeTag calls delete", async () => {
      await api.removeRecipeTag("123", "tag1");
      expect(mockDelete).toHaveBeenCalledWith("/recipes/123/tags/tag1");
    });

    it("removeRecipeIngredient calls delete", async () => {
      await api.removeRecipeIngredient("123", "ing1");
      expect(mockDelete).toHaveBeenCalledWith("/recipes/123/ingredients/ing1");
    });
  });

  describe("Ingredients", () => {
    it("fetchIngredients calls get", async () => {
      await api.fetchIngredients(20, 0, "salt");
      expect(mockGet).toHaveBeenCalledWith("/ingredients", {
        params: { limit: 20, offset: 0, name: "salt" },
      });
    });

    it("createIngredient calls post", async () => {
      await api.createIngredient("Pepper");
      expect(mockPost).toHaveBeenCalledWith("/ingredients", { name: "Pepper" });
    });
  });

  describe("Lists", () => {
    it("fetchLists calls get", async () => {
      await api.fetchLists(10, 0, "test", "name", "asc");
      expect(mockGet).toHaveBeenCalledWith("/lists", {
        params: { limit: 10, offset: 0, name: "test", sort: "name", order: "asc" },
      });
    });

    it("fetchLists calls get with defaults", async () => {
      await api.fetchLists(10, 0);
      expect(mockGet).toHaveBeenCalledWith("/lists", {
        params: { limit: 10, offset: 0, name: undefined, sort: undefined, order: undefined },
      });
    });

    it("fetchUserLists calls get", async () => {
      await api.fetchUserLists("u1", 10, 0, "test", "name", "asc");
      expect(mockGet).toHaveBeenCalledWith("/lists/user/u1", {
        params: { limit: 10, offset: 0, name: "test", sort: "name", order: "asc" },
      });
    });

    it("fetchUserLists calls get with defaults", async () => {
      await api.fetchUserLists("u1", 10, 0);
      expect(mockGet).toHaveBeenCalledWith("/lists/user/u1", {
        params: { limit: 10, offset: 0, name: undefined, sort: undefined, order: undefined },
      });
    });

    it("fetchList calls get", async () => {
      await api.fetchList("l1");
      expect(mockGet).toHaveBeenCalledWith("/lists/l1");
    });

    it("deleteList calls delete", async () => {
      await api.deleteList("l1");
      expect(mockDelete).toHaveBeenCalledWith("/lists/l1");
    });

    it("createList calls post", async () => {
      await api.createList("My List");
      expect(mockPost).toHaveBeenCalledWith("/lists", { name: "My List" });
    });

    it("fetchListRecipes calls get", async () => {
      await api.fetchListRecipes("l1", 10, 0);
      expect(mockGet).toHaveBeenCalledWith("/lists/l1/recipes", {
        params: { limit: 10, offset: 0 },
      });
    });

    it("addRecipeToList calls post", async () => {
      await api.addRecipeToList("l1", "r1");
      expect(mockPost).toHaveBeenCalledWith("/lists/l1/recipes", { recipe_id: "r1" });
    });

    it("removeRecipeFromList calls delete", async () => {
      await api.removeRecipeFromList("l1", "r1");
      expect(mockDelete).toHaveBeenCalledWith("/lists/l1/recipes/r1");
    });
  });

  describe("Tags", () => {
    it("fetchTags calls get", async () => {
      await api.fetchTags(50, 0);
      expect(mockGet).toHaveBeenCalledWith("/tags", {
        params: { limit: 50, offset: 0 },
      });
    });

    it("createTag calls post", async () => {
      await api.createTag("Vegan");
      expect(mockPost).toHaveBeenCalledWith("/tags", { name: "Vegan" });
    });
  });

  describe("Users", () => {
    it("fetchUsers calls get", async () => {
      await api.fetchUsers(10, 0);
      expect(mockGet).toHaveBeenCalledWith("/users", {
        params: { limit: 10, offset: 0 },
      });
    });

    it("fetchUser calls get", async () => {
      await api.fetchUser("u1");
      expect(mockGet).toHaveBeenCalledWith("/users/u1");
    });

    it("fetchMe calls get", async () => {
      await api.fetchMe();
      expect(mockGet).toHaveBeenCalledWith("/users/me");
    });
  });

  describe("Relationships", () => {
    it("followUser calls post", async () => {
      await api.followUser("u2");
      expect(mockPost).toHaveBeenCalledWith("/relationships/u2");
    });

    it("unfollowUser calls delete", async () => {
      await api.unfollowUser("u2");
      expect(mockDelete).toHaveBeenCalledWith("/relationships/u2");
    });

    it("fetchFollowers calls get", async () => {
      await api.fetchFollowers("u1", 20, 0);
      expect(mockGet).toHaveBeenCalledWith("/relationships/u1/followers", {
        params: { limit: 20, offset: 0 },
      });
    });

    it("fetchFollowing calls get", async () => {
      await api.fetchFollowing("u1", 20, 0);
      expect(mockGet).toHaveBeenCalledWith("/relationships/u1/following", {
        params: { limit: 20, offset: 0 },
      });
    });

    it("fetchFriends calls get", async () => {
      await api.fetchFriends("u1", 20, 0);
      expect(mockGet).toHaveBeenCalledWith("/relationships/u1/friends", {
        params: { limit: 20, offset: 0 },
      });
    });

    it("fetchRelationshipCounts calls get", async () => {
      await api.fetchRelationshipCounts("u1");
      expect(mockGet).toHaveBeenCalledWith("/relationships/u1/counts");
    });
  });

  describe("Messages", () => {
    it("sendMessage calls post with correct data", async () => {
      const data = { receiver_id: "u2", content: "Hello", recipe_id: 1, list_id: null };
      await api.sendMessage("u2", "Hello", 1, null);
      expect(mockPost).toHaveBeenCalledWith("/messages", data);
    });

    it("fetchThreads calls get", async () => {
      await api.fetchThreads(20, 0);
      expect(mockGet).toHaveBeenCalledWith("/messages/threads", {
        params: { limit: 20, offset: 0 },
      });
    });

    it("fetchConversation calls get with other user id", async () => {
      await api.fetchConversation("u2", 20, 0);
      expect(mockGet).toHaveBeenCalledWith("/messages/u2", {
        params: { limit: 20, offset: 0 },
      });
    });

    it("markMessagesAsRead calls put with correct data", async () => {
      const ids = [1, 2, 3];
      await api.markMessagesAsRead(ids);
      expect(mockPut).toHaveBeenCalledWith("/messages/read", {
        message_ids: ids,
        is_read: true,
      });
    });
  });
});