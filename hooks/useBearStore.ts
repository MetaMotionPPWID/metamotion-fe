import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface BearState {
  currentHand: "left" | "right";
  setCurrentHand: (hand: "left" | "right") => void;

  currentLabel: "sitting" | "walking" | "running";
  setCurrentLabel: (label: "sitting" | "walking" | "running") => void;
}

export const useBearStore = create<BearState>()(
  devtools(
    persist(
      (set) => ({
        currentHand: "left",
        setCurrentHand: (hand) => set({ currentHand: hand }),

        currentLabel: "sitting",
        setCurrentLabel: (label) => set({ currentLabel: label }),
      }),
      {
        name: "samples-metadata-storage",
      },
    ),
  ),
);
