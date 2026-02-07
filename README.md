# LazyKanban

A mobile-first TODO list application with advanced project management features, built with Next.js, Shadcn/ui, and MySQL.

## Features

- **Project Management**: Create and manage multiple projects.
- **Task Management**: Create, assign, and track tasks with priorities and due dates.
- **Kanban Board**: Drag-and-drop task management (Dev Mode).
- **Dual UI Modes**:
  - **Dev Mode**: Full-featured interface for project managers and developers.
  - **Regular Mode**: Simplified list view for focusing on assigned tasks.
- **Group & Permissions**: Granular permission system using groups (Admin, Manager, Member, Viewer).
- **Custom Tags**: Create custom tags with colors to match your workflow. Default tags included.
- **Mobile First**: Responsive design that works great on all devices.

## Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Components**: [Shadcn/ui](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Data Fetching**: [TanStack Query](https://tanstack.com/query/latest)
- **Database**: [MySQL 8.0](https://www.mysql.com/)
- **ORM/Query**: [mysql2](https://github.com/sidorares/node-mysql2)
- **Authentication**: JWT & bcrypt
- **Runtime/Build**: [Bun](https://bun.sh/)
- **Infrastructure**: Docker & Docker Compose

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- [Bun](https://bun.sh/) (optional, for local dev without Docker)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/lazykanban.git
   cd lazykanban
   ```

2. **Configure Environment**
   Copy `.env.example` to `.env` and update variables if needed.
   ```bash
   cp .env.example .env
   ```

3. **Run with Docker (Recommended)**
   ```bash
   # Start database and app
   docker-compose up -d
   ```
   Access the app at `http://localhost:3000`.

4. **Run Locally (Development)**
   If you want to run the frontend locally for hot-reload:
   
   Start the database only:
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```
   
   Install dependencies:
   ```bash
   bun install
   ```
   
   Run the development server:
   ```bash
   bun dev
   ```
   Access the app at `http://localhost:3000`.

## Project Structure

- `src/app`: Next.js App Router pages and API routes
- `src/components`: React components (UI, projects, tasks, groups)
- `src/hooks`: Custom React hooks (data fetching, state)
- `src/lib`: Utilities (db connection, auth helper)
- `src/store`: Zustand stores (auth, ui)
- `src/middleware`: Next.js middleware (auth)
- `data/init.sql`: Database initialization script

## License

MIT
