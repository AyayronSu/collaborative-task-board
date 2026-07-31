# Collaborative Task Board

A real-time collaborative task management app. Create shared workspaces, organize tasks across a Kanban board, and see your team's changes instantly — no refresh needed.

---

## Features

- **Real-time collaboration** — task creates, moves, and deletes sync instantly across all connected clients via WebSockets
- **Live presence** — see who's currently viewing the same workspace
- **Activity feed** — a running log of who did what ("Sarah moved 'Deploy app' to Done")
- **Workspace membership** — invite teammates by email; members are added to dashboards in real time
- **Session-based auth** — secure signup, login, and logout with protected routes
- **Permission system** — workspace-scoped access control; only members can see a workspace, only the creator can rename or delete it

---

## Tech Stack

**Backend**
- [Flask](https://flask.palletsprojects.com/) — REST API with Blueprints
- [Flask-SocketIO](https://flask-socketio.readthedocs.io/) — WebSocket server with room-based broadcasting
- [SQLAlchemy](https://www.sqlalchemy.org/) — ORM with PostgreSQL
- [Werkzeug](https://werkzeug.palletsprojects.com/) — password hashing

**Frontend**
- [React](https://react.dev/) — component-based UI
- [Vite](https://vitejs.dev/) — dev server and build tool
- [Socket.IO client](https://socket.io/docs/v4/client-api/) — WebSocket connection
- [Axios](https://axios-http.com/) — HTTP client with interceptors
- [React Router](https://reactrouter.com/) — client-side routing

**Database**
- [PostgreSQL](https://www.postgresql.org/) — primary data store

**Testing**
- [pytest](https://pytest.org/) + [pytest-flask](https://pytest-flask.readthedocs.io/) — backend unit and integration tests covering auth, permissions, CRUD, and WebSocket events

---

## Project Structure

```
collaborative-task-board/
├── backend/
│   ├── app.py                  # app factory, blueprint + socket registration
│   ├── config.py               # environment config
│   ├── models/
│   │   ├── user.py
│   │   ├── workspace.py
│   │   ├── task.py
│   │   └── membership.py
│   ├── routes/
│   │   ├── auth.py             # POST /api/auth/...
│   │   ├── workspaces.py       # /api/workspaces/...
│   │   ├── tasks.py            # /api/workspaces/<id>/tasks/...
│   │   └── memberships.py      # /api/workspaces/<id>/members/...
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── workspace_service.py
│   │   ├── task_service.py
│   │   └── membership_service.py
│   ├── sockets/
│   │   └── events.py           # WebSocket handlers + broadcast functions
│   ├── utils/
│   │   └── auth.py             # login_required + workspace_member_required decorators
│   └── tests/
│       ├── conftest.py
│       ├── test_auth.py
│       ├── test_workspaces.py
│       ├── test_tasks.py
│       └── test_sockets.py
└── frontend/
    ├── src/
    │   ├── api/                # axios call modules (auth, workspaces, tasks, memberships)
    │   ├── components/         # ErrorBoundary, Toast
    │   ├── hooks/              # useNetworkStatus, useToast
    │   ├── pages/              # Login, Signup, Dashboard, Board
    │   ├── socket.js           # shared Socket.IO client instance
    │   ├── App.jsx             # routing, socket lifecycle, global state
    │   └── styles.css
    └── vite.config.js          # proxies /api → Flask on port 5000
```

---

## Running Locally

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL running locally

### 1. Clone the repo

```bash
git clone https://github.com/your-username/collaborative-task-board.git
cd collaborative-task-board
```

### 2. Set up the backend

```bash
# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install flask flask-socketio flask-sqlalchemy psycopg2-binary werkzeug python-dotenv pytest pytest-flask

# Create the database
psql -U postgres -c "CREATE DATABASE taskboard;"

# Create backend/.env
cp backend/.env.example backend/.env
# Then edit backend/.env with your database credentials
```

**`backend/.env`**
```
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://postgres:password@localhost:5432/taskboard
```

### 3. Set up the frontend

```bash
cd frontend
npm install
```

### 4. Run both servers

**Terminal 1 — Flask:**
```bash
cd backend
source ../venv/bin/activate
python app.py
# Running on http://127.0.0.1:5000
```

**Terminal 2 — React:**
```bash
cd frontend
npm run dev
# Running on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create an account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/me` | Get current session user |
| GET | `/api/workspaces/` | List workspaces you belong to |
| POST | `/api/workspaces/` | Create a workspace |
| GET | `/api/workspaces/<id>` | Get a workspace |
| PATCH | `/api/workspaces/<id>` | Rename a workspace (creator only) |
| DELETE | `/api/workspaces/<id>` | Delete a workspace (creator only) |
| GET | `/api/workspaces/<id>/tasks/` | List tasks in a workspace |
| POST | `/api/workspaces/<id>/tasks/` | Create a task |
| PATCH | `/api/workspaces/<id>/tasks/<task_id>` | Update title or status |
| DELETE | `/api/workspaces/<id>/tasks/<task_id>` | Delete a task |
| GET | `/api/workspaces/<id>/members/` | List workspace members |
| POST | `/api/workspaces/<id>/members/` | Invite a member by email |
| DELETE | `/api/workspaces/<id>/members/<user_id>` | Remove a member |

## WebSocket Events

| Direction | Event | Payload |
|-----------|-------|---------|
| Client → Server | `join_workspace` | `{ workspace_id, user }` |
| Client → Server | `leave_workspace` | `{ workspace_id }` |
| Client → Server | `join_user_room` | `{ user_id }` |
| Server → Client | `connected` | `{ message }` |
| Server → Client | `room_joined` | `{ workspace_id }` |
| Server → Client | `presence_updated` | `{ users: [{id, username}] }` |
| Server → Client | `task_created` | `{ task }` |
| Server → Client | `task_updated` | `{ task }` |
| Server → Client | `task_deleted` | `{ task_id }` |
| Server → Client | `activity` | `{ message }` |
| Server → Client | `workspace_added` | `{ workspace }` |
| Server → Client | `workspace_removed` | `{ workspace_id }` |

---

## Running Tests

```bash
cd backend
source ../venv/bin/activate
pytest tests/ -v
```

Tests use an in-memory SQLite database and Flask-SocketIO's built-in test client — no running server or real database needed.

---

## Screenshots

> Add screenshots here after deployment or local setup.

### Login
<!-- ![Login screen](docs/screenshots/login.png) -->

### Workspace Dashboard
<!-- ![Dashboard](docs/screenshots/dashboard.png) -->

### Task Board
<!-- ![Board with tasks](docs/screenshots/board.png) -->

### Real-time Collaboration
<!-- ![Two users collaborating](docs/screenshots/realtime.png) -->

To add screenshots: create a `docs/screenshots/` folder, drop in your images, and uncomment the lines above.

---

## Data Model

```
User ──< Membership >── Workspace ──< Task
```

- A **User** belongs to many **Workspaces** through **Membership**
- A **Workspace** has many **Tasks**
- **Membership** is the join table — also where you'd add roles (admin/member) in the future

---

## Known Limitations

- Presence state is stored in memory on the server — restarting Flask clears it (acceptable for development; use Redis in production)
- No email verification on signup
- No pagination on tasks or members
- WebSocket auth relies on the HTTP session cookie — works for same-origin but would need token-based auth for a mobile client

---

## License

MIT
