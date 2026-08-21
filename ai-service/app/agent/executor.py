from __future__ import annotations

import json
import logging
import time
from typing import Any

from pydantic import ValidationError

from app.agent.foodloop_client import (
    FoodLoopApiError,
    FoodLoopClient,
    listing_to_matcher,
    organization_to_matcher,
)
from app.agent.schemas import (
    CalculateMatchScoreArgs,
    FindAvailableFoodArgs,
    FindOrganizationsArgs,
    GenerateMatchRecommendationArgs,
)

logger = logging.getLogger("foodloop.matching_agent")


class ToolExecutionError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class ToolExecutor:
    def __init__(self, client: FoodLoopClient) -> None:
        self.client = client
        self.listings: dict[str, dict[str, Any]] = {}
        self.organizations: dict[str, dict[str, Any]] = {}
        self.score_results: list[dict[str, Any]] = []
        self.recommendations: list[dict[str, Any]] = []
        self.tool_calls: list[dict[str, Any]] = []

    async def execute(self, name: str, arguments: dict[str, Any], call_id: str = "") -> dict[str, Any]:
        started = time.perf_counter()
        logger.info("tool_start name=%s call_id=%s args=%s", name, call_id, arguments)
        try:
            result = await self._dispatch(name, arguments)
            ok = "error" not in result
            summary = _summarize(name, result)
            duration_ms = int((time.perf_counter() - started) * 1000)
            record = {
                "id": call_id,
                "name": name,
                "arguments": arguments,
                "ok": ok,
                "durationMs": duration_ms,
                **summary,
            }
            self.tool_calls.append(record)
            logger.info(
                "tool_end name=%s call_id=%s ok=%s duration_ms=%s summary=%s",
                name,
                call_id,
                ok,
                duration_ms,
                summary,
            )
            return result
        except Exception as error:
            duration_ms = int((time.perf_counter() - started) * 1000)
            logger.exception("tool_error name=%s call_id=%s duration_ms=%s", name, call_id, duration_ms)
            result = {"error": "Tool execution failed", "details": str(error)}
            self.tool_calls.append(
                {
                    "id": call_id,
                    "name": name,
                    "arguments": arguments,
                    "ok": False,
                    "durationMs": duration_ms,
                    "error": result["error"],
                }
            )
            return result

    async def _dispatch(self, name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        try:
            if name == "find_available_food":
                return await self._find_available_food(FindAvailableFoodArgs.model_validate(arguments))
            if name == "find_organizations":
                return await self._find_organizations(FindOrganizationsArgs.model_validate(arguments))
            if name == "calculate_match_score":
                return await self._calculate_match_score(CalculateMatchScoreArgs.model_validate(arguments))
            if name == "generate_match_recommendation":
                return await self._generate_match_recommendation(
                    GenerateMatchRecommendationArgs.model_validate(arguments)
                )
        except ValidationError as error:
            return {"error": "Invalid tool arguments", "details": error.errors()}
        except FoodLoopApiError as error:
            return {"error": error.message, "status": error.status_code}
        except ToolExecutionError as error:
            return {"error": error.message, "status": error.status_code}

        return {"error": f"Unknown tool: {name}", "status": 400}

    async def _find_available_food(self, args: FindAvailableFoodArgs) -> dict[str, Any]:
        params: dict[str, Any] = {"status": "Available"}
        if args.category:
            params["category"] = args.category
        if args.urgencyHours is not None:
            params["urgencyHours"] = args.urgencyHours
            params["urgency"] = "true"
        if args.latitude is not None and args.longitude is not None:
            params["latitude"] = args.latitude
            params["longitude"] = args.longitude
        if args.maxDistanceKm is not None:
            params["maxDistanceKm"] = args.maxDistanceKm

        listings = await self.client.list_foods(params)
        if args.foodNameContains:
            needle = args.foodNameContains.lower()
            listings = [
                listing for listing in listings if needle in str(listing.get("foodName") or "").lower()
            ]

        available = [listing for listing in listings if listing.get("status") == "Available"]
        for listing in available:
            if listing.get("id"):
                self.listings[listing["id"]] = listing
        return {
            "listings": available,
            "count": len(available),
            "source": "food-service",
        }

    async def _find_organizations(self, args: FindOrganizationsArgs) -> dict[str, Any]:
        params: dict[str, Any] = {}
        if args.category:
            params["category"] = args.category
        if args.name:
            params["q"] = args.name
        organizations = await self.client.list_organizations(params)
        for organization in organizations:
            if organization.get("id"):
                self.organizations[organization["id"]] = organization
        return {
            "organizations": organizations,
            "count": len(organizations),
            "source": "organization-service",
        }

    async def _calculate_match_score(self, args: CalculateMatchScoreArgs) -> dict[str, Any]:
        listing = await self._require_listing(args.listingId)
        organization = await self._require_organization(args.organizationId)
        match = await self.client.score_match(
            listing_to_matcher(listing),
            organization_to_matcher(organization),
        )
        recommendation = build_recommendation(listing, organization, match)
        self.score_results.append(recommendation)
        return {
            "match": match,
            "recommendation": recommendation,
            "source": "matcher",
        }

    async def _generate_match_recommendation(self, args: GenerateMatchRecommendationArgs) -> dict[str, Any]:
        listings = await self._select_listings(args.listingId)
        organizations = await self._select_organizations(args.organizationIds)
        if not listings:
            return {
                "recommendations": [],
                "count": 0,
                "message": "No available FoodLoop listings were loaded to rank.",
                "source": "matcher",
            }
        if not organizations:
            return {
                "recommendations": [],
                "count": 0,
                "message": "No FoodLoop organizations were loaded to rank.",
                "source": "matcher",
            }

        ranked: list[dict[str, Any]] = []
        rejected: list[dict[str, Any]] = []
        for listing in listings:
            matcher_orgs = [organization_to_matcher(organization) for organization in organizations]
            matches = await self.client.find_matches(listing_to_matcher(listing), matcher_orgs)
            org_by_id = {organization["id"]: organization for organization in organizations}
            for match in matches:
                organization_id = match.get("organization_id") or match.get("organizationId")
                organization = org_by_id.get(str(organization_id))
                if not organization:
                    continue
                ranked.append(build_recommendation(listing, organization, match))

            scored = []
            for organization in organizations:
                already = any(
                    item.get("organizationId") == organization["id"] and item.get("listingId") == listing["id"]
                    for item in ranked
                )
                if already:
                    continue
                match = await self.client.score_match(
                    listing_to_matcher(listing),
                    organization_to_matcher(organization),
                )
                scored.append(build_recommendation(listing, organization, match))
            rejected.extend(item for item in scored if not item.get("eligible"))

        ranked.sort(key=lambda item: item.get("score") or 0, reverse=True)
        recommendations = ranked[: args.limit]
        self.recommendations = recommendations
        return {
            "recommendations": recommendations,
            "rejected": rejected[: args.limit],
            "count": len(recommendations),
            "source": "matcher",
        }

    async def _select_listings(self, listing_id: str | None) -> list[dict[str, Any]]:
        if listing_id:
            return [await self._require_listing(listing_id)]
        if self.listings:
            return [listing for listing in self.listings.values() if listing.get("status") == "Available"]
        return []

    async def _select_organizations(self, organization_ids: list[str] | None) -> list[dict[str, Any]]:
        if organization_ids:
            return [await self._require_organization(org_id) for org_id in organization_ids]
        if self.organizations:
            return list(self.organizations.values())
        organizations = await self.client.list_organizations()
        for organization in organizations:
            if organization.get("id"):
                self.organizations[organization["id"]] = organization
        return organizations

    async def _require_listing(self, listing_id: str) -> dict[str, Any]:
        cached = self.listings.get(listing_id)
        if cached:
            return cached
        listing = await self.client.get_food(listing_id)
        self.listings[listing_id] = listing
        return listing

    async def _require_organization(self, organization_id: str) -> dict[str, Any]:
        cached = self.organizations.get(organization_id)
        if cached:
            return cached
        organization = await self.client.get_organization(organization_id)
        self.organizations[organization_id] = organization
        return organization


def build_recommendation(listing: dict[str, Any], organization: dict[str, Any], match: dict[str, Any]) -> dict[str, Any]:
    breakdown = match.get("breakdown") or {}
    score = match.get("total_score")
    if score is None:
        score = match.get("totalScore")
    distance = match.get("distance_km")
    if distance is None:
        distance = match.get("distanceKm")
    eligible = match.get("eligible")
    rejection = match.get("rejection_reason")
    if rejection is None:
        rejection = match.get("rejectionReason")
    location = listing.get("pickupLocation") or {}
    return {
        "listingId": listing["id"],
        "listingName": listing.get("foodName"),
        "listingCategory": listing.get("category"),
        "listingQuantity": listing.get("quantity"),
        "listingUnit": listing.get("unit"),
        "listingLocation": location.get("address"),
        "organizationId": organization["id"],
        "organizationName": organization.get("organizationName"),
        "organizationLocation": organization.get("address"),
        "score": score,
        "eligible": eligible,
        "rejectionReason": rejection,
        "why": explain_match(listing, organization, match, breakdown),
        "urgency": breakdown.get("urgency"),
        "quantityFit": breakdown.get("quantity"),
        "distanceKm": distance,
        "breakdown": breakdown,
    }


def explain_match(
    listing: dict[str, Any],
    organization: dict[str, Any],
    match: dict[str, Any],
    breakdown: dict[str, Any],
) -> str:
    needed = organization.get("foodCategoriesNeeded") or []
    category = listing.get("category")
    quantity = listing.get("quantity")
    unit = listing.get("unit") or "units"
    required = organization.get("requiredQuantity")
    distance = match.get("distance_km")
    if distance is None:
        distance = match.get("distanceKm")
    parts = [
        f"{organization.get('organizationName')} needs {', '.join(needed) or 'listed categories'}.",
        f"Listing '{listing.get('foodName')}' is {category} ({quantity} {unit}).",
    ]
    if category in needed:
        parts.append("Category matches an organization need.")
    else:
        parts.append(f"Category score {breakdown.get('category')} from the matcher.")
    parts.append(f"Quantity fit score {breakdown.get('quantity')} against requiredQuantity {required}.")
    parts.append(f"Distance {distance} km (distance score {breakdown.get('distance')}).")
    parts.append(f"Urgency score {breakdown.get('urgency')} from remaining time until expiry.")
    eligible = match.get("eligible")
    rejection = match.get("rejection_reason") or match.get("rejectionReason")
    if eligible:
        parts.append("Matcher marked this pair eligible.")
    elif rejection:
        parts.append(f"Matcher rejected the pair: {rejection}.")
    return " ".join(str(part) for part in parts if part is not None)


def _summarize(name: str, result: dict[str, Any]) -> dict[str, Any]:
    if result.get("error"):
        return {"error": result["error"]}
    if name == "find_available_food":
        return {"listingIds": [item.get("id") for item in result.get("listings") or []]}
    if name == "find_organizations":
        return {"organizationIds": [item.get("id") for item in result.get("organizations") or []]}
    if name == "calculate_match_score":
        rec = result.get("recommendation") or {}
        return {
            "listingId": rec.get("listingId"),
            "organizationId": rec.get("organizationId"),
            "score": rec.get("score"),
        }
    if name == "generate_match_recommendation":
        recs = result.get("recommendations") or []
        return {
            "recommendationCount": len(recs),
            "organizationIds": [item.get("organizationId") for item in recs],
        }
    return {}


def dumps(result: dict[str, Any]) -> str:
    return json.dumps(result, default=str)
