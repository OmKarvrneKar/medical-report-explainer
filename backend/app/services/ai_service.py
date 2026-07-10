import google.generativeai as genai
import json
import os
from dotenv import load_dotenv
from app.services.validation_service import validate_parameters

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

SYSTEM_PROMPT = """
You are MedExplain, an expert medical report interpreter.
You must analyse the lab test results and provide BOTH a plain-language explanation for patients AND a clinical-grade summary for doctors.

STRICT RULES:
- Never diagnose in the patient explanation.
- For patients, use "outside normal range" — never "dangerous". Be warm and reassuring.
- For doctors, use standard clinical terminology.
- Group the tests into logical panels (e.g., CBC, Lipid Profile). If there's only one unclassified group, name it "General Panel".
- You MUST respond with ONLY a valid JSON object. No extra text, no markdown fences.

JSON schema:
{
  "patient_summary": "2-3 sentence plain-language overview for the patient",
  "clinical_summary": "1-2 sentence clinical assessment for a doctor",
  "overall_status": "normal" or "attention_needed" or "urgent_review",
  "panels": [
    {
      "name": "Panel name (e.g. CBC, Liver Function)",
      "summary": "Brief summary of this panel's results",
      "parameters": [
        {
          "name": "test name",
          "value": "patient result with unit",
          "normal_range": "reference range with unit",
          "risk_level": "normal" or "low" or "high",
          "patient_explanation": "1-2 sentence simple explanation for patient",
          "clinical_explanation": "clinical interpretation (e.g. macrocytic anemia)",
          "flag": "e.g. Slightly above normal (or null)"
        }
      ]
    }
  ],
  "what_to_do": "Next-step advice.",
  "disclaimer": "This explanation is for informational purposes only."
}
"""

def explain_report(extraction_data: dict, language: str = "English") -> dict:
    pages = extraction_data.get("pages", [])
    confidence = extraction_data.get("overall_confidence", 100.0)
    
    full_text = "\n\n".join([f"--- PAGE {p['page']} ---\n{p['text']}" for p in pages])
    
    if not full_text or len(full_text.strip()) < 20:
        raise ValueError("Not enough text extracted from the report to analyse.")

    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction=SYSTEM_PROMPT
    )

    hedge_instruction = ""
    if confidence < 60:
        hedge_instruction = "WARNING: The text extraction confidence score is low (below 60). You MUST explicitly hedge your analysis by stating that values might be misread due to low scan quality, and instruct the user to verify against the original report."

    user_prompt = f"""
Here is the extracted text from a medical lab report (Confidence: {confidence:.1f}/100):

{full_text}

{hedge_instruction}

Please explain this report clearly. Respond in {language}.
"""

    response = model.generate_content(user_prompt)
    raw = response.text.strip()

    # Strip accidental markdown fences
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    parsed = json.loads(raw)
    parsed["confidence_score"] = confidence
    
    # Run validation service across all panels
    raw_combined = " ".join([p["text"] for p in pages])
    for panel in parsed.get("panels", []):
        if "parameters" in panel:
            panel["parameters"] = validate_parameters(raw_combined, panel["parameters"])
            
    return parsed