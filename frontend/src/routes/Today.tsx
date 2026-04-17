import { useState } from 'react';
import { Typography, Box, Button, Alert } from '@mui/material';
import { Add as AddIcon, CalendarToday as CalendarTodayIcon } from '@mui/icons-material';
import { Link } from 'react-router';
import { TaskList } from '../features/tasks/TaskList';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useGetTasksQuery } from '../features/tasks/tasksApi';

/**
 * Get today's date in YYYY-MM-DD format using local timezone
 * Fixes timezone bug where toISOString() returns UTC date
 */
function getLocalDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function Today() {
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  const todayDate = getLocalDateString();
  const { data, isLoading, error } = useGetTasksQuery({ scheduledDate: todayDate });

  const handleTaskSelect = (taskId: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  return (
    <>
      <title>{'Taskbox | Today'}</title>
      <meta name="description" content="View and manage today's scheduled tasks" />
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Today
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<CalendarTodayIcon />}
            component={Link}
            to="/app/task/new"
            aria-label="Quick Add for Today"
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
