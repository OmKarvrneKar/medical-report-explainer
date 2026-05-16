from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import reports

app = FastAPI(title="Medical Report Explainer API")

import os

ALLOWED_ORIGINS = [
    "http://localhost:5173",                          # local dev
    "http://localhost:3000",                          # alternative local
    os.getenv("FRONTEND_URL", ""),                    # set this on Render later
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