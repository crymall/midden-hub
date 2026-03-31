import { useState, useCallback } from "react";
import DataContext from "./DataContext";
import * as iamApi from "../../services/iamApi";
import * as canteenApi from "../../services/canteenApi";
import { ROLES } from "../../utils/constants";

export const DataProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [authedUserDetails, setAuthedUserDetails] = useState(null);

  const [recipes, setRecipes] = useState([]);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [userProfileRecipes, setUserProfileRecipes] = useState([]);
  const [currentRecipe, setCurrentRecipe] = useState(null);
  const [viewedUser, setViewedUser] = useState(null);
  const [viewedUserLoading, setViewedUserLoading] = useState(false);
  const [ingredients, setIngredients] = useState([]);
  const [tags, setTags] = useState([]);
  const [userLists, setUserLists] = useState([]);
  const [currentListRecipes, setCurrentListRecipes] = useState([]);
  const [currentListId, setCurrentListId] = useState(null);
  const [comboboxLists, setComboboxLists] = useState([]);
  const [comboboxListsLastFetched, setComboboxListsLastFetched] = useState(0);
  const [currentComboboxQuery, setCurrentComboboxQuery] = useState("");
  const [comboboxListsUserId, setComboboxListsUserId] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [relationshipCounts, setRelationshipCounts] = useState({ followers: 0, following: 0 });
  const [friends, setFriends] = useState([]);
  const [relationshipsLoading, setRelationshipsLoading] = useState(false);
  const [threads, setThreads] = useState([]);
  const [currentConversation, setCurrentConversation] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [recipesCacheInvalid, setRecipesCacheInvalid] = useState(false);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const data = await iamApi.fetchUsers();
      setUsers(data.users);
    } catch (err) {
      console.error("Fetch users failed", err);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const deleteUser = async (id) => {
    try {
      await iamApi.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error("Delete user failed", err);
    }
  };

  const updateUserRole = async (userId, roleId) => {
    try {
      await iamApi.updateUserRole(userId, roleId);
      const roleName = Object.keys(ROLES).find((key) => ROLES[key] === roleId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: roleName } : u))
      );
    } catch (err) {
      console.error("Update user role failed", err);
    }
  };

  const getAuthedUserDetails = useCallback(async (userId) => {
    try {
      const data = await iamApi.fetchUser(userId);
      setAuthedUserDetails(data);
    } catch (err) {
      console.error("Fetch authed user details failed", err);
      setAuthedUserDetails(null);
    }
  }, []);

  const getRecipes = useCallback(
    async (limit = 50, offset = 0, filters = {}) => {
      setRecipesLoading(true);
      try {
        const { tags, ingredients, title, ids } = filters;
        const data = await canteenApi.fetchRecipes(
          limit,
          offset,
          tags,
          ingredients,
          title,
          ids
        );
        setRecipes(data);
      } catch (err) {
        console.error("Fetch recipes failed", err);
      } finally {
        setRecipesLoading(false);
      }
    },
    [],
  );

  const getUserProfileRecipes = useCallback(async (userId, limit = 50, offset = 0) => {
    setRecipesLoading(true);
    try {
      const data = await canteenApi.fetchUserRecipes(userId, limit, offset);
      setUserProfileRecipes(data);
    } catch (err) {
      console.error("Fetch user recipes failed", err);
    } finally {
      setRecipesLoading(false);
    }
  }, []);

  const getPopularRecipes = useCallback(async (limit = 50, offset = 0) => {
    setRecipesLoading(true);
    try {
      const data = await canteenApi.fetchPopularRecipes(limit, offset);
      setRecipes(data);
    } catch (err) {
      console.error("Fetch popular recipes failed", err);
    } finally {
      setRecipesLoading(false);
    }
  }, []);

  const getRecipe = useCallback(async (id) => {
    setRecipesLoading(true);
    try {
      const data = await canteenApi.fetchRecipe(id);
      setCurrentRecipe(data);
      return data;
    } catch (err) {
      console.error("Fetch recipe failed", err);
      setCurrentRecipe(null);
      return null;
    } finally {
      setRecipesLoading(false);
    }
  }, []);

  const getViewedUser = useCallback(async (id) => {
    setViewedUserLoading(true);
    try {
      const data = await canteenApi.fetchUser(id);
      setViewedUser(data);
      return data;
    } catch (err) {
      console.error("Fetch viewed user failed", err);
      setViewedUser(null);
      return null;
    } finally {
      setViewedUserLoading(false);
    }
  }, []);

  const getIngredients = useCallback(async (limit = 100, offset = 0, name = "") => {
    try {
      const data = await canteenApi.fetchIngredients(limit, offset, name);
      setIngredients(data);
    } catch (err) {
      console.error("Fetch ingredients failed", err);
    }
  }, []);

  const clearIngredients = useCallback(() => {
    setIngredients([]);
  }, []);

  const getTags = useCallback(async () => {
    try {
      const data = await canteenApi.fetchTags(100, 0);
      setTags(data);
    } catch (err) {
      console.error("Fetch tags failed", err);
    }
  }, []);

  const getUserLists = useCallback(async (userId, limit = 20, offset = 0, name = "", sort = "created_at", order = "DESC") => {
    try {
      const data = await canteenApi.fetchUserLists(userId, limit, offset, name, sort, order);
      setUserLists(data);
      return data;
    } catch (err) {
      console.error("Fetch user lists failed", err);
      return null;
    }
  }, []);

  const getComboboxLists = useCallback(async (userId, query = "") => {
    try {
      const data = await canteenApi.fetchUserLists(userId, 10, 0, query, "updated_at", "DESC");
      setComboboxLists(data);
      setComboboxListsUserId(userId);
      setCurrentComboboxQuery(query);
      if (!query) {
        setComboboxListsLastFetched(Date.now());
      }
    } catch (err) {
      console.error("Fetch combobox lists failed", err);
    }
  }, []);

  const hoistComboboxList = useCallback((listId) => {
    setComboboxLists((prev) => {
      const index = prev.findIndex((list) => list.id === listId);
      if (index <= 0) return prev;

      const newLists = [...prev];
      const [item] = newLists.splice(index, 1);
      newLists.unshift(item);
      return newLists;
    });
  }, []);

  const getListRecipes = useCallback(async (id, limit, offset) => {
    setRecipesLoading(true);
    try {
      const data = await canteenApi.fetchListRecipes(id, limit, offset);
      setCurrentListRecipes(data);
      setCurrentListId(id);
      return data;
    } catch (err) {
      console.error("Fetch list recipes failed", err);
      setCurrentListRecipes([]);
      setCurrentListId(null);
      return null;
    } finally {
      setRecipesLoading(false);
    }
  }, []);

  const toggleRecipeLike = async (id, isLiked) => {
    try {
      if (isLiked) {
        await canteenApi.unlikeRecipe(id);
      } else {
        await canteenApi.likeRecipe(id);
      }
      if (currentRecipe && currentRecipe.id === id) {
        const updated = await canteenApi.fetchRecipe(id);
        setCurrentRecipe(updated);
      }
    } catch (err) {
      console.error("Toggle like failed", err);
    }
  };

  const createRecipe = async (recipeData) => {
    const data = await canteenApi.createRecipe(recipeData);
    setRecipesCacheInvalid(true);
    return data;
  };

  const deleteRecipe = async (id) => {
    try {
      await canteenApi.deleteRecipe(id);
      setRecipes((prev) => prev.filter((r) => String(r.id) !== String(id)));
      setCurrentRecipe((prev) => (prev && String(prev.id) === String(id) ? null : prev));
    } catch (err) {
      console.error("Delete recipe failed", err);
      throw err;
    }
  };

  const createTag = async (name) => {
    try {
      const data = await canteenApi.createTag(name);
      setTags((prev) => [...prev, data]);
      return data;
    } catch (err) {
      console.error("Create tag failed", err);
      throw err;
    }
  };

  const createIngredient = async (name) => {
    try {
      const data = await canteenApi.createIngredient(name);
      setIngredients((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      console.error("Create ingredient failed", err);
      throw err;
    }
  };

  const getRelationshipCounts = useCallback(async (id) => {
    try {
      const data = await canteenApi.fetchRelationshipCounts(id);
      setRelationshipCounts(data);
    } catch (err) {
      console.error("Fetch relationship counts failed", err);
    }
  }, []);

  const getFollowers = useCallback(async (id, limit = 50, offset = 0) => {
    setRelationshipsLoading(true);
    try {
      const data = await canteenApi.fetchFollowers(id, limit, offset);
      setFollowers(data);
    } catch (err) {
      console.error("Fetch followers failed", err);
    } finally {
      setRelationshipsLoading(false);
    }
  }, []);

  const getFollowing = useCallback(async (id, limit = 50, offset = 0) => {
    setRelationshipsLoading(true);
    try {
      const data = await canteenApi.fetchFollowing(id, limit, offset);
      setFollowing(data);
    } catch (err) {
      console.error("Fetch following failed", err);
    } finally {
      setRelationshipsLoading(false);
    }
  }, []);

  const getFriends = useCallback(async (id, limit = 50, offset = 0, query = undefined) => {
    setRelationshipsLoading(true);
    try {
      const data = await canteenApi.fetchFriends(id, limit, offset, query);
      setFriends(data);
    } catch (err) {
      console.error("Fetch friends failed", err);
    } finally {
      setRelationshipsLoading(false);
    }
  }, []);

  const followUser = async (id) => {
    try {
      await canteenApi.followUser(id);
    } catch (err) {
      console.error("Follow user failed", err);
    }
  };

  const unfollowUser = async (id) => {
    try {
      await canteenApi.unfollowUser(id);
    } catch (err) {
      console.error("Unfollow user failed", err);
    }
  };

  const getThreads = useCallback(async (limit = 50, offset = 0) => {
    setMessagesLoading(true);
    try {
      const data = await canteenApi.fetchThreads(limit, offset);
      setThreads(data);
    } catch (err) {
      console.error("Fetch threads failed", err);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

 const getConversation = useCallback(async (otherUserId, limit = 50, offset = 0) => {
    setMessagesLoading(true);
    try {
      const data = await canteenApi.fetchConversation(otherUserId, limit, offset);

      const recipeIds = [...new Set(data.map((msg) => msg.recipe_id).filter(Boolean))];

      if (recipeIds.length > 0) {
        const fetchedRecipes = await canteenApi.fetchRecipes(
          recipeIds.length,
          0,
          undefined,
          undefined,
          undefined,
          recipeIds,
        );

        const recipesMap = {};
        for (const recipe of fetchedRecipes) {
          recipesMap[String(recipe.id)] = recipe;
        }

        for (const msg of data) {
          if (msg.recipe_id && recipesMap[String(msg.recipe_id)]) {
            msg.recipe = recipesMap[String(msg.recipe_id)];
          }
        }
      }

      setCurrentConversation(data);
    } catch (err) {
      console.error("Fetch conversation failed", err);
    } finally {
      setMessagesLoading(false);
    }
  }, []); 

  const sendMessage = async (receiverId, content, recipeId = null, listId = null) => {
    try {
      const data = await canteenApi.sendMessage(receiverId, content, recipeId, listId);

      let enrichedData = { ...data };
      if (recipeId) {
        if (currentRecipe && String(currentRecipe.id) === String(recipeId)) {
          enrichedData.recipe = currentRecipe;
        } else {
          try {
            const recipe = await canteenApi.fetchRecipe(recipeId);
            enrichedData.recipe = recipe;
          } catch (e) {
            console.error("Failed to fetch recipe for new message", e);
          }
        }
      }

      setCurrentConversation((prev) => [enrichedData, ...prev]);
      return enrichedData;
    } catch (err) {
      console.error("Send message failed", err);
      throw err;
    }
  };

  const markMessagesAsRead = async (ids) => {
    try {
      await canteenApi.markMessagesAsRead(ids);

      const sendersToUpdate = new Set();
      currentConversation.forEach((msg) => {
        if (ids.includes(msg.id)) {
          sendersToUpdate.add(String(msg.sender_id));
        }
      });

      setCurrentConversation((prev) =>
        prev.map((msg) => (ids.includes(msg.id) ? { ...msg, is_read: true } : msg))
      );

      if (sendersToUpdate.size > 0) {
        setThreads((prev) =>
          prev.map((thread) =>
            sendersToUpdate.has(String(thread.other_user_id))
              ? { ...thread, is_read: true }
              : thread,
          ),
        );
      }
    } catch (err) {
      console.error("Mark messages read failed", err);
    }
  };

  return (
    <DataContext.Provider
      value={{
        users,
        usersLoading,
        fetchUsers,
        deleteUser,
        updateUserRole,
        authedUserDetails,
        getAuthedUserDetails,
        recipes,
        recipesLoading,
        currentRecipe,
        ingredients,
        viewedUser,
        viewedUserLoading,
        getViewedUser,
        userProfileRecipes,
        getUserProfileRecipes,
        tags,
        userLists,
        getRecipes,
        getPopularRecipes,
        getRecipe,
        getIngredients,
        clearIngredients,
        getTags,
        getUserLists,
        getListRecipes,
        comboboxLists,
        getComboboxLists,
        comboboxListsLastFetched,
        currentComboboxQuery,
        comboboxListsUserId,
        hoistComboboxList,
        currentListRecipes,
        currentListId,
        toggleRecipeLike,
        createRecipe,
        deleteRecipe,
        createTag,
        createIngredient,
        followers,
        following,
        relationshipCounts,
        getRelationshipCounts,
        friends,
        relationshipsLoading,
        getFollowers,
        getFollowing,
        getFriends,
        followUser,
        unfollowUser,
        threads,
        currentConversation,
        messagesLoading,
        getThreads,
        getConversation,
        sendMessage,
        markMessagesAsRead,
        recipesCacheInvalid,
        setRecipesCacheInvalid,
        canteenApi,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export default DataProvider;
