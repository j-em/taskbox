import {
  ListItem,
  ListItemText,
  ListItemButton,
  Chip,
  Box,
  IconButton,
  Tooltip,
  Checkbox,
} from '@mui/material';
import {
  PlayCircle as InProgressIcon,
  CheckCircle as DoneIcon,
  Cancel as CancelledIcon,
  CircleOutlined as TodoIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inbox as InboxIcon,
} from '@mui/icons-material';
import { Link } from 'react-router';
import type { Task, Status } from '../../types';

interface TaskListItemProps {
  task: Task;
  isSelected?: boolean;
  onClick?: () => void;
  onStatusChange?: (taskId: string, currentStatus: Status) => void;
  onDelete?: (taskId: string) => void;
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

export function TaskListItem({ task, isSelected = false, onClick, onStatusChange, onDelete }: TaskListItemProps) {
  const { icon, color } = statusConfig[task.status];

  const handleStatusChange = () => {
    onStatusChange?.(task.id, task.status);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(task.id);
  };

  const scheduledDate = task.scheduledDate
    ? new Date(task.scheduledDate).toLocaleDateString()
    : null;

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
              to={`/app/task/${task.id}/edit`}
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
      <ListItemButton component={Link} to={`/app/task/${task.id}`} onClick={onClick}>
        <Box onClick={(e) => e.stopPropagation()}>
          <Checkbox
            edge="start"
            checked={isSelected}
            onChange={() => onClick?.()}
            sx={{ mr: 1 }}
          />
        </Box>
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
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {task.title}
              {task.inInbox && (
                <Chip
                  icon={<InboxIcon />}
                  label="Inbox"
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              )}
            </Box>
          }
          secondary={
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
              <Chip
                label={statusLabels[task.status]}
                color={color}
                size="small"
                component="span"
              />
              {scheduledDate && <span>{scheduledDate}</span>}
              {task.tags.length > 0 && (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {task.tags.slice(0, 3).map((tag) => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" component="span" />
                  ))}
                  {task.tags.length > 3 && (
                    <Chip label={`+${task.tags.length - 3}`} size="small" variant="outlined" component="span" />
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
