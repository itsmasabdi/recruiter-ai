import { MyStateCreator } from './store';

export type UiSlice = {
  instructions: string | null;
  memory: string | null;
  resume: string | null;
  actions: {
    setInstructions: (instructions: string) => void;
    setMemory: (memory: string) => void;
    setResume: (resume: string) => void;
  };
};
export const createUiSlice: MyStateCreator<UiSlice> = (set) => ({
  instructions: null,
  memory: '',
  resume: '',
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
    setResume: (resume: string) => {
      set((state) => {
        state.ui.resume = resume;
      });
    },
  },
});
