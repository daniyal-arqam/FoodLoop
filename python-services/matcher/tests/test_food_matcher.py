from datetime import datetime, timedelta, timezone

from app.matcher.food_matcher import FoodMatcher
from app.models.matching import FoodListingInput, MatchWeights, OrganizationInput


NOW = datetime(2026, 8, 21, 12, 0, tzinfo=timezone.utc)


def listing(**overrides) -> FoodListingInput:
    payload = {
        "id": "listing-1",
        "food_name": "Bread",
        "category": "Bakery",
        "quantity": 40,
        "latitude": 24.8607,
        "longitude": 67.0011,
        "expiry_date": NOW + timedelta(hours=6),
        "status": "Available",
    }
    payload.update(overrides)
    return FoodListingInput(**payload)


def organization(**overrides) -> OrganizationInput:
    payload = {
        "id": "org-1",
        "organization_name": "Karachi Food Bank",
        "verified": True,
        "latitude": 24.8607,
        "longitude": 67.0011,
        "food_categories_needed": ["Bakery", "Produce"],
        "required_quantity": 40,
    }
    payload.update(overrides)
    return OrganizationInput(**payload)


def test_exact_category_match():
    matcher = FoodMatcher()
    result = matcher.calculate_match_score(listing(), organization(), now=NOW)
    assert result.breakdown.category == 1.0
    assert result.eligible is True


def test_category_mismatch():
    matcher = FoodMatcher()
    result = matcher.calculate_match_score(
        listing(),
        organization(food_categories_needed=["Dairy"]),
        now=NOW,
    )
    assert result.breakdown.category == 0.0
    assert result.eligible is False
    assert result.rejection_reason == "category_mismatch"
    matches = matcher.find_matches(
        listing(),
        [organization(food_categories_needed=["Dairy"])],
        now=NOW,
    )
    assert matches == []


def test_close_distance():
    matcher = FoodMatcher(max_distance_km=50)
    result = matcher.calculate_match_score(listing(), organization(), now=NOW)
    assert result.distance_km < 1
    assert result.breakdown.distance == 1.0


def test_far_distance():
    matcher = FoodMatcher(max_distance_km=50)
    far = organization(id="org-far", latitude=31.5204, longitude=74.3587)
    result = matcher.calculate_match_score(listing(), far, now=NOW)
    assert result.distance_km > 50
    assert result.breakdown.distance == 0.0
    assert result.eligible is False
    assert result.rejection_reason == "distance_too_far"


def test_quantity_fit():
    matcher = FoodMatcher()
    result = matcher.calculate_match_score(
        listing(quantity=50),
        organization(required_quantity=50),
        now=NOW,
    )
    assert result.breakdown.quantity == 1.0
    assert result.eligible is True


def test_insufficient_quantity():
    matcher = FoodMatcher(min_quantity_ratio=0.2)
    result = matcher.calculate_match_score(
        listing(quantity=5),
        organization(required_quantity=100),
        now=NOW,
    )
    assert result.breakdown.quantity == 0.05
    assert result.eligible is False
    assert result.rejection_reason == "insufficient_quantity"


def test_urgent_expiry():
    matcher = FoodMatcher(urgency_window_hours=72)
    urgent = matcher.calculate_match_score(
        listing(expiry_date=NOW + timedelta(hours=2)),
        organization(),
        now=NOW,
    )
    relaxed = matcher.calculate_match_score(
        listing(expiry_date=NOW + timedelta(hours=60)),
        organization(),
        now=NOW,
    )
    assert urgent.breakdown.urgency > relaxed.breakdown.urgency
    assert urgent.breakdown.urgency > 0.9


def test_ranking():
    matcher = FoodMatcher()
    close = organization(id="close", organization_name="Close Kitchen")
    farther = organization(
        id="farther",
        organization_name="Farther Kitchen",
        latitude=24.90,
        longitude=67.05,
    )
    ranked = matcher.find_matches(listing(), [farther, close], now=NOW)
    assert [item.organization_id for item in ranked] == ["close", "farther"]
    assert ranked[0].total_score >= ranked[1].total_score


def test_weights_are_configurable():
    matcher = FoodMatcher(weights=MatchWeights(distance=1, quantity=0, category=0, urgency=0))
    result = matcher.calculate_match_score(listing(), organization(), now=NOW)
    assert result.breakdown.weights.distance == 1.0
    assert result.total_score == result.breakdown.weighted_distance
