import { Typography, Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Paper, Divider } from '@mui/material';
import { Info as InfoIcon, ArrowForwardIos as ChevronRightIcon } from '@mui/icons-material';
import { Link } from 'react-router';

const settingsItems = [
  {
    label: 'About',
    description: 'App information, version, and credits',
    icon: <InfoIcon />,
    href: '/app/settings/about',
  },
];

export function Settings() {
  return (
    <>
      <title>{'Taskbox | Settings'}</title>
      <meta name="description" content="Configure Taskbox settings" />
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Settings
      </Typography>

      <Paper elevation={1}>
        <List>
          {settingsItems.map((item, index) => (
            <Box key={item.label}>
              <ListItem disablePadding>
                <ListItemButton component={Link} to={item.href}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    secondary={item.description}
                    slotProps={{ primary: { sx: { fontWeight: 500 } } }}
                  />
                  <ChevronRightIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </ListItemButton>
              </ListItem>
              {index < settingsItems.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      </Paper>
    </Box>
    </>
  );
}
