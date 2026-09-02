# Robbie Inventory Application Handout

This document provides a comprehensive overview of the **Robbie Inventory** application. It is designed to get any new AI agent up to speed immediately so they can solve problems, navigate the codebase, and deploy updates effectively without needing to ask basic questions.

---

## 1. What the Application Does
The Robbie Inventory application is an internal web-based ERP tool used to track:
- **Employee Labor Hours:** Employees clock in/out for specific tasks, projects, and quoted items. Supervisors can manage and edit these time records.
- **Inventory & Materials:** It manages stock for various printing/graphic materials (like vinyl, banner materials, ink, etc.), tracking locations, material IDs, and dimensions (width, lot numbers).
- **Outflows:** When materials are used for a job, an "Outflow" record is created to deduct stock. It supports features like decimal quantities (e.g. `0.5`) and re-using remaining stock from partial cuts.
- **Project Tracking:** It associates labor hours and material usage directly to specific jobs/projects.

---

## 2. Where the Application is Located
- **Local Machine Path:** `C:\Robbie_Workspace\Inventory\Inventory`
  - *Note: Ensure you are in this specific directory when running commands or editing files.*
- **Remote Production Domain:** `inventory.robbie.gr`
- **GitHub Repository:** The code is hosted securely on a private GitHub repository (`PanosRb007/Inventory`) which acts as the bridge between local development and production deployment.

---

## 3. Technology Stack & Architecture
The system is built as a **Monorepo** containing both the frontend and backend in one single repository structure:

### **Frontend (React)**
- **Path:** `frontend/`
- **Framework:** React.js (created via Create React App)
- **Local Development:** Run `npm start` inside `frontend/` to spin up a hot-reloading dev server (usually on `localhost:3000`).
- **Key Files:** 
  - `frontend/src/App.js` (Routing & Layout)
  - `frontend/src/pages/AddLaborHours.js` / `LaborHours.js` (Time tracking)
  - `frontend/src/pages/AddOutflow.js` / `Outflow.js` / `InstOut.js` (Stock management)
- **Proxy:** During local dev, the frontend is configured to proxy `/api` requests to the backend server (e.g., `http://localhost:5000` or `inventory.robbie.gr`).

### **Backend (Node.js & Express)**
- **Path:** `backend/`
- **Framework:** Node.js with Express
- **Responsibilities:** Serves API endpoints (`/api/*`), handles authentication (JWT), connects to MySQL, and also physically serves the React `build` folder in production.
- **Key Files:**
  - `backend/server.js` (Main entry point and route definitions)
  - `backend/env` (Environment variables)

### **Database (MySQL)**
- **Type:** Relational MySQL Database hosted on the Plesk server.
- **Credentials:** Found exclusively in `backend/env`. *Do not push credentials to GitHub!*
- **Key Tables:** `day_records`, `inventory`, `materials`, `employees`, `projects`, `outflows`. Dates are often tracked in UTC but displayed in Europe/Athens time natively on the frontend to avoid timezone bugs.

---

## 4. Deployment Workflow (CRITICAL)
The production app is hosted on **Plesk (Phusion Passenger)**. When you fix a bug, here is the exact deployment pipeline:

1. **Commit and Push:** The agent should commit the fix locally and push it to GitHub (`git add .`, `git commit -m "..."`, `git push`).
2. **Plesk Pull:** The user will go into their Plesk Dashboard for `inventory.robbie.gr`, go to the Git section, and click **"Pull now"**.
3. **Plesk Build Script:** Plesk is configured with an "Additional deployment action" hook that will automatically run:
   ```bash
   npm install --prefix backend
   npm install --prefix frontend
   npm run build --prefix frontend
   ```
4. **App Restart:** The user then navigates to the Node.js tab in Plesk and clicks **Restart App** to apply the new code.

**IMPORTANT PLESK QUIRKS:**
- The repository contains a `.node-version` file containing `23`. This forces the Plesk `nodenv` shim to use Node.js 23. **Do not delete this file** or the deployment hook will fail.
- The `backend/env` file is intentionally missing from Git (`.gitignore`). It only exists locally and on the Plesk server.
- The `AGENT_ONBOARDING.md` file is strictly kept locally and ignored by Git to prevent internal docs from leaking.

---

## 5. Agent Instructions & Best Practices
If you are an AI taking over this codebase, follow these rules:
1. **Never use `cat` or `grep` inside bash commands.** Use the dedicated API tools (`view_file`, `grep_search`, `replace_file_content`, etc.) to interact with the codebase.
2. **Always test locally if possible.** You can run `npm run build` in the frontend folder locally to catch syntax errors before telling the user to deploy.
3. **Handle Timezones carefully.** The server is UTC, the user is in Athens (UTC+3). The `getLocalDate()` and `toLocaleTimeString('en-GB', { timeZone: 'Europe/Athens' })` implementations in the frontend are heavily relied upon. Do not change how dates are stored without thoroughly testing.
4. **Input Constraints:** Be aware that inputs like `Quantity` often accept decimal values (`0.5`). Avoid strict numerical parsers like `parseFloat()` on `onChange` handlers if they aggressively strip trailing dots (`0.`) or leading zeroes as the user types.

*End of Document*
