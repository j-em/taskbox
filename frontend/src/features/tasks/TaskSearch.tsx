import { useState } from 'react';
import { Alert, Box } from '@mui/material';
import { TaskSearchView } from './TaskSearchView';
import { useGetTasksQuery } from './tasksApi';
import { useDebounce } from '../../hooks/useDebounce';

export function TaskSearch() {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  // Only trigger API call when we have 2+ characters
  const shouldSearch = debouncedSearch.length >= 2;
  const { data, isLoading, error } = useGetTasksQuery(
    shouldSearch ? { search: debouncedSearch } : undefined,
    {
      // Skip the query if we don't have enough characters
      skip: !shouldSearch && searchInput.length > 0,
    }
  );

  const filteredTasks = data?.data ?? [];

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load tasks. Please try again later.
        </Alert>
      )}

      <TaskSearchView
        searchInput={searchInput}
        filteredTasks={filteredTasks}
        onSearchChange={setSearchInput}
        isLoading={isLoading}
      />
    </Box>
  );
}
