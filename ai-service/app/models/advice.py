from typing import Annotated, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class RecommendRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    surplus_quantity: Annotated[float, Field(gt=0, alias="surplusQuantity")]
    food_category: Annotated[str, Field(min_length=2, alias="foodCategory")]
    time_pattern: Annotated[str, Field(min_length=2, alias="timePattern")]
    frequency: Annotated[str, Field(min_length=2)]
    unit: Optional[str] = None
    provider_name: Annotated[Optional[str], Field(alias="providerName")] = None
    notes: Optional[str] = None

    @field_validator("food_category", "time_pattern", "frequency", "unit", "provider_name", "notes")
    @classmethod
    def strip_text(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        cleaned = value.strip()
        return cleaned or None


class ProviderContext(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None
    provider_name: Optional[str] = None


class Advice(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    situation_summary: Annotated[str, Field(alias="situationSummary")]
    immediate_actions: Annotated[list[str], Field(alias="immediateActions")]
    operational_improvements: Annotated[list[str], Field(alias="operationalImprovements")]
    redistribution_suggestions: Annotated[list[str], Field(alias="redistributionSuggestions")]
    long_term_recommendations: Annotated[list[str], Field(alias="longTermRecommendations")]
    caveats: list[str] = Field(default_factory=list)

    @field_validator(
        "immediate_actions",
        "operational_improvements",
        "redistribution_suggestions",
        "long_term_recommendations",
        "caveats",
        mode="before",
    )
    @classmethod
    def coerce_list(cls, value):
        if value is None:
            return []
        if isinstance(value, str):
            lines = [line.strip(" -*\t") for line in value.splitlines()]
            return [line for line in lines if line]
        if isinstance(value, list):
            return [str(item).strip() for item in value if str(item).strip()]
        return [str(value)]
