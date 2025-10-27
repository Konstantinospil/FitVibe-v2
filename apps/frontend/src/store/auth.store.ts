import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

interface AuthState extends AuthTokens {
  isAuthenticated: boolean;
  signIn: (tokens: Required<AuthTokens>) => void;
  signOut: () => void;
  setTokens: (tokens: Partial<Required<AuthTokens>>) => void;
}

const initialState: AuthTokens & { isAuthenticated: boolean } = {
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...initialState,
      signIn: (tokens) =>
        set({
          isAuthenticated: true,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        }),
      signOut: () => set({ ...initialState }),
      setTokens: (tokens) =>
        set((state) => ({
          ...state,
          ...tokens,
          isAuthenticated: Boolean(tokens.accessToken ?? state.accessToken ?? false),
        })),
    }),
    {
      name: "fitvibe:auth",
      version: 1,
    },
  ),
);
