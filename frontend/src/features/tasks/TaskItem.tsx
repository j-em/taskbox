import {
  ListItem,
  ListItemText,
  ListItemButton,
  Chip,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  PlayCircle as InProgressIcon,
  CheckCircle as DoneIcon,
  Cancel as CancelledIcon,
  CircleOutlined as TodoIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Link } from 'react-router';
import { useUpdateTaskMutation, useDeleteTaskMutation } from './tasksApi';
import type { Task, Status } from '../../types';

interface TaskItemProps {
  task: Task;
}

const statusConfig: Record<Status, { icon: React.ReactNode; color: 'default' | 'primary' | 'success' | 'error' }> = {
  TODO: { icon: <TodoIcon />, color: 'default' },
  IN_PROGRESS: { icon: <InProgressIcon />, color: 'primary' },
  DONE: { icon: <DoneIcon />, color: 'success' },
  CANCELLED: { icon: <CancelledIcon />, color: 'error' },
};

const statusLabels: Record<Status, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
  CANCELLED: 'Cancelled',
};

export function TaskItem({ task }: TaskItemProps) {
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const { icon, color } = statusConfig[task.status];

  const handleStatusChange = () => {
    const statusOrder: Status[] = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'];
    const currentIndex = statusOrder.indexOf(task.status);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
    updateTask({ id: task.id, status: nextStatus });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask(task.id);
    }
  };

  const scheduledDate = new Date(task.scheduledDate).toLocaleDateString();

  return (
    <ListItem
      role="listitem"
      disablePadding
      secondaryAction={
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Edit">
            <IconButton
              edge="end"
              aria-label="edit"
              component={Link}
              to={`/task/${task.id}/edit`}
              onClick={(e) => e.stopPropagation()}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              edge="end"
              aria-label="delete"
              onClick={handleDelete}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      }
    >
      <ListItemButton component={Link} to={`/task/${task.id}`}>
        <Tooltip title={`Change status (current: ${statusLabels[task.status]})`}>
          <IconButton
            edge="start"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleStatusChange();
            }}
            sx={{ mr: 2 }}
            color={color}
          >
            {icon}
          </IconButton>
        </Tooltip>
        <ListItemText
          primary={task.title}
          secondary={
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
              <Chip
                label={statusLabels[task.status]}
                color={color}
                size="small"
              />
              <span>{scheduledDate}</span>
              {task.tags.length > 0 && (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {task.tags.slice(0, 3).map((tag) => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                  ))}
                  {task.tags.length > 3 && (
                    <Chip label={`+${task.tags.length - 3}`} size="small" variant="outlined" />
                  )}
                </Box>
              )}
            </Box>
          }
        />
      </ListItemButton>
    </ListItem>
  );
}
