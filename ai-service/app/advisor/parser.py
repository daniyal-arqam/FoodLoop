import json
import re

from app.models.advice import Advice

FENCE_RE = re.compile(r"```(?:json)?\s*(.*?)\s*```", re.DOTALL | re.IGNORECASE)


class AdviceParseError(Exception):
    def __init__(self, message: str = "AI advisor returned an unreadable response"):
        super().__init__(message)
        self.status_code = 502
        self.message = message


def extract_json_object(raw: str) -> dict:
    if raw is None or not str(raw).strip():
        raise AdviceParseError("AI advisor returned an empty response")

    text = str(raw).strip()
    fenced = FENCE_RE.search(text)
    if fenced:
        text = fenced.group(1).strip()

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise AdviceParseError("AI advisor response was not valid JSON")
        try:
            parsed = json.loads(text[start : end + 1])
        except json.JSONDecodeError as error:
            raise AdviceParseError("AI advisor response was not valid JSON") from error

    if not isinstance(parsed, dict):
        raise AdviceParseError("AI advisor response must be a JSON object")
    if isinstance(parsed.get("advice"), dict):
        parsed = parsed["advice"]
    return parsed


def parse_advice(raw: str) -> Advice:
    payload = extract_json_object(raw)
    try:
        return Advice.model_validate(payload)
    except Exception as error:
        raise AdviceParseError("AI advisor response was missing required recommendation fields") from error
