# ⚡ TaskFlow — Team Task Manager

A full-stack team productivity app with role-based access control, project management, and real-time task tracking.

![TaskFlow](https://img.shields.io/badge/Stack-React%20%2B%20Node.js%20%2B%20MongoDB-7c6cfc?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## 🚀 Live Demo

- **Frontend:** `https://taskflow-production-8e84.up.railway.app/`
- **Backend API:** `https://taskflow-backend.railway.app/api/health`

**Demo Credentials:**
- Admin: `admin@demo.com` / `demo123`
- Member: `member@demo.com` / `demo123`

---

## ✨ Features

- 🔐 **Authentication** — JWT-based signup/login with role system
- 👥 **Role-Based Access** — Admin (full control) vs Member (limited)
- 📁 **Project Management** — Create, edit, delete projects with member management
- ✅ **Task Tracking** — Create tasks, assign to members, set priorities & due dates
- 📊 **Dashboard** — Real-time stats, overdue alerts, activity overview
- 🗂️ **Kanban Board** — Visual task management with drag-friendly columns
- 📋 **List View** — Inline status updates for quick task management
- 🌙 **Dark Theme** — Sleek, modern dark UI

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Axios, Vite |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Styling | Pure CSS with CSS Variables |
| Deployment | Railway |

---

## 📂 Project Structure

```
taskflow/
├── backend/
│   ├── models/          # Mongoose schemas (User, Project, Task)
│   ├── routes/          # REST API routes
│   ├── middleware/       # JWT auth middleware
│   ├── server.js        # Express entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # Layout, shared UI
│   │   ├── context/     # AuthContext (React Context)
│   │   ├── pages/       # Dashboard, Projects, Tasks, Team
│   │   └── utils/       # Axios API config
│   └── package.json
└── README.md
```

---

## ⚙️ Local Development Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/taskflow.git
cd taskflow
```

### 2. Backend setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```

### 3. Frontend setup
```bash
cd frontend
npm install
# Create .env.local:
echo "VITE_API_URL=http://localhost:5000/api" > .env.local
npm run dev
```

App runs at `http://localhost:5173`

---

## 🌐 Deployment on Railway (Step-by-Step)

### Step 1: Prepare MongoDB Atlas

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) → Create free account
2. Create a **free M0 cluster**
3. Create a **database user** (username + password — save these)
4. Under **Network Access** → Add IP Address → `0.0.0.0/0` (allow all)
5. Click **Connect** → **Drivers** → Copy the connection string
   - Replace `<password>` with your DB user password
   - Replace `myFirstDatabase` with `taskflow`

### Step 2: Push Code to GitHub

```bash
cd taskflow
git init
git add .
git commit -m "Initial commit: TaskFlow app"
git remote add origin https://github.com/YOURUSERNAME/taskflow.git
git push -u origin main
```

### Step 3: Deploy Backend on Railway

1. Go to [railway.app](https://railway.app) → Sign up with GitHub
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your `taskflow` repo
4. Railway auto-detects — set **Root Directory** to `backend`
5. Go to **Variables** tab, add:
   ```
   MONGODB_URI = mongodb+srv://user:pass@cluster.mongodb.net/taskflow
   JWT_SECRET  = your_random_secret_at_least_32_chars
   NODE_ENV    = production
   PORT        = 5000
   ```
6. Click **Deploy** — wait ~2 minutes
7. Go to **Settings** → **Networking** → Generate Domain
8. Copy your backend URL (e.g., `https://taskflow-backend-xxx.railway.app`)
9. Test: visit `https://your-backend.railway.app/api/health`

### Step 4: Deploy Frontend on Railway

1. In Railway dashboard → **New Service** → **GitHub Repo** (same repo)
2. Set **Root Directory** to `frontend`
3. Add Variables:
   ```
   VITE_API_URL = https://your-backend.railway.app/api
   ```
4. Deploy & generate domain
5. Copy frontend URL → go back to **backend service** → add variable:
   ```
   FRONTEND_URL = https://your-frontend.railway.app
   ```

### Step 5: Create Demo Accounts (Optional)

Use the signup page to create:
- An Admin account
- A Member account

Or use the API directly:
```bash
curl -X POST https://your-backend.railway.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin User","email":"admin@demo.com","password":"demo123","role":"admin"}'
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login + get JWT |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create project |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project + tasks |
| POST | `/api/projects/:id/members` | Add member |
| GET | `/api/projects/:id/tasks` | Get project tasks |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List tasks (filterable) |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task/status |
| DELETE | `/api/tasks/:id` | Delete task |
| GET | `/api/tasks/overdue` | Get overdue tasks |
| POST | `/api/tasks/:id/comments` | Add comment |

### Users (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| PUT | `/api/users/:id/role` | Change user role |

---

## 🔐 Role Permissions

| Action | Admin | Member |
|--------|-------|--------|
| View all projects | ✅ | ❌ (own only) |
| Create project | ✅ | ✅ |
| Delete any project | ✅ | ❌ |
| Manage team roles | ✅ | ❌ |
| Create/edit tasks | ✅ | ✅ |
| Delete any task | ✅ | Own only |

---

## 📝 License

Hari © 2026 TaskFlow
