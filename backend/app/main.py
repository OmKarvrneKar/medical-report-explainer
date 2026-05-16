from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import reports

app = FastAPI(title="Medical Report Explainer API")

import os

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://medical-report-explainer-rust.vercel.app",  # your actual Vercel URL
    os.getenv("FRONTEND_URL", ""),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in ALLOWED_ORIGINS if o],  # filter empty strings
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(reports.router, prefix="/api")

@app.get("/")
def health_check():
    return {"status": "running", "message": "Medical Report Explainer API is live"}