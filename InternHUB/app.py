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

from fastapi import FastAPI, Request, HTTPException, status
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
async def run_sql(payload: Dict[str, str]):
    """Execute raw SQL result (Auth Disabled)."""
    sql = payload.get("sql")
    if not sql:
        raise HTTPException(400, "SQL missing")
    
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
async def ask(payload: ChatRequest):
    """Full natural language query lifecycle (Auth Disabled)."""
    try:
        sql = _generate_sql_for_question(payload.question)

        if not _looks_like_sql(sql):
            raise HTTPException(
                status_code=422,
                detail=(
                    "LLM returned non-SQL output. Rephrase the prompt as a query request "
                    "(example: 'show interns from CHARUSAT with department')."
                ),
            )

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
