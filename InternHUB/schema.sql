-- IMS (Intern Management System) — Production Schema
-- Target DB : ims_db  (Dockerized postgres:15 container named "postgres")
-- Usage:
--   docker exec -i postgres psql -U postgres -d ims_db < InternHUB/schema.sql
--
-- This file mirrors the schema created through the Hasura Console as described
-- in README.md §5 "Set Up the Database".

-- ── Extensions ────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Internship status lookup ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS internship_status (
  id     UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL UNIQUE
);

INSERT INTO internship_status (status)
SELECT unnest(ARRAY['active','completed','dropped','pending'])
ON CONFLICT (status) DO NOTHING;

-- ── Institutes ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS institutes (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  location   TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- ── Departments (head_id FK added after users) ────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  head_id    UUID,                         -- FK to users.id added below
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- ── Users ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
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

-- ── Add departments.head_id FK now that users exists ─────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'departments_head_id_fkey'
  ) THEN
    ALTER TABLE departments
      ADD CONSTRAINT departments_head_id_fkey
      FOREIGN KEY (head_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ── Interns ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS interns (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  institute_id  UUID REFERENCES institutes(id)  ON DELETE SET NULL,
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

-- ── Auto-update updated_at trigger ────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','departments','interns','institutes'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'set_updated_at_' || t
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER set_updated_at_%I
         BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION set_updated_at();', t, t
      );
    END IF;
  END LOOP;
END $$;
