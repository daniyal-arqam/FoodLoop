from datetime import datetime, timezone
from typing import Optional

from app.models.matching import (
    FoodListingInput,
    MatchResult,
    MatchWeights,
    OrganizationInput,
    ScoreBreakdown,
)
from app.utils.geo import distance_km


class FoodMatcher:
    """Scores and ranks organizations for a food listing."""

    def __init__(
        self,
        weights: Optional[MatchWeights] = None,
        max_distance_km: float = 50.0,
        urgency_window_hours: float = 72.0,
        min_quantity_ratio: float = 0.2,
    ) -> None:
        self.weights = (weights or MatchWeights()).normalized()
        self.max_distance_km = max_distance_km
        self.urgency_window_hours = urgency_window_hours
        self.min_quantity_ratio = min_quantity_ratio

    def calculate_match_score(
        self,
        listing: FoodListingInput,
        organization: OrganizationInput,
        now: Optional[datetime] = None,
    ) -> MatchResult:
        now = self._ensure_utc(now or datetime.now(timezone.utc))
        kilometres = distance_km(
            listing.latitude,
            listing.longitude,
            organization.latitude,
            organization.longitude,
        )
        distance_score = self._score_distance(kilometres)
        quantity_score = self._score_quantity(listing.quantity, organization.required_quantity)
        category_score = self._score_category(listing.category, organization.food_categories_needed)
        urgency_score = self._score_urgency(listing.expiry_date, now)

        breakdown = ScoreBreakdown(
            distance=round(distance_score, 4),
            quantity=round(quantity_score, 4),
            category=round(category_score, 4),
            urgency=round(urgency_score, 4),
            weights=self.weights,
            weighted_distance=round(distance_score * self.weights.distance, 4),
            weighted_quantity=round(quantity_score * self.weights.quantity, 4),
            weighted_category=round(category_score * self.weights.category, 4),
            weighted_urgency=round(urgency_score * self.weights.urgency, 4),
        )
        total = (
            breakdown.weighted_distance
            + breakdown.weighted_quantity
            + breakdown.weighted_category
            + breakdown.weighted_urgency
        )
        eligible, reason = self._suitability(listing, organization, kilometres, quantity_score, now)

        return MatchResult(
            listing_id=listing.id,
            organization_id=organization.id,
            organization_name=organization.organization_name,
            total_score=round(max(0.0, min(1.0, total)), 4),
            distance_km=round(kilometres, 3),
            eligible=eligible,
            rejection_reason=reason,
            breakdown=breakdown,
        )

    def find_matches(
        self,
        listing: FoodListingInput,
        organizations: list[OrganizationInput],
        now: Optional[datetime] = None,
    ) -> list[MatchResult]:
        now = self._ensure_utc(now or datetime.now(timezone.utc))
        candidates = [
            self.calculate_match_score(listing, organization, now=now)
            for organization in organizations
        ]
        eligible = [match for match in candidates if match.eligible]
        return self.rank_matches(eligible)

    def rank_matches(self, matches: list[MatchResult]) -> list[MatchResult]:
        return sorted(matches, key=lambda match: match.total_score, reverse=True)

    def _score_distance(self, kilometres: float) -> float:
        if kilometres <= 0:
            return 1.0
        if kilometres >= self.max_distance_km:
            return 0.0
        return 1.0 - (kilometres / self.max_distance_km)

    def _score_category(self, category: str, needed: list[str]) -> float:
        return 1.0 if category in needed else 0.0

    def _score_quantity(self, listing_quantity: float, required_quantity: float) -> float:
        if listing_quantity <= 0:
            return 0.0
        if required_quantity <= 0:
            return 1.0
        return min(1.0, listing_quantity / required_quantity)

    def _score_urgency(self, expiry_date: datetime, now: datetime) -> float:
        expiry = self._ensure_utc(expiry_date)
        hours_left = (expiry - now).total_seconds() / 3600
        if hours_left <= 0:
            return 0.0
        if hours_left >= self.urgency_window_hours:
            return 0.0
        return 1.0 - (hours_left / self.urgency_window_hours)

    def _suitability(
        self,
        listing: FoodListingInput,
        organization: OrganizationInput,
        kilometres: float,
        quantity_score: float,
        now: datetime,
    ) -> tuple[bool, Optional[str]]:
        if listing.status != "Available":
            return False, "listing_not_available"
        if self._ensure_utc(listing.expiry_date) <= now:
            return False, "listing_expired"
        if not organization.verified:
            return False, "organization_not_verified"
        if listing.category not in organization.food_categories_needed:
            return False, "category_mismatch"
        if kilometres > self.max_distance_km:
            return False, "distance_too_far"
        if quantity_score < self.min_quantity_ratio:
            return False, "insufficient_quantity"
        return True, None

    @staticmethod
    def _ensure_utc(value: datetime) -> datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)
