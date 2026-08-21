from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.main import create_app


APP = create_app()


def listing(**overrides):
    payload = {
        "id": "listing-1",
        "foodName": "Bread",
        "category": "Bakery",
        "quantity": 40,
        "latitude": 24.8607,
        "longitude": 67.0011,
        "expiryDate": (datetime.now(timezone.utc) + timedelta(hours=6)).isoformat(),
        "status": "Available",
    }
    payload.update(overrides)
    return payload


def organization(**overrides):
    payload = {
        "id": "org-1",
        "organizationName": "Karachi Food Bank",
        "verified": True,
        "latitude": 24.8607,
        "longitude": 67.0011,
        "foodCategoriesNeeded": ["Bakery", "Produce"],
        "requiredQuantity": 40,
    }
    payload.update(overrides)
    return payload


def test_score_endpoint_returns_breakdown():
    client = TestClient(APP)
    response = client.post("/matching/score", json={"listing": listing(), "organization": organization()})
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    data = body["data"]
    assert data["eligible"] is True
    assert data["listing_id"] == "listing-1"
    assert data["organization_id"] == "org-1"
    assert data["breakdown"]["category"] == 1.0
    assert data["total_score"] > 0


def test_score_rejects_far_distance():
    client = TestClient(APP)
    far = organization(id="org-far", latitude=31.5204, longitude=74.3587)
    response = client.post("/matching/score", json={"listing": listing(), "organization": far})
    data = response.json()["data"]
    assert data["eligible"] is False
    assert data["rejection_reason"] == "distance_too_far"
    assert data["distance_km"] > 50


def test_score_quantity_and_category():
    client = TestClient(APP)
    mismatch = organization(foodCategoriesNeeded=["Dairy"])
    category = client.post("/matching/score", json={"listing": listing(), "organization": mismatch})
    assert category.json()["data"]["breakdown"]["category"] == 0.0
    assert category.json()["data"]["rejection_reason"] == "category_mismatch"

    tight = organization(requiredQuantity=100)
    quantity = client.post(
        "/matching/score",
        json={"listing": listing(quantity=5), "organization": tight},
    )
    assert quantity.json()["data"]["eligible"] is False
    assert quantity.json()["data"]["rejection_reason"] == "insufficient_quantity"


def test_score_urgency_ranks_sooner_expiry_higher():
    client = TestClient(APP)
    now = datetime.now(timezone.utc)
    urgent = client.post(
        "/matching/score",
        json={
            "listing": listing(expiryDate=(now + timedelta(hours=2)).isoformat()),
            "organization": organization(),
        },
    ).json()["data"]
    later = client.post(
        "/matching/score",
        json={
            "listing": listing(expiryDate=(now + timedelta(hours=60)).isoformat()),
            "organization": organization(),
        },
    ).json()["data"]
    assert urgent["breakdown"]["urgency"] > later["breakdown"]["urgency"]


def test_find_ranks_closer_organization_first():
    client = TestClient(APP)
    close = organization(id="close", organizationName="Close Kitchen")
    farther = organization(
        id="farther",
        organizationName="Farther Kitchen",
        latitude=24.90,
        longitude=67.05,
    )
    response = client.post(
        "/matching/find",
        json={"listing": listing(), "organizations": [farther, close]},
    )
    assert response.status_code == 200
    matches = response.json()["data"]["matches"]
    assert [item["organization_id"] for item in matches] == ["close", "farther"]
    assert matches[0]["total_score"] >= matches[1]["total_score"]


def test_impact_endpoint_uses_waste_and_sustainability_classes():
    client = TestClient(APP)
    response = client.post(
        "/matching/impact",
        json={
            "listings": [
                {"quantity": 10, "claimedQuantity": 10, "status": "Collected", "category": "Prepared"},
                {"quantity": 4, "status": "Expired", "category": "Bakery"},
            ]
        },
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["rescuedPortions"] == 10
    assert data["estimatedWasteKg"] == 3.5
    assert data["co2AvoidedKg"] == 8.75
