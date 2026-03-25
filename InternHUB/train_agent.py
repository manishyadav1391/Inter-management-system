"""
train_agent.py
==============
Training script for the InternHub Vanna agent.
Trains Vanna against the current IMS database schema.
"""

import logging
from vanna_setup import vn

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── DDL (IMS Schema) ────────────────────────────────────────────────────
DDL_STATEMENTS = [
    """
    CREATE TABLE departments (
      id UUID PRIMARY KEY,
      head_id UUID,
      name TEXT NOT NULL,
      created_at TIMESTAMP,
      updated_at TIMESTAMP,
      deleted_at TIMESTAMP
    );
    """,
    """
    CREATE TABLE users (
      id UUID PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      department_id UUID,
      created_at TIMESTAMP,
      updated_at TIMESTAMP,
      deleted_at TIMESTAMP
    );
    """,
    """
    CREATE TABLE institutes (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT,
      created_at TIMESTAMP,
      updated_at TIMESTAMP,
      deleted_at TIMESTAMP
    );
    """,
    """
    CREATE TABLE internship_status (
      id UUID PRIMARY KEY,
      status TEXT NOT NULL
    );
    """,
    """
    CREATE TABLE interns (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL,
      department_id UUID NOT NULL,
      name TEXT NOT NULL,
      gender TEXT,
      phone TEXT,
      institute_id UUID,
      start_date DATE,
      end_date DATE,
      status_id UUID,
      created_at TIMESTAMP,
      updated_at TIMESTAMP,
      deleted_at TIMESTAMP
    );
    """
]

# ── Documentation ──────────────────────────────────────────────────────
DOCUMENTATION = [
    """
    Database has 5 core tables: users, departments, institutes, internship_status, interns.
    interns.status_id maps to internship_status.id.
    interns.user_id maps to users.id (for intern login identity and email).
    interns.department_id maps to departments.id.
    Intern records use soft-delete via deleted_at IS NULL.
    """
]

# ── Golden Queries ───────────────────────────────────────────────────
GOLDEN_QUERIES = [
    {
        "question": "Show all active interns with their email, department and institute.",
        "sql": """
            SELECT
                i.id,
                i.name,
                u.email,
                d.name AS department,
                ins.name AS institute,
                s.status,
                i.start_date,
                i.end_date
            FROM interns i
            JOIN users u ON u.id = i.user_id
            LEFT JOIN departments d ON d.id = i.department_id
            LEFT JOIN institutes ins ON ins.id = i.institute_id
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
            JOIN users u ON u.id = i.user_id
            LEFT JOIN departments d ON d.id = i.department_id
            WHERE i.deleted_at IS NULL
              AND i.end_date IS NOT NULL
              AND i.end_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')
            ORDER BY i.end_date ASC;
        """
    }
]

def run_training():
    logger.info("Starting training of InternHub AI...")

    # 1. DDL
    for ddl in DDL_STATEMENTS:
        vn.train(ddl=ddl)
    
    # 2. Docs
    for doc in DOCUMENTATION:
        vn.train(documentation=doc)
    
    # 3. Golden Queries
    for query in GOLDEN_QUERIES:
        vn.train(question=query['question'], sql=query['sql'])

    logger.info("Training complete! ChromaDB seed successful.")

if __name__ == "__main__":
    run_training()
