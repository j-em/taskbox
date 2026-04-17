import { List, Paper, Typography } from '@mui/material';
import { TaskListItem } from './TaskListItem';
import { useUpdateTaskMutation, useDeleteTaskMutation } from './tasksApi';
import type { Task, Status } from '../../types';

interface TaskListProps {
  tasks: Task[];
  selectedTasks?: string[];
  onTaskSelect?: (taskId: string) => void;
}

export function TaskList({ tasks, selectedTasks = [], onTaskSelect }: TaskListProps) {
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();

  const handleStatusChange = (task: Task) => {
    const statusOrder: Status[] = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'];
    const currentIndex = statusOrder.indexOf(task.status);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
    updateTask({
      id: task.id,
      title: task.title,
      description: task.description,
      status: nextStatus,
      scheduledDate: task.scheduledDate,
      tags: task.tags,
      inInbox: task.inInbox,
    });
  };

  const handleDelete = (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask(taskId);
    }
  };

  if (tasks.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          {'No tasks found'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {'Create a new task to get started'}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper>
      <List role="list">
        {tasks.map((task) => (
          <TaskListItem
            key={task.id}
            task={task}
            isSelected={selectedTasks.includes(task.id)}
            onClick={() => onTaskSelect?.(task.id)}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        ))}
      </List>
    </Paper>
  );
}
