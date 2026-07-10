import re
import math
import json

# Direction mapping: 
# lower_is_better -> e.g., LDL, Triglycerides, Glucose
# higher_is_better -> e.g., HDL, Hemoglobin
CLINICAL_CONFIG = {
    "cholesterol": "lower_is_better",
    "ldl": "lower_is_better",
    "triglycerides": "lower_is_better",
    "fasting glucose": "lower_is_better",
    "hba1c": "lower_is_better",
    "hemoglobin": "higher_is_better",
    "hdl": "higher_is_better",
    "vitamin d": "higher_is_better",
}

def parse_value(val_str: str):
    if not val_str:
        return None
    match = re.search(r"(\d+\.?\d*)", str(val_str))
    if match:
        return float(match.group(1))
    return None

def parse_range_midpoint(range_str: str):
    if not range_str:
        return None
    # e.g., "13.5 - 17.5"
    matches = re.findall(r"(\d+\.?\d*)", str(range_str))
    if len(matches) >= 2:
        return (float(matches[0]) + float(matches[1])) / 2.0
    return None

def determine_direction(name: str, val_a: float, val_b: float, range_str: str) -> str:
    """
    Returns 'improved', 'worsened', or 'stable'
    comparing value A (old) to value B (new)
    """
    if val_a == val_b:
        return "stable"
        
    name_lower = name.lower()
    
    # 1. Use dictionary if exact or partial match found
    direction_pref = None
    for k, v in CLINICAL_CONFIG.items():
        if k in name_lower:
            direction_pref = v
            break
            
    if direction_pref == "lower_is_better":
        return "improved" if val_b < val_a else "worsened"
    elif direction_pref == "higher_is_better":
        return "improved" if val_b > val_a else "worsened"
        
    # 2. Fallback: Distance to Normal Range Midpoint
    midpoint = parse_range_midpoint(range_str)
    if midpoint is not None:
        dist_a = abs(val_a - midpoint)
        dist_b = abs(val_b - midpoint)
        if dist_b < dist_a:
            return "improved"
        elif dist_b > dist_a:
            return "worsened"
            
    # 3. Default fallback if can't compute
    return "stable"

def extract_parameters_from_history(reports: list) -> dict:
    """
    Takes a list of SQLAlchemy ReportDB objects (already filtered by user_id, sorted oldest to newest),
    and returns a dict mapping normalized parameter name -> list of data points.
    """
    trends = {}
    for r in reports:
        if not r.parameters:
            continue
        try:
            panels = json.loads(r.parameters)
            for panel in panels:
                for p in panel.get("parameters", []):
                    name = p.get("name", "").strip()
                    if not name:
                        continue
                        
                    norm_name = name.lower()
                    if norm_name not in trends:
                        trends[norm_name] = {
                            "original_name": name,
                            "data": []
                        }
                        
                    val_num = parse_value(p.get("value", ""))
                    if val_num is not None:
                        trends[norm_name]["data"].append({
                            "report_id": r.id,
                            "date": str(r.created_at.date()) if r.created_at else "",
                            "value": val_num,
                            "original_value": p.get("value", ""),
                            "normal_range": p.get("normal_range", ""),
                            "risk_level": p.get("risk_level", "normal")
                        })
        except Exception:
            continue
            
    return trends
