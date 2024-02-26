import { MyStateCreator } from './store';

export type UiSlice = {
  instructions: string | null;
  memory: string | null;
  actions: {
    setInstructions: (instructions: string) => void;
    setMemory: (memory: string) => void;
  };
};
export const createUiSlice: MyStateCreator<UiSlice> = (set) => ({
  instructions: null,
  memory: '',
  actions: {
    setInstructions: (instructions) => {
      set((state) => {
        state.ui.instructions = instructions;
      });
    },
    setMemory: (memory: string) => {
      set((state) => {
        state.ui.memory = memory;
      });
    },
  },
});
