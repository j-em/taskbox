import { Router } from 'express';
import { TaskController } from '../../controllers/taskController';
import { validateCreateTask, validateUpdateTask } from '../../middleware/validation';

const router = Router();

// List all tasks with filtering, sorting, and pagination
router.get('/', TaskController.listTasks);

// Get single task by ID
router.get('/:id', TaskController.getTaskById);

// Create new task
router.post('/', validateCreateTask, TaskController.createTask);

// Update task (full replacement)
router.put('/:id', validateUpdateTask, TaskController.updateTask);

// Delete task (hard delete)
router.delete('/:id', TaskController.deleteTask);

export default router;
