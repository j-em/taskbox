import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import {
  Typography,
  Paper,
  TextField,
  Button,
  Box,
  Alert,
  MenuItem,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import {
  useGetTaskQuery,
  useAddTaskMutation,
  useUpdateTaskMutation,
} from '../features/tasks/tasksApi';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { Status } from '../types';

const statuses: Status[] = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'];

export function TaskForm() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(taskId && taskId !== 'new');

  const { data: existingTask, isLoading: isLoadingTask } = useGetTaskQuery(
    taskId || '',
    { skip: !isEditing }
  );

  const [addTask, { isLoading: isAdding }] = useAddTaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Status>('TODO');
  const [scheduledDate, setScheduledDate] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingTask) {
      setTitle(existingTask.title);
      setDescription(existingTask.description || '');
      setStatus(existingTask.status);
      setScheduledDate(existingTask.scheduledDate.split('T')[0]);
      setTags(existingTask.tags);
    }
  }, [existingTask]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!scheduledDate) {
      setError('Scheduled date is required');
      return;
    }

    const taskData = {
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      scheduledDate: new Date(scheduledDate).toISOString(),
      tags,
    };

    try {
      if (isEditing && taskId) {
        await updateTask({ id: taskId, ...taskData }).unwrap();
      } else {
        await addTask(taskData).unwrap();
      }
      navigate('/');
    } catch (err) {
      setError('Failed to save task. Please try again.');
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleDeleteTag = (tagToDelete: string) => {
    setTags(tags.filter((tag) => tag !== tagToDelete));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (isEditing && isLoadingTask) {
    return <LoadingSpinner />;
  }

  const isSubmitting = isAdding || isUpdating;

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

      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          {isEditing ? 'Edit Task' : 'Create New Task'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                error={!title.trim() && error !== null}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={3}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  value={status}
                  label="Status"
                  onChange={(e: SelectChangeEvent<Status>) => setStatus(e.target.value as Status)}
                >
                  {statuses.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s.replace('_', ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Scheduled Date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                required
                slotProps={{ inputLabel: { shrink: true } }}
                error={!scheduledDate && error !== null}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Add Tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                helperText="Press Enter to add a tag"
              />
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                {tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleDeleteTag(tag)}
                  />
                ))}
              </Box>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
                </Button>
                <Button
                  component={Link}
                  to="/"
                  variant="outlined"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}
