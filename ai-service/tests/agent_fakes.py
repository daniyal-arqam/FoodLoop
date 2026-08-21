from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from urllib.parse import parse_qs

import httpx


def hours_from_now(hours: float) -> str:
    return (datetime.now(timezone.utc) + timedelta(hours=hours)).isoformat()


VEGETARIAN_LISTING = {
    "id": "listing-veg-1",
    "providerId": "provider-1",
    "foodName": "Vegetarian meal",
    "category": "Prepared",
    "quantity": 30,
    "unit": "servings",
    "description": "Packed vegetarian trays for same-day rescue",
    "pickupLocation": {
        "address": "12 Rescue Street, Karachi",
        "latitude": 24.8607,
        "longitude": 67.0011,
    },
    "availableFrom": hours_from_now(-1),
    "availableUntil": hours_from_now(8),
    "expiryDate": hours_from_now(6),
    "status": "Available",
    "reservedBy": None,
    "claimedQuantity": 0,
}

BAKERY_LISTING = {
    "id": "listing-bread-1",
    "providerId": "provider-1",
    "foodName": "Surplus bread",
    "category": "Bakery",
    "quantity": 12,
    "unit": "items",
    "description": "Same-day bakery surplus",
    "pickupLocation": {
        "address": "12 Rescue Street, Karachi",
        "latitude": 24.8607,
        "longitude": 67.0011,
    },
    "availableFrom": hours_from_now(-1),
    "availableUntil": hours_from_now(10),
    "expiryDate": hours_from_now(10),
    "status": "Available",
}

KARACHI_FOOD_BANK = {
    "id": "org-kitchen-1",
    "userId": "org-user-1",
    "organizationName": "Karachi Food Bank",
    "description": "Community kitchen",
    "address": "45 Relief Avenue, Karachi",
    "location": {"latitude": 24.8607, "longitude": 67.0011},
    "foodCategoriesNeeded": ["Prepared", "Bakery"],
    "requiredQuantity": 40,
    "verified": True,
}

DISTANT_MEAT_ORG = {
    "id": "org-meat-1",
    "userId": "org-user-2",
    "organizationName": "Harbour Meat Rescue",
    "description": "Needs meat only",
    "address": "90 Harbour Road, Karachi",
    "location": {"latitude": 24.9, "longitude": 67.08},
    "foodCategoriesNeeded": ["Meat"],
    "requiredQuantity": 20,
    "verified": True,
}

MATCH_SCORE = {
    "listing_id": "listing-veg-1",
    "organization_id": "org-kitchen-1",
    "organization_name": "Karachi Food Bank",
    "total_score": 0.8125,
    "distance_km": 0.012,
    "eligible": True,
    "rejection_reason": None,
    "breakdown": {
        "distance": 0.9998,
        "quantity": 0.75,
        "category": 1.0,
        "urgency": 0.9167,
        "weights": {"distance": 0.35, "quantity": 0.25, "category": 0.2, "urgency": 0.2},
        "weighted_distance": 0.3499,
        "weighted_quantity": 0.1875,
        "weighted_category": 0.2,
        "weighted_urgency": 0.1833,
    },
}


def envelope(data: dict, message: str = "ok", status: int = 200) -> httpx.Response:
    return httpx.Response(status, json={"success": status < 400, "message": message, "data": data})


class FakeFoodLoop:
    """Serves FoodLoop-shaped food and organization payloads over HTTP."""

    def __init__(
        self,
        listings: list[dict] | None = None,
        organizations: list[dict] | None = None,
        require_auth: bool = True,
        matcher_scores: dict[tuple[str, str], dict] | None = None,
    ) -> None:
        self.listings = list(listings) if listings is not None else [VEGETARIAN_LISTING, BAKERY_LISTING]
        self.organizations = list(organizations) if organizations is not None else [KARACHI_FOOD_BANK, DISTANT_MEAT_ORG]
        self.require_auth = require_auth
        self.matcher_scores = matcher_scores or {("listing-veg-1", "org-kitchen-1"): MATCH_SCORE}
        self.calls: list[dict] = []

    def handler(self, request: httpx.Request) -> httpx.Response:
        path = request.url.path
        self.calls.append({"method": request.method, "url": str(request.url), "path": path})
        if self.require_auth and request.url.port in {4002, 4003}:
            if not request.headers.get("authorization"):
                return envelope(None, "Unauthorized", 401)

        if request.method == "GET" and path == "/foods":
            return self._list_foods(request)
        if request.method == "GET" and path.startswith("/foods/"):
            return self._get_food(path.rsplit("/", 1)[-1])
        if request.method == "GET" and path == "/organizations":
            return self._list_organizations(request)
        if request.method == "GET" and path.startswith("/organizations/"):
            return self._get_organization(path.rsplit("/", 1)[-1])
        if request.method == "POST" and path in {"/score", "/matching/score"}:
            return self._score(request)
        if request.method == "POST" and path in {"/find", "/matching/find"}:
            return self._find(request)
        return envelope(None, "Not found", 404)

    def transport(self) -> httpx.MockTransport:
        return httpx.MockTransport(self.handler)

    def _list_foods(self, request: httpx.Request) -> httpx.Response:
        query = parse_qs(request.url.query.decode() if isinstance(request.url.query, bytes) else request.url.query)
        listings = list(self.listings)
        status = _first(query, "status")
        category = _first(query, "category")
        if status:
            listings = [item for item in listings if item.get("status") == status]
        if category:
            listings = [item for item in listings if item.get("category") == category]
        return envelope({"listings": listings}, "Listings retrieved")

    def _get_food(self, listing_id: str) -> httpx.Response:
        listing = next((item for item in self.listings if item["id"] == listing_id), None)
        if not listing:
            return envelope(None, f"Food listing {listing_id} was not found", 404)
        return envelope({"listing": listing}, "Listing retrieved")

    def _list_organizations(self, request: httpx.Request) -> httpx.Response:
        query = parse_qs(request.url.query.decode() if isinstance(request.url.query, bytes) else request.url.query)
        organizations = list(self.organizations)
        category = _first(query, "category")
        name = _first(query, "q") or _first(query, "name")
        if category:
            organizations = [item for item in organizations if category in (item.get("foodCategoriesNeeded") or [])]
        if name:
            needle = name.lower()
            organizations = [
                item for item in organizations if needle in str(item.get("organizationName") or "").lower()
            ]
        return envelope({"organizations": organizations}, "Organizations retrieved")

    def _get_organization(self, organization_id: str) -> httpx.Response:
        organization = next((item for item in self.organizations if item["id"] == organization_id), None)
        if not organization:
            return envelope(None, f"Organization {organization_id} was not found", 404)
        return envelope({"organization": organization}, "Organization retrieved")

    def _score(self, request: httpx.Request) -> httpx.Response:
        body = json.loads(request.content.decode())
        listing_id = body["listing"]["id"]
        organization_id = body["organization"]["id"]
        match = self.matcher_scores.get((listing_id, organization_id))
        if match is None:
            match = {
                "listing_id": listing_id,
                "organization_id": organization_id,
                "organization_name": body["organization"]["organizationName"],
                "total_score": 0.0,
                "distance_km": 12.4,
                "eligible": False,
                "rejection_reason": "category_mismatch",
                "breakdown": {
                    "distance": 0.75,
                    "quantity": 1.0,
                    "category": 0.0,
                    "urgency": 0.5,
                    "weights": {"distance": 0.35, "quantity": 0.25, "category": 0.2, "urgency": 0.2},
                    "weighted_distance": 0.2625,
                    "weighted_quantity": 0.25,
                    "weighted_category": 0.0,
                    "weighted_urgency": 0.1,
                },
            }
        return envelope(match, "Match scored")

    def _find(self, request: httpx.Request) -> httpx.Response:
        body = json.loads(request.content.decode())
        listing_id = body["listing"]["id"]
        matches = []
        for organization in body["organizations"]:
            match = self.matcher_scores.get((listing_id, organization["id"]))
            if match and match.get("eligible"):
                matches.append(match)
        matches.sort(key=lambda item: item.get("total_score") or 0, reverse=True)
        return envelope({"count": len(matches), "matches": matches}, "Matches ranked")


def _first(query: dict[str, list[str]], key: str) -> str | None:
    values = query.get(key)
    if not values:
        return None
    return values[0]
