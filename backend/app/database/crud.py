from sqlalchemy.orm import Session
from app.database.db import ReportDB
import json
import uuid

def save_report(db: Session, report_data: dict, language: str, user_id: str):
    summary_data = {
        "patient_summary": report_data.get("patient_summary", ""),
        "clinical_summary": report_data.get("clinical_summary", ""),
        "confidence_score": report_data.get("confidence_score", 100.0)
    }
    
    db_report = ReportDB(
        id=str(uuid.uuid4()),
        user_id=user_id,
        summary=json.dumps(summary_data),
        overall_status=report_data.get("overall_status", "normal"),
        parameters=json.dumps(report_data.get("panels", [])),
        what_to_do=report_data.get("what_to_do", ""),
        disclaimer=report_data.get("disclaimer", ""),
        language=language
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report

def get_report(db: Session, report_id: str, user_id: str):
    return db.query(ReportDB).filter(ReportDB.id == report_id, ReportDB.user_id == user_id).first()

def get_reports(db: Session, user_id: str, skip: int = 0, limit: int = 100):
    return db.query(ReportDB).filter(ReportDB.user_id == user_id).order_by(ReportDB.created_at.desc()).offset(skip).limit(limit).all()

def delete_report(db: Session, report_id: str, user_id: str):
    report = db.query(ReportDB).filter(ReportDB.id == report_id, ReportDB.user_id == user_id).first()
    if report:
        db.delete(report)
        db.commit()
        return True
    return False
