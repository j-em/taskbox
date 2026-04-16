import { useParams, useNavigate, Link } from 'react-router';
import {
  Typography,
  Paper,
  Box,
  Chip,
  Button,
  Alert,
  Divider,
  Grid,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { useGetTaskQuery, useDeleteTaskMutation } from '../features/tasks/tasksApi';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useState } from 'react';

const statusColors = {
  TODO: 'default',
  IN_PROGRESS: 'primary',
  DONE: 'success',
  CANCELLED: 'error',
} as const;

export function TaskDetail() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: task, isLoading, error } = useGetTaskQuery(taskId || '', {
    skip: !taskId,
  });
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();

  const handleDelete = async () => {
    if (!taskId || !confirm('Are you sure you want to delete this task?')) return;
    
    try {
      setDeleteError(null);
      await deleteTask(taskId).unwrap();
      navigate('/');
    } catch (err) {
      setDeleteError('Failed to delete task. Please try again.');
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !task) {
    return (
      <Alert severity="error">
        Task not found or failed to load.
        <Button component={Link} to="/" sx={{ ml: 2 }}>
          Back to Tasks
        </Button>
      </Alert>
    );
  }

  return (
    <Box>
      <Button
        component={Link}
        to="/"
        startIcon={<BackIcon />}
        sx={{ mb: 2 }}
      >
        Back to Tasks
      </Button>

      {deleteError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {deleteError}
        </Alert>
      )}

      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h4" component="h1">
            {task.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              component={Link}
              to={`/app/task/${task.id}/edit`}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
              disabled={isDeleting}
            >
              Delete
            </Button>
          </Box>
        </Box>

        <Chip
          label={task.status}
          color={statusColors[task.status]}
          sx={{ mb: 2 }}
        />

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Typography variant="body1">
              {task.description || 'No description provided.'}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Scheduled Date
            </Typography>
            <Typography variant="body1">
              {new Date(task.scheduledDate).toLocaleDateString()}
            </Typography>
          </Grid>

          {task.tags.length > 0 && (
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Tags
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {task.tags.map((tag) => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                ))}
              </Box>
            </Grid>
          )}

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Created
            </Typography>
            <Typography variant="body1">
              {new Date(task.createdAt).toLocaleString()}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Last Updated
            </Typography>
            <Typography variant="body1">
              {new Date(task.updatedAt).toLocaleString()}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
