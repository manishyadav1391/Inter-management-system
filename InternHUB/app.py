"""
app.py
======
FastAPI application server for the InternHub Text-to-SQL chatbot.

AUTHENTICATION REMOVED: In testing mode as requested.
This allows any user to access the chatbot and run SQL queries.
"""

import os
import logging
import pandas as pd
import re
from contextlib import asynccontextmanager
from typing import Optional, List, Dict, Any

import jwt
from fastapi import FastAPI, Request, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

from vanna_setup import vn, connect_to_postgres

load_dotenv()

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)

# ── Config ─────────────────────────────────────────────────────────────
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "*").split(",")
]

# ── Models ─────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    question: str


SQL_START_PATTERN = re.compile(
    r"^\s*(select|with|insert|update|delete|create|alter|drop|truncate)\b",
    re.IGNORECASE,
)
INTERNS_TABLE_PATTERN = re.compile(r"\b(?:public\.)?interns\b", re.IGNORECASE)


def _looks_like_sql(text: str) -> bool:
    if not text or not isinstance(text, str):
        return False
    return SQL_START_PATTERN.search(text.strip()) is not None


def _generate_sql_for_question(question: str) -> str:
    """Generate SQL with data-awareness enabled when supported by Vanna."""
    try:
        # Some Vanna versions support this flag; it helps resolve value-based prompts.
        return vn.generate_sql(question=question, allow_llm_to_see_data=True)
    except TypeError:
        # Fallback for versions that do not accept allow_llm_to_see_data.
        return vn.generate_sql(question=question)


def _parse_auth_claims(authorization: str | None) -> Dict[str, Any]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Invalid bearer token")

    jwt_secret = os.getenv("JWT_SECRET")
    if not jwt_secret:
        raise HTTPException(status_code=500, detail="JWT_SECRET is not configured")

    try:
        decoded = jwt.decode(token, jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

    claims = decoded.get("https://hasura.io/jwt/claims", {})
    if not isinstance(claims, dict):
        raise HTTPException(status_code=401, detail="Invalid Hasura claims in token")

    return claims


def _scope_sql_for_department(sql: str, department_id: str) -> str:
    if not department_id:
        raise HTTPException(status_code=403, detail="Department claim missing in token")

    if not INTERNS_TABLE_PATTERN.search(sql):
        raise HTTPException(
            status_code=403,
            detail="Department users can only run queries that include interns data",
        )

    scoped_sql = INTERNS_TABLE_PATTERN.sub("allowed_interns", sql)
    cte = (
        "allowed_interns AS ("
        "SELECT * FROM interns "
        f"WHERE department_id = '{department_id}'::uuid AND deleted_at IS NULL"
        ")"
    )

    if re.match(r"^\s*with\b", scoped_sql, flags=re.IGNORECASE):
        return re.sub(r"^\s*with\b", f"WITH {cte},", scoped_sql, count=1, flags=re.IGNORECASE)

    return f"WITH {cte} {scoped_sql}"

# ── Lifespan ───────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up InternHub AI Server (TESTING MODE - AUTH DISABLED)")
    try:
        connect_to_postgres()
    except Exception as e:
        logger.error(f"Postgres connection failed: {e}")
    yield
    logger.info("Shutting down InternHub AI Server.")

# ── App Init ───────────────────────────────────────────────────────────
app = FastAPI(lifespan=lifespan, title="InternHub Vanna 2.0 API (Testing)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Endpoints ──────────────────────────────────────────────────────────

@app.get("/api/v0/config")
async def get_config():
    """Vanna-chat compatible discovery endpoint."""
    return {
        "api_base":    "/api/v0",
        "product":     "InternHub AI SQL",
        "llm_model":   os.getenv("GROQ_MODEL", "llama3-70b-8192"),
    }

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/api/v0/generate_sql")
async def generate_sql(payload: ChatRequest):
    """Generate SQL from natural language (Auth Disabled)."""
    try:
        sql = _generate_sql_for_question(payload.question)

        if not _looks_like_sql(sql):
            raise HTTPException(
                status_code=422,
                detail=(
                    "LLM returned non-SQL output. Rephrase your question with explicit SQL intent "
                    "or retrain the agent with more examples."
                ),
            )

        return {"sql": sql}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"SQL generation failed: {e}")
        raise HTTPException(500, f"Error generating SQL: {str(e)}")

@app.post("/api/v0/run_sql")
async def run_sql(payload: Dict[str, str], authorization: str | None = Header(default=None)):
    """Execute raw SQL result (Auth Disabled)."""
    sql = payload.get("sql")
    if not sql:
        raise HTTPException(400, "SQL missing")

    claims = _parse_auth_claims(authorization)
    role = claims.get("x-hasura-default-role")
    department_id = claims.get("x-hasura-department-id", "")

    if role == "department":
        sql = _scope_sql_for_department(sql, department_id)
    
    try:
        df = vn.run_sql(sql)
        if df is None or df.empty:
            return {"results": [], "columns": []}
        
        return {
            "results": df.to_dict(orient="records"),
            "columns": list(df.columns)
        }
    except Exception as e:
        logger.error(f"SQL execution failed: {e}")
        raise HTTPException(500, f"Database error: {str(e)}")

@app.post("/api/v0/ask")
async def ask(payload: ChatRequest, authorization: str | None = Header(default=None)):
    """Full natural language query lifecycle (Auth Disabled)."""
    try:
        claims = _parse_auth_claims(authorization)
        role = claims.get("x-hasura-default-role")
        department_id = claims.get("x-hasura-department-id", "")

        sql = _generate_sql_for_question(payload.question)

        if not _looks_like_sql(sql):
            raise HTTPException(
                status_code=422,
                detail=(
                    "LLM returned non-SQL output. Rephrase the prompt as a query request "
                    "(example: 'show interns from CHARUSAT with department')."
                ),
            )

        if role == "department":
            sql = _scope_sql_for_department(sql, department_id)

        df = vn.run_sql(sql)
        
        results = []
        columns = []
        if df is not None and not df.empty:
            results = df.to_dict(orient="records")
            columns = list(df.columns)
        
        return {
            "question": payload.question,
            "sql": sql,
            "results": results,
            "columns": columns
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ask query failed: {e}")
        raise HTTPException(500, f"Error processing query: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
