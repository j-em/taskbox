# Taskbox

Taskbox is a task management application built as a monorepo with a RESTful backend API. It provides a lightweight solution for organizing tasks with features like status tracking, tagging, and date scheduling, using modern web technologies designed for simplicity and ease of deployment.

- **Backend API** – Express.js with TypeScript providing complete CRUD operations for task management with Prisma ORM
- **Database** – SQLite with JSON array support for flexible tagging and Prisma migrations for schema versioning
- **Filtering & Search** – Query tasks by status, scheduled date, tags, or search text across title and description
- **Pagination** – Cursor-based pagination with sortable fields (created date, scheduled date, title, status) for efficient data retrieval
- **Validation** – Strict input validation using Zod schemas with detailed error responses and normalized tag handling
- **Monorepo Structure** – Clean separation between backend API and frontend (ready for expansion)
