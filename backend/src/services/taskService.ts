import { prisma } from '../config/database';
import { Task, CreateTaskInput, UpdateTaskInput, ListTasksFilters, ListTasksPagination, ListTasksSort, PaginatedResponse, Status } from '../types';
import { NotFoundError, ValidationError } from '../utils/errors';

function normalizeTags(tags: string[] = []): string[] {
  // Convert to lowercase and remove duplicates while preserving order
  const seen = new Set<string>();
  return tags
    .map(tag => tag.toLowerCase())
    .filter(tag => {
      if (seen.has(tag)) return false;
      seen.add(tag);
      return true;
    });
}

function convertToUTC(dateString: string | null): Date | null {
  // Parse the date string and convert to UTC
  if (dateString === null) return null;
  const date = new Date(dateString);
  return date;
}

function toTaskDTO(dbTask: any): Task {
  return {
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description,
    status: dbTask.status as Status,
    scheduledDate: dbTask.scheduledDate?.toISOString() ?? null,
    tags: JSON.parse(dbTask.tags),
    inInbox: dbTask.inInbox,
    createdAt: dbTask.createdAt.toISOString(),
    updatedAt: dbTask.updatedAt.toISOString(),
  };
}

export class TaskService {
  static async createTask(data: CreateTaskInput): Promise<Task> {
    const normalizedTags = normalizeTags(data.tags);
    const scheduledDateUTC = convertToUTC(data.scheduledDate);

    const dbTask = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,  // Always a string
        status: data.status ?? 'TODO',
        scheduledDate: scheduledDateUTC,  // null or Date
        tags: JSON.stringify(normalizedTags),
        inInbox: data.inInbox ?? false,
      },
    });

    return toTaskDTO(dbTask);
  }

  static async getTaskById(id: string): Promise<Task> {
    const dbTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!dbTask) {
      throw new NotFoundError();
    }

    return toTaskDTO(dbTask);
  }

  static async updateTask(id: string, data: UpdateTaskInput): Promise<Task> {
    // Check if task exists
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError();
    }

    const normalizedTags = normalizeTags(data.tags);
    const scheduledDateUTC = convertToUTC(data.scheduledDate);

    const dbTask = await prisma.task.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,  // Always a string
        status: data.status,
        scheduledDate: scheduledDateUTC,  // null or Date
        tags: JSON.stringify(normalizedTags),
        inInbox: data.inInbox ?? false,
      },
    });

    return toTaskDTO(dbTask);
  }

  static async deleteTask(id: string): Promise<void> {
    // Check if task exists
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError();
    }

    await prisma.task.delete({ where: { id } });
  }

  static async listTasks(
    filters: ListTasksFilters = {},
    sort: ListTasksSort = {},
    pagination: ListTasksPagination = {}
  ): Promise<PaginatedResponse<Task>> {
    const {
      scheduledDate,
      status,
      tag,
      search,
      inInbox,
    } = filters;

    const validSortFields = ['createdAt', 'scheduledDate', 'title', 'status'];
    const rawSortField = sort.sort ?? 'createdAt';
    const sortField = validSortFields.includes(rawSortField) ? rawSortField : 'createdAt';
    const sortOrder = sort.order ?? 'desc';
    const limit = Math.min(pagination.limit && pagination.limit > 0 ? pagination.limit : 20, 100);

    // Build where clause
    const where: any = {};

    if (inInbox !== undefined) {
      where.inInbox = inInbox;
    }

    if (status) {
      where.status = status.toUpperCase();
    }

    if (scheduledDate !== undefined) {
      if (scheduledDate === null) {
        // Filter to tasks with NO scheduled date (Anytime view)
        where.scheduledDate = null;
      } else {
        // Validate date format
        const date = new Date(scheduledDate);
        if (isNaN(date.getTime())) {
          throw new ValidationError({ scheduledDate: 'Invalid date format' });
        }
        
        // Filter by date only, ignoring time
        const startOfDay = new Date(date);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setUTCHours(23, 59, 59, 999);

        where.scheduledDate = {
          gte: startOfDay,
          lte: endOfDay,
        };
      }
    }

    if (tag) {
      // With COLLATE NOCASE, case-insensitive tag search works automatically
      where.tags = {
        contains: `"${tag}"`,
      };
    }

    if (search && search.length >= 2) {
      // With COLLATE NOCASE on title and description, search is case-insensitive
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Build order by - Prisma expects an array
    const orderBy: any[] = [
      { [sortField]: sortOrder },
      { id: sortOrder }, // Secondary sort for stable pagination
    ];

    // Handle cursor pagination
    let cursorCondition: any = {};
    if (pagination.cursor) {
      try {
        const cursorData = JSON.parse(Buffer.from(pagination.cursor, 'base64').toString());
        // Build cursor condition based on sort field
        if (cursorData.sortField !== undefined) {
          cursorCondition = {
            OR: [
              { [sortField]: sortOrder === 'asc' ? { gt: cursorData.sortField } : { lt: cursorData.sortField } },
              {
                [sortField]: cursorData.sortField,
                id: sortOrder === 'asc' ? { gt: cursorData.id } : { lt: cursorData.id },
              },
            ],
          };
        } else {
          cursorCondition = {
            id: sortOrder === 'asc' ? { gt: cursorData.id } : { lt: cursorData.id },
          };
        }
      } catch {
        // Invalid cursor, ignore
      }
    }

    // Merge where conditions
    const finalWhere = cursorCondition.OR ? { AND: [where, cursorCondition] } : where;

    // Fetch one extra to determine if there are more results
    const dbTasks = await prisma.task.findMany({
      where: finalWhere,
      orderBy,
      take: limit + 1,
    });

    const hasMore = dbTasks.length > limit;
    const tasks = hasMore ? dbTasks.slice(0, limit) : dbTasks;

    // Generate next cursor
    let nextCursor: string | null = null;
    if (hasMore && tasks.length > 0) {
      const lastTask = tasks[tasks.length - 1];
      const cursorData: any = {
        id: lastTask.id,
      };
      // Include sort field value in cursor
      if (sortField === 'scheduledDate') {
        cursorData.sortField = lastTask.scheduledDate?.toISOString() ?? null;
      } else if (sortField === 'createdAt') {
        cursorData.sortField = lastTask.createdAt.toISOString();
      } else if (sortField === 'title') {
        cursorData.sortField = lastTask.title;
      } else if (sortField === 'status') {
        cursorData.sortField = lastTask.status;
      }
      // Include filter values in cursor
      if (scheduledDate) cursorData.scheduledDate = scheduledDate;
      if (status) cursorData.status = status;
      if (tag) cursorData.tag = tag;
      if (search) cursorData.search = search;
      if (inInbox !== undefined) cursorData.inInbox = inInbox;
      if (sortField !== 'createdAt') cursorData.sort = sortField;
      if (sortOrder !== 'desc') cursorData.order = sortOrder;

      nextCursor = Buffer.from(JSON.stringify(cursorData)).toString('base64');
    }

    return {
      data: tasks.map(toTaskDTO),
      pagination: {
        hasMore,
        nextCursor,
      },
    };
  }
}
