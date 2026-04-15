import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { TaskView } from '../../types';

interface UIState {
  sidebarOpen: boolean;
  themeMode: 'light' | 'dark';
  currentView: TaskView;
}

const initialState: UIState = {
  sidebarOpen: false,
  themeMode: 'light',
  currentView: 'all',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleTheme: (state) => {
      state.themeMode = state.themeMode === 'light' ? 'dark' : 'light';
    },
    setThemeMode: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.themeMode = action.payload;
    },
    setCurrentView: (state, action: PayloadAction<TaskView>) => {
      state.currentView = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleTheme,
  setThemeMode,
  setCurrentView,
} = uiSlice.actions;

export default uiSlice.reducer;
