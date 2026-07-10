import unittest
from app.services.validation_service import validate_parameters, extract_candidates

class TestValidationService(unittest.TestCase):
    def test_extract_candidates(self):
        raw_text = "Patient has Hemoglobin 12.5 g/dL and TSH of 4.2. Cholesterol: 190.5"
        candidates = extract_candidates(raw_text)
        
        self.assertIn("hemoglobin", candidates)
        self.assertEqual(candidates["hemoglobin"], 12.5)
        self.assertIn("tsh", candidates)
        self.assertEqual(candidates["tsh"], 4.2)
        self.assertIn("cholesterol", candidates)
        self.assertEqual(candidates["cholesterol"], 190.5)
        
    def test_validate_parameters_match(self):
        raw_text = "Hemoglobin 12.5"
        parameters = [{"name": "Hemoglobin", "value": "12.5 g/dL"}]
        validated = validate_parameters(raw_text, parameters)
        
        self.assertEqual(validated[0]["validation_status"], "MATCH")
        
    def test_validate_parameters_mismatch(self):
        raw_text = "Hemoglobin 12.5"
        parameters = [{"name": "Hemoglobin", "value": "14.0 g/dL"}] # Hallucinated value
        validated = validate_parameters(raw_text, parameters)
        
        self.assertEqual(validated[0]["validation_status"], "MISMATCH")
        
    def test_validate_parameters_unverified(self):
        raw_text = "Some random text"
        # Unknown parameter
        parameters = [{"name": "Vitamin D", "value": "30 ng/mL"}]
        validated = validate_parameters(raw_text, parameters)
        
        self.assertEqual(validated[0]["validation_status"], "UNVERIFIED")

if __name__ == '__main__':
    unittest.main()
