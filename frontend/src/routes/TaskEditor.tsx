import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import {
  useGetTaskQuery,
  useAddTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} from "../features/tasks/tasksApi";
import { TaskEditorView, TaskFormData } from "../features/tasks/TaskEditorView";

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

export function TaskEditor() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(taskId && taskId !== "new");

  const pageTitle = isEditing ? 'Edit Task' : 'New Task';

  const { data: existingTask, isLoading: isLoadingTask } = useGetTaskQuery(
    taskId || "",
    { skip: !isEditing },
  );

  const isInboxMode = searchParams.get("inbox") === "true" || (!!existingTask?.inInbox);

  const [addTask, { isLoading: isAdding }] = useAddTaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();

  const [error, setError] = useState<string | null>(null);

  const initialData: TaskFormData =
    isEditing && existingTask
      ? {
          title: existingTask.title,
          description: existingTask.description || "",
          status: existingTask.status,
          scheduledDate: existingTask.scheduledDate?.split("T")[0] ?? null,
          tags: existingTask.tags,
          inInbox: existingTask.inInbox,
        }
      : {
          title: "",
          description: "",
          status: "TODO",
          scheduledDate: searchParams.get("inbox") === "true" ? null : getLocalDateString(),
          tags: [],
          inInbox: searchParams.get("inbox") === "true",
        };

  const handleSave = async (data: TaskFormData) => {
    setError(null);

    const taskData = {
      title: data.title.trim(),
      description: data.description.trim() || undefined,
      status: data.status,
      scheduledDate: data.scheduledDate ? new Date(data.scheduledDate).toISOString() : null,
      tags: data.tags,
      inInbox: data.inInbox ?? false,
    };

    try {
      if (isEditing && taskId) {
        await updateTask({ id: taskId, ...taskData }).unwrap();
        // Navigate back to task detail after update
        navigate(`/app/task/${taskId}`);
      } else {
        await addTask(taskData).unwrap();
        navigate("/app");
      }
    } catch {
      setError("Failed to save task. Please try again.");
    }
  };

  const handleCancel = () => {
    navigate("/app");
  };

  const handleDelete = async () => {
    if (!taskId) return;
    setError(null);

    try {
      await deleteTask(taskId).unwrap();
      navigate("/app");
    } catch {
      setError("Failed to delete task. Please try again.");
    }
  };

  const isSubmitting = isAdding || isUpdating || isDeleting;
  const isLoading = isEditing ? isLoadingTask || !existingTask : false;

  // Show loading spinner while fetching existing task data for editing
  if (isEditing && (isLoadingTask || !existingTask)) {
    return (
      <>
        <title>{`Taskbox | ${pageTitle}`}</title>
        <div>Loading...</div>
      </>
    );
  }

  return (
    <>
      <title>{`Taskbox | ${pageTitle}`}</title>
      <meta name="description" content={isEditing ? 'Edit an existing task' : 'Create a new task'} />
    <TaskEditorView
      initialData={initialData}
      isEditing={isEditing}
      isInboxMode={isInboxMode}
      onSave={handleSave}
      onCancel={handleCancel}
      onDelete={isEditing ? handleDelete : undefined}
      isLoading={isLoading}
      isSaving={isSubmitting}
      error={error}
    />
    </>
  );
}
