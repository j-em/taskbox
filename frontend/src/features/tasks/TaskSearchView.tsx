import { Box, Typography, TextField, InputAdornment } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { TaskList } from './TaskList';
import type { Task } from '../../types';

interface TaskSearchViewProps {
  searchInput: string;
  filteredTasks: Task[];
  onSearchChange: (value: string) => void;
  isLoading: boolean;
}

export function TaskSearchView({
  searchInput,
  filteredTasks,
  onSearchChange,
  isLoading,
}: TaskSearchViewProps) {
  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Search tasks
      </Typography>

      <TextField
        fullWidth
        placeholder="Search tasks..."
        value={searchInput}
        onChange={(e) => onSearchChange(e.target.value)}
        sx={{ mb: 3 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
      />

      {isLoading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">Loading...</Typography>
        </Box>
      ) : searchInput.length > 0 && searchInput.length < 2 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">
            Type at least 2 characters to search
          </Typography>
        </Box>
      ) : (
        <TaskList tasks={filteredTasks} />
      )}
    </Box>
  );
}
