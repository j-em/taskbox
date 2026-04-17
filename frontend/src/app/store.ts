import { configureStore } from '@reduxjs/toolkit';
import { tasksApi } from '../features/tasks/tasksApi';
import { rootReducer, type RootState } from './rootReducer';

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(tasksApi.middleware),
});

export type { RootState };
export type AppDispatch = typeof store.dispatch;
