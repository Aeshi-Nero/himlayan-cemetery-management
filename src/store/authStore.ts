import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  updateUser: (updatedFields: Partial<User>) => void;
}

const STORED_USER_KEY = 'himlayan_user';
const STORED_ACCESS_KEY = 'himlayan_access_token';
const STORED_REFRESH_KEY = 'himlayan_refresh_token';

const getInitialState = () => {
  try {
    const userJson = localStorage.getItem(STORED_USER_KEY);
    const access = localStorage.getItem(STORED_ACCESS_KEY);
    const refresh = localStorage.getItem(STORED_REFRESH_KEY);
    if (userJson && access) {
      return {
        user: JSON.parse(userJson),
        accessToken: access,
        refreshToken: refresh,
        isAuthenticated: true,
      };
    }
  } catch (e) {
    console.error('Error loading auth from localStorage:', e);
  }
  return {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
  };
};

export const useAuthStore = create<AuthState>((set) => ({
  ...getInitialState(),

  login: (user, accessToken, refreshToken) => {
    localStorage.setItem(STORED_USER_KEY, JSON.stringify(user));
    localStorage.setItem(STORED_ACCESS_KEY, accessToken);
    localStorage.setItem(STORED_REFRESH_KEY, refreshToken);
    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
    });
  },

  logout: () => {
    localStorage.removeItem(STORED_USER_KEY);
    localStorage.removeItem(STORED_ACCESS_KEY);
    localStorage.removeItem(STORED_REFRESH_KEY);
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem(STORED_ACCESS_KEY, accessToken);
    localStorage.setItem(STORED_REFRESH_KEY, refreshToken);
    set({ accessToken, refreshToken });
  },

  updateUser: (updatedFields) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, ...updatedFields };
      localStorage.setItem(STORED_USER_KEY, JSON.stringify(updatedUser));
      return { user: updatedUser };
    });
  },
}));
