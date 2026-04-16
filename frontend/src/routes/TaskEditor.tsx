import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  useGetTaskQuery,
  useAddTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} from "../features/tasks/tasksApi";
import { TaskEditorView, TaskFormData } from "../components/TaskEditorView";

export function TaskEditor() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(taskId && taskId !== "new");

  const { data: existingTask, isLoading: isLoadingTask } = useGetTaskQuery(
    taskId || "",
    { skip: !isEditing },
  );

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
          scheduledDate: existingTask.scheduledDate.split("T")[0],
          tags: existingTask.tags,
        }
      : {
          title: "",
          description: "",
          status: "TODO",
          scheduledDate: new Date().toISOString().split("T")[0],
          tags: [],
        };

  const handleSave = async (data: TaskFormData) => {
    setError(null);

    const taskData = {
      title: data.title.trim(),
      description: data.description.trim() || undefined,
      status: data.status,
      scheduledDate: new Date(data.scheduledDate).toISOString(),
      tags: data.tags,
    };

    try {
      if (isEditing && taskId) {
        await updateTask({ id: taskId, ...taskData }).unwrap();
      } else {
        await addTask(taskData).unwrap();
      }
      navigate("/");
    } catch {
      setError("Failed to save task. Please try again.");
    }
  };

  const handleCancel = () => {
    navigate("/");
  };

  const handleDelete = async () => {
    if (!taskId) return;
    setError(null);

    try {
      await deleteTask(taskId).unwrap();
      navigate("/");
    } catch {
      setError("Failed to delete task. Please try again.");
    }
  };

  const isSubmitting = isAdding || isUpdating || isDeleting;
  const isLoading = isEditing ? isLoadingTask || !existingTask : false;

  // Show loading spinner while fetching existing task data for editing
  if (isEditing && (isLoadingTask || !existingTask)) {
    return <div>Loading...</div>;
  }

  return (
    <TaskEditorView
      initialData={initialData}
      isEditing={isEditing}
      onSave={handleSave}
      onCancel={handleCancel}
      onDelete={isEditing ? handleDelete : undefined}
      isLoading={isLoading}
      isSaving={isSubmitting}
      error={error}
    />
  );
}
