import { create } from "zustand";
import { persist } from "zustand/middleware";

type UIMode = "dev" | "regular";

interface UIState {
  currentMode: UIMode;
  sidebarOpen: boolean;
  setMode: (mode: UIMode) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      currentMode: "regular",
      sidebarOpen: false,
      setMode: (mode) => set({ currentMode: mode }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: "ui-storage",
    }
  )
);
