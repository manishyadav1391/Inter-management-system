"""
train_agent.py
==============
Training script for the InternHub Vanna agent.
Trains Vanna against the IMS production database schema (ims_db on Dockerized Postgres).

Run once after first setup, or whenever the schema changes:
  python train_agent.py
"""

import logging
from vanna_setup import vn, connect_to_postgres

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Connect first ───────────────────────────────────────────────────────────
connect_to_postgres()

# ── DDL — matches README schema (ims_db) ────────────────────────────────────
DDL_STATEMENTS = [
    """
    CREATE TABLE internship_status (
      id     UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      status TEXT NOT NULL UNIQUE
    );
    """,
    """
    CREATE TABLE institutes (
      id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name       TEXT NOT NULL,
      location   TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      deleted_at TIMESTAMPTZ
    );
    """,
    """
    CREATE TABLE departments (
      id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name       TEXT NOT NULL,
      head_id    UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      deleted_at TIMESTAMPTZ
    );
    """,
    """
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
    """,
    """
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
    """
]

# ── Documentation ──────────────────────────────────────────────────────────
DOCUMENTATION = [
    """
    This is the IMS (Intern Management System) database running on PostgreSQL 15 (Docker).
    It has 5 core tables: users, departments, institutes, internship_status, interns.

    Key relationships:
    - interns.user_id      → users.id         (one-to-one, UNIQUE — each user has at most one intern profile)
    - interns.department_id→ departments.id   (which department this intern belongs to)
    - interns.institute_id → institutes.id    (the college/university the intern comes from)
    - interns.status_id    → internship_status.id (current internship status)
    - departments.head_id  → users.id         (department head user, role='department')
    - users.department_id  → departments.id   (for role='department' users)

    Soft deletes: most tables have a deleted_at column. Active rows have deleted_at IS NULL.
    Timestamps use TIMESTAMPTZ (timezone-aware).

    internship_status values: 'active', 'completed', 'dropped', 'pending'
    user roles: 'admin', 'department', 'intern'
    intern genders: 'male', 'female', 'other'
    """,
    """
    Common query patterns:
    - To get an intern's email, join interns → users on interns.user_id = users.id
    - To get department name, join interns → departments on interns.department_id = departments.id
    - To get institute name, join interns → institutes on interns.institute_id = institutes.id
    - To get status text, join interns → internship_status on interns.status_id = internship_status.id
    - Always filter active/non-deleted rows with: WHERE interns.deleted_at IS NULL
    - Department heads: users WHERE role = 'department'
    - Admin users:      users WHERE role = 'admin'
    """
]

# ── Golden Queries ────────────────────────────────────────────────────────
GOLDEN_QUERIES = [
    {
        "question": "Show all active interns with their email, department and institute.",
        "sql": """
            SELECT
                i.id,
                i.name,
                u.email,
                d.name   AS department,
                ins.name AS institute,
                s.status,
                i.start_date,
                i.end_date
            FROM interns i
            JOIN users u              ON u.id   = i.user_id
            LEFT JOIN departments d   ON d.id   = i.department_id
            LEFT JOIN institutes ins  ON ins.id = i.institute_id
            LEFT JOIN internship_status s ON s.id = i.status_id
            WHERE i.deleted_at IS NULL
              AND s.status = 'active'
            ORDER BY i.created_at DESC;
        """
    },
    {
        "question": "Count interns by status.",
        "sql": """
            SELECT
                COALESCE(s.status, 'unknown') AS status,
                COUNT(*) AS total
            FROM interns i
            LEFT JOIN internship_status s ON s.id = i.status_id
            WHERE i.deleted_at IS NULL
            GROUP BY COALESCE(s.status, 'unknown')
            ORDER BY total DESC;
        """
    },
    {
        "question": "List interns ending in the next 30 days.",
        "sql": """
            SELECT
                i.name,
                u.email,
                i.end_date,
                d.name AS department
            FROM interns i
            JOIN users u             ON u.id = i.user_id
            LEFT JOIN departments d  ON d.id = i.department_id
            WHERE i.deleted_at IS NULL
              AND i.end_date IS NOT NULL
              AND i.end_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')
            ORDER BY i.end_date ASC;
        """
    },
    {
        "question": "How many interns are there in each department?",
        "sql": """
            SELECT
                d.name AS department,
                COUNT(i.id) AS intern_count
            FROM departments d
            LEFT JOIN interns i ON i.department_id = d.id AND i.deleted_at IS NULL
            WHERE d.deleted_at IS NULL
            GROUP BY d.name
            ORDER BY intern_count DESC;
        """
    },
    {
        "question": "Show all pending interns.",
        "sql": """
            SELECT
                i.name,
                u.email,
                d.name AS department,
                i.start_date,
                i.end_date
            FROM interns i
            JOIN users u             ON u.id = i.user_id
            LEFT JOIN departments d  ON d.id = i.department_id
            JOIN internship_status s ON s.id = i.status_id
            WHERE i.deleted_at IS NULL
              AND s.status = 'pending'
            ORDER BY i.start_date ASC;
        """
    },
    {
        "question": "List all departments with their head's email.",
        "sql": """
            SELECT
                d.name AS department,
                u.email AS head_email
            FROM departments d
            LEFT JOIN users u ON u.id = d.head_id
            WHERE d.deleted_at IS NULL
            ORDER BY d.name;
        """
    },
    {
        "question": "Which institutes have the most interns?",
        "sql": """
            SELECT
                ins.name AS institute,
                COUNT(i.id) AS intern_count
            FROM institutes ins
            LEFT JOIN interns i ON i.institute_id = ins.id AND i.deleted_at IS NULL
            WHERE ins.deleted_at IS NULL
            GROUP BY ins.name
            ORDER BY intern_count DESC;
        """
    },
    {
        "question": "Show completed interns with their department.",
        "sql": """
            SELECT
                i.name,
                u.email,
                d.name AS department,
                i.end_date
            FROM interns i
            JOIN users u             ON u.id = i.user_id
            LEFT JOIN departments d  ON d.id = i.department_id
            JOIN internship_status s ON s.id = i.status_id
            WHERE i.deleted_at IS NULL
              AND s.status = 'completed'
            ORDER BY i.end_date DESC;
        """
    }
]


def run_training():
    logger.info("Starting training of InternHub AI against ims_db (Dockerized Postgres)...")

    # 1. DDL
    logger.info("Training on schema DDL...")
    for ddl in DDL_STATEMENTS:
        vn.train(ddl=ddl)

    # 2. Documentation
    logger.info("Training on documentation...")
    for doc in DOCUMENTATION:
        vn.train(documentation=doc)

    # 3. Golden Queries
    logger.info("Training on golden SQL examples...")
    for query in GOLDEN_QUERIES:
        vn.train(question=query["question"], sql=query["sql"])

    logger.info("Training complete! ChromaDB vector store seeded successfully.")
    logger.info(f"Total golden queries trained: {len(GOLDEN_QUERIES)}")


if __name__ == "__main__":
    run_training()
