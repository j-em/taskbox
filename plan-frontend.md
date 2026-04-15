# Taskbox Frontend Plan

## Overview
React + TypeScript SPA using Vite, Material UI v9, Redux Toolkit, and React Router v7.

## Directory Structure
```
frontend/
├── public/                 # Static assets
├── src/
│   ├── main.tsx           # Entry point
│   ├── App.tsx            # Root component with router
│   ├── app/
│   │   ├── store.ts       # Redux store configuration
│   │   ├── hooks.ts       # Typed Redux hooks (useAppDispatch, useAppSelector)
│   │   └── rootReducer.ts # Root reducer combining all slices
│   ├── features/          # Feature-based folder structure
│   │   ├── tasks/
│   │   │   ├── tasksApi.ts        # RTK Query API for tasks
│   │   │   ├── TasksList.tsx      # Component: list of tasks
│   │   │   ├── TaskItem.tsx       # Component: single task
│   │   │   └── TaskForm.tsx       # Component: create/edit task
│   │   └── ui/
│   │       ├── uiSlice.ts         # UI state (sidebar, theme, etc.)
│   │       └── Layout.tsx         # App shell with MUI components
│   ├── components/        # Shared reusable components
│   │   ├── AppBar.tsx
│   │   ├── Sidebar.tsx
│   │   └── LoadingSpinner.tsx
│   ├── routes/            # Route components
│   │   ├── Root.tsx       # Root layout with navigation
│   │   ├── Home.tsx       # Dashboard / task list
│   │   ├── TaskDetail.tsx # Individual task view
│   │   └── NotFound.tsx   # 404 page
│   ├── theme/             # MUI theme configuration
│   │   └── theme.ts
│   └── types/             # Global TypeScript types
│       └── index.ts
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Technology Stack

### Core
- **Vite** v6+ with @vitejs/plugin-react for fast dev/build
- **React** v19+ with TypeScript
- **TypeScript** strict mode enabled

### UI Framework
- **Material UI (MUI)** v9 (@mui/material, @mui/icons-material)
- **Emotion** (MUI v9's styling engine: @emotion/react, @emotion/styled)
- CSS-in-JS via Emotion for component styles

### State Management
- **Redux Toolkit** (@reduxjs/toolkit) v2+
- **RTK Query** (@reduxjs/toolkit) - Data fetching and caching
- **React-Redux** v9+
- Redux DevTools configuration for debugging

### Routing
- **React Router** v7 (@react-router/dev, react-router)
- Declarative API with `Route` components in JSX
- Data router with `createBrowserRouter` (or `createHashRouter` for static export)

### Build Output
- Static SPA export via `vite build`
- Output directory: `dist/` (configured in vite.config.ts)
- Base path: `/` (configurable for deployment)

## Implementation Steps

### Phase 1: Project Setup
1. Initialize Vite project with React TypeScript template:
   ```bash
   npm create vite@latest frontend -- --template react-ts
   cd frontend
   npm install
   ```

2. Install core dependencies:
   ```bash
   npm install @mui/material@^9.0.0 @emotion/react @emotion/styled
   npm install @mui/icons-material@^9.0.0
   npm install @reduxjs/toolkit react-redux
   npm install react-router@^7.0.0 @react-router/dev
   ```

3. Configure Vite for static export (vite.config.ts):
   - Set `base: '/'` (or deployment-specific path)
   - Configure build.outDir as 'dist'
   - Enable rollupOptions for SPA fallback
   - Add @react-router/dev plugin for React Router v7

### Phase 2: Foundation Architecture

#### Redux Store Setup (src/app/store.ts)
- Configure store using `configureStore` from Redux Toolkit
- Add RTK Query API middleware for caching and auto-refetching
- Enable Redux DevTools in development (RTK Query DevTools integration)
- Create typed hooks: `useAppDispatch`, `useAppSelector`

#### RTK Query API Pattern (src/features/tasks/tasksApi.ts)
- Define API using `createApi` from Redux Toolkit
- Configure base URL via `fetchBaseQuery`
- Define endpoints with `builder.query()` and `builder.mutation()`
- RTK Query handles: caching, deduplication, polling, optimistic updates
- Tag types for automatic cache invalidation (`providesTags` / `invalidatesTags`)

#### UI Slice (src/features/ui/uiSlice.ts)
- State: `{ sidebarOpen: boolean, themeMode: 'light'|'dark' }`
- Reducers: toggleSidebar, setThemeMode

### Phase 3: Material UI v9 Integration

#### Theme Configuration (src/theme/theme.ts)
- Create theme using `createTheme` from @mui/material/styles v9
- Configure color palette (primary, secondary, error, warning, info, success)
- Set typography defaults
- Support light/dark mode via `palette.mode`
- Export `ThemeProvider` wrapper

#### App Shell (src/features/ui/Layout.tsx)
- MUI AppBar (top navigation)
- MUI Drawer (collapsible sidebar)
- MUI Container (main content area)
- Responsive design with MUI's sx prop and breakpoints

#### Component Patterns
- Use MUI v9's updated component APIs:
  - `Button` with `variant`, `color`, `size` props
  - `TextField` for inputs with proper labeling
  - `Checkbox` for task states
  - `IconButton` for actions (pin, delete)
  - `List`, `ListItem`, `ListItemText` for task lists
  - `Paper` for cards/containers
  - `Typography` for all text
  - `Box` and `Stack` for layout
  - `Chip` for task status indicators
- Styling via `sx` prop (primary) or `styled()` API
- Use MUI's `cssVariables` for dynamic theming support

### Phase 4: React Router v7 Setup

#### Router Configuration (src/App.tsx)
Use declarative API with data router:

```tsx
import { createBrowserRouter, RouterProvider, Route } from 'react-router';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      { index: true, element: <Home /> },
      { path: 'task/:taskId', element: <TaskDetail /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}
```

For static export, use `createHashRouter` or configure server for SPA fallback.

#### Route Components
- **Root.tsx**: Layout with sidebar, app bar, outlet for children
- **Home.tsx**: Task list view with filters (inbox, pinned, archived)
- **TaskDetail.tsx**: Individual task view with edit capability
- **NotFound.tsx**: 404 page with MUI styling

#### Navigation
- Use `Link` and `NavLink` from react-router
- Active route styling via NavLink's `isActive` state
- Programmatic navigation via `useNavigate` hook

### Phase 5: Tasks Feature Implementation

#### TasksList Component
- Uses RTK Query hook: `const { data: tasks, isLoading, error } = useGetTasksQuery()`
- Displays tasks using MUI `List` and `ListItem`
- Implements filters: All Tasks, Inbox (unarchived), Pinned, Archived
- Loading state with MUI `Skeleton` or `CircularProgress` (isLoading from RTK Query)
- Error state handled via RTK Query error object
- Empty state with MUI `Paper` and `Typography`

#### TaskItem Component
- Props: `task: Task` from parent
- MUI `Checkbox` for selection
- MUI `IconButton` for pin action (star icon)
- Uses RTK Query mutation: `const [updateTask] = useUpdateTaskMutation()`
- Optimistic updates via RTK Query's `onQueryStarted` lifecycle in API definition
- Click handler to navigate to detail view

#### TaskForm Component
- Used in modal or dedicated page for create/edit
- MUI `TextField` for title, description
- MUI `Select` for status/priority
- Form validation with MUI error states
- Uses RTK Query mutations: `const [addTask] = useAddTaskMutation()` or `useUpdateTaskMutation()`
- On success, form resets and cache auto-invalidates

#### RTK Query API Definition (src/features/tasks/tasksApi.ts)
- Centralized API definition using `createApi`
- Endpoints:
  - `getTasks`: GET /tasks (query)
  - `getTask`: GET /tasks/:id (query)
  - `addTask`: POST /tasks (mutation)
  - `updateTask`: PATCH /tasks/:id (mutation)
  - `deleteTask`: DELETE /tasks/:id (mutation)
- Tag types: `Task` for cache invalidation
- Base URL from `VITE_API_URL` env variable via `fetchBaseQuery`

### Phase 6: Build & Deployment

#### Vite Configuration for Static Export
```ts
// vite.config.ts
export default defineConfig({
  base: '/', // or '/taskbox/' for subpath deployment
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
```

#### Build Scripts (package.json)
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit"
  }
}
```

#### Output
- Single-page application in `dist/` folder
- `index.html` with injected script tags
- Static assets hashed for caching
- Ready for deployment to any static host

## State Management Patterns

### RTK Query API Pattern
Define the tasks API using `createApi`:
```ts
export const tasksApi = createApi({
  reducerPath: 'tasksApi',
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_URL }),
  tagTypes: ['Task'],
  endpoints: (builder) => ({
    getTasks: builder.query<Task[], void>({
      query: () => '/tasks',
      providesTags: (result) =>
        result ? result.map(({ id }) => ({ type: 'Task', id })) : ['Task'],
    }),
    getTask: builder.query<Task, string>({
      query: (id) => `/tasks/${id}`,
      providesTags: (result, error, id) => [{ type: 'Task', id }],
    }),
    addTask: builder.mutation<Task, Partial<Task>>({
      query: (body) => ({
        url: '/tasks',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Task'],
    }),
    updateTask: builder.mutation<Task, Partial<Task> & { id: string }>({
      query: ({ id, ...patch }) => ({
        url: `/tasks/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Task', id }],
    }),
    deleteTask: builder.mutation<void, string>({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Task', id }],
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
```

### Store Configuration with RTK Query
```ts
export const store = configureStore({
  reducer: {
    [tasksApi.reducerPath]: tasksApi.reducer,
    ui: uiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(tasksApi.middleware),
});
```

### Component Connection Pattern (RTK Query)
```tsx
function TasksList() {
  const { data: tasks, isLoading, error } = useGetTasksQuery();
  const [updateTask] = useUpdateTaskMutation();

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">Failed to load tasks</Alert>;

  return (
    <List>
      {tasks?.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onPin={() => updateTask({ ...task, state: 'TASK_PINNED' })}
        />
      ))}
    </List>
  );
}
```

### Optimistic Updates with RTK Query
Configure in API definition for instant UI feedback:
```ts
updateTask: builder.mutation<Task, Partial<Task> & { id: string }>({
  query: ({ id, ...patch }) => ({
    url: `/tasks/${id}`,
    method: 'PATCH',
    body: patch,
  }),
  async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled }) {
    const patchResult = dispatch(
      tasksApi.util.updateQueryData('getTasks', undefined, (draft) => {
        const task = draft.find((t) => t.id === id);
        if (task) Object.assign(task, patch);
      })
    );
    try {
      await queryFulfilled;
    } catch {
      patchResult.undo();
    }
  },
  invalidatesTags: (result, error, { id }) => [{ type: 'Task', id }],
}),
```

## TypeScript Configuration

### Global Types (src/types/index.ts)
```ts
export interface Task {
  id: string;
  title: string;
  description?: string;
  state: 'TASK_INBOX' | 'TASK_PINNED' | 'TASK_ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export type TaskState = Task['state'];
```

### Redux Types (src/app/hooks.ts)
```ts
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

### Strict TypeScript
- Enable strict mode in tsconfig.json
- No `any` types in feature code
- Proper typing for all Redux slices and thunks
- MUI components typed via @mui/material types

## Development Workflow

1. **Start dev server**: `npm run dev` (Vite HMR)
2. **Type checking**: `npm run type-check` (parallel to dev/build)
3. **Build for production**: `npm run build`
4. **Preview production**: `npm run preview`

## Integration with Backend

- Base API URL from environment: `VITE_API_URL`
- RTK Query `fetchBaseQuery` configured in tasksApi.ts
- RTK Query automatically handles loading states, errors, retries, and caching
- Cache invalidation via tag types ensures data consistency
- CORS configured on backend for local dev

## Next Steps After Foundation

1. Implement task CRUD UI components
2. Add search and filtering
3. Implement optimistic updates
4. Add error boundaries (MUI error fallback)
5. Add loading skeletons
6. Dark mode toggle
7. Responsive mobile layout
8. Unit tests with Vitest + React Testing Library
9. E2E tests with Playwright

---

## E2E Testing with Playwright

### Setup

Add Playwright to dev dependencies:
```json
{
  "devDependencies": {
    "@playwright/test": "^1.40.0"
  },
  "scripts": {
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui"
  }
}
```

Configure `playwright.config.ts`:
- Start Vite dev server (or `vite preview` for production-like testing)
- Set `VITE_API_URL` to point to test backend or use API mocking
- Test against Chromium, Firefox, WebKit

### Core E2E Tests

Three essential tests covering critical user journeys:

#### Test 1: Task List Loading & Navigation
Tests app loading, API data fetching, and route navigation.

```typescript
test('task list loads and navigation works', async ({ page }) => {
  await page.goto('/');
  
  // Verify MUI App shell renders
  await expect(page.getByRole('banner')).toBeVisible();
  await expect(page.getByText(/taskbox|tasks/i)).toBeVisible();
  
  // Wait for RTK Query loading state → data
  await expect(page.getByRole('progressbar')).not.toBeVisible({ timeout: 5000 });
  await expect(page.getByRole('list')).toBeVisible();
  
  // Test navigation to task detail
  const firstTask = page.getByRole('listitem').first();
  if (await firstTask.isVisible()) {
    await firstTask.click();
    await expect(page).toHaveURL(/\/task\/\w+/);
    await expect(page.getByRole('heading')).toBeVisible();
  }
});
```

#### Test 2: Create and Pin a Task
Tests task creation flow and state mutation with optimistic updates.

```typescript
test('create and pin a task', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('progressbar')).not.toBeVisible();
  
  // Open create task form
  await page.getByRole('button', { name: /add|create|new/i }).click();
  
  // Fill MUI form fields
  await page.getByLabel(/title/i).fill('Test Task from E2E');
  await page.getByLabel(/description/i).fill('This is a test task');
  await page.getByRole('button', { name: /save|create|submit/i }).click();
  
  // Verify task appears (RTK Query cache invalidation)
  await expect(page.getByText('Test Task from E2E')).toBeVisible();
  
  // Pin the task
  const taskItem = page.getByText('Test Task from E2E').locator('..').locator('..');
  const pinButton = taskItem.getByRole('button', { name: /pin|star/i });
  await pinButton.click();
  
  // Verify pinned state
  await expect(pinButton).toHaveAttribute('aria-pressed', 'true');
});
```

#### Test 3: Archive and Filter Tasks
Tests state transitions (archiving), sidebar navigation, and filtering between views.

```typescript
test('archive task and filter views', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('progressbar')).not.toBeVisible();
  
  // Archive first task
  const firstTask = page.getByRole('listitem').first();
  await expect(firstTask).toBeVisible();
  const taskTitle = await firstTask.textContent();
  
  await firstTask.getByRole('button', { name: /archive|checkbox/i }).click();
  await expect(page.getByText(taskTitle!)).not.toBeVisible();
  
  // Navigate to Archived via sidebar
  await page.getByRole('link', { name: /archived/i }).click();
  await expect(page).toHaveURL(/\/archived|state=archived/);
  await expect(page.getByText(taskTitle!)).toBeVisible();
  
  // Switch to Pinned view
  await page.getByRole('link', { name: /pinned/i }).click();
  await expect(page).toHaveURL(/\/pinned|state=pinned/);
  await expect(page.getByRole('list')).toBeVisible();
});
```

### What These Tests Verify

These 3 tests cover the **complete stack**:
- **React Router v7**: Route transitions, URL params, navigation state
- **RTK Query**: Data fetching, caching, mutations, cache invalidation
- **Material UI v9**: Component rendering, form interactions, loading states
- **Redux State**: Optimistic updates, state transitions (pin/archive)
- **Integration**: Frontend ↔ Backend API communication
