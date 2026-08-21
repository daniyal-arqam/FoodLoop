from pydantic import BaseModel, Field

from app.models.matching import FoodListingInput, MatchResult, OrganizationInput


class FindMatchesRequest(BaseModel):
    listing: FoodListingInput
    organizations: list[OrganizationInput] = Field(min_length=1)


class ScoreRequest(BaseModel):
    listing: FoodListingInput
    organization: OrganizationInput


class ImpactListingInput(BaseModel):
    quantity: float = Field(ge=0)
    status: str
    category: str = "Other"
    claimedQuantity: float | None = None


class ImpactRequest(BaseModel):
    listings: list[ImpactListingInput] = Field(default_factory=list)


class FindMatchesResponse(BaseModel):
    success: bool = True
    message: str
    data: dict[str, list[MatchResult] | int]


class ScoreResponse(BaseModel):
    success: bool = True
    message: str
    data: MatchResult
