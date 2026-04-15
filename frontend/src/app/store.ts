import { configureStore } from '@reduxjs/toolkit';
import { tasksApi } from '../features/tasks/tasksApi';
import uiReducer from '../features/ui/uiSlice';

export const store = configureStore({
  reducer: {
    [tasksApi.reducerPath]: tasksApi.reducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(tasksApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
