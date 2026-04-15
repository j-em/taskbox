import { Typography, Paper, Button, Box } from '@mui/material';
import { Link } from 'react-router';

export function NotFound() {
  return (
    <Box sx={{ textAlign: 'center', mt: 8 }}>
      <Paper sx={{ p: 6, maxWidth: 500, mx: 'auto' }}>
        <Typography variant="h1" component="h1" gutterBottom>
          404
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom>
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          The page you are looking for does not exist.
        </Typography>
        <Button
          variant="contained"
          component={Link}
          to="/"
        >
          Go Home
        </Button>
      </Paper>
    </Box>
  );
}
