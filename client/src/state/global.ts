import { create } from "zustand";
import { localKey } from "../lib/api";
import type { ApiUser } from "../types/api";

interface UserStore {
  token: string | null;
  user: ApiUser | null;
  setToken: (token: string | null) => void;
  setUser: (user: ApiUser | null) => void;
  logout: () => void;
}

const getStoredUser = (): ApiUser | null => {
  try {
    const raw = localStorage.getItem(localKey.user);
    if (!raw) return null;
    return JSON.parse(raw) as ApiUser;
  } catch (error) {
    console.error("Failed to parse stored user", error);
    return null;
  }
};

export const userStore = create<UserStore>((set) => ({
  token: localStorage.getItem(localKey.token) || null,
  user: getStoredUser(),
  setToken: (token) => {
    if (token) {
      localStorage.setItem(localKey.token, token);
    } else {
      localStorage.removeItem(localKey.token);
    }
    set({ token });
  },
  setUser: (user) => {
    if (user) {
      localStorage.setItem(localKey.user, JSON.stringify(user));
    } else {
      localStorage.removeItem(localKey.user);
    }
    set({ user });
  },
  logout: () => {
    localStorage.removeItem(localKey.token);
    localStorage.removeItem(localKey.user);
    set({ token: null, user: null });
  }
}));
