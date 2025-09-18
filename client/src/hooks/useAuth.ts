import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/axios/axios";
import { API_ROUTES } from "../lib/api";
import type { ApiResponse, ApiUser, AuthResponse } from "../types/api";
import { userStore } from "../state/global";

const fetchMe = async (): Promise<ApiUser> => {
  const response = await api.get<ApiResponse<{ user: ApiUser }>>(API_ROUTES.AUTH.ME);
  return response.data.data.user;
};

export const useAuth = () => {
  const token = userStore((state) => state.token);
  const storedUser = userStore((state) => state.user);
  const setUser = userStore((state) => state.setUser);
  const logout = userStore((state) => state.logout);

  const query = useQuery<ApiUser>({
    queryKey: ["auth", "me"],
    queryFn: fetchMe,
    enabled: Boolean(token),
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (query.data) {
      setUser(query.data);
    }
  }, [query.data, setUser]);

  useEffect(() => {
    if (query.error) {
      logout();
    }
  }, [query.error, logout]);

  const user: ApiUser | null = storedUser ?? query.data ?? null;

  return {
    token,
    user,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isAuthenticated: Boolean(token && user),
  };
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  const setToken = userStore((state) => state.setToken);
  const setUser = userStore((state) => state.setUser);

  return useMutation({
    mutationKey: ["auth", "login"],
    mutationFn: async (payload: { email: string; password: string }) => {
      const response = await api.post<ApiResponse<AuthResponse>>(API_ROUTES.AUTH.LOGIN, payload);
      return response.data.data;
    },
    onSuccess: (data) => {
      setToken(data.token);
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    }
  });
};

export const useSignup = () => {
  const queryClient = useQueryClient();
  const setToken = userStore((state) => state.setToken);
  const setUser = userStore((state) => state.setUser);

  return useMutation({
    mutationKey: ["auth", "signup"],
    mutationFn: async (payload: { name: string; email: string; password: string }) => {
      const response = await api.post<ApiResponse<AuthResponse>>(API_ROUTES.AUTH.SIGNUP, payload);
      return response.data.data;
    },
    onSuccess: (data) => {
      setToken(data.token);
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    }
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const logout = userStore((state) => state.logout);

  return () => {
    logout();
    queryClient.clear();
  };
};
