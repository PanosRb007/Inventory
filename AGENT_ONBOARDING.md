# Agent Onboarding Guide for Inventory Application

## Architecture Overview
This application is a unified Monorepo consisting of a React frontend and an Express/Node.js backend, deployed on Plesk.
- **Frontend**: Located in `frontend/`. Uses React. Builds into `frontend/build/`.
- **Backend**: Located in `backend/`. Uses Express. Serves the API via `/api/*` routes and also serves the frontend static files from `frontend/build` on all other routes.
- **Database**: MySQL.

## Deployment & Hosting
- **Host**: Plesk (inventory.robbie.gr).
- **Phusion Passenger**: Plesk runs the Node.js backend using Phusion Passenger. The "Application Root" and "Document Root" in Plesk must be set to the `backend/` directory, and the "Startup File" is `server.js`.
- **Git Deployment Hook**: Plesk is configured to automatically pull from this GitHub repository. We use the "Additional deployment actions" script to install dependencies and build the frontend:
  ```bash
  npm install --prefix backend
  npm install --prefix frontend
  npm run build --prefix frontend
  ```
- **Node Version Management**: The repository contains a `.node-version` file containing `23`. This forces the Plesk `nodenv` shim to use Node.js version 23 for all background scripts (like `npm install` postinstall hooks). Do not delete or modify this file, or deployment hooks will break.

## Environment Variables and Secrets
- **Location**: Environment variables are stored in the `backend/env` (or `.env`) file. 
- **Security**: The `env` file is intentionally ignored by `.gitignore` so secrets are never pushed to GitHub.
- **Important**: If you need to access or modify database credentials (`DB_USER`, `DB_PASSWORD`), host configuration, or the `JWT_SECRET`, look in the `backend/env` file on the server. Do NOT upload this file to the repository.

## Key Files to Know
- `backend/server.js`: The main Express server entry point.
- `frontend/src/App.js`: The main React component that handles routing.
- `backend/env`: Secrets and configuration (not in Git).
