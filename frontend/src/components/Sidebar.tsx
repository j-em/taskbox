import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import {
  Inbox as InboxIcon,
  Assignment as TodoIcon,
  PlayCircle as InProgressIcon,
  CheckCircle as DoneIcon,
  Cancel as CancelledIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { setSidebarOpen, setCurrentView } from '../features/ui/uiSlice';
import type { TaskView } from '../types';

const DRAWER_WIDTH = 240;

interface SidebarItem {
  label: string;
  view: TaskView;
  icon: React.ReactNode;
  href: string;
}

const sidebarItems: SidebarItem[] = [
  { label: 'All Tasks', view: 'all', icon: <InboxIcon />, href: '/' },
  { label: 'To Do', view: 'todo', icon: <TodoIcon />, href: '/?status=TODO' },
  { label: 'In Progress', view: 'in_progress', icon: <InProgressIcon />, href: '/?status=IN_PROGRESS' },
  { label: 'Done', view: 'done', icon: <DoneIcon />, href: '/?status=DONE' },
  { label: 'Cancelled', view: 'cancelled', icon: <CancelledIcon />, href: '/?status=CANCELLED' },
];

export function Sidebar() {
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen);
  const location = useLocation();

  const handleClose = () => {
    dispatch(setSidebarOpen(false));
  };

  const handleItemClick = (view: TaskView) => {
    dispatch(setCurrentView(view));
    if (window.innerWidth < 600) {
      handleClose();
    }
  };

  const drawerContent = (
    <Box sx={{ width: DRAWER_WIDTH }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" component="div">
          Taskbox
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Task Management
        </Typography>
      </Box>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            to="/task/new"
            onClick={() => handleClose()}
          >
            <ListItemIcon>
              <AddIcon />
            </ListItemIcon>
            <ListItemText primary="New Task" />
          </ListItemButton>
        </ListItem>
        <Divider sx={{ my: 1 }} />
        {sidebarItems.map((item) => (
          <ListItem key={item.view} disablePadding>
            <ListItemButton
              component={Link}
              to={item.href}
              onClick={() => handleItemClick(item.view)}
              selected={location.search === item.href.replace('/', '')}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Drawer
      variant="temporary"
      open={sidebarOpen}
      onClose={handleClose}
      ModalProps={{
        keepMounted: true,
      }}
      sx={{
        '& .MuiDrawer-paper': {
          boxSizing: 'border-box',
          width: DRAWER_WIDTH,
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
