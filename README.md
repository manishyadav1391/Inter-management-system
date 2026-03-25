# Intern Management System (IMS)

A full-stack web application for managing interns across departments, built with **Next.js 16**, **Hasura GraphQL**, and **PostgreSQL**. Features role-based access control for three user types: Admin, Department Head, and Intern.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Install Dependencies](#2-install-dependencies)
  - [3. Set Up Docker (PostgreSQL + Hasura)](#3-set-up-docker-postgresql--hasura)
  - [4. Configure Environment Variables](#4-configure-environment-variables)
  - [5. Set Up the Database](#5-set-up-the-database)
  - [6. Configure Hasura](#6-configure-hasura)
  - [7. Seed Initial Data](#7-seed-initial-data)
  - [8. Run the Development Server](#8-run-the-development-server)
- [User Roles & Access](#user-roles--access)
- [Default Login Credentials](#default-login-credentials)
- [Database Schema](#database-schema)
- [Environment Variables Reference](#environment-variables-reference)
- [Common Issues & Fixes](#common-issues--fixes)
- [Deployment](#deployment)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), Tailwind CSS |
| Authentication | Auth.js v5 (NextAuth), bcryptjs, jose |
| GraphQL Engine | Hasura v2.36 |
| Database | PostgreSQL 15 |
| Runtime | Docker Desktop |
| Language | TypeScript |

---

## Features

### Admin Role
- View all interns across all departments
- Full CRUD — create, read, update, delete any intern
- Filter by department, gender, institute
- Search by name
- Manage departments and institutes
- Creates intern user accounts automatically when adding an intern

### Department Head Role
- View only interns within their department
- Full CRUD on their department's interns only
- Same filtering and search as admin but scoped
- Cannot delete interns (safety restriction)

### Intern Role
- View their own profile only
- Edit limited fields: name, phone, gender
- Cannot see other interns' data

---

## Project Structure

```
intern-management-system/
├── app/
│   ├── actions/
│   │   ├── createIntern.ts              # Server action: create user + intern (admin)
│   │   └── createInternDepartment.ts   # Server action: create user + intern (dept)
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts            # Auth.js route handler
│   ├── components/
│   │   ├── DeleteButton.tsx            # Intern delete button (admin only)
│   │   ├── DepartmentInternForm.tsx    # Create/edit form for department role
│   │   ├── InternFilters.tsx           # Search + filter bar
│   │   ├── InternForm.tsx              # Create/edit form for admin role
│   │   ├── InternProfileForm.tsx       # Self-edit form for intern role
│   │   └── Sidebar.tsx                 # Role-aware navigation sidebar
│   ├── dashboard/
│   │   ├── layout.tsx                  # Shared dashboard layout with sidebar
│   │   ├── admin/
│   │   │   ├── page.tsx                # Admin overview with stats
│   │   │   └── interns/
│   │   │       ├── page.tsx            # Intern list with filters
│   │   │       ├── new/page.tsx        # Create intern form
│   │   │       └── [id]/page.tsx       # Edit/delete intern
│   │   ├── department/
│   │   │   ├── page.tsx                # Department dashboard
│   │   │   └── interns/
│   │   │       ├── new/page.tsx        # Add intern (dept scoped)
│   │   │       └── [id]/page.tsx       # Edit intern (dept scoped)
│   │   └── intern/
│   │       └── page.tsx                # Intern self-profile page
│   ├── lib/
│   │   └── hasura.ts                   # Reusable GraphQL fetch helper
│   ├── login/
│   │   └── page.tsx                    # Login page
│   ├── providers.tsx                   # SessionProvider wrapper
│   ├── layout.tsx                      # Root layout
│   └── page.tsx                        # Root redirect by role
├── auth.ts                             # Auth.js configuration
├── proxy.ts                            # Route protection middleware
├── .env.local                          # Environment variables (not committed)
├── hasura/                             # Hasura CLI project files
│   ├── config.yaml
│   ├── metadata/
│   └── migrations/
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## Prerequisites

Make sure you have the following installed before starting:

| Tool | Version | Download |
|---|---|---|
| Node.js | 18 or higher | https://nodejs.org |
| Docker Desktop | Latest | https://www.docker.com/products/docker-desktop |
| Git | Any | https://git-scm.com |

Verify your versions:

```bash
node --version    # Should show v18.x.x or higher
docker --version  # Should show Docker version 24.x.x or higher
npm --version     # Should show 9.x.x or higher
```

---

## Getting Started

Follow these steps in order. Do not skip any step.

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/intern-management-system.git
cd intern-management-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Docker (PostgreSQL + Hasura)

We run both PostgreSQL and Hasura inside Docker containers.

**Step 3a — Start PostgreSQL:**

```bash
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_USER=postgres \
  -p 5432:5432 \
  postgres:15
```

> Replace `yourpassword` with your own password. Remember it — you'll use it in the next steps.

**Step 3b — Generate a JWT Secret:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output. You'll use it in the next step and in `.env.local`.

**Step 3c — Create the IMS database:**

```bash
docker exec -it postgres psql -U postgres -c "CREATE DATABASE ims_db;"
```

Verify it was created:

```bash
docker exec -it postgres psql -U postgres -c "\l"
```

You should see `ims_db` in the list.

**Step 3d — Create a hasura.env file:**

On **Mac/Linux**, create the file:
```bash
cat > hasura.env << EOF
HASURA_GRAPHQL_DATABASE_URL=postgresql://postgres:yourpassword@172.17.0.2:5432/ims_db
HASURA_GRAPHQL_ENABLE_CONSOLE=true
HASURA_GRAPHQL_ADMIN_SECRET=myadminsecret
HASURA_GRAPHQL_DEV_MODE=true
HASURA_GRAPHQL_JWT_SECRET={"type":"HS256","key":"YOUR_GENERATED_JWT_SECRET"}
EOF
```

On **Windows PowerShell**, create the file:
```powershell
@"
HASURA_GRAPHQL_DATABASE_URL=postgresql://postgres:yourpassword@172.17.0.2:5432/ims_db
HASURA_GRAPHQL_ENABLE_CONSOLE=true
HASURA_GRAPHQL_ADMIN_SECRET=myadminsecret
HASURA_GRAPHQL_DEV_MODE=true
HASURA_GRAPHQL_JWT_SECRET={"type":"HS256","key":"YOUR_GENERATED_JWT_SECRET"}
"@ | Set-Content -Path "hasura.env" -NoNewline
```

> Replace `yourpassword` with your PostgreSQL password and `YOUR_GENERATED_JWT_SECRET` with the key from Step 3b.

**Step 3e — Find your PostgreSQL container IP:**

```bash
docker inspect postgres --format '{{json .NetworkSettings.Networks}}'
```

Look for `"IPAddress"` in the output — it will be something like `172.17.0.2` or `172.17.0.3`. Update the `HASURA_GRAPHQL_DATABASE_URL` in `hasura.env` with this IP.

**Step 3f — Start Hasura:**

```bash
docker run -d -p 8080:8080 --env-file hasura.env hasura/graphql-engine:v2.36.1
```

Verify both containers are running:

```bash
docker ps
```

You should see two containers — `postgres` and the Hasura container.

Open the Hasura Console in your browser:
```
http://localhost:8080/console
```

Enter admin secret: `myadminsecret`

---

### 4. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# On Mac/Linux
touch .env.local

# On Windows PowerShell
New-Item .env.local -ItemType File
```

Open it and paste the following (replace the values):

```env
# Hasura GraphQL endpoint
NEXT_PUBLIC_HASURA_GRAPHQL_URL=http://localhost:8080/v1/graphql

# Hasura admin secret (server-side only — never expose to browser)
HASURA_ADMIN_SECRET=myadminsecret

# Auth.js configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=YOUR_GENERATED_JWT_SECRET

# JWT secret — must be the same value as NEXTAUTH_SECRET
JWT_SECRET=YOUR_GENERATED_JWT_SECRET
```

> **Important:** `NEXTAUTH_SECRET` and `JWT_SECRET` must be the **same value** as the key you put in `hasura.env`.

---

### 5. Set Up the Database

Go to **Hasura Console → Data tab → SQL** (left sidebar).

Paste this entire SQL block and click **Run**:

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Internship status lookup table
CREATE TABLE internship_status (
  id     UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL UNIQUE
);

-- Seed default statuses
INSERT INTO internship_status (status) VALUES
  ('active'), ('completed'), ('dropped'), ('pending');

-- Institutes
CREATE TABLE institutes (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  location   TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Departments (head_id added after users)
CREATE TABLE departments (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  head_id    UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Users
CREATE TABLE users (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password      TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'intern'
                  CHECK (role IN ('admin', 'department', 'intern')),
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);

-- Add head_id FK to departments
ALTER TABLE departments
  ADD CONSTRAINT departments_head_id_fkey
  FOREIGN KEY (head_id) REFERENCES users(id) ON DELETE SET NULL;

-- Interns
CREATE TABLE interns (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  institute_id  UUID REFERENCES institutes(id) ON DELETE SET NULL,
  status_id     UUID REFERENCES internship_status(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  gender        TEXT CHECK (gender IN ('male', 'female', 'other')),
  phone         TEXT,
  start_date    DATE,
  end_date      DATE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_departments
  BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_interns
  BEFORE UPDATE ON interns FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_institutes
  BEFORE UPDATE ON institutes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

Verify tables were created:

```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

You should see: `internship_status`, `institutes`, `departments`, `users`, `interns`.

---

### 6. Configure Hasura

#### 6a — Track All Tables

In Hasura Console → **Data tab → default database**.

You will see a banner: **"Untracked tables or views"**. Click **Track All**.

#### 6b — Add Relationships

Go to each table → **Relationships tab** → click **Add** on all suggested relationships:

| Table | Relationship | Points To |
|---|---|---|
| `interns` | `department` (object) | `departments` |
| `interns` | `institute` (object) | `institutes` |
| `interns` | `internship_status` (object) | `internship_status` |
| `interns` | `user` (object) | `users` |
| `departments` | `head` (object) | `users` |
| `departments` | `interns` (array) | `interns` |
| `users` | `intern` (object) | `interns` |

#### 6c — Set Permissions

Go to each table → **Permissions tab** and configure as follows:

**Table: `interns`**

| Role | insert | select | update | delete |
|---|---|---|---|---|
| `admin` | Without any checks, all columns | Without any checks, all columns | Without any checks, all columns | Without any checks |
| `department` | Check: `{"department_id":{"_eq":"X-Hasura-Department-Id"}}`, preset `department_id=x-hasura-department-id` | Same check, all columns | Same check, columns: name/gender/phone/start_date/end_date/status_id/institute_id | No permission |
| `intern` | No permission | Check: `{"user_id":{"_eq":"X-Hasura-User-Id"}}`, columns: id/name/gender/phone/start_date/end_date/status_id/department_id/institute_id | Same check, columns: name/phone/gender only | No permission |

For `admin`, `department`, and `intern` roles on `interns` select permission → also tick **Allow aggregation queries**.

**Tables: `departments`, `institutes`, `internship_status`**

All three roles get **select → Without any checks → All columns**. Only admin gets insert/update/delete.

**Table: `users`**

| Role | select |
|---|---|
| `admin` | Without any checks, all columns |
| `department` | Without any checks, columns: id/email only |
| `intern` | Check: `{"id":{"_eq":"X-Hasura-User-Id"}}`, columns: id/email only |

---

### 7. Seed Initial Data

In **Hasura Console → API tab**, run these mutations to create your initial data:

**Create departments:**

```graphql
mutation {
  insert_departments(objects: [
    { name: "Engineering" },
    { name: "Marketing"   },
    { name: "Design"      }
  ]) {
    returning { id name }
  }
}
```

**Create an institute:**

```graphql
mutation {
  insert_institutes_one(object: {
    name:     "Gujarat Technological University"
    location: "Ahmedabad, Gujarat"
  }) { id name }
}
```

**Generate a bcrypt hash for your admin password.** Run this in your terminal:

```bash
node -e "const b = require('bcryptjs'); b.hash('admin123', 10).then(h => console.log(h))"
```

**Create the admin user** (paste your hash):

```graphql
mutation {
  insert_users_one(object: {
    email:    "admin@ims.com"
    password: "PASTE_BCRYPT_HASH_HERE"
    role:     "admin"
  }) { id email role }
}
```

---

### 8. Run the Development Server

```bash
npm run dev
```

Open your browser at:

```
http://localhost:3000
```

You will be redirected to the login page. Log in with:

```
Email:    admin@ims.com
Password: admin123
```

You should land on the Admin Dashboard. 🎉

---

## User Roles & Access

### How to Create a Department Head

1. Log in as admin
2. Go to **Hasura Console → API tab**
3. Get a department UUID: `query { departments { id name } }`
4. Generate a bcrypt hash for their password (see Step 7 above)
5. Run this mutation:

```graphql
mutation {
  insert_users_one(object: {
    email:         "head@engineering.com"
    password:      "PASTE_HASH_HERE"
    role:          "department"
    department_id: "PASTE_DEPT_UUID_HERE"
  }) { id email }
}
```

### How to Create an Intern Account

Intern accounts are created automatically when an admin or department head adds an intern through the dashboard form. The form asks for:
- Intern's name, email, temporary password
- Department, institute, gender, phone, dates, status

The system automatically:
1. Creates a `users` row with `role = intern`
2. Creates an `interns` profile row linked via `user_id`

The intern can then log in with the email and temporary password provided.

---

## Default Login Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@ims.com | admin123 |

> **Note:** Department and intern accounts are created through the dashboard. There are no hardcoded department or intern accounts.

---

## Database Schema

```
internship_status        institutes
─────────────────        ──────────
id (PK)                  id (PK)
status                   name
                         location
                         created_at
                         updated_at
                         deleted_at

departments              users
───────────              ─────
id (PK)                  id (PK)
name                     email
head_id → users.id       password (bcrypt hash)
created_at               role (admin|department|intern)
updated_at               department_id → departments.id
deleted_at               created_at
                         updated_at
                         deleted_at

interns
───────
id (PK)
user_id → users.id (unique, cascade delete)
department_id → departments.id
institute_id → institutes.id
status_id → internship_status.id
name
gender (male|female|other)
phone
start_date
end_date
created_at
updated_at
deleted_at
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_HASURA_GRAPHQL_URL` | Yes | Hasura GraphQL endpoint. Must start with `NEXT_PUBLIC_` to be accessible in the browser. |
| `HASURA_ADMIN_SECRET` | Yes | Hasura admin secret. Used only on the server side (Server Actions, API routes). Never exposed to the browser. |
| `NEXTAUTH_URL` | Yes | Full URL of your app. Use `http://localhost:3000` for development. |
| `NEXTAUTH_SECRET` | Yes | Random secret for Auth.js session encryption. Must be at least 32 characters. |
| `JWT_SECRET` | Yes | Secret used to sign Hasura JWT tokens. Must be identical to the key in `hasura.env`. |

Generate a secure value for `NEXTAUTH_SECRET` and `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Common Issues & Fixes

### "Cannot connect to database" when starting Hasura

The PostgreSQL IP address in `hasura.env` may be wrong. Find the correct IP:

```bash
docker inspect postgres --format '{{json .NetworkSettings.Networks}}'
```

Update `HASURA_GRAPHQL_DATABASE_URL` in `hasura.env` with the correct `IPAddress`, then restart Hasura:

```bash
docker stop <hasura-container-id>
docker rm <hasura-container-id>
docker run -d -p 8080:8080 --env-file hasura.env hasura/graphql-engine:v2.36.1
```

---

### "field 'X' not found in type" GraphQL errors

This usually means either:
1. The relationship wasn't added in Hasura, or
2. The role doesn't have permission to access that field

**Fix:** Go to Hasura Console → Data → the affected table → Relationships tab and verify the relationship exists. Then check the Permissions tab for the affected role.

If relationships are correct but still failing, restart the Hasura container:

```bash
docker restart $(docker ps -q --filter ancestor=hasura/graphql-engine:v2.36.1)
```

---

### "Invalid email or password" on login

Check these in order:

1. Verify the user exists in Hasura: `query { users { id email role } }`
2. Verify the password column is called `password` (not `password_hash`)
3. Confirm your `HASURA_ADMIN_SECRET` in `.env.local` matches what Hasura is running with
4. Check terminal logs for the `📦 Hasura response` debug output

---

### Tables not visible in pgAdmin

pgAdmin caches the database structure. Right-click the database → **Refresh**. If that doesn't work, disconnect and reconnect the server.

This does not affect the application — if tables are visible in Hasura Console they exist and the app will work correctly.

---

### Hasura Console shows blank page or won't load

The Hasura container may have crashed. Check logs:

```bash
docker logs $(docker ps -lq)
```

Common causes:
- Wrong database password in `HASURA_GRAPHQL_DATABASE_URL`
- JWT secret format error — the value must be valid JSON: `{"type":"HS256","key":"..."}`
- Database doesn't exist yet — make sure you ran `CREATE DATABASE ims_db`

---

### `npm install` fails with peer dependency errors

Your Node.js version may be incompatible. This project requires Node.js 18+:

```bash
node --version
```

If below 18, download the LTS version from https://nodejs.org.

---

### Windows: PowerShell bracket errors with folder names

The `[...nextauth]` folder name contains square brackets which PowerShell treats as wildcards. Use .NET directly to create files inside it:

```powershell
[System.IO.File]::WriteAllText(
  (Join-Path (Get-Location) "app\api\auth\[...nextauth]\route.ts"),
  "your file content here"
)
```

---

## Deployment

### Deploy Hasura

1. Go to [cloud.hasura.io](https://cloud.hasura.io) and create a free account
2. Create a new project
3. Connect a PostgreSQL database (Neon DB free tier works well)
4. In Project Settings → Environment Variables, add:
   - `HASURA_GRAPHQL_ADMIN_SECRET` — a strong random string
   - `HASURA_GRAPHQL_JWT_SECRET` — `{"type":"HS256","key":"your-jwt-secret"}`
5. In the Hasura Console, run your SQL schema and configure tables + permissions as described above

### Deploy Next.js to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. In the Vercel dashboard → Project Settings → Environment Variables, add all variables from `.env.local` with production values:
   - `NEXT_PUBLIC_HASURA_GRAPHQL_URL` → your Hasura Cloud endpoint
   - `HASURA_ADMIN_SECRET` → your Hasura admin secret
   - `NEXTAUTH_URL` → your Vercel app URL (e.g. `https://your-app.vercel.app`)
   - `NEXTAUTH_SECRET` → same JWT secret used in Hasura
   - `JWT_SECRET` → same JWT secret used in Hasura

4. Deploy

### Production Checklist

```
✅ NEXTAUTH_URL points to your production domain (not localhost)
✅ HASURA_ADMIN_SECRET is a strong random string (not "myadminsecret")
✅ JWT_SECRET is the same in both Hasura and Next.js environment variables
✅ .env.local is in .gitignore and never committed to Git
✅ Hasura permissions tested for all three roles
✅ CORS configured in Hasura to allow your Vercel domain
✅ Error boundaries added to React components
✅ Test login for all three role types before going live
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## License

This project is licensed under the MIT License.