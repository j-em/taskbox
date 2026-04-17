<p align="center">
  <img src="./frontend/public/logo_dark.png" width="400" alt="Taskbox Logo">
</p>

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

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- npm (comes with Node.js)

### Installation

1. Clone the repository and install dependencies for both backend and frontend:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Running the App

The app requires both the backend and frontend servers to be running simultaneously.

#### 1. Start the Backend Server

```bash
cd backend
npm run dev
```

The backend API will be available at `http://localhost:3000`.

#### 2. Start the Frontend Server

In a new terminal window:

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173` (or another port if 5173 is in use).

### Database Setup

If you're starting with a fresh database, run the Prisma migrations:

```bash
cd backend
npm run db:migrate
```

### Development Scripts

| Location | Command | Description |
|----------|---------|-------------|
| `backend/` | `npm run dev` | Start backend with hot reload (nodemon) |
| `backend/` | `npm run db:migrate` | Run Prisma database migrations |
| `backend/` | `npm run db:studio` | Open Prisma Studio to inspect database |
| `frontend/` | `npm run dev` | Start frontend dev server (Vite) |
| `frontend/` | `npm run build` | Build for production |

## Screenshots

| Main View (Light) | Create Task | Dark Theme |
|:---:|:---:|:---:|
| ![Main View](./frontend/screenshots/home-all/light/desktop.png) | ![Create Task](./frontend/screenshots/task-create/light/desktop.png) | ![Dark Theme](./frontend/screenshots/home-all/dark/desktop.png) |

## Deployment

- **Frontend** – Statically exported and can be hosted on any static hosting service (GitHub Pages, Cloudflare Pages, Vercel, Netlify, or similar)
- **Backend** – Can be hosted on any platform that supports running a Node.js process (VPS, PaaS, containerized environments, or serverless functions)
