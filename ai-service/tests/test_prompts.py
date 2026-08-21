from app.advisor.prompts import SYSTEM_PROMPT, build_messages, build_user_prompt
from app.models.advice import ProviderContext, RecommendRequest


def sample_payload(**overrides) -> RecommendRequest:
    data = {
        "surplusQuantity": 120,
        "foodCategory": "Prepared Meals",
        "timePattern": "7 PM - 9 PM",
        "frequency": "weekly",
        "unit": "servings",
        "providerName": "Harbour Kitchen",
    }
    data.update(overrides)
    return RecommendRequest.model_validate(data)


def test_system_prompt_states_role_and_priorities():
    assert "You are FoodLoop's Waste Reduction Advisor." in SYSTEM_PROMPT
    assert "Early surplus listing" in SYSTEM_PROMPT
    assert "Do not invent statistics." in SYSTEM_PROMPT
    assert "Do not claim food is safe unless supported by provided information." in SYSTEM_PROMPT
    assert "Do not provide unsafe food handling instructions." in SYSTEM_PROMPT
    assert "Clearly distinguish recommendations from factual information." in SYSTEM_PROMPT
    for item in [
        "situation summary",
        "immediate actions",
        "operational improvements",
        "redistribution suggestions",
        "long-term recommendations",
    ]:
        assert item in SYSTEM_PROMPT


def test_user_prompt_includes_surplus_facts_and_provider_context():
    payload = sample_payload()
    context = ProviderContext(user_id="user-1", role="Provider", provider_name="Harbour Kitchen")
    prompt = build_user_prompt(payload, context)
    assert "120 servings" in prompt
    assert "Prepared Meals" in prompt
    assert "7 PM - 9 PM" in prompt
    assert "weekly" in prompt
    assert "Provider" in prompt
    assert "Harbour Kitchen" in prompt
    assert "user-1" in prompt
    assert "Recommendations are advice, not confirmed outcomes." in prompt


def test_messages_put_system_prompt_first():
    messages = build_messages(sample_payload(), ProviderContext(role="Provider"))
    assert messages[0]["role"] == "system"
    assert "Do not invent statistics." in messages[0]["content"]
    assert messages[1]["role"] == "user"
    assert "Prepared Meals" in messages[1]["content"]
