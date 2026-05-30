# Doctor Hub ---Design by Haider

Production-style healthcare consultation and patient history platform (Final Semester Project).

Built from the CareLink scaffold; evolving to match official Doctor Hub documentation (roles, workflow, database, security rules, and future enhancements).

## Tech stack

| Layer | Technology |
|-------|------------|
| Patient app | React 19, Vite, Tailwind CSS |
| Staff dashboard | React 19, Vite, Tailwind CSS (`admin/`) |
| API | Node.js, Express 5 |
| Database | Supabase (PostgreSQL) |
| File storage | Cloudinary |
| Auth | JWT + bcrypt |

## Project structure

```
Doctor Hub/
├── frontend/     # Patient-facing app
├── admin/        # Doctor, Assistant, Admin, Super Admin dashboards
├── backend/      # REST API
├── ARCHITECTURE.md
└── docs/
    └── API_ROUTES.md
```

## Documentation scope

- **Functionalities:** Fixed per project documentation (5 roles, 9 tables, 6-step appointment workflow, medical record rules, etc.).
- **Resources:** Flexible (libraries, deployment, UI polish timeline).
- **In-app analytics module:** Not required — semester **written report** at project end.
- **Future features (planned in code):** AI disease prediction, video consultation, WhatsApp notifications, e-prescription PDF.

## Environment variables

Copy examples and fill values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp admin/.env.example admin/.env
```

See each `.env.example` for descriptions.

## Database

Run in Supabase SQL Editor (in order):

1. `backend/supabase_schema.sql`
2. `backend/supabase_messages.sql` (Phase 9 messaging)
3. `backend/supabase_video.sql` (Phase 13 video)
4. `backend/supabase_whatsapp.sql` (Phase 14 notifications log)
5. `backend/supabase_seed.sql` (optional demo doctors)

Demo doctor logins use password from seed file comments.

Security (Phase 11): see `docs/SECURITY.md` for CORS, rate limits, and production env vars.

## Running locally

```bash
# Terminal 1 — API
cd backend
npm install
npm run server

# Terminal 2 — Patient app
cd frontend
npm install
npm run dev

# Terminal 3 — Staff dashboard
cd admin
npm install
npm run dev
```

Default ports: backend `4000` (or `PORT` in `.env`), Vite apps `5173` / `5174` (check terminal output).

## Health check

`GET http://localhost:4000/health`

## Phases

Development is phased; confirm each phase before the next. See `docs/PHASES.md`.

## Deployment

Deploy `backend`, `frontend`, and `admin` separately (e.g. Vercel). Set all environment variables in the host dashboard — do not commit `.env` files.
