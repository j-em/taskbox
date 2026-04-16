import { createBrowserRouter, RouterProvider } from 'react-router';
import { Root } from './routes/Root';
import { Home } from './routes/Home';
import { TaskDetail } from './routes/TaskDetail';
import { TaskEditor } from './routes/TaskEditor';
import { NotFound } from './routes/NotFound';

export function AppRouter() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <Root />,
      children: [
        { index: true, element: <Home /> },
        { path: 'task/new', element: <TaskEditor /> },
        { path: 'task/:taskId', element: <TaskDetail /> },
        { path: 'task/:taskId/edit', element: <TaskEditor /> },
        { path: '*', element: <NotFound /> },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}
