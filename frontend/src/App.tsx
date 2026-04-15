import { createBrowserRouter, RouterProvider } from 'react-router';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Provider } from 'react-redux';
import { store } from './app/store';
import { theme, darkTheme } from './theme/theme';
import { Root } from './routes/Root';
import { Home } from './routes/Home';
import { TaskDetail } from './routes/TaskDetail';
import { TaskForm } from './routes/TaskForm';
import { NotFound } from './routes/NotFound';
import { useAppSelector } from './app/hooks';

function AppContent() {
  const themeMode = useAppSelector((state) => state.ui.themeMode);
  const currentTheme = themeMode === 'dark' ? darkTheme : theme;

  const router = createBrowserRouter([
    {
      path: '/',
      element: <Root />,
      children: [
        { index: true, element: <Home /> },
        { path: 'task/new', element: <TaskForm /> },
        { path: 'task/:taskId', element: <TaskDetail /> },
        { path: 'task/:taskId/edit', element: <TaskForm /> },
        { path: '*', element: <NotFound /> },
      ],
    },
  ]);

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
