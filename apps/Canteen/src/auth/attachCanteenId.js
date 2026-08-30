import { fetchMe } from "@shared/core/services/canteenApi";

export const attachCanteenId = async (user) => {
  try {
    const canteenUser = await fetchMe();
    return { ...user, canteenId: canteenUser?.id };
  } catch (err) {
    console.error("Failed to fetch Canteen user", err);
    return { ...user, canteenId: null };
  }
};
