import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Provider } from 'react-redux';
import { store } from './app/store';
import { theme, darkTheme } from './theme/theme';
import { AppRouter } from './AppRouter';
import { useAppSelector } from './app/hooks';

function AppContent() {
  const themeMode = useAppSelector((state) => state.ui.themeMode);
  const currentTheme = themeMode === 'dark' ? darkTheme : theme;

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <AppRouter />
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
