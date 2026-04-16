import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Task, CreateTaskInput, UpdateTaskInput, PaginatedResponse, ListTasksFilters } from '../../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api/v1';

export const tasksApi = createApi({
  reducerPath: 'tasksApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_URL }),
  tagTypes: ['Task'],
  endpoints: (builder) => ({
    getTasks: builder.query<PaginatedResponse<Task>, ListTasksFilters | void>({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters) {
          if (filters.status) params.append('status', filters.status);
          if (filters.scheduledDate) params.append('scheduledDate', filters.scheduledDate);
          if (filters.tag) params.append('tag', filters.tag);
          if (filters.search) params.append('search', filters.search);
          if (filters.inInbox !== undefined) params.append('inInbox', String(filters.inInbox));
        }
        return `/tasks?${params.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Task' as const, id })),
              'Task',
            ]
          : ['Task'],
    }),
    getTask: builder.query<Task, string>({
      query: (id) => `/tasks/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Task', id }],
    }),
    addTask: builder.mutation<Task, CreateTaskInput>({
      query: (body) => ({
        url: '/tasks',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Task'],
    }),
    updateTask: builder.mutation<Task, Partial<UpdateTaskInput> & { id: string }>({
      query: ({ id, ...patch }) => ({
        url: `/tasks/${id}`,
        method: 'PUT',
        body: patch,
      }),
      async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled }) {
        // Optimistically update both the list and the individual task
        const patchListResult = dispatch(
          tasksApi.util.updateQueryData('getTasks', undefined, (draft) => {
            const task = draft.data.find((t) => t.id === id);
            if (task) Object.assign(task, patch);
          })
        );
        const patchTaskResult = dispatch(
          tasksApi.util.updateQueryData('getTask', id, (draft) => {
            Object.assign(draft, patch);
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchListResult.undo();
          patchTaskResult.undo();
        }
      },
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Task', id }, 'Task'],
    }),
    deleteTask: builder.mutation<void, string>({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Task', id }],
    }),
  }),
});

export const {
  useGetTasksQuery,
  useGetTaskQuery,
  useAddTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} = tasksApi;
