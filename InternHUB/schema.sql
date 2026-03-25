-- InternHUB / IMS schema + dummy seed
-- Target DB: intern_management
-- Usage:
--   psql -U postgres -d intern_management -f InternHUB/schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS departments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  head_id     UUID,
  name        TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT now(),
  updated_at  TIMESTAMP DEFAULT now(),
  deleted_at  TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password      TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('admin','department','intern')),
  department_id UUID REFERENCES departments(id),
  created_at    TIMESTAMP DEFAULT now(),
  updated_at    TIMESTAMP DEFAULT now(),
  deleted_at    TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_dept_head') THEN
    ALTER TABLE departments
      ADD CONSTRAINT fk_dept_head
      FOREIGN KEY (head_id) REFERENCES users(id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS institutes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  location    TEXT,
  created_at  TIMESTAMP DEFAULT now(),
  updated_at  TIMESTAMP DEFAULT now(),
  deleted_at  TIMESTAMP
);

CREATE TABLE IF NOT EXISTS internship_status (
  id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS interns (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id),
  department_id UUID NOT NULL REFERENCES departments(id),
  name          TEXT NOT NULL,
  gender        TEXT,
  phone         TEXT,
  institute_id  UUID REFERENCES institutes(id),
  start_date    DATE,
  end_date      DATE,
  status_id     UUID REFERENCES internship_status(id),
  created_at    TIMESTAMP DEFAULT now(),
  updated_at    TIMESTAMP DEFAULT now(),
  deleted_at    TIMESTAMP
);

INSERT INTO internship_status (status)
SELECT 'pending'
WHERE NOT EXISTS (SELECT 1 FROM internship_status WHERE status = 'pending');

INSERT INTO internship_status (status)
SELECT 'active'
WHERE NOT EXISTS (SELECT 1 FROM internship_status WHERE status = 'active');

INSERT INTO internship_status (status)
SELECT 'completed'
WHERE NOT EXISTS (SELECT 1 FROM internship_status WHERE status = 'completed');

INSERT INTO internship_status (status)
SELECT 'terminated'
WHERE NOT EXISTS (SELECT 1 FROM internship_status WHERE status = 'terminated');

INSERT INTO departments (id, name)
VALUES
  ('11111111-1111-1111-1111-111111111001', 'Engineering'),
  ('11111111-1111-1111-1111-111111111002', 'Human Resources'),
  ('11111111-1111-1111-1111-111111111003', 'Data Science')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    updated_at = now();

INSERT INTO institutes (id, name, location)
VALUES
  ('22222222-2222-2222-2222-222222222001', 'IIT Bombay', 'Mumbai'),
  ('22222222-2222-2222-2222-222222222002', 'NIT Trichy', 'Tiruchirappalli'),
  ('22222222-2222-2222-2222-222222222003', 'Delhi University', 'New Delhi')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    location = EXCLUDED.location,
    updated_at = now();

INSERT INTO users (email, password, role)
VALUES
  ('admin@intern.com', '$2b$12$cDCZOMk1bSz11pKrFSSTq.6.MY8QxPLigIRSxJvNLWnxyGNOR7lOu', 'admin')
ON CONFLICT (email) DO UPDATE
SET password = EXCLUDED.password,
    role = EXCLUDED.role,
    updated_at = now();

INSERT INTO users (id, email, password, role, department_id)
VALUES
  ('33333333-3333-3333-3333-333333333001', 'eng.head@intern.com', '$2b$12$cDCZOMk1bSz11pKrFSSTq.6.MY8QxPLigIRSxJvNLWnxyGNOR7lOu', 'department', '11111111-1111-1111-1111-111111111001'),
  ('33333333-3333-3333-3333-333333333002', 'hr.head@intern.com',  '$2b$12$cDCZOMk1bSz11pKrFSSTq.6.MY8QxPLigIRSxJvNLWnxyGNOR7lOu', 'department', '11111111-1111-1111-1111-111111111002'),
  ('33333333-3333-3333-3333-333333333003', 'ds.head@intern.com',  '$2b$12$cDCZOMk1bSz11pKrFSSTq.6.MY8QxPLigIRSxJvNLWnxyGNOR7lOu', 'department', '11111111-1111-1111-1111-111111111003')
ON CONFLICT (email) DO UPDATE
SET password = EXCLUDED.password,
    role = EXCLUDED.role,
    department_id = EXCLUDED.department_id,
    updated_at = now();

UPDATE departments d
SET head_id = u.id,
    updated_at = now()
FROM users u
WHERE (
    (d.id = '11111111-1111-1111-1111-111111111001' AND u.email = 'eng.head@intern.com') OR
    (d.id = '11111111-1111-1111-1111-111111111002' AND u.email = 'hr.head@intern.com') OR
    (d.id = '11111111-1111-1111-1111-111111111003' AND u.email = 'ds.head@intern.com')
);

INSERT INTO users (id, email, password, role, department_id)
VALUES
  ('44444444-4444-4444-4444-444444444001', 'riya.intern@intern.com', '$2b$12$cDCZOMk1bSz11pKrFSSTq.6.MY8QxPLigIRSxJvNLWnxyGNOR7lOu', 'intern', '11111111-1111-1111-1111-111111111001'),
  ('44444444-4444-4444-4444-444444444002', 'aman.intern@intern.com', '$2b$12$cDCZOMk1bSz11pKrFSSTq.6.MY8QxPLigIRSxJvNLWnxyGNOR7lOu', 'intern', '11111111-1111-1111-1111-111111111002'),
  ('44444444-4444-4444-4444-444444444003', 'neha.intern@intern.com', '$2b$12$cDCZOMk1bSz11pKrFSSTq.6.MY8QxPLigIRSxJvNLWnxyGNOR7lOu', 'intern', '11111111-1111-1111-1111-111111111003')
ON CONFLICT (email) DO UPDATE
SET password = EXCLUDED.password,
    role = EXCLUDED.role,
    department_id = EXCLUDED.department_id,
    updated_at = now();

INSERT INTO interns (
  id, user_id, department_id, name, gender, phone, institute_id, start_date, end_date, status_id
)
VALUES
  (
    '55555555-5555-5555-5555-555555555001',
    '44444444-4444-4444-4444-444444444001',
    '11111111-1111-1111-1111-111111111001',
    'Riya Sharma',
    'female',
    '9876543210',
    '22222222-2222-2222-2222-222222222001',
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE + INTERVAL '60 days',
    (SELECT id FROM internship_status WHERE status = 'active' LIMIT 1)
  ),
  (
    '55555555-5555-5555-5555-555555555002',
    '44444444-4444-4444-4444-444444444002',
    '11111111-1111-1111-1111-111111111002',
    'Aman Verma',
    'male',
    '8765432109',
    '22222222-2222-2222-2222-222222222002',
    CURRENT_DATE - INTERVAL '120 days',
    CURRENT_DATE - INTERVAL '10 days',
    (SELECT id FROM internship_status WHERE status = 'completed' LIMIT 1)
  ),
  (
    '55555555-5555-5555-5555-555555555003',
    '44444444-4444-4444-4444-444444444003',
    '11111111-1111-1111-1111-111111111003',
    'Neha Singh',
    'female',
    '7654321098',
    '22222222-2222-2222-2222-222222222003',
    CURRENT_DATE + INTERVAL '7 days',
    CURRENT_DATE + INTERVAL '90 days',
    (SELECT id FROM internship_status WHERE status = 'pending' LIMIT 1)
  )
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    gender = EXCLUDED.gender,
    phone = EXCLUDED.phone,
    institute_id = EXCLUDED.institute_id,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    status_id = EXCLUDED.status_id,
    updated_at = now();
