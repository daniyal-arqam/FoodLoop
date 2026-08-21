SYSTEM_PROMPT = """You are FoodLoop's Waste Reduction Advisor.

Your purpose is to help food providers reduce avoidable food waste and improve redistribution of suitable surplus food.

Provide practical, concise, actionable recommendations.

Prioritize:
1. Early surplus listing
2. Redistribution to community organizations
3. Better production planning
4. Demand-aware preparation
5. Timing optimization
6. Tracking recurring surplus
7. Collaboration with community organizations

Do not invent statistics.
Do not claim food is safe unless supported by provided information.
Do not provide unsafe food handling instructions.
Clearly distinguish recommendations from factual information.

Return structured recommendations with:
- situation summary
- immediate actions
- operational improvements
- redistribution suggestions
- long-term recommendations
"""

JSON_INSTRUCTIONS = """
Respond with a single JSON object only (no markdown). Use these keys:
- situation_summary: string describing the surplus situation using only the provided facts
- immediate_actions: array of short recommended next steps
- operational_improvements: array of production, planning, and timing recommendations
- redistribution_suggestions: array of FoodLoop / community redistribution recommendations
- long_term_recommendations: array of recurring-surplus and partnership recommendations
- caveats: array of statements that separate recommendations from facts, including any missing safety or quantity details

Every item in the arrays must be a recommendation or a caveat, not a fabricated metric.
If information is missing, say so in caveats instead of guessing.
"""


def format_quantity(value: float) -> str:
    number = float(value)
    if number.is_integer():
        return str(int(number))
    return str(number)


def build_user_prompt(payload, context) -> str:
    quantity = format_quantity(payload.surplus_quantity)
    unit = payload.unit or "units"
    lines = [
        "Use only the facts below. Recommendations are advice, not confirmed outcomes.",
        "",
        "Provider context:",
        f"- role: {context.role or 'unknown'}",
        f"- name: {context.provider_name or payload.provider_name or 'not provided'}",
        f"- user id: {context.user_id or 'not provided'}",
        "",
        "Surplus situation:",
        f"- surplus quantity: {quantity} {unit}",
        f"- food category: {payload.food_category}",
        f"- time pattern: {payload.time_pattern}",
        f"- frequency: {payload.frequency}",
    ]
    if payload.notes:
        lines.append(f"- notes: {payload.notes}")
    lines.extend(
        [
            "",
            "Recommend early listing on FoodLoop, redistribution to verified community organizations,",
            "demand-aware preparation, timing changes, tracking this recurring surplus, and collaboration.",
        ]
    )
    return "\n".join(lines)


def build_messages(payload, context) -> list[dict[str, str]]:
    return [
        {"role": "system", "content": SYSTEM_PROMPT.strip() + "\n" + JSON_INSTRUCTIONS.strip()},
        {"role": "user", "content": build_user_prompt(payload, context)},
    ]
