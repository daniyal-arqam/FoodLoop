import pytest

from app.advisor.parser import AdviceParseError, parse_advice


VALID = """
{
  "situation_summary": "A provider reports 120 servings of prepared meals leftover weekly between 7 PM and 9 PM.",
  "immediate_actions": ["List tonight's surplus on FoodLoop before closing."],
  "operational_improvements": ["Plan production using the weekly 7-9 PM leftover pattern."],
  "redistribution_suggestions": ["Offer the listing to verified nearby community organizations."],
  "long_term_recommendations": ["Track this weekly surplus and partner with a regular rescue org."],
  "caveats": ["Safety was not assessed from the provided details; follow your existing food-safety process."]
}
"""


def test_parse_plain_json():
    advice = parse_advice(VALID)
    assert "120 servings" in advice.situation_summary
    assert advice.immediate_actions[0].startswith("List tonight")
    assert len(advice.redistribution_suggestions) == 1
    assert advice.caveats


def test_parse_fenced_json_and_camel_case():
    raw = """Here is the advice:
```json
{
  "situationSummary": "Weekly prepared-meal surplus after dinner service.",
  "immediateActions": "Publish a FoodLoop listing as soon as leftover volume is known.",
  "operationalImprovements": ["Reduce batch size for the 7-9 PM window."],
  "redistributionSuggestions": ["Coordinate pickup with a verified kitchen."],
  "longTermRecommendations": ["Review weekly leftover logs each Monday."]
}
```
"""
    advice = parse_advice(raw)
    assert advice.situation_summary.startswith("Weekly prepared-meal")
    assert advice.immediate_actions == ["Publish a FoodLoop listing as soon as leftover volume is known."]
    assert advice.caveats == []


def test_parse_nested_advice_object():
    advice = parse_advice(
        '{"advice": {"situation_summary": "Surplus noted.", "immediate_actions": ["List early"],'
        '"operational_improvements": ["Plan smaller batches"], "redistribution_suggestions": ["Use FoodLoop"],'
        '"long_term_recommendations": ["Track weekly leftovers"]}}'
    )
    assert advice.situation_summary == "Surplus noted."


def test_parse_rejects_empty_and_invalid():
    with pytest.raises(AdviceParseError):
        parse_advice(" ")
    with pytest.raises(AdviceParseError):
        parse_advice("not json")
    with pytest.raises(AdviceParseError):
        parse_advice('{"situation_summary": "only this"}')
