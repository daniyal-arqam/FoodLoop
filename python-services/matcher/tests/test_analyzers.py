from app.analyzer.sustainability_calculator import SustainabilityCalculator
from app.analyzer.waste_analyzer import WasteAnalyzer


def test_waste_analyzer_counts_collected_and_expired():
    analyzer = WasteAnalyzer()
    listings = [
        {"status": "Collected", "category": "Prepared", "quantity": 10, "claimedQuantity": 10},
        {"status": "Expired", "category": "Bakery", "quantity": 4},
        {"status": "Available", "category": "Produce", "quantity": 8},
    ]
    assert analyzer.rescued_portions(listings) == 10
    assert analyzer.expired_portions(listings) == 4
    assert analyzer.estimated_waste_diverted_kg(listings) == 3.5
    assert analyzer.estimated_expired_kg(listings) == 1.6


def test_sustainability_calculator_summary():
    summary = SustainabilityCalculator().summarize(
        [{"status": "Collected", "category": "Prepared", "quantity": 10, "claimedQuantity": 10}]
    )
    assert summary["rescuedPortions"] == 10
    assert summary["estimatedWasteKg"] == 3.5
    assert summary["co2AvoidedKg"] == 8.75
    assert summary["waterSavedLiters"] == 3500.0
