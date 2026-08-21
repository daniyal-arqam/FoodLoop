from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


FOOD_CATEGORIES = (
    "Produce",
    "Bakery",
    "Dairy",
    "Prepared",
    "Canned",
    "Frozen",
    "Meat",
    "Other",
)

FoodCategory = Literal[
    "Produce",
    "Bakery",
    "Dairy",
    "Prepared",
    "Canned",
    "Frozen",
    "Meat",
    "Other",
]


class FindAvailableFoodArgs(BaseModel):
    model_config = ConfigDict(extra="forbid")

    category: FoodCategory | None = None
    foodNameContains: str | None = Field(default=None, min_length=2, max_length=80)
    urgencyHours: float | None = Field(default=None, gt=0, le=168)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    maxDistanceKm: float | None = Field(default=None, gt=0, le=200)


class FindOrganizationsArgs(BaseModel):
    model_config = ConfigDict(extra="forbid")

    category: FoodCategory | None = None
    name: str | None = Field(default=None, min_length=2, max_length=80)


class CalculateMatchScoreArgs(BaseModel):
    model_config = ConfigDict(extra="forbid")

    listingId: str = Field(min_length=1, max_length=80)
    organizationId: str = Field(min_length=1, max_length=80)


class GenerateMatchRecommendationArgs(BaseModel):
    model_config = ConfigDict(extra="forbid")

    listingId: str | None = Field(default=None, min_length=1, max_length=80)
    organizationIds: list[str] | None = Field(default=None, max_length=20)
    limit: int = Field(default=5, ge=1, le=10)
