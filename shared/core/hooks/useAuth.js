import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as iamApi from "../services/iamApi";
import { useUserEnrichment } from "./userEnrichment";

export const useAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const enrichUser = useUserEnrichment();

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const data = await iamApi.verify();
      return enrichUser(data.user);
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
      return enrichUser(data.user);
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
