import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.matching import router as matching_router
from app.core.config import settings


def _is_production() -> bool:
    env = (os.getenv("NODE_ENV") or os.getenv("ENVIRONMENT") or "").lower()
    return env == "production"


def _cors_kwargs() -> dict:
    origins = settings.cors_origins
    wildcard = origins == ["*"] or "*" in origins
    return {
        "allow_origins": ["*"] if wildcard else origins,
        "allow_credentials": not wildcard,
        "allow_methods": ["*"],
        "allow_headers": ["*"],
    }


def create_app() -> FastAPI:
    production = _is_production()
    application = FastAPI(
        title="FoodLoop Matcher",
        version="0.1.0",
        description="Food-to-organization matching service",
        docs_url=None if production else "/docs",
        redoc_url=None if production else "/redoc",
        openapi_url=None if production else "/openapi.json",
    )
    application.add_middleware(CORSMiddleware, **_cors_kwargs())
    application.include_router(health_router)
    application.include_router(matching_router)
    return application


app = create_app()
