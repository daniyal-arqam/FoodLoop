import os

from app.models.matching import MatchWeights


class Settings:
    service_name: str = os.getenv("SERVICE_NAME", "matcher")
    port: int = int(os.getenv("PORT", "8001"))
    cors_origins: list[str] = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
        if origin.strip()
    ]
    max_distance_km: float = float(os.getenv("MATCH_MAX_DISTANCE_KM", "50"))
    urgency_window_hours: float = float(os.getenv("MATCH_URGENCY_WINDOW_HOURS", "72"))
    min_quantity_ratio: float = float(os.getenv("MATCH_MIN_QUANTITY_RATIO", "0.2"))

    def match_weights(self) -> MatchWeights:
        return MatchWeights(
            distance=float(os.getenv("MATCH_WEIGHT_DISTANCE", "0.35")),
            quantity=float(os.getenv("MATCH_WEIGHT_QUANTITY", "0.25")),
            category=float(os.getenv("MATCH_WEIGHT_CATEGORY", "0.20")),
            urgency=float(os.getenv("MATCH_WEIGHT_URGENCY", "0.20")),
        )


settings = Settings()
