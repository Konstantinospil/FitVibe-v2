import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

// Detect system preference
const getSystemTheme = (): Theme => {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
};

// Apply theme to document
const applyTheme = (theme: Theme) => {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", theme);
  }
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: getSystemTheme(),
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      toggleTheme: () => {
        const newTheme = get().theme === "light" ? "dark" : "light";
        applyTheme(newTheme);
        set({ theme: newTheme });
      },
    }),
    {
      name: "fitvibe:theme",
      version: 1,
      onRehydrateStorage: () => (state) => {
        // Apply theme on page load after rehydration
        if (state) {
          applyTheme(state.theme);
        }
      },
    },
  ),
);
