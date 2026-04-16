# Taskbox

Taskbox is a task management application built as a monorepo with a RESTful backend API. It provides a lightweight solution for organizing tasks with features like status tracking, tagging, and date scheduling, using modern web technologies designed for simplicity and ease of deployment.

- **Backend API** – Express.js with TypeScript providing complete CRUD operations for task management with Prisma ORM
- **Frontend** – React with TypeScript, React Router for navigation, Material-UI (MUI) for component library, and Redux for state management
- **Database** – SQLite with JSON array support for flexible tagging and Prisma migrations for schema versioning
- **Filtering & Search** – Query tasks by status, scheduled date, tags, or search text across title and description
- **Pagination** – Cursor-based pagination with sortable fields (created date, scheduled date, title, status) for efficient data retrieval
- **Validation** – Strict input validation using Zod schemas with detailed error responses and normalized tag handling
- **Monorepo Structure** – Clean separation between backend API and frontend (ready for expansion)

## Prototype Limitations

This project is a demo/prototype and intentionally omits features that would be useful for a production application but add unnecessary complexity for proof-of-concept work.

## Screenshots

| Main View (Light) | Create Task | Dark Theme |
|:---:|:---:|:---:|
| ![Main View](./frontend/screenshots/home-all/light/desktop.png) | ![Create Task](./frontend/screenshots/task-create/light/desktop.png) | ![Dark Theme](./frontend/screenshots/home-all/dark/desktop.png) |

## Deployment

- **Frontend** – Statically exported and can be hosted on any static hosting service (GitHub Pages, Cloudflare Pages, Vercel, Netlify, or similar)
- **Backend** – Can be hosted on any platform that supports running a Node.js process (VPS, PaaS, containerized environments, or serverless functions)
