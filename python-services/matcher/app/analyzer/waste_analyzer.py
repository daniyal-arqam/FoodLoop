from typing import Iterable

KG_PER_PORTION = {
    "Prepared": 0.35,
    "Bakery": 0.40,
    "Produce": 0.30,
    "Dairy": 0.25,
    "Meat": 0.45,
    "Canned": 0.40,
    "Frozen": 0.35,
    "Other": 0.30,
}


class WasteAnalyzer:
    """Estimates rescued vs expired surplus from FoodLoop listings."""

    def __init__(self, kg_per_portion: dict[str, float] | None = None) -> None:
        self.kg_per_portion = kg_per_portion or KG_PER_PORTION

    def rescued_portions(self, listings: Iterable[dict]) -> float:
        return round(sum(self._amount(item) for item in listings if item.get("status") == "Collected"), 2)

    def expired_portions(self, listings: Iterable[dict]) -> float:
        return round(sum(self._amount(item) for item in listings if item.get("status") == "Expired"), 2)

    def estimated_waste_diverted_kg(self, listings: Iterable[dict]) -> float:
        return round(sum(self._kg(item) for item in listings if item.get("status") == "Collected"), 2)

    def estimated_expired_kg(self, listings: Iterable[dict]) -> float:
        return round(sum(self._kg(item) for item in listings if item.get("status") == "Expired"), 2)

    def _amount(self, item: dict) -> float:
        claimed = item.get("claimedQuantity")
        quantity = item.get("quantity") or 0
        value = claimed if claimed is not None else quantity
        try:
            number = float(value)
        except (TypeError, ValueError):
            return 0.0
        return number if number > 0 else 0.0

    def _kg(self, item: dict) -> float:
        category = str(item.get("category") or "Other")
        factor = self.kg_per_portion.get(category, self.kg_per_portion["Other"])
        return self._amount(item) * factor
