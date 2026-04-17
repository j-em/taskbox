import { useState } from 'react';
import { Typography, Box, Button, Alert } from '@mui/material';
import { Add as AddIcon, MoveToInbox as InboxIcon } from '@mui/icons-material';
import { Link } from 'react-router';
import { TaskList } from '../features/tasks/TaskList';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useGetTasksQuery } from '../features/tasks/tasksApi';

export function Inbox() {
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  const { data, isLoading, error } = useGetTasksQuery({ inInbox: true });

  const handleTaskSelect = (taskId: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  return (
    <>
      <title>{'Taskbox | Inbox'}</title>
      <meta name="description" content="View and manage your inbox tasks" />
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Inbox
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<InboxIcon />}
            component={Link}
            to="/app/task/new?inbox=true"
            aria-label="Quick Add to Inbox"
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
    </>
  );
}
