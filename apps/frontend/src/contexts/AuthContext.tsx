import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AuthTokens } from "../store/auth.store";
import { useAuthStore } from "../store/auth.store";

interface AuthContextValue {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  signIn: (tokens: Required<AuthTokens>) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const signIn = useAuthStore((state) => state.signIn);
  const signOut = useAuthStore((state) => state.signOut);
  const [hydrated, setHydrated] = useState<boolean>(
    () => useAuthStore.persist?.hasHydrated?.() ?? false,
  );

  useEffect(() => {
    useAuthStore.persist?.rehydrate?.();
    const unsub = useAuthStore.persist?.onFinishHydration?.(() => {
      setHydrated(true);
    });

    if (useAuthStore.persist?.hasHydrated?.()) {
      setHydrated(true);
    }

    return () => {
      unsub?.();
    };
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      accessToken,
      refreshToken,
      signIn,
      signOut,
    }),
    [isAuthenticated, accessToken, refreshToken, signIn, signOut],
  );

  if (!hydrated) {
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export { AuthProvider, useAuth };
