import { Typography, Box, Paper, List, ListItem, ListItemText, Divider, IconButton, Stack } from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { Link } from 'react-router';

// App information - could be loaded from package.json or environment in production
const appInfo = {
  name: 'Taskbox',
  version: '0.0.0',
  description: 'Task Management',
  author: 'Taskbox Team',
};

export function SettingsAbout() {
  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton component={Link} to="/app/settings" aria-label="Back to Settings">
          <BackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          About
        </Typography>
      </Stack>

      <Paper elevation={1}>
        <List>
          <ListItem>
            <ListItemText
              primary={appInfo.name}
              secondary="App Name"
              slotProps={{
                primary: { variant: 'body1', sx: { fontWeight: 500 } },
                secondary: { color: 'text.secondary', variant: 'body2' },
              }}
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText
              primary={appInfo.version}
              secondary="Version"
              slotProps={{
                primary: { variant: 'body1', sx: { fontWeight: 500 } },
                secondary: { color: 'text.secondary', variant: 'body2' },
              }}
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText
              primary={appInfo.description}
              secondary="Description"
              slotProps={{
                primary: { variant: 'body1', sx: { fontWeight: 500 } },
                secondary: { color: 'text.secondary', variant: 'body2' },
              }}
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText
              primary={appInfo.author}
              secondary="Author"
              slotProps={{
                primary: { variant: 'body1', sx: { fontWeight: 500 } },
                secondary: { color: 'text.secondary', variant: 'body2' },
              }}
            />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
}
