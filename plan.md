# Taskbox Project Plan

## Overview
Taskbox is a simple task management backend API built with Node.js, Express, TypeScript, Prisma, and SQLite.

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: SQLite
- **Validation**: Zod

## Project Structure

This is a monorepo with the following top-level structure:

```
taskbox/
├── backend/         # Task management API (this plan)
├── frontend/        # UI application (separate)
└── README.md        # Root monorepo documentation
```

The backend folder contains the Node.js/Express API:

```
backend/
├── prisma/
│   ├── schema.prisma      # Database schema definition
│   └── migrations/        # Database migrations
├── src/
│   ├── config/            # Configuration files
│   │   └── database.ts    # Prisma client setup
│   ├── controllers/       # Request handlers
│   │   └── taskController.ts
│   ├── middleware/        # Express middleware
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── routes/            # API route definitions
│   │   └── v1/
│   │       └── taskRoutes.ts
│   ├── services/          # Business logic layer
│   │   └── taskService.ts
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/             # Utility functions
│   │   └── errors.ts
│   └── index.ts           # Application entry point
├── tests/                 # Test files
├── .env                   # Environment variables
├── .env.example           # Example environment file
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Database Schema (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Task {
  id            String   @id @default(uuid())
  title         String
  description   String?
  status        Status   @default(TODO)
  scheduledDate DateTime // Stored as UTC timestamp
  tags          String   // JSON array serialized as string (e.g., '["urgent","work"]')
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum Status {
  TODO
  IN_PROGRESS
  DONE
  CANCELLED
}
```

## API Specification

### Error Response Format
All errors will follow this structure:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // Object with field-level errors for VALIDATION_ERROR; always included (may be empty)
  }
}
```
For `VALIDATION_ERROR`, the `details` object contains field-level errors:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "title": "Title is required",
      "scheduledDate": "Invalid date format"
    }
  }
}
```
For all other errors, `details` is always included as an empty object `{}`:
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Task does not exist",
    "details": {}
  }
}
```

### Versioning
The API follows URL path versioning. All v1 endpoints are prefixed with `/api/v1/`.

### Assumptions & Design Decisions
- **PUT is full replacement**: Clients must fetch the full task and send complete object on updates. Partial updates (PATCH) are not supported.
- **Filter combination**: Multiple filters use AND logic (all must match).
- **Empty results**: Filtered queries returning no matches return `200 OK` with empty array, not `404`.
- **Tag normalization**: Duplicate tags within a task are removed before storage.
- **Error responses**: Always include `details: {}` for consistency, even when empty.
- **Timezone handling**: Accept any ISO 8601 datetime with timezone offset, convert to UTC for storage.
- **Default sort**: `createdAt` in descending order (newest first).

### Endpoints

#### 1. List All Tasks
- **GET** `/api/v1/tasks`
- **Required Query Parameters** - The endpoint MUST support the following filter and sort arguments:
  - **Filter Parameters** (combined with AND logic):
    - `scheduledDate`: Filter by scheduled date for the task (accepts any ISO 8601 datetime; time component is ignored on both the filter value and stored timestamps to match any time on that date).
    - `status`: Filter by status (TODO, IN_PROGRESS, DONE, CANCELLED)
    - `tag`: Filter by single tag (case-insensitive, both query and stored values normalized to lowercase for comparison). Returns tasks where the tag is present in the task's tag array using SQLite's JSON functions (`json_each`) for proper JSON array filtering.
    - `search`: Search in title and description (optional, partial substring match anywhere in the text, case-insensitive, OR logic - matches if either title OR description contains the search term. E.g., "sign" matches "design", "signature", "resign"). Minimum 2 characters required. Implemented using SQLite `LIKE` with `%` wildcards and `LOWER()` function.
  - **Sort Parameters**:
    - `sort`: Sort field - MUST support `createdAt`, `scheduledDate`, `title`, `status`. Default: `createdAt`
    - `order`: Sort order - MUST support `asc` (ascending) or `desc` (descending). Default: `desc`
  - **Pagination Parameters** (cursor-based):
    - `cursor`: Base64-encoded JSON string serving as a bookmark containing the last seen `id`, `sortField` value (stored as in database, e.g., UTC ISO strings for dates), and all active filter values. The server still reads and validates query params on subsequent requests and merges them with cursor data. Omit for first page.
    - `limit`: Number of results per page (default: 20, max: 100)
- **Success**: `200 OK` - Returns paginated response:
```json
{
  "data": [...],
  "pagination": {
    "hasMore": true,
    "nextCursor": "..."
  }
}
```
- **Error Codes**: `INTERNAL_ERROR`, `VALIDATION_ERROR` (for invalid sort fields, orders, or pagination params)

#### 2. Get Single Task
- **GET** `/api/v1/tasks/:id`
- **Success**: `200 OK` - Returns task object
- **Error Codes**: 
  - `INVALID_ID` (400) - Returned for malformed UUID format
  - `NOT_FOUND` (404) - Returned when task ID does not exist

#### 3. Create Task
- **POST** `/api/v1/tasks`
- **Body**:
```json
{
  "title": "Task title",
  "description": "Task description",
  "status": "TODO",
  "scheduledDate": "2024-01-15T10:00:00Z",
  "tags": ["urgent", "work"]
}
```
- **Required Fields**: `title`, `scheduledDate`
- **Validation Rules**:
  - `title`: 1-200 characters
  - `description`: Optional, max 1000 characters
  - `tags`: Optional, max 10 tags per task. Each tag: 1-30 characters, case-insensitive (stored in lowercase), alphanumeric with hyphens/underscores allowed (e.g., "urgent", "work-item", "team_a"). Duplicate tags are normalized preserving original order (first occurrence kept, lowercased). API accepts tags as a JSON array (e.g., `["urgent","work"]`) which gets stringified before storage.
  - `scheduledDate`: Valid ISO 8601 datetime string with optional timezone offset (e.g., `2024-01-15T10:00:00Z` or `2024-01-15T12:00:00+02:00`). Converted to UTC for storage.
  - `status`: Required. Must be one of the enum values (TODO, IN_PROGRESS, DONE, CANCELLED). Case-insensitive input accepted (e.g., "todo", "Todo"), normalized to uppercase.
- **Success**: `201 Created` - Returns created task
- **Error Codes**:
  - `VALIDATION_ERROR` (400)
  - `INTERNAL_ERROR` (500)

#### 4. Update Task
- **PUT** `/api/v1/tasks/:id`
- **Body**: Same as Create (full payload required). **Note: All fields (`title`, `description`, `scheduledDate`, `tags`, `status`) are required. Any missing fields will result in a `VALIDATION_ERROR`. This is a full replacement operation - partial updates (PATCH) are not supported. The entire task object must be provided in the request body.**
- **Success**: `200 OK` - Returns updated task
- **Error Codes**:
  - `INVALID_ID` (400) - Returned for malformed UUID format
  - `NOT_FOUND` (404) - Returned when task ID does not exist
  - `VALIDATION_ERROR` (400)

#### 5. Delete Task
- **DELETE** `/api/v1/tasks/:id`
- **Success**: `204 No Content` - Task is permanently removed (hard delete)
- **Error Codes**:
  - `INVALID_ID` (400) - Returned for malformed UUID format
  - `NOT_FOUND` (404) - Returned when task ID does not exist

## Implementation Phases

### Phase 1: Project Setup (inside `backend/` folder)
1. Initialize Node.js project with TypeScript in `backend/`
2. Install dependencies:
   - `express`
   - `prisma` + `@prisma/client`
   - `typescript` + `ts-node` + `nodemon`
   - `cors`
   - `dotenv`
   - `zod` (for validation)
3. Configure TypeScript (`tsconfig.json`)
4. Setup Prisma with SQLite
5. Create database schema
6. Run initial migration

### Phase 2: Core Implementation
1. Setup Prisma client configuration
2. Create custom error classes
3. Implement error handling middleware
4. Implement validation middleware
5. Create Task service layer (CRUD operations)
6. Create Task controller
7. Setup routes

### Phase 3: API Endpoints
1. Implement `GET /api/v1/tasks` (list with filtering)
2. Implement `GET /api/v1/tasks/:id`
3. Implement `POST /api/v1/tasks`
4. Implement `PUT /api/v1/tasks/:id`
5. Implement `DELETE /api/v1/tasks/:id`

### Phase 4: Testing & Polish

#### Unit Test Priorities (Start Here)

**1. TaskService.createTask() - Valid Input**
- Should create a task with valid title and scheduledDate
- Should normalize tags to lowercase and remove duplicates
- Should convert scheduledDate to UTC before storage

**2. TaskService.getTaskById() - Found/Not Found**
- Should return task when ID exists
- Should throw `NotFoundError` when ID does not exist

**3. TaskService.updateTask() - Full Replacement**
- Should replace all fields when given valid full payload
- Should throw `NotFoundError` when updating non-existent task
- Should reject partial updates (missing fields)

**4. TaskService.deleteTask() - Hard Delete**
- Should permanently remove task by ID
- Should throw `NotFoundError` when deleting non-existent task

**5. TaskService.listTasks() - Filtering Logic**
- Should filter by status (AND logic when multiple filters)
- Should filter by tag (case-insensitive, JSON array matching)
- Should filter by scheduledDate (ignoring time component)
- Should filter by search (substring match in title/description, min 2 chars)

**6. Validation Middleware - Valid Input**
- Should pass valid task data to next() without errors
- Should normalize status case-insensitive to uppercase

**7. Validation Middleware - Invalid Input**
- Should return `VALIDATION_ERROR` for missing title
- Should return `VALIDATION_ERROR` for title > 200 chars
- Should return `VALIDATION_ERROR` for invalid ISO 8601 date
- Should return `VALIDATION_ERROR` for >10 tags or tag >30 chars

**8. TaskController - Error Handling**
- Should catch service errors and pass to error handler
- Should return 201 for successful create
- Should return 200 for successful update

**9. Cursor Pagination Logic**
- Should encode cursor as Base64 JSON with id, sortField, and filters
- Should decode and merge cursor with query params
- Should return `hasMore: false` when no more results
- Should respect default limit (20) and max limit (100)

**10. Error Handler Middleware**
- Should format `VALIDATION_ERROR` with field-level details
- Should format `NOT_FOUND` with empty details object
- Should return 500 for unexpected errors with `INTERNAL_ERROR` code

#### Remaining Tasks
1. Add integration tests for full API endpoints
2. Add cursor-based pagination for list endpoint
3. Documentation

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `INVALID_ID` | 400 | Malformed task ID |
| `NOT_FOUND` | 404 | Task does not exist |

## Environment Variables

```bash
# .env
DATABASE_URL="file:./dev.db"
PORT=3000
NODE_ENV=development
```

## Next Steps
1. Create the monorepo structure: `mkdir -p taskbox/backend taskbox/frontend`
2. Navigate to `backend/` and run `npm init -y`
3. Install dependencies
4. Initialize Prisma
5. Create database schema
6. Generate Prisma client
7. Implement the application code

## Notes
- No authentication layer required
- Tags stored as stringified JSON array (e.g., `'["urgent","work"]'") to support array structure and filtering
- SQLite is file-based, no separate database server needed; database file located in `backend/` folder (`./dev.db`)
- CORS configured to allow all origins (`*`) for development simplicity, with no credentials
- No logging layer—only `console.error` for errors during development
- Unhandled routes return `{"error": {"code": "NOT_FOUND", "message": "Route not found", "details": {}}}` with 404 status
- All commands and paths in this plan are relative to the `backend/` folder unless otherwise specified
