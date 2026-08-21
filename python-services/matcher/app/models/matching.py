from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class MatchWeights(BaseModel):
    distance: float = 0.35
    quantity: float = 0.25
    category: float = 0.20
    urgency: float = 0.20

    @field_validator("distance", "quantity", "category", "urgency")
    @classmethod
    def non_negative(cls, value: float) -> float:
        if value < 0:
            raise ValueError("weights must be non-negative")
        return value

    def normalized(self) -> "MatchWeights":
        total = self.distance + self.quantity + self.category + self.urgency
        if total <= 0:
            raise ValueError("weights must sum to a positive value")
        return MatchWeights(
            distance=self.distance / total,
            quantity=self.quantity / total,
            category=self.category / total,
            urgency=self.urgency / total,
        )


class FoodListingInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    food_name: str = Field(alias="foodName")
    category: str
    quantity: float
    latitude: float
    longitude: float
    expiry_date: datetime = Field(alias="expiryDate")
    status: str = "Available"


class OrganizationInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    organization_name: str = Field(alias="organizationName")
    verified: bool = False
    latitude: float
    longitude: float
    food_categories_needed: list[str] = Field(alias="foodCategoriesNeeded")
    required_quantity: float = Field(alias="requiredQuantity")


class ScoreBreakdown(BaseModel):
    distance: float
    quantity: float
    category: float
    urgency: float
    weights: MatchWeights
    weighted_distance: float
    weighted_quantity: float
    weighted_category: float
    weighted_urgency: float


class MatchResult(BaseModel):
    listing_id: str
    organization_id: str
    organization_name: str
    total_score: float
    distance_km: float
    eligible: bool
    rejection_reason: Optional[str] = None
    breakdown: ScoreBreakdown
