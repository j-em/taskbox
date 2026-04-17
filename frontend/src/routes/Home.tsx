import { useState } from 'react';
import { Typography, Box, Button, Alert } from '@mui/material';
import { Add as AddIcon, MoveToInbox as InboxIcon } from '@mui/icons-material';
import { Link, useSearchParams } from 'react-router';
import { TaskList } from '../features/tasks/TaskList';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useGetTasksQuery } from '../features/tasks/tasksApi';
import type { Status } from '../types';

export function Home() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status') as Status | null;
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  const filters = status ? { status } : {};
  const { data, isLoading, error } = useGetTasksQuery(filters);

  const handleTaskSelect = (taskId: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

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

  const pageTitle = getTitle();

  return (
    <>
      <title>{`Taskbox | ${pageTitle}`}</title>
      <meta name="description" content={`View and manage ${pageTitle.toLowerCase()} in Taskbox`} />
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {getTitle()}
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
