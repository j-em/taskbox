import {
  AppBar as MuiAppBar,
  Toolbar,
  IconButton,
  Box,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { toggleSidebar, toggleTheme } from '../features/ui/uiSlice';
import { Link } from 'react-router';
import { Logo } from './Logo';

export function AppBar() {
  const dispatch = useAppDispatch();
  const themeMode = useAppSelector((state) => state.ui.themeMode);

  return (
    <MuiAppBar position="fixed" role="banner">
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="toggle sidebar"
          edge="start"
          onClick={() => dispatch(toggleSidebar())}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
            <Logo width={160} variant="dark" />
          </Link>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            color="inherit"
            component={Link}
            to="/"
          >
            Tasks
          </Button>
          <IconButton
            color="inherit"
            aria-label={`Switch to ${themeMode === 'light' ? 'dark' : 'light'} mode`}
            onClick={() => dispatch(toggleTheme())}
          >
            {themeMode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Box>
      </Toolbar>
    </MuiAppBar>
  );
}
