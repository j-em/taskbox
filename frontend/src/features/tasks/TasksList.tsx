import { List, Paper, Typography } from '@mui/material';
import { TaskItem } from './TaskItem';
import type { Task } from '../../types';

interface TasksListProps {
  tasks: Task[];
}

export function TasksList({ tasks }: TasksListProps) {
  if (tasks.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No tasks found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create a new task to get started
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper>
      <List role="list">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </List>
    </Paper>
  );
}
