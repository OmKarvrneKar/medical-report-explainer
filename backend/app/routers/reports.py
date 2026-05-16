from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
import json
import io
from app.services.pdf_service import generate_report_pdf
from typing import List
import json
from app.services.ocr_service import extract_text
from app.services.ai_service import explain_report
from app.database.db import get_db
from app.database.crud import save_report, get_report, get_reports, delete_report
from app.models.schemas import ReportResponse

router = APIRouter()

@router.post("/upload")
async def upload_report(
    file: UploadFile = File(...),
    language: str = Form(default="English"),
    db: Session = Depends(get_db)
):
    allowed_types = ["application/pdf", "image/jpeg", "image/png",
                     "image/jpg", "image/bmp", "image/tiff"]

    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Unsupported file type.")

    file_bytes = await file.read()

    if len(file_bytes) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File too large. Max 10MB.")

    try:
        extracted_text = extract_text(file_bytes, file.filename)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not extract text: {str(e)}")

    try:
        result = explain_report(extracted_text, language)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI explanation failed: {str(e)}")

    # Save to database
    try:
        saved_report = save_report(db, result, language)
        result["id"] = saved_report.id
        result["created_at"] = saved_report.created_at
        result["language"] = saved_report.language
    except Exception as e:
        print("Database error:", e)

    return result

@router.get("/report/{report_id}")
def read_report(report_id: str, db: Session = Depends(get_db)):
    db_report = get_report(db, report_id)
    if db_report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return {
        "id": db_report.id,
        "summary": db_report.summary,
        "overall_status": db_report.overall_status,
        "parameters": json.loads(db_report.parameters),
        "what_to_do": db_report.what_to_do,
        "disclaimer": db_report.disclaimer,
        "language": db_report.language,
        "created_at": db_report.created_at
    }

@router.get("/history")
def read_history(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    reports = get_reports(db, skip=skip, limit=limit)
    result = []
    for r in reports:
        result.append({
            "id": r.id,
            "summary": r.summary,
            "overall_status": r.overall_status,
            "created_at": r.created_at,
            "language": r.language
        })
    return result

@router.delete("/report/{report_id}")
def delete_saved_report(report_id: str, db: Session = Depends(get_db)):
    success = delete_report(db, report_id)
    if not success:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"status": "success", "message": "Report deleted"}

@router.get("/export/{report_id}")
async def export_report_pdf(report_id: str, db: Session = Depends(get_db)):
    """Fetch report from DB and return it as a downloadable PDF."""
    report = get_report(db, report_id)

    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    # Convert SQLAlchemy model → plain dict
    report_dict = {
        "summary":        report.summary,
        "overall_status": report.overall_status,
        "parameters":     report.parameters,   # stored as JSON string — pdf_service handles it
        "what_to_do":     getattr(report, "what_to_do",  "Please consult your doctor."),
        "disclaimer":     getattr(report, "disclaimer",  "This is for informational purposes only."),
        "language":       report.language,
        "created_at":     str(report.created_at) if hasattr(report, "created_at") else "",
    }

    pdf_bytes = generate_report_pdf(report_dict)

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=medical_report_{report_id}.pdf"
        }
    )