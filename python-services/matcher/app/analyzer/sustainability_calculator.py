from typing import Iterable

from app.analyzer.waste_analyzer import WasteAnalyzer


class SustainabilityCalculator:
    """Heuristic sustainability impact from diverted food waste.

    Factors are published estimates for demo dashboards, not laboratory measurements.
    """

    def __init__(
        self,
        kg_co2_per_kg_food: float = 2.5,
        liters_water_per_kg_food: float = 1000.0,
        waste_analyzer: WasteAnalyzer | None = None,
    ) -> None:
        self.kg_co2_per_kg_food = kg_co2_per_kg_food
        self.liters_water_per_kg_food = liters_water_per_kg_food
        self.waste_analyzer = waste_analyzer or WasteAnalyzer()

    def estimate_co2_kg(self, waste_kg: float) -> float:
        return round(max(waste_kg, 0) * self.kg_co2_per_kg_food, 2)

    def estimate_water_liters(self, waste_kg: float) -> float:
        return round(max(waste_kg, 0) * self.liters_water_per_kg_food, 1)

    def summarize(self, listings: Iterable[dict]) -> dict:
        items = list(listings)
        waste_kg = self.waste_analyzer.estimated_waste_diverted_kg(items)
        return {
            "rescuedPortions": self.waste_analyzer.rescued_portions(items),
            "expiredPortions": self.waste_analyzer.expired_portions(items),
            "estimatedWasteKg": waste_kg,
            "expiredWasteKg": self.waste_analyzer.estimated_expired_kg(items),
            "co2AvoidedKg": self.estimate_co2_kg(waste_kg),
            "waterSavedLiters": self.estimate_water_liters(waste_kg),
            "method": "heuristic-portions-to-kg",
        }
