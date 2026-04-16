import { useState } from 'react';
import { Link } from 'react-router';
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
import { ArrowBack as BackIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import type { Status } from '../../types';

const statuses: Status[] = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'];

export interface TaskFormData {
  title: string;
  description: string;
  status: Status;
  scheduledDate: string;
  tags: string[];
}

interface TaskEditorViewProps {
  initialData: TaskFormData;
  isEditing: boolean;
  onSave: (data: TaskFormData) => void | Promise<void>;
  onCancel: () => void;
  onDelete?: () => void;
  isLoading?: boolean;
  isSaving?: boolean;
  error?: string | null;
}


export function TaskEditorView({
  isEditing,
  initialData,
  onSave,
  onCancel,
  onDelete,
  isLoading,
  isSaving,
  error: externalError,
}: TaskEditorViewProps) {
  const [formData, setFormData] = useState<TaskFormData>(initialData);
  const [tagInput, setTagInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!formData.title.trim()) {
      setValidationError('Title is required');
      return;
    }

    if (!formData.scheduledDate) {
      setValidationError('Scheduled date is required');
      return;
    }

    await onSave(formData);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const handleDeleteTag = (tagToDelete: string) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((tag) => tag !== tagToDelete) }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const displayError = externalError || validationError;

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

        {displayError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {displayError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                required
                error={!formData.title.trim() && validationError !== null}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                multiline
                rows={3}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  value={formData.status}
                  label="Status"
                  onChange={(e: SelectChangeEvent<Status>) =>
                    setFormData((prev) => ({ ...prev, status: e.target.value as Status }))
                  }
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
                value={formData.scheduledDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, scheduledDate: e.target.value }))}
                required
                slotProps={{ inputLabel: { shrink: true } }}
                error={!formData.scheduledDate && validationError !== null}
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
                {formData.tags.map((tag) => (
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
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
                </Button>
                <Button
                  onClick={onCancel}
                  variant="outlined"
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                {isEditing && onDelete && (
                  <Button
                    onClick={onDelete}
                    variant="outlined"
                    color="error"
                    disabled={isSaving}
                    startIcon={<DeleteIcon />}
                  >
                    Delete
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}
