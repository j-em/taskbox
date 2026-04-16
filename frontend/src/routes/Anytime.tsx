import { useState } from 'react';
import { Typography, Box, Button, Alert } from '@mui/material';
import { Add as AddIcon, WatchLater } from '@mui/icons-material';
import { Link } from 'react-router';
import { TaskList } from '../features/tasks/TaskList';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useGetTasksQuery } from '../features/tasks/tasksApi';

export function Anytime() {
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  const { data, isLoading, error } = useGetTasksQuery({ scheduledDate: null });

  const handleTaskSelect = (taskId: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Anytime
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<WatchLater />}
            component={Link}
            to="/app/task/new"
            aria-label="Quick Add for Anytime"
          >
            Quick Add
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={Link}
            to="/app/task/new"
            aria-label="Add Task"
          >
            Add Task
          </Button>
        </Box>
      </Box>

      {isLoading && <LoadingSpinner />}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load tasks. Please try again later.
        </Alert>
      )}

      {!isLoading && !error && data && (
        <TaskList
          tasks={data.data}
          selectedTasks={selectedTasks}
          onTaskSelect={handleTaskSelect}
        />
      )}
    </Box>
  );
}
