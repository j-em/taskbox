import { createBrowserRouter, RouterProvider, Navigate } from 'react-router';
import { Root } from './routes/Root';
import { Home } from './routes/Home';
import { Inbox } from './routes/Inbox';
import { Today } from './routes/Today';
import { Anytime } from './routes/Anytime';
import { TaskDetail } from './routes/TaskDetail';
import { TaskEditor } from './routes/TaskEditor';
import { NotFound } from './routes/NotFound';

export function AppRouter() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <Navigate to="/app/home" replace />,
    },
    {
      path: '/app',
      element: <Root />,
      children: [
        { path: 'home', element: <Home /> },
        { path: 'inbox', element: <Inbox /> },
        { path: 'today', element: <Today /> },
        { path: 'anytime', element: <Anytime /> },
        { path: 'task/new', element: <TaskEditor /> },
        { path: 'task/:taskId', element: <TaskDetail /> },
        { path: 'task/:taskId/edit', element: <TaskEditor /> },
        { index: true, element: <Navigate to="home" replace /> },
        { path: '*', element: <NotFound /> },
      ],
    },
    // Catch-all for any non-matching routes
    {
      path: '*',
      element: <NotFound />,
    },
  ]);

  return <RouterProvider router={router} />;
}
