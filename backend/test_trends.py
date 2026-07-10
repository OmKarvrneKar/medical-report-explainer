import unittest
from app.services.trends_service import determine_direction, extract_parameters_from_history
import json

class TestTrendsService(unittest.TestCase):
    
    def test_determine_direction_known_better_lower(self):
        # Cholesterol: lower is better
        self.assertEqual(determine_direction("Cholesterol", 240, 190, "100-200"), "improved")
        self.assertEqual(determine_direction("LDL", 100, 150, "0-100"), "worsened")
        
    def test_determine_direction_known_better_higher(self):
        # Hemoglobin: higher is better
        self.assertEqual(determine_direction("Hemoglobin", 14.0, 10.0, "13.5-17.5"), "worsened")
        self.assertEqual(determine_direction("HDL", 35, 45, ">40"), "improved")

    def test_determine_direction_unknown_fallback(self):
        # Distance to midpoint
        # Normal range: 10 - 20 (midpoint = 15)
        # 25 (dist=10) -> 18 (dist=3) => improved
        self.assertEqual(determine_direction("UnknownTest", 25, 18, "10 - 20"), "improved")
        # 16 (dist=1) -> 22 (dist=7) => worsened
        self.assertEqual(determine_direction("UnknownTest", 16, 22, "10 - 20"), "worsened")
        
    def test_extract_parameters_single_point(self):
        class MockReport:
            def __init__(self, rid, params, date):
                self.id = rid
                self.parameters = json.dumps(params)
                self.created_at = date
        
        from datetime import datetime
        r1 = MockReport("1", [{"parameters": [{"name": "Cholesterol", "value": "190", "risk_level": "normal"}]}], datetime(2023, 1, 1))
        
        trends = extract_parameters_from_history([r1])
        
        self.assertIn("cholesterol", trends)
        self.assertEqual(len(trends["cholesterol"]["data"]), 1)
        self.assertEqual(trends["cholesterol"]["data"][0]["value"], 190.0)

if __name__ == '__main__':
    unittest.main()
