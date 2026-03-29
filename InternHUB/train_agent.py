"""
train_agent.py
==============
Training script for the InternHub Vanna agent.
Trains Vanna against the IMS production database schema (ims_db on Dockerized Postgres).

Run once after first setup, or whenever the schema changes:
  python train_agent.py
"""

import logging
import csv
from pathlib import Path
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

CSV_PATH = Path(__file__).with_name("training_queries.csv")


def load_queries_from_csv(csv_path: Path) -> list[dict[str, str]]:
    if not csv_path.exists():
        raise FileNotFoundError(
            f"Training CSV not found at: {csv_path}. "
            "Create this file with headers: question,sql"
        )

    queries: list[dict[str, str]] = []
    with csv_path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        required = {"question", "sql"}
        fields = set(reader.fieldnames or [])
        if not required.issubset(fields):
            raise ValueError(
                "Training CSV must contain headers: question,sql"
            )

        for idx, row in enumerate(reader, start=2):
            question = (row.get("question") or "").strip()
            sql = (row.get("sql") or "").strip()
            if not question or not sql:
                logger.warning(
                    "Skipping invalid training row %s in %s (empty question/sql)",
                    idx,
                    csv_path,
                )
                continue
            queries.append({"question": question, "sql": sql})

    if not queries:
        raise ValueError(f"No valid training rows found in {csv_path}")

    return queries


def run_training():
    logger.info("Starting training of InternHub AI against ims_db (Dockerized Postgres)...")
    logger.info("Loading training examples from CSV: %s", CSV_PATH)
    csv_queries = load_queries_from_csv(CSV_PATH)
    logger.info("Loaded %s training examples from CSV", len(csv_queries))

    # 1. DDL
    logger.info("Training on schema DDL...")
    for ddl in DDL_STATEMENTS:
        vn.train(ddl=ddl)

    # 2. Documentation
    logger.info("Training on documentation...")
    for doc in DOCUMENTATION:
        vn.train(documentation=doc)

    # 3. CSV Queries
    logger.info("Training on CSV SQL examples...")
    for query in csv_queries:
        vn.train(question=query["question"], sql=query["sql"])

    logger.info("Training complete! ChromaDB vector store seeded successfully.")
    logger.info("Total CSV queries trained: %s", len(csv_queries))


if __name__ == "__main__":
    run_training()
