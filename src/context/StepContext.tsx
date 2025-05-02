import { create } from "zustand"

interface StepState {
    step: number
    next: () => void
    prev: () => void
    move: (by: number) => void
}

export const useStepStore = create<StepState>((set) => ({
    step: 1,
    next: () => set((state) => ({ step: state.step >= 5 ? 5 : state.step + 1 })),
    prev: () => set((state) => ({ step: state.step <= 1 ? state.step : state.step - 1 })),
    move: (by) => set({ step: by }),
}))