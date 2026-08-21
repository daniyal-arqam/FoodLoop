from fastapi import APIRouter

from app.analyzer.sustainability_calculator import SustainabilityCalculator
from app.core.config import settings
from app.matcher.food_matcher import FoodMatcher
from app.models.api import FindMatchesRequest, ImpactRequest, ScoreRequest

router = APIRouter()


def build_matcher() -> FoodMatcher:
    return FoodMatcher(
        weights=settings.match_weights(),
        max_distance_km=settings.max_distance_km,
        urgency_window_hours=settings.urgency_window_hours,
        min_quantity_ratio=settings.min_quantity_ratio,
    )


@router.post("/matching/find")
@router.post("/find")
async def find_matches(payload: FindMatchesRequest):
    matcher = build_matcher()
    matches = matcher.find_matches(payload.listing, payload.organizations)
    return {
        "success": True,
        "message": "Matches ranked",
        "data": {
            "count": len(matches),
            "matches": [match.model_dump() for match in matches],
        },
    }


@router.post("/matching/score")
@router.post("/score")
async def score_match(payload: ScoreRequest):
    matcher = build_matcher()
    result = matcher.calculate_match_score(payload.listing, payload.organization)
    return {
        "success": True,
        "message": "Match scored",
        "data": result.model_dump(),
    }


@router.post("/matching/impact")
@router.post("/impact")
async def listing_impact(payload: ImpactRequest):
    calculator = SustainabilityCalculator()
    listings = [item.model_dump() for item in payload.listings]
    return {
        "success": True,
        "message": "Sustainability impact estimated",
        "data": calculator.summarize(listings),
    }
