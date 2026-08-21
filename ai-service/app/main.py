import os

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.advisor.llm_client import LlmClientError
from app.advisor.parser import AdviceParseError
from app.agent.foodloop_client import FoodLoopApiError
from app.api.agent import router as agent_router
from app.api.health import router as health_router
from app.api.rag import router as rag_router
from app.api.recommend import router as recommend_router
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
        title="FoodLoop AI Service",
        version="0.1.0",
        description="Waste-reduction advisor, RAG knowledge assistant, and food matching agent",
        docs_url=None if production else "/docs",
        redoc_url=None if production else "/redoc",
        openapi_url=None if production else "/openapi.json",
    )
    application.add_middleware(CORSMiddleware, **_cors_kwargs())
    application.include_router(health_router)
    application.include_router(recommend_router)
    application.include_router(rag_router)
    application.include_router(agent_router)

    @application.exception_handler(RequestValidationError)
    async def validation_handler(_request: Request, exc: RequestValidationError):
        errors = []
        for item in exc.errors():
            location = ".".join(str(part) for part in item.get("loc", []) if part != "body")
            errors.append(f"{location}: {item.get('msg')}" if location else item.get("msg"))
        return JSONResponse(
            status_code=400,
            content={"success": False, "message": "Validation failed", "data": {"errors": errors}},
        )

    @application.exception_handler(LlmClientError)
    async def llm_handler(_request: Request, exc: LlmClientError):
        return JSONResponse(
            status_code=exc.status_code,
            content={"success": False, "message": exc.message, "data": None},
        )

    @application.exception_handler(AdviceParseError)
    async def parse_handler(_request: Request, exc: AdviceParseError):
        return JSONResponse(
            status_code=exc.status_code,
            content={"success": False, "message": exc.message, "data": None},
        )

    @application.exception_handler(FileNotFoundError)
    async def missing_index_handler(_request: Request, exc: FileNotFoundError):
        return JSONResponse(
            status_code=503,
            content={"success": False, "message": str(exc), "data": None},
        )

    @application.exception_handler(FoodLoopApiError)
    async def foodloop_handler(_request: Request, exc: FoodLoopApiError):
        return JSONResponse(
            status_code=exc.status_code,
            content={"success": False, "message": exc.message, "data": None},
        )

    return application


app = create_app()
