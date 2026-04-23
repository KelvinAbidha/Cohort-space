# Cohort Space

Cohort Space is a modern, academic workspace management hub designed to mitigate social loafing by providing transparent accountability through shared task boards, resource vaults, and clear milestones.

## Quick Start

This project is organized as a monorepo containing both a React frontend and an Express/Prisma backend.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm (comes with Node.js)

### 1. Installation

Clone the repository and install all dependencies:

```bash
# Install root dependencies (concurrently)
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Environment Setup

Teammates must have their own isolated local database to avoid Git merge conflicts.

1. Navigate to the `backend` directory.
2. Duplicate the `.env.example` file and rename it to `.env`.
   ```bash
   cp backend/.env.example backend/.env
   ```

### 3. Database Initialization

Cohort Space uses SQLite for local development.

1. Apply the Prisma schema to generate your local `dev.db`:
   ```bash
   cd backend
   npx prisma db push
   ```
2. **Seed your local database** with test data (Users, Workspaces, Tasks) so you don't start with an empty dashboard:
   ```bash
   npm run seed
   ```

### 4. Running the Application

You can start both the frontend and backend servers simultaneously from the root folder:

```bash
# Run this from the root 'Cohort Space' folder
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS v4, React Router, Lucide Icons, Axios.
- **Backend:** Node.js, Express, Prisma ORM.
- **Database:** SQLite (local development).

## Important Note for Contributors

**DO NOT** commit your local `.env` or `*.db` files to Git. The `.gitignore` at the root of this repository is configured to prevent this. This ensures everyone on the team has an isolated environment for safe, conflict-free testing.
