import re
import math

# A small dictionary of common lab parameters and their typical regex patterns.
# The regex should capture the numeric value in group 1.
PARAM_PATTERNS = {
    "Hemoglobin": r"(?i)Hemoglobin[^\d]{0,15}(\d+\.?\d*)",
    "TSH": r"(?i)TSH[^\d]{0,15}(\d+\.?\d*)",
    "Cholesterol": r"(?i)Cholesterol[^\d]{0,15}(\d+\.?\d*)",
    "RBC": r"(?i)RBC[^\d]{0,15}(\d+\.?\d*)",
    "WBC": r"(?i)WBC[^\d]{0,15}(\d+\.?\d*)",
    "Platelets": r"(?i)Platelets[^\d]{0,15}(\d+\.?\d*)",
    "Glucose": r"(?i)Glucose[^\d]{0,15}(\d+\.?\d*)",
}

def extract_candidates(raw_text: str) -> dict:
    candidates = {}
    for param, pattern in PARAM_PATTERNS.items():
        match = re.search(pattern, raw_text)
        if match:
            try:
                candidates[param.lower()] = float(match.group(1))
            except ValueError:
                pass
    return candidates

def validate_parameters(raw_text: str, parameters: list) -> list:
    """
    Validates Gemini-extracted parameters against raw text using regex.
    Adds 'validation_status' to each parameter: MATCH, MISMATCH, or UNVERIFIED.
    """
    candidates = extract_candidates(raw_text)
    
    for param in parameters:
        name_lower = param.get("name", "").lower()
        
        # Try to find a matching pattern for this parameter
        matched_candidate_key = None
        for key in candidates.keys():
            if key in name_lower or name_lower in key:
                matched_candidate_key = key
                break
                
        if not matched_candidate_key:
            # If we don't have a regex pattern for it, or didn't find it
            param["validation_status"] = "UNVERIFIED"
            continue
            
        candidate_val = candidates[matched_candidate_key]
        
        try:
            # Try parsing the gemini value
            # Remove non-numeric characters except dots and commas (handle ranges carefully)
            gemini_val_str = param.get("value", "")
            # Just extract the first numeric float we see
            match = re.search(r"(\d+\.?\d*)", gemini_val_str)
            if match:
                gemini_val = float(match.group(1))
                if math.isclose(candidate_val, gemini_val, rel_tol=1e-5):
                    param["validation_status"] = "MATCH"
                else:
                    param["validation_status"] = "MISMATCH"
            else:
                param["validation_status"] = "UNVERIFIED"
        except Exception:
            param["validation_status"] = "UNVERIFIED"
            
    return parameters
