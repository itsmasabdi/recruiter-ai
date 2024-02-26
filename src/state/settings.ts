import { MyStateCreator } from './store';

export type SettingsSlice = {
  openAIKey: string | null;
  selectedModel: string;
  page: string;
  actions: {
    update: (values: Partial<SettingsSlice>) => void;
  };
};
export const createSettingsSlice: MyStateCreator<SettingsSlice> = (set) => ({
  openAIKey: null,
  selectedModel: 'gpt-3.5-turbo',
  page: 'default',
  actions: {
    update: (values) => {
      set((state) => {
        state.settings = { ...state.settings, ...values };
      });
    },
  },
});
