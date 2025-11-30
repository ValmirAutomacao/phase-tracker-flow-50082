## Project Overview

This is **EngFlow**, a SaaS application for managing engineering projects, built with a modern Jamstack architecture. The project is currently in the process of being migrated from a `localStorage`-based prototype to a full-stack application using Supabase as the backend.

The application is feature-rich, with modules for financial control, HR management (employees, roles), project tracking, client registration, and a Business Intelligence (BI) dashboard.

### Key Technologies
- **Frontend:** React, Vite, TypeScript
- **UI:** shadcn-ui, Radix UI, Tailwind CSS
- **Routing:** React Router DOM
- **State Management:** TanStack Query (React Query) for server state, `useState` for local UI state.
- **Forms:** React Hook Form with Zod for validation.
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Real-time).
- **Testing:** Vitest, React Testing Library, Playwright.

The primary architectural document, which serves as the single source of truth, can be found at `docs/architecture.md`.

## Building and Running

The project uses `npm` as the package manager. The backend is managed by the Supabase CLI.

### Prerequisites
- Node.js (v18+)
- npm
- Supabase CLI (`npm install -g supabase`)

### Local Development

1.  **Install Dependencies:**
    ```bash
    npm i
    ```

2.  **Set up Supabase:**
    Initialize and start the local Supabase instance. This will spin up the necessary Docker containers for the database, auth, etc.
    ```bash
    supabase init
    supabase start
    ```

3.  **Configure Environment Variables:**
    Copy the example environment file and fill in the details provided by the `supabase start` command.
    ```bash
    cp .env.example .env
    ```
    Your `.env` file should look something like this:
    ```
    VITE_SUPABASE_URL=http://127.0.0.1:54321
    VITE_SUPABASE_ANON_KEY=your-anon-key-from-cli
    ```

4.  **Run Database Migrations:**
    Apply the SQL schema from `supabase/migrations` to your local database.
    ```bash
    supabase db reset
    ```

5.  **Run the Frontend Dev Server:**
    This will start the React application on `http://localhost:8080`.
    ```bash
    npm run dev
    ```

### Key Commands

- `npm run dev`: Starts the Vite development server.
- `npm run build`: Creates a production build of the frontend application.
- `npm run lint`: Lints the codebase using ESLint.
- `npm run test`: Runs the unit and integration tests using Vitest.
- `supabase start`: Starts the local Supabase services.
- `supabase stop`: Stops the local Supabase services.
- `supabase db reset`: Resets the local database and runs all migrations.
- `supabase gen types typescript --local > src/types/database.ts`: Generates TypeScript types from your database schema.

## Development Conventions

### Architecture
- The project follows the patterns outlined in `docs/architecture.md`.
- A **services layer** (`src/lib` or `src/services`) is used to abstract all communication with the Supabase backend.
- **Protected routes** and a **permission guard** component handle authentication and authorization on the frontend.
- **Row Level Security (RLS)** is enabled in Supabase to enforce data access policies at the database level.

### Code Style
- The project uses **ESLint** for linting. Configuration is in `eslint.config.js`.
- Code formatting is likely handled by a tool like Prettier (implied by convention, but not explicitly configured in `package.json` scripts).
- The alias `@/` is configured to point to the `src/` directory.

### Testing
- **Unit & Integration Tests (Frontend):** Written with Vitest and React Testing Library. Test files are located near the components they are testing. The global test setup is in `src/test/setup.ts`.
- **E2E Tests:** The presence of a `.playwright-mcp` directory suggests Playwright is used for end-to-end testing.
- **Backend Tests:** The architecture document specifies `pgTAP` for database testing.

### Project Structure
```
/engflow
├── docs/                 # Project documentation (architecture, PRD)
├── src/                  # React frontend source code
│   ├── components/       # Reusable UI components (including shadcn-ui)
│   ├── pages/            # Top-level page components for routes
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Core utilities and Supabase client setup
│   ├── services/         # Data access layer for Supabase
│   ├── types/            # TypeScript type definitions
│   └── ...
├── supabase/             # Supabase project configuration
│   ├── migrations/       # Database schema migrations (SQL)
│   ├── functions/        # Serverless edge functions
│   └── config.toml       # Supabase project configuration
└── ...
```
