import { Typography, Box, Button, Alert } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { Link, useSearchParams } from 'react-router';
import { TasksList } from '../features/tasks/TasksList';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useGetTasksQuery } from '../features/tasks/tasksApi';
import type { Status } from '../types';

export function Home() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status') as Status | null;

  const { data, isLoading, error } = useGetTasksQuery(status ? { status } : {});

  const getTitle = () => {
    if (!status) return 'All Tasks';
    switch (status) {
      case 'TODO':
        return 'To Do';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'DONE':
        return 'Done';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return 'Tasks';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {getTitle()}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={Link}
          to="/task/new"
          aria-label="Add Task"
        >
          Add Task
        </Button>
      </Box>

      {isLoading && <LoadingSpinner />}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load tasks. Please try again later.
        </Alert>
      )}

      {!isLoading && !error && data && (
        <TasksList tasks={data.data} />
      )}
    </Box>
  );
}
