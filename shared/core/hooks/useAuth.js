import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as canteenApi from "../services/canteenApi";
import * as iamApi from "../services/iamApi";

export const useAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const data = await iamApi.verify();
      let canteenId = null;
      try {
        const canteenUser = await canteenApi.fetchMe();
        canteenId = canteenUser?.id;
      } catch (err) {
        console.error("Failed to fetch Canteen user", err);
      }
      return { ...data.user, canteenId };
    },
    staleTime: Infinity,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: ({ username, password }) => iamApi.login(username, password),
  });

  const verifyLoginMutation = useMutation({
    mutationFn: async ({ tempToken, code, rememberMe }) => {
      const data = await iamApi.verify2FA(tempToken, code, rememberMe);
      let canteenId = null;
      try {
        const canteenUser = await canteenApi.fetchMe();
        canteenId = canteenUser?.id;
      } catch (err) {
        console.error("Failed to fetch Canteen user", err);
      }
      return { ...data.user, canteenId };
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["currentUser"], user);
      const origin = location.state?.from?.pathname || "/";
      navigate(origin, { state: { loginRedirect: true, ...location.state?.from?.state } });
    },
  });

  const registerMutation = useMutation({
    mutationFn: ({ username, email, password }) => iamApi.register(username, email, password),
  });

  const logoutMutation = useMutation({
    mutationFn: iamApi.logout,
    onSuccess: () => {
      queryClient.clear();
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !isError,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    verifyLogin: verifyLoginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
  };
};
