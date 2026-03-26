import axios from "axios";

const canteenApi = axios.create({
  baseURL: "/canteen",
});

canteenApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export const fetchRecipes = async (
  limit,
  offset,
  tags = [],
  ingredients = [],
  title = "",
  ids,
) => {
  const response = await canteenApi.get("/recipes", {
    params: { limit, offset, tags, ingredients, title, ids },
  });
  return response.data;
};

export const fetchUserRecipes = async (userId, limit, offset) => {
  const response = await canteenApi.get(`/recipes/user/${userId}`, {
    params: { limit, offset },
  });
  return response.data;
};

export const fetchPopularRecipes = async (limit, offset) => {
  const response = await canteenApi.get("/recipes/popular", {
    params: { limit, offset },
  });
  return response.data;
};

export const fetchRecipe = async (id) => {
  const response = await canteenApi.get(`/recipes/${id}`);
  return response.data;
};

export const createRecipe = async (recipeData) => {
  const response = await canteenApi.post("/recipes", recipeData);
  return response.data;
};

export const likeRecipe = async (id) => {
  const response = await canteenApi.post(`/recipes/${id}/likes`);
  return response.data;
};

export const updateRecipe = async (id, recipeData) => {
  const response = await canteenApi.put(`/recipes/${id}`, recipeData);
  return response.data;
};

export const deleteRecipe = async (id) => {
  const response = await canteenApi.delete(`/recipes/${id}`);
  return response.data;
};

export const unlikeRecipe = async (id) => {
  const response = await canteenApi.delete(`/recipes/${id}/likes`);
  return response.data;
};

export const addRecipeIngredient = async (recipeId, ingredientData) => {
  const response = await canteenApi.post(
    `/recipes/${recipeId}/ingredients`,
    ingredientData,
  );
  return response.data;
};

export const addRecipeTag = async (recipeId, tagId) => {
  const response = await canteenApi.post(`/recipes/${recipeId}/tags`, {
    tag_id: tagId,
  });
  return response.data;
};

export const removeRecipeTag = async (recipeId, tagId) => {
  const response = await canteenApi.delete(
    `/recipes/${recipeId}/tags/${tagId}`,
  );
  return response.data;
};

export const removeRecipeIngredient = async (recipeId, ingredientId) => {
  const response = await canteenApi.delete(
    `/recipes/${recipeId}/ingredients/${ingredientId}`,
  );
  return response.data;
};

export const fetchIngredients = async (limit, offset, name) => {
  const response = await canteenApi.get("/ingredients", {
    params: { limit, offset, name },
  });
  return response.data;
};

export const createIngredient = async (name) => {
  const response = await canteenApi.post("/ingredients", { name });
  return response.data;
};

export const fetchLists = async (limit, offset, name, sort, order) => {
  const response = await canteenApi.get("/lists", {
    params: { limit, offset, name, sort, order },
  });
  return response.data;
};

export const fetchUserLists = async (
  userId,
  limit,
  offset,
  name,
  sort,
  order,
) => {
  const response = await canteenApi.get(`/lists/user/${userId}`, {
    params: { limit, offset, name, sort, order },
  });
  return response.data;
};

export const fetchList = async (id) => {
  const response = await canteenApi.get(`/lists/${id}`);
  return response.data;
};

export const deleteList = async (id) => {
  const response = await canteenApi.delete(`/lists/${id}`);
  return response.data;
};

export const createList = async (name) => {
  const response = await canteenApi.post("/lists", { name });
  return response.data;
};

export const fetchListRecipes = async (id, limit, offset) => {
  const response = await canteenApi.get(`/lists/${id}/recipes`, {
    params: { limit, offset },
  });
  return response.data;
};

export const addRecipeToList = async (id, recipeId) => {
  const response = await canteenApi.post(`/lists/${id}/recipes`, {
    recipe_id: recipeId,
  });
  return response.data;
};

export const removeRecipeFromList = async (id, recipeId) => {
  const response = await canteenApi.delete(`/lists/${id}/recipes/${recipeId}`);
  return response.data;
};

export const fetchTags = async (limit, offset) => {
  const response = await canteenApi.get("/tags", { params: { limit, offset } });
  return response.data;
};

export const createTag = async (name) => {
  const response = await canteenApi.post("/tags", { name });
  return response.data;
};

export const fetchUsers = async (limit, offset) => {
  const response = await canteenApi.get("/users", {
    params: { limit, offset },
  });
  return response.data;
};

export const fetchUser = async (id) => {
  const response = await canteenApi.get(`/users/${id}`);
  return response.data;
};

export const followUser = async (id) => {
  const response = await canteenApi.post(`/relationships/${id}`);
  return response.data;
};

export const unfollowUser = async (id) => {
  const response = await canteenApi.delete(`/relationships/${id}`);
  return response.data;
};

export const fetchRelationshipCounts = async (id) => {
  const response = await canteenApi.get(`/relationships/${id}/counts`);
  return response.data;
};

export const fetchFollowers = async (id, limit, offset) => {
  const response = await canteenApi.get(`/relationships/${id}/followers`, {
    params: { limit, offset },
  });
  return response.data;
};

export const fetchFollowing = async (id, limit, offset) => {
  const response = await canteenApi.get(`/relationships/${id}/following`, {
    params: { limit, offset },
  });
  return response.data;
};

export const fetchFriends = async (id, limit, offset) => {
  const response = await canteenApi.get(`/relationships/${id}/friends`, {
    params: { limit, offset },
  });
  return response.data;
};

export const sendMessage = async (receiverId, content, recipeId, listId) => {
  const response = await canteenApi.post("/messages", {
    receiver_id: receiverId,
    content,
    recipe_id: recipeId,
    list_id: listId,
  });
  return response.data;
};

export const fetchThreads = async (limit, offset) => {
  const response = await canteenApi.get("/messages/threads", {
    params: { limit, offset },
  });
  return response.data;
};

export const fetchConversation = async (otherUserId, limit, offset) => {
  const response = await canteenApi.get(`/messages/${otherUserId}`, {
    params: { limit, offset },
  });
  return response.data;
};

export const markMessagesAsRead = async (messageIds, isRead = true) => {
  const response = await canteenApi.put("/messages/read", {
    message_ids: messageIds,
    is_read: isRead,
  });
  return response.data;
};
