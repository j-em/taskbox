import { Box, Toolbar, Container } from '@mui/material';
import { AppBar } from '../../components/AppBar';
import { Sidebar } from '../../components/Sidebar';
import { Outlet } from 'react-router';

export function Layout() {
  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}
