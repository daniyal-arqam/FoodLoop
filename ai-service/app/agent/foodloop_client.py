from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger("foodloop.matching_agent")


class FoodLoopApiError(Exception):
    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class FoodLoopClient:
    """HTTP client for food-service, organization-service, and matcher."""

    def __init__(
        self,
        authorization: str | None = None,
        transport=None,
        food_service_url: str | None = None,
        organization_service_url: str | None = None,
        matcher_url: str | None = None,
        timeout: float | None = None,
    ) -> None:
        self.authorization = authorization
        self.food_service_url = (food_service_url or settings.food_service_url).rstrip("/")
        self.organization_service_url = (organization_service_url or settings.organization_service_url).rstrip(
            "/"
        )
        self.matcher_url = (matcher_url or settings.matcher_url).rstrip("/")
        self._client = httpx.AsyncClient(
            timeout=timeout or settings.foodloop_timeout_seconds,
            transport=transport,
        )

    async def aclose(self) -> None:
        await self._client.aclose()

    async def list_foods(self, params: dict[str, Any] | None = None) -> list[dict[str, Any]]:
        payload = await self._request(
            "GET",
            f"{self.food_service_url}/foods",
            params=params or {},
            auth=True,
        )
        listings = (payload.get("data") or {}).get("listings")
        if not isinstance(listings, list):
            raise FoodLoopApiError("Food service returned an unexpected listings payload")
        return listings

    async def get_food(self, listing_id: str) -> dict[str, Any]:
        payload = await self._request("GET", f"{self.food_service_url}/foods/{listing_id}", auth=True)
        listing = (payload.get("data") or {}).get("listing")
        if not isinstance(listing, dict) or not listing.get("id"):
            raise FoodLoopApiError(f"Food listing {listing_id} was not found", 404)
        return listing

    async def list_organizations(self, params: dict[str, Any] | None = None) -> list[dict[str, Any]]:
        payload = await self._request(
            "GET",
            f"{self.organization_service_url}/organizations",
            params=params or {},
            auth=True,
        )
        organizations = (payload.get("data") or {}).get("organizations")
        if not isinstance(organizations, list):
            raise FoodLoopApiError("Organization service returned an unexpected payload")
        return organizations

    async def get_organization(self, organization_id: str) -> dict[str, Any]:
        payload = await self._request(
            "GET",
            f"{self.organization_service_url}/organizations/{organization_id}",
            auth=True,
        )
        organization = (payload.get("data") or {}).get("organization")
        if not isinstance(organization, dict) or not organization.get("id"):
            raise FoodLoopApiError(f"Organization {organization_id} was not found", 404)
        return organization

    async def score_match(self, listing: dict[str, Any], organization: dict[str, Any]) -> dict[str, Any]:
        payload = await self._request(
            "POST",
            f"{self.matcher_url}/score",
            json_body={"listing": listing, "organization": organization},
            auth=False,
        )
        data = payload.get("data")
        if not isinstance(data, dict):
            raise FoodLoopApiError("Matcher returned an unexpected score payload")
        return data

    async def find_matches(self, listing: dict[str, Any], organizations: list[dict[str, Any]]) -> list[dict[str, Any]]:
        payload = await self._request(
            "POST",
            f"{self.matcher_url}/find",
            json_body={"listing": listing, "organizations": organizations},
            auth=False,
        )
        matches = (payload.get("data") or {}).get("matches")
        if not isinstance(matches, list):
            raise FoodLoopApiError("Matcher returned an unexpected matches payload")
        return matches

    async def _request(
        self,
        method: str,
        url: str,
        params: dict[str, Any] | None = None,
        json_body: dict[str, Any] | None = None,
        auth: bool = False,
    ) -> dict[str, Any]:
        headers: dict[str, str] = {"Accept": "application/json"}
        if auth and self.authorization:
            headers["Authorization"] = self.authorization
        try:
            response = await self._client.request(
                method,
                url,
                params=_clean_params(params),
                json=json_body,
                headers=headers,
            )
        except httpx.TimeoutException as error:
            logger.warning("foodloop_timeout method=%s url=%s", method, url)
            raise FoodLoopApiError("FoodLoop service timed out", 504) from error
        except httpx.HTTPError as error:
            logger.warning("foodloop_unavailable method=%s url=%s error=%s", method, url, error)
            raise FoodLoopApiError("FoodLoop service is unavailable", 502) from error

        try:
            payload = response.json()
        except ValueError as error:
            raise FoodLoopApiError("FoodLoop service returned an unreadable response", 502) from error

        if response.status_code >= 400:
            message = payload.get("message") if isinstance(payload, dict) else None
            raise FoodLoopApiError(
                message or f"FoodLoop service returned HTTP {response.status_code}",
                response.status_code if response.status_code in {400, 401, 403, 404} else 502,
            )
        if not isinstance(payload, dict):
            raise FoodLoopApiError("FoodLoop service returned an unexpected response")
        return payload


def listing_to_matcher(listing: dict[str, Any]) -> dict[str, Any]:
    location = listing.get("pickupLocation") or {}
    return {
        "id": listing["id"],
        "foodName": listing["foodName"],
        "category": listing["category"],
        "quantity": listing["quantity"],
        "latitude": location["latitude"],
        "longitude": location["longitude"],
        "expiryDate": listing["expiryDate"],
        "status": listing["status"],
    }


def organization_to_matcher(organization: dict[str, Any]) -> dict[str, Any]:
    location = organization.get("location") or {}
    return {
        "id": organization["id"],
        "organizationName": organization["organizationName"],
        "verified": organization.get("verified", False),
        "latitude": location["latitude"],
        "longitude": location["longitude"],
        "foodCategoriesNeeded": organization.get("foodCategoriesNeeded") or [],
        "requiredQuantity": organization.get("requiredQuantity") or 0,
    }


def _clean_params(params: dict[str, Any] | None) -> dict[str, Any] | None:
    if not params:
        return None
    return {key: value for key, value in params.items() if value is not None}
