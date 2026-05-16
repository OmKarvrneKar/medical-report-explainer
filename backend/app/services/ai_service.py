import google.generativeai as genai
import json
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

SYSTEM_PROMPT = """
You are MedExplain, a friendly medical report interpreter.
Explain lab test results in simple language a patient with no medical background can understand.

STRICT RULES:
- Never diagnose. Never say "you have [disease]".
- Use "outside normal range" or "requires attention" — never "dangerous".
- Clearly reassure the patient when values are normal.
- Always end with recommending a doctor for abnormal values.
- Be warm, calm, and simple. Patients may be anxious.

You MUST respond with ONLY a valid JSON object. No extra text, no markdown fences.

JSON schema:
{
  "summary": "2-3 sentence plain-language overview of the overall report",
  "overall_status": "normal" or "attention_needed" or "urgent_review",
  "parameters": [
    {
      "name": "test name as it appears in the report",
      "value": "patient result with unit",
      "normal_range": "reference range with unit",
      "risk_level": "normal" or "low" or "high",
      "explanation": "1-2 sentence plain explanation of what this test measures and what this result means",
      "flag": "e.g. Slightly above normal — or null if risk_level is normal"
    }
  ],
  "what_to_do": "1-2 sentence next-step advice. Recommend a doctor if any values are abnormal.",
  "disclaimer": "This explanation is for informational purposes only. Please consult a qualified doctor."
}
"""

def explain_report(extracted_text: str, language: str = "English") -> dict:
    if not extracted_text or len(extracted_text.strip()) < 20:
        raise ValueError("Not enough text extracted from the report to analyse.")

    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction=SYSTEM_PROMPT
    )

    user_prompt = f"""
Here is the extracted text from a medical lab report:

---
{extracted_text}
---

Please explain this report clearly. Respond in {language}.
If any value is missing its unit or normal range, make a reasonable clinical assumption and note it.
"""

    response = model.generate_content(user_prompt)
    raw = response.text.strip()

    # Strip accidental markdown fences
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    return json.loads(raw)