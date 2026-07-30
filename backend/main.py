from __future__ import annotations

import logging

from fastapi import FastAPI

from app.core.database import Base, engine
from app.routers.backups import router as backups_router
from app.routers.devices import router as devices_router

logger = logging.getLogger(__name__)
app = FastAPI(title="Net Almoner API")


@app.on_event("startup")
def on_startup() -> None:
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully.")
    except Exception as error:
        logger.exception("Database initialization failed during startup.")
        raise


app.include_router(devices_router)
app.include_router(backups_router)


@app.get("/")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "net-almoner"}
