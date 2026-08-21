import os
from pathlib import Path


AI_ROOT = Path(__file__).resolve().parents[2]


class Settings:
    service_name: str = os.getenv("SERVICE_NAME", "ai-service")
    port: int = int(os.getenv("PORT", "8002"))
    cors_origins: list[str] = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
        if origin.strip()
    ]
    openai_base_url: str = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    ai_timeout_seconds: float = float(os.getenv("AI_TIMEOUT_SECONDS", "25"))
    knowledge_base_dir: Path = Path(os.getenv("RAG_KNOWLEDGE_DIR", AI_ROOT / "knowledge-base"))
    rag_index_dir: Path = Path(os.getenv("RAG_INDEX_DIR", AI_ROOT / "data" / "rag"))
    rag_top_k: int = int(os.getenv("RAG_TOP_K", "4"))
    rag_min_score: float = float(os.getenv("RAG_MIN_SCORE", "0.18"))
    embedding_dim: int = int(os.getenv("RAG_EMBEDDING_DIM", "384"))
    food_service_url: str = os.getenv("FOOD_SERVICE_URL", "http://localhost:4002").rstrip("/")
    organization_service_url: str = os.getenv("ORGANIZATION_SERVICE_URL", "http://localhost:4003").rstrip("/")
    matcher_url: str = os.getenv("MATCHER_URL", "http://localhost:8001").rstrip("/")
    foodloop_timeout_seconds: float = float(os.getenv("FOODLOOP_TIMEOUT_SECONDS", "10"))
    agent_max_steps: int = int(os.getenv("AGENT_MAX_STEPS", "8"))

    @property
    def openai_api_key(self) -> str | None:
        return os.getenv("OPENAI_API_KEY") or os.getenv("AI_API_KEY") or None


settings = Settings()
