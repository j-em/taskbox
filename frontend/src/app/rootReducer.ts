import { combineReducers } from '@reduxjs/toolkit';
import { tasksApi } from '../features/tasks/tasksApi';
import uiReducer from '../features/ui/uiSlice';

export const rootReducer = combineReducers({
  [tasksApi.reducerPath]: tasksApi.reducer,
  ui: uiReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
