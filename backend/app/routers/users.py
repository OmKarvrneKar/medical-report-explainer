from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.db import get_db, UserDB, ReportDB
from app.services.auth_service import get_current_user, verify_password
from pydantic import BaseModel
import json

router = APIRouter(prefix="/users", tags=["users"])

class DeleteAccountRequest(BaseModel):
    password: str

@router.get("/me/export")
def export_user_data(current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    reports = db.query(ReportDB).filter(ReportDB.user_id == current_user.id).all()
    
    export_data = {
        "user": {
            "email": current_user.email,
            "created_at": current_user.created_at.isoformat()
        },
        "reports": []
    }
    
    for r in reports:
        export_data["reports"].append({
            "id": r.id,
            "created_at": r.created_at.isoformat(),
            "summary": r.summary,
            "overall_status": r.overall_status,
            "parameters": json.loads(r.parameters) if r.parameters else [],
            "what_to_do": r.what_to_do,
            "language": r.language
        })
        
    return export_data

@router.delete("/me")
def delete_user_account(request: DeleteAccountRequest, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    # Verify password before deletion
    if not verify_password(request.password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect password")
        
    # Cascade delete reports
    reports = db.query(ReportDB).filter(ReportDB.user_id == current_user.id).all()
    for r in reports:
        # If there were physical files (e.g. PDFs generated and stored on disk), we would delete them here.
        db.delete(r)
        
    db.delete(current_user)
    db.commit()
    
    return {"message": "User account and all associated data deleted successfully"}
