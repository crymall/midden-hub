import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useContext } from "react";
import { DataProvider } from "../DataProvider";
import DataContext from "../DataContext";
import * as iamApi from "../../../services/iamApi";
import * as canteenApi from "../../../services/canteenApi";

vi.mock("../../../services/iamApi");
vi.mock("../../../services/canteenApi");
vi.mock("../../../utils/constants", () => ({
  ROLES: {
    ADMIN: "role_admin_id",
    USER: "role_user_id",
  },
}));

describe("DataProvider", () => {
  const mockUsers = [
    { id: "1", name: "User One", role: "USER" },
    { id: "2", name: "User Two", role: "USER" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("provides initial state", () => {
    const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
    const { result } = renderHook(() => useContext(DataContext), { wrapper });

    expect(result.current.usersLoading).toBe(false);
    expect(result.current.users).toEqual([]);
    expect(result.current.recipesCacheInvalid).toBe(false);
  });

  it("fetches users and updates state", async () => {
    iamApi.fetchUsers.mockResolvedValue({ users: mockUsers });
    
    const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
    const { result } = renderHook(() => useContext(DataContext), { wrapper });

    let promise;
    act(() => {
      promise = result.current.fetchUsers();
    });

    expect(result.current.usersLoading).toBe(true);

    await act(async () => {
      await promise;
    });

    expect(result.current.usersLoading).toBe(false);
    expect(result.current.users).toEqual(mockUsers);
    expect(iamApi.fetchUsers).toHaveBeenCalledTimes(1);
  });

  it("handles fetch error gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    iamApi.fetchUsers.mockRejectedValue(new Error("Fetch failed"));
    
    const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
    const { result } = renderHook(() => useContext(DataContext), { wrapper });

    await act(async () => {
      await result.current.fetchUsers();
    });

    expect(result.current.usersLoading).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(
      "Fetch users failed",
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });

  it("deletes a user and updates state", async () => {
    iamApi.fetchUsers.mockResolvedValue({ users: mockUsers });
    iamApi.deleteUser.mockResolvedValue({});
    
    const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
    const { result } = renderHook(() => useContext(DataContext), { wrapper });

    await act(async () => {
      await result.current.fetchUsers();
    });

    await act(async () => {
      await result.current.deleteUser("1");
    });

    expect(iamApi.deleteUser).toHaveBeenCalledWith("1");
    expect(result.current.users).toHaveLength(1);
    expect(result.current.users[0].id).toBe("2");
  });

  it("updates user role and updates state", async () => {
    iamApi.fetchUsers.mockResolvedValue({ users: mockUsers });
    iamApi.updateUserRole.mockResolvedValue({});
    
    const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
    const { result } = renderHook(() => useContext(DataContext), { wrapper });

    await act(async () => {
      await result.current.fetchUsers();
    });

    await act(async () => {
      await result.current.updateUserRole("1", "role_admin_id");
    });

    expect(iamApi.updateUserRole).toHaveBeenCalledWith("1", "role_admin_id");
    expect(result.current.users.find((u) => u.id === "1").role).toBe("ADMIN");
  });

  it("fetches authed user details and updates state", async () => {
    const mockUserDetails = { id: "1", email: "test@user.com" };
    iamApi.fetchUser.mockResolvedValue(mockUserDetails);

    const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
    const { result } = renderHook(() => useContext(DataContext), { wrapper });

    await act(async () => {
      await result.current.getAuthedUserDetails("1");
    });

    expect(result.current.authedUserDetails).toEqual(mockUserDetails);
    expect(iamApi.fetchUser).toHaveBeenCalledWith("1");
  });

  it("handles fetch authed user details error gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    iamApi.fetchUser.mockRejectedValue(new Error("Fetch failed"));

    const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
    const { result } = renderHook(() => useContext(DataContext), { wrapper });

    await act(async () => {
      await result.current.getAuthedUserDetails("1");
    });

    expect(result.current.authedUserDetails).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      "Fetch authed user details failed",
      expect.any(Error),
    );
    consoleSpy.mockRestore();
  });

  it("handles deleteUser error gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    iamApi.deleteUser.mockRejectedValue(new Error("Delete failed"));
    
    const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
    const { result } = renderHook(() => useContext(DataContext), { wrapper });

    await act(async () => {
      await result.current.deleteUser("1");
    });

    expect(consoleSpy).toHaveBeenCalledWith("Delete user failed", expect.any(Error));
    consoleSpy.mockRestore();
  });

  it("handles updateUserRole error gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    iamApi.updateUserRole.mockRejectedValue(new Error("Update failed"));
    
    const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
    const { result } = renderHook(() => useContext(DataContext), { wrapper });

    await act(async () => {
      await result.current.updateUserRole("1", "role_admin_id");
    });

    expect(consoleSpy).toHaveBeenCalledWith("Update user role failed", expect.any(Error));
    consoleSpy.mockRestore();
  });

  describe("Canteen Actions", () => {
    it("fetches recipes and updates state", async () => {
      const mockRecipes = [{ id: 1, title: "Soup" }];
      canteenApi.fetchRecipes.mockResolvedValue(mockRecipes);

      const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
      const { result } = renderHook(() => useContext(DataContext), { wrapper });

      let promise;
      act(() => {
        promise = result.current.getRecipes(20, 0, {});
      });

      expect(result.current.recipesLoading).toBe(true);

      await act(async () => {
        await promise;
      });

      expect(result.current.recipesLoading).toBe(false);
      expect(result.current.recipes).toEqual(mockRecipes);
      expect(canteenApi.fetchRecipes).toHaveBeenCalledWith(20, 0, undefined, undefined, undefined, undefined);
    });

    it("fetches user profile recipes and updates state", async () => {
      const mockRecipes = [{ id: 1, title: "User Recipe" }];
      canteenApi.fetchUserRecipes.mockResolvedValue(mockRecipes);

      const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
      const { result } = renderHook(() => useContext(DataContext), { wrapper });

      let promise;
      act(() => {
        promise = result.current.getUserProfileRecipes("u1", 20, 0);
      });

      expect(result.current.recipesLoading).toBe(true);

      await act(async () => {
        await promise;
      });

      expect(result.current.recipesLoading).toBe(false);
      expect(result.current.userProfileRecipes).toEqual(mockRecipes);
      expect(canteenApi.fetchUserRecipes).toHaveBeenCalledWith("u1", 20, 0);
    });

    it("fetches single recipe and updates state", async () => {
      const mockRecipe = { id: "101", title: "Cake" };
      canteenApi.fetchRecipe.mockResolvedValue(mockRecipe);

      const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
      const { result } = renderHook(() => useContext(DataContext), { wrapper });

      let data;
      await act(async () => {
        data = await result.current.getRecipe("101");
      });

      expect(result.current.currentRecipe).toEqual(mockRecipe);
      expect(data).toEqual(mockRecipe);
      expect(canteenApi.fetchRecipe).toHaveBeenCalledWith("101");
    });

    it("fetches ingredients and updates state", async () => {
      const mockIngredients = [{ id: "i1", name: "Salt" }];
      canteenApi.fetchIngredients.mockResolvedValue(mockIngredients);

      const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
      const { result } = renderHook(() => useContext(DataContext), { wrapper });

      await act(async () => {
        await result.current.getIngredients();
      });

      expect(result.current.ingredients).toEqual(mockIngredients);
    });

    it("fetches tags and updates state", async () => {
      const mockTags = [{ id: "t1", name: "Vegan" }];
      canteenApi.fetchTags.mockResolvedValue(mockTags);

      const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
      const { result } = renderHook(() => useContext(DataContext), { wrapper });

      await act(async () => {
        await result.current.getTags();
      });

      expect(result.current.tags).toEqual(mockTags);
    });

    it("toggles recipe like and updates current recipe if matches", async () => {
      const recipe = { id: "101", likes: [] };
      const updatedRecipe = { id: "101", likes: [{ user_id: "u1" }] };

      canteenApi.fetchRecipe.mockResolvedValueOnce(recipe);
      canteenApi.likeRecipe.mockResolvedValue({});
      canteenApi.fetchRecipe.mockResolvedValueOnce(updatedRecipe);

      const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
      const { result } = renderHook(() => useContext(DataContext), { wrapper });

      await act(async () => {
        await result.current.getRecipe("101");
      });

      await act(async () => {
        await result.current.toggleRecipeLike("101", false);
      });

      expect(canteenApi.likeRecipe).toHaveBeenCalledWith("101");
      expect(canteenApi.fetchRecipe).toHaveBeenCalledTimes(2);
      expect(result.current.currentRecipe).toEqual(updatedRecipe);
    });

    it("creates a tag and updates state", async () => {
      const newTag = { id: "t1", name: "Gluten-Free" };
      canteenApi.createTag.mockResolvedValue(newTag);

      const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
      const { result } = renderHook(() => useContext(DataContext), { wrapper });

      await act(async () => {
        await result.current.createTag("Gluten-Free");
      });

      expect(canteenApi.createTag).toHaveBeenCalledWith("Gluten-Free");
      expect(result.current.tags).toContainEqual(newTag);
    });

    it("creates an ingredient and updates state", async () => {
      const newIngredient = { id: "i99", name: "Saffron" };
      canteenApi.createIngredient.mockResolvedValue(newIngredient);

      const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
      const { result } = renderHook(() => useContext(DataContext), { wrapper });

      await act(async () => {
        await result.current.createIngredient("Saffron");
      });

      expect(canteenApi.createIngredient).toHaveBeenCalledWith("Saffron");
      expect(result.current.ingredients[0]).toEqual(newIngredient);
    });

    it("fetches viewed user and updates state", async () => {
      const mockUser = { id: "101", username: "Viewed" };
      canteenApi.fetchUser.mockResolvedValue(mockUser);

      const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
      const { result } = renderHook(() => useContext(DataContext), { wrapper });

      let data;
      await act(async () => {
        data = await result.current.getViewedUser("101");
      });

      expect(result.current.viewedUser).toEqual(mockUser);
      expect(data).toEqual(mockUser);
      expect(canteenApi.fetchUser).toHaveBeenCalledWith("101");
    });

    it("fetches popular recipes and updates state", async () => {
      const mockRecipes = [{ id: 1, title: "Pop Soup" }];
      canteenApi.fetchPopularRecipes.mockResolvedValue(mockRecipes);

      const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
      const { result } = renderHook(() => useContext(DataContext), { wrapper });

      await act(async () => {
        await result.current.getPopularRecipes(10, 0);
      });

      expect(result.current.recipesLoading).toBe(false);
      expect(result.current.recipes).toEqual(mockRecipes);
      expect(canteenApi.fetchPopularRecipes).toHaveBeenCalledWith(10, 0);
    });

    it("clears ingredients", async () => {
      const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
      const { result } = renderHook(() => useContext(DataContext), { wrapper });

      act(() => {
        result.current.clearIngredients();
      });

      expect(result.current.ingredients).toEqual([]);
    });

    it("fetches user lists and updates state", async () => {
      const mockLists = [{ id: 1, name: "Favorites" }];
      canteenApi.fetchUserLists.mockResolvedValue(mockLists);

      const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
      const { result } = renderHook(() => useContext(DataContext), { wrapper });

      let data;
      await act(async () => {
        data = await result.current.getUserLists("u1", 20, 0, "", "created_at", "DESC");
      });

      expect(result.current.userLists).toEqual(mockLists);
      expect(data).toEqual(mockLists);
      expect(canteenApi.fetchUserLists).toHaveBeenCalledWith("u1", 20, 0, "", "created_at", "DESC");
    });

    it("fetches combobox lists, updates state, and hoists a list", async () => {
      const mockLists = [
        { id: 1, name: "List 1" },
        { id: 2, name: "List 2" },
        { id: 3, name: "List 3" },
      ];
      canteenApi.fetchUserLists.mockResolvedValue(mockLists);

      const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
      const { result } = renderHook(() => useContext(DataContext), { wrapper });

      await act(async () => {
        await result.current.getComboboxLists("u1", "");
      });

      expect(result.current.comboboxLists).toEqual(mockLists);
      expect(result.current.comboboxListsUserId).toBe("u1");
      expect(result.current.currentComboboxQuery).toBe("");
      expect(result.current.comboboxListsLastFetched).toBeGreaterThan(0);

      act(() => {
        result.current.hoistComboboxList(3);
      });
      
      expect(result.current.comboboxLists[0].id).toBe(3);

      act(() => {
        result.current.hoistComboboxList(99);
      });
      expect(result.current.comboboxLists[0].id).toBe(3);

      act(() => {
        result.current.hoistComboboxList(3);
      });
      expect(result.current.comboboxLists[0].id).toBe(3);

      await act(async () => {
        await result.current.getComboboxLists("u1", "test");
      });
      expect(result.current.currentComboboxQuery).toBe("test");
    });

    it("fetches list recipes and updates state", async () => {
      const mockListRecipes = [{ id: 1, title: "List Recipe" }];
      canteenApi.fetchListRecipes.mockResolvedValue(mockListRecipes);

      const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
      const { result } = renderHook(() => useContext(DataContext), { wrapper });

      let data;
      await act(async () => {
        data = await result.current.getListRecipes(1, 10, 0);
      });

      expect(result.current.currentListRecipes).toEqual(mockListRecipes);
      expect(result.current.currentListId).toBe(1);
      expect(data).toEqual(mockListRecipes);
      expect(result.current.recipesLoading).toBe(false);
    });

    it("creates a recipe", async () => {
      const mockRecipe = { id: 1, title: "New Recipe" };
      canteenApi.createRecipe.mockResolvedValue(mockRecipe);

      const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
      const { result } = renderHook(() => useContext(DataContext), { wrapper });

      let createdRecipe;
      await act(async () => {
        createdRecipe = await result.current.createRecipe({ title: "New Recipe" });
      });

      expect(canteenApi.createRecipe).toHaveBeenCalledWith({ title: "New Recipe" });
      expect(createdRecipe).toEqual(mockRecipe);
      expect(result.current.recipesCacheInvalid).toBe(true);
    });

    it("deletes a recipe and updates state", async () => {
      const mockRecipe = { id: "101", title: "To Delete" };
      canteenApi.fetchRecipe.mockResolvedValue(mockRecipe);
      canteenApi.deleteRecipe.mockResolvedValue({});

      const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
      const { result } = renderHook(() => useContext(DataContext), { wrapper });

      await act(async () => {
        await result.current.getRecipe("101");
        await result.current.deleteRecipe("101");
      });

      expect(canteenApi.deleteRecipe).toHaveBeenCalledWith("101");
      expect(result.current.currentRecipe).toBeNull();
    });

    describe("Error handling in Canteen Actions", () => {
      let consoleSpy;
      beforeEach(() => {
        consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      });
      afterEach(() => {
        consoleSpy.mockRestore();
      });

      it("handles errors across various endpoints gracefully", async () => {
        const error = new Error("Failed");
        canteenApi.fetchRecipes.mockRejectedValue(error);
        canteenApi.fetchUserRecipes.mockRejectedValue(error);
        canteenApi.fetchPopularRecipes.mockRejectedValue(error);
        canteenApi.fetchRecipe.mockRejectedValue(error);
        canteenApi.fetchUser.mockRejectedValue(error);
        canteenApi.fetchIngredients.mockRejectedValue(error);
        canteenApi.fetchTags.mockRejectedValue(error);
        canteenApi.fetchUserLists.mockRejectedValue(error);
        canteenApi.fetchListRecipes.mockRejectedValue(error);
        canteenApi.unlikeRecipe.mockRejectedValue(error);
        canteenApi.likeRecipe.mockRejectedValue(error);
        canteenApi.createTag.mockRejectedValue(error);
        canteenApi.deleteRecipe.mockRejectedValue(error);
        canteenApi.createIngredient.mockRejectedValue(error);

        const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
        const { result } = renderHook(() => useContext(DataContext), { wrapper });

        await act(async () => { await result.current.getRecipes(); });
        expect(consoleSpy).toHaveBeenCalledWith("Fetch recipes failed", error);

        await act(async () => { await result.current.getUserProfileRecipes("u1"); });
        expect(consoleSpy).toHaveBeenCalledWith("Fetch user recipes failed", error);

        await act(async () => { await result.current.getPopularRecipes(); });
        expect(consoleSpy).toHaveBeenCalledWith("Fetch popular recipes failed", error);

        await act(async () => { await result.current.getRecipe("1"); });
        expect(consoleSpy).toHaveBeenCalledWith("Fetch recipe failed", error);

        await act(async () => { await result.current.getViewedUser("1"); });
        expect(consoleSpy).toHaveBeenCalledWith("Fetch viewed user failed", error);

        await act(async () => { await result.current.getIngredients(); });
        expect(consoleSpy).toHaveBeenCalledWith("Fetch ingredients failed", error);

        await act(async () => { await result.current.getTags(); });
        expect(consoleSpy).toHaveBeenCalledWith("Fetch tags failed", error);

        await act(async () => { await result.current.getUserLists("u1"); });
        expect(consoleSpy).toHaveBeenCalledWith("Fetch user lists failed", error);

        await act(async () => { await result.current.getComboboxLists("u1"); });
        expect(consoleSpy).toHaveBeenCalledWith("Fetch combobox lists failed", error);

        await act(async () => { await result.current.getListRecipes(1, 10, 0); });
        expect(consoleSpy).toHaveBeenCalledWith("Fetch list recipes failed", error);

        await act(async () => { await result.current.toggleRecipeLike("1", true); });
        expect(consoleSpy).toHaveBeenCalledWith("Toggle like failed", error);

        await act(async () => { await result.current.toggleRecipeLike("1", false); });
        expect(consoleSpy).toHaveBeenCalledWith("Toggle like failed", error);

        await expect(result.current.createTag("NewTag")).rejects.toThrow();
        expect(consoleSpy).toHaveBeenCalledWith("Create tag failed", error);

        await expect(result.current.createIngredient("NewIng")).rejects.toThrow();
        expect(consoleSpy).toHaveBeenCalledWith("Create ingredient failed", error);

        await expect(result.current.deleteRecipe("1")).rejects.toThrow();
        expect(consoleSpy).toHaveBeenCalledWith("Delete recipe failed", error);
      });
    });
  });

  describe("Relationships", () => {
    it("fetches relationship counts and updates state", async () => {
      const mockCounts = { followers: 10, following: 5 };
      canteenApi.fetchRelationshipCounts.mockResolvedValue(mockCounts);

      const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
      const { result } = renderHook(() => useContext(DataContext), { wrapper });

      await act(async () => {
        await result.current.getRelationshipCounts("u1");
      });

      expect(result.current.relationshipCounts).toEqual(mockCounts);
      expect(canteenApi.fetchRelationshipCounts).toHaveBeenCalledWith("u1");
    });

    it("fetches followers and updates state", async () => {
      const mockFollowers = [{ id: "u2", username: "User2" }];
      canteenApi.fetchFollowers.mockResolvedValue(mockFollowers);

      const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
      const { result } = renderHook(() => useContext(DataContext), { wrapper });

      await act(async () => {
        await result.current.getFollowers("u1", 20, 0);
      });

      expect(result.current.followers).toEqual(mockFollowers);
      expect(canteenApi.fetchFollowers).toHaveBeenCalledWith("u1", 20, 0);
    });

    it("fetches following and updates state", async () => {
      const mockFollowing = [{ id: "u3", username: "User3" }];
      canteenApi.fetchFollowing.mockResolvedValue(mockFollowing);

      const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
      const { result } = renderHook(() => useContext(DataContext), { wrapper });

      await act(async () => {
        await result.current.getFollowing("u1", 20, 0);
      });

      expect(result.current.following).toEqual(mockFollowing);
      expect(canteenApi.fetchFollowing).toHaveBeenCalledWith("u1", 20, 0);
    });

    it("fetches friends and updates state", async () => {
      const mockFriends = [{ id: "u4", username: "User4" }];
      canteenApi.fetchFriends.mockResolvedValue(mockFriends);

      const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
      const { result } = renderHook(() => useContext(DataContext), { wrapper });

      await act(async () => {
        await result.current.getFriends("u1", 20, 0);
      });

      expect(result.current.friends).toEqual(mockFriends);
      expect(canteenApi.fetchFriends).toHaveBeenCalledWith("u1", 20, 0, undefined);
    });

    it("follows and unfollows user", async () => {
      canteenApi.followUser.mockResolvedValue({});
      canteenApi.unfollowUser.mockResolvedValue({});

      const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
      const { result } = renderHook(() => useContext(DataContext), { wrapper });

      await act(async () => {
        await result.current.followUser("u5");
        await result.current.unfollowUser("u5");
      });

      expect(canteenApi.followUser).toHaveBeenCalledWith("u5");
      expect(canteenApi.unfollowUser).toHaveBeenCalledWith("u5");
    });
  });

  describe("Messages", () => {
    it("fetches threads and updates state", async () => {
      const mockThreads = [{ id: 1, content: "Hello" }];
      canteenApi.fetchThreads.mockResolvedValue(mockThreads);

      const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
      const { result } = renderHook(() => useContext(DataContext), { wrapper });

      await act(async () => {
        await result.current.getThreads(20, 0);
      });

      expect(result.current.threads).toEqual(mockThreads);
      expect(canteenApi.fetchThreads).toHaveBeenCalledWith(20, 0);
    });

    it("fetches conversation and updates state", async () => {
      const mockConversation = [{ id: 1, content: "Hi there" }];
      canteenApi.fetchConversation.mockResolvedValue(mockConversation);

      const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
      const { result } = renderHook(() => useContext(DataContext), { wrapper });

      await act(async () => {
        await result.current.getConversation("u2", 20, 0);
      });

      expect(result.current.currentConversation).toEqual(mockConversation);
      expect(canteenApi.fetchConversation).toHaveBeenCalledWith("u2", 20, 0);
    });

    it("fetches conversation and enriches messages with recipes", async () => {
      const mockConversation = [
        { id: 1, content: "Look", recipe_id: "101" },
        { id: 2, content: "No recipe" },
      ];
      const mockRecipes = [{ id: "101", title: "Shared Recipe" }];

      canteenApi.fetchConversation.mockResolvedValue(mockConversation);
      canteenApi.fetchRecipes.mockResolvedValue(mockRecipes);

      const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
      const { result } = renderHook(() => useContext(DataContext), { wrapper });

      await act(async () => {
        await result.current.getConversation("u2", 20, 0);
      });

      expect(canteenApi.fetchRecipes).toHaveBeenCalledWith(1, 0, undefined, undefined, undefined, ["101"]);
      expect(result.current.currentConversation).toEqual([
        { id: 1, content: "Look", recipe_id: "101", recipe: mockRecipes[0] },
        { id: 2, content: "No recipe" },
      ]);
    });

    it("sends message and updates current conversation", async () => {
      const newMessage = { id: 2, content: "New message" };
      canteenApi.sendMessage.mockResolvedValue(newMessage);

      const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
      const { result } = renderHook(() => useContext(DataContext), { wrapper });

      await act(async () => {
        await result.current.sendMessage("u2", "New message");
      });

      expect(canteenApi.sendMessage).toHaveBeenCalledWith("u2", "New message", null, null);
      expect(result.current.currentConversation).toContainEqual(newMessage);
    });

    it("sends message with recipe and enriches it from API", async () => {
      const newMessage = { id: 3, content: "New recipe message", recipe_id: "102" };
      const fetchedRecipe = { id: "102", title: "Fetched Recipe" };

      canteenApi.sendMessage.mockResolvedValue(newMessage);
      canteenApi.fetchRecipe.mockResolvedValue(fetchedRecipe);

      const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
      const { result } = renderHook(() => useContext(DataContext), { wrapper });

      await act(async () => {
        await result.current.sendMessage("u2", "New recipe message", "102");
      });

      expect(canteenApi.sendMessage).toHaveBeenCalledWith("u2", "New recipe message", "102", null);
      expect(canteenApi.fetchRecipe).toHaveBeenCalledWith("102");
      expect(result.current.currentConversation).toContainEqual({
        ...newMessage,
        recipe: fetchedRecipe,
      });
    });

    it("sends message with recipe and uses currentRecipe if matching", async () => {
      const newMessage = { id: 4, content: "Current recipe message", recipe_id: "103" };
      const currentRecipe = { id: "103", title: "Current Recipe" };

      canteenApi.fetchRecipe.mockResolvedValueOnce(currentRecipe);
      canteenApi.sendMessage.mockResolvedValue(newMessage);

      const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
      const { result } = renderHook(() => useContext(DataContext), { wrapper });

      await act(async () => {
        await result.current.getRecipe("103");
      });

      canteenApi.fetchRecipe.mockClear();

      await act(async () => {
        await result.current.sendMessage("u2", "Current recipe message", "103");
      });

      expect(canteenApi.sendMessage).toHaveBeenCalledWith("u2", "Current recipe message", "103", null);
      expect(canteenApi.fetchRecipe).not.toHaveBeenCalled();
      expect(result.current.currentConversation).toContainEqual({
        ...newMessage,
        recipe: currentRecipe,
      });
    });

    it("marks messages as read and updates state and threads", async () => {
      const initialConversation = [
        { id: 1, sender_id: "u3", content: "Msg 1", is_read: false },
        { id: 2, sender_id: "u4", content: "Msg 2", is_read: false },
      ];
      const initialThreads = [
        { id: 10, other_user_id: "u3", is_read: false },
        { id: 11, other_user_id: "u4", is_read: false }
      ];

      canteenApi.fetchConversation.mockResolvedValue(initialConversation);
      canteenApi.fetchThreads.mockResolvedValue(initialThreads);
      canteenApi.markMessagesAsRead.mockResolvedValue({});

      const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
      const { result } = renderHook(() => useContext(DataContext), { wrapper });

      await act(async () => {
        await result.current.getConversation("u3", 20, 0);
        await result.current.getThreads(20, 0);
      });

      await act(async () => {
        await result.current.markMessagesAsRead([1]);
      });

      expect(canteenApi.markMessagesAsRead).toHaveBeenCalledWith([1]);
      expect(result.current.currentConversation.find((m) => m.id === 1).is_read).toBe(true);
      expect(result.current.currentConversation.find((m) => m.id === 2).is_read).toBe(false);
      expect(result.current.threads.find((t) => t.other_user_id === "u3").is_read).toBe(true);
      expect(result.current.threads.find((t) => t.other_user_id === "u4").is_read).toBe(false);
    });

    it("sends message with recipe but fails to fetch recipe details", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const newMessage = { id: 3, content: "New recipe message", recipe_id: "102" };

      canteenApi.sendMessage.mockResolvedValue(newMessage);
      canteenApi.fetchRecipe.mockRejectedValue(new Error("Failed"));

      const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
      const { result } = renderHook(() => useContext(DataContext), { wrapper });

      await act(async () => {
        await result.current.sendMessage("u2", "New recipe message", "102");
      });

      expect(consoleSpy).toHaveBeenCalledWith("Failed to fetch recipe for new message", expect.any(Error));
      expect(result.current.currentConversation).toContainEqual(newMessage);
      consoleSpy.mockRestore();
    });

    describe("Error handling in Relationships & Messages", () => {
      let consoleSpy;
      beforeEach(() => {
        consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      });
      afterEach(() => {
        consoleSpy.mockRestore();
      });

      it("handles errors across various endpoints gracefully", async () => {
        const error = new Error("Failed");
        canteenApi.fetchFollowers.mockRejectedValue(error);
        canteenApi.fetchFollowing.mockRejectedValue(error);
        canteenApi.fetchFriends.mockRejectedValue(error);
        canteenApi.followUser.mockRejectedValue(error);
        canteenApi.unfollowUser.mockRejectedValue(error);
        canteenApi.fetchRelationshipCounts.mockRejectedValue(error);
        canteenApi.fetchThreads.mockRejectedValue(error);
        canteenApi.fetchConversation.mockRejectedValue(error);
        canteenApi.sendMessage.mockRejectedValue(error);
        canteenApi.markMessagesAsRead.mockRejectedValue(error);

        const wrapper = ({ children }) => <DataProvider>{children}</DataProvider>;
        const { result } = renderHook(() => useContext(DataContext), { wrapper });

        await act(async () => { await result.current.getFollowers("1"); });
        expect(consoleSpy).toHaveBeenCalledWith("Fetch followers failed", error);

        await act(async () => { await result.current.getFollowing("1"); });
        expect(consoleSpy).toHaveBeenCalledWith("Fetch following failed", error);

        await act(async () => { await result.current.getFriends("1"); });
        expect(consoleSpy).toHaveBeenCalledWith("Fetch friends failed", error);

        await act(async () => { await result.current.followUser("1"); });
        expect(consoleSpy).toHaveBeenCalledWith("Follow user failed", error);

        await act(async () => { await result.current.unfollowUser("1"); });
        expect(consoleSpy).toHaveBeenCalledWith("Unfollow user failed", error);

        await act(async () => { await result.current.getRelationshipCounts("1"); });
        expect(consoleSpy).toHaveBeenCalledWith("Fetch relationship counts failed", error);

        await act(async () => { await result.current.getThreads(); });
        expect(consoleSpy).toHaveBeenCalledWith("Fetch threads failed", error);

        await act(async () => { await result.current.getConversation("1"); });
        expect(consoleSpy).toHaveBeenCalledWith("Fetch conversation failed", error);

        await expect(result.current.sendMessage("1", "hi")).rejects.toThrow();
        expect(consoleSpy).toHaveBeenCalledWith("Send message failed", error);

        await act(async () => { await result.current.markMessagesAsRead([1]); });
        expect(consoleSpy).toHaveBeenCalledWith("Mark messages read failed", error);
      });
    });
  });
});