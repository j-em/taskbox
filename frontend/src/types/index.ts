export type Status = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  scheduledDate: string | null;
  tags: string[];
  inInbox: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: Status;
  scheduledDate: string | null;
  tags?: string[];
  inInbox?: boolean;
}

export interface UpdateTaskInput {
  title: string;
  description: string;
  status: Status;
  scheduledDate: string | null;
  tags: string[];
  inInbox?: boolean;
}

export interface ListTasksFilters {
  scheduledDate?: string | null;
  status?: Status;
  tag?: string;
  search?: string;
  inInbox?: boolean;
}

export interface ListTasksSort {
  sort?: 'createdAt' | 'scheduledDate' | 'title' | 'status';
  order?: 'asc' | 'desc';
}

export interface ListTasksPagination {
  cursor?: string;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
  };
}

export type TaskView = 'all' | 'inbox' | 'today' | 'anytime' | 'todo' | 'in_progress' | 'done' | 'cancelled';
