
import { create } from 'zustand';

// Define the store's state type
export interface SIQSStore {
  score: number | null;
  setScore: (score: number | null) => void;
  getScore: () => number | null;
}

// Create the store with proper types
export const useSiqsStore = create<SIQSStore>((set, get) => ({
  score: null,
  setScore: (score) => set({ score }),
  getScore: () => get().score,
}));
