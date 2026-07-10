from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.db import get_db, UserDB
from app.database.crud import get_reports, get_report
from app.services.auth_service import get_current_user
from app.services.trends_service import extract_parameters_from_history, determine_direction, parse_value
import json

router = APIRouter()

@router.get("/parameters")
def get_available_parameters(db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    """Returns a unique list of parameter names from the user's history."""
    reports = get_reports(db, current_user.id, limit=50)
    # get_reports returns sorted by desc, we just need all of them to find keys
    trends = extract_parameters_from_history(reports)
    
    # Return formatted list of options for a frontend dropdown
    result = []
    for key, data in trends.items():
        if len(data["data"]) > 0:
            result.append({
                "id": key,
                "name": data["original_name"],
                "data_points": len(data["data"])
            })
    # Sort alphabetically
    return sorted(result, key=lambda x: x["name"])

@router.get("/{parameter_id}")
def get_parameter_trend(parameter_id: str, db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    """Returns the time-series data for a specific parameter."""
    # Fetch reports (oldest to newest for charting)
    # get_reports returns desc, so we reverse it
    reports = get_reports(db, current_user.id, limit=50)
    reports = list(reversed(reports)) 
    
    trends = extract_parameters_from_history(reports)
    
    if parameter_id not in trends:
        return {"parameter": parameter_id, "data": []}
        
    return {
        "parameter": trends[parameter_id]["original_name"],
        "data": trends[parameter_id]["data"]
    }

@router.get("/reports/compare")
def compare_reports(report_a: str, report_b: str, db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    """
    Compares two reports. 
    report_a is treated as the OLDER report.
    report_b is treated as the NEWER report.
    """
    db_report_a = get_report(db, report_a, current_user.id)
    db_report_b = get_report(db, report_b, current_user.id)
    
    if not db_report_a or not db_report_b:
        raise HTTPException(status_code=404, detail="One or both reports not found.")
        
    panels_a = json.loads(db_report_a.parameters) if db_report_a.parameters else []
    panels_b = json.loads(db_report_b.parameters) if db_report_b.parameters else []
    
    # Flatten parameters into dictionaries by normalized name
    params_a = {}
    for panel in panels_a:
        for p in panel.get("parameters", []):
            name = p.get("name", "").strip().lower()
            if name: params_a[name] = p

    params_b = {}
    for panel in panels_b:
        for p in panel.get("parameters", []):
            name = p.get("name", "").strip().lower()
            if name: params_b[name] = p
            
    # Compute comparisons
    all_keys = set(params_a.keys()).union(set(params_b.keys()))
    comparison = []
    
    for key in all_keys:
        pa = params_a.get(key)
        pb = params_b.get(key)
        
        name = pb.get("name") if pb else pa.get("name")
        val_a = pa.get("value", "Not tested") if pa else "Not tested"
        val_b = pb.get("value", "Not tested") if pb else "Not tested"
        risk_a = pa.get("risk_level", "normal") if pa else None
        risk_b = pb.get("risk_level", "normal") if pb else None
        
        direction = "not_tested"
        if pa and pb:
            num_a = parse_value(val_a)
            num_b = parse_value(val_b)
            if num_a is not None and num_b is not None:
                direction = determine_direction(name, num_a, num_b, pb.get("normal_range", ""))
        elif pb and not pa:
            direction = "new_in_b"
            
        comparison.append({
            "name": name,
            "value_a": val_a,
            "value_b": val_b,
            "risk_a": risk_a,
            "risk_b": risk_b,
            "direction": direction
        })
        
    return sorted(comparison, key=lambda x: x["name"])
