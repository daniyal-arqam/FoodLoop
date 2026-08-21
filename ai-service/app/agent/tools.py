from app.agent.schemas import FOOD_CATEGORIES

_CATEGORY_ENUM = {"type": "string", "enum": list(FOOD_CATEGORIES)}

FIND_AVAILABLE_FOOD = {
    "type": "function",
    "function": {
        "name": "find_available_food",
        "description": (
            "Fetch currently Available food listings from the FoodLoop food service. "
            "Never invent listings, quantities, or locations. "
            "FoodLoop categories: Produce, Bakery, Dairy, Prepared, Canned, Frozen, Meat, Other. "
            "Vegetarian meals are usually category Prepared; also pass foodNameContains='vegetarian' "
            "when the user asks for vegetarian food."
        ),
        "parameters": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "category": {
                    **_CATEGORY_ENUM,
                    "description": "Official FoodLoop listing category.",
                },
                "foodNameContains": {
                    "type": "string",
                    "minLength": 2,
                    "maxLength": 80,
                    "description": "Case-insensitive substring match on foodName after the API returns listings.",
                },
                "urgencyHours": {
                    "type": "number",
                    "exclusiveMinimum": 0,
                    "maximum": 168,
                    "description": "Only listings expiring within this many hours.",
                },
                "latitude": {"type": "number", "minimum": -90, "maximum": 90},
                "longitude": {"type": "number", "minimum": -180, "maximum": 180},
                "maxDistanceKm": {"type": "number", "exclusiveMinimum": 0, "maximum": 200},
            },
        },
    },
}

FIND_ORGANIZATIONS = {
    "type": "function",
    "function": {
        "name": "find_organizations",
        "description": (
            "Fetch verified community organizations from the FoodLoop organization service. "
            "Never invent organizations, capacity, or locations. "
            "Pass category so only organizations that need that food category are returned."
        ),
        "parameters": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "category": {
                    **_CATEGORY_ENUM,
                    "description": "Filter organizations whose foodCategoriesNeeded includes this category.",
                },
                "name": {
                    "type": "string",
                    "minLength": 2,
                    "maxLength": 80,
                    "description": "Optional organization name search.",
                },
            },
        },
    },
}

CALCULATE_MATCH_SCORE = {
    "type": "function",
    "function": {
        "name": "calculate_match_score",
        "description": (
            "Score one listing against one organization using the FoodLoop matcher service. "
            "IDs must come from find_available_food and find_organizations. Never invent scores."
        ),
        "parameters": {
            "type": "object",
            "additionalProperties": False,
            "required": ["listingId", "organizationId"],
            "properties": {
                "listingId": {"type": "string", "minLength": 1, "maxLength": 80},
                "organizationId": {"type": "string", "minLength": 1, "maxLength": 80},
            },
        },
    },
}

GENERATE_MATCH_RECOMMENDATION = {
    "type": "function",
    "function": {
        "name": "generate_match_recommendation",
        "description": (
            "Rank organizations for a listing with the FoodLoop matcher /find API, then return "
            "grounded recommendations (score, why, urgency, quantity fit, distance). "
            "Uses only listings and organizations already loaded from FoodLoop APIs."
        ),
        "parameters": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "listingId": {
                    "type": "string",
                    "minLength": 1,
                    "maxLength": 80,
                    "description": "Listing id from find_available_food. If omitted, rank every cached available listing.",
                },
                "organizationIds": {
                    "type": "array",
                    "maxItems": 20,
                    "items": {"type": "string", "minLength": 1, "maxLength": 80},
                    "description": "Organization ids from find_organizations. If omitted, use every cached organization.",
                },
                "limit": {"type": "integer", "minimum": 1, "maximum": 10, "default": 5},
            },
        },
    },
}

TOOL_DEFINITIONS = [
    FIND_AVAILABLE_FOOD,
    FIND_ORGANIZATIONS,
    CALCULATE_MATCH_SCORE,
    GENERATE_MATCH_RECOMMENDATION,
]

TOOL_NAMES = [item["function"]["name"] for item in TOOL_DEFINITIONS]
