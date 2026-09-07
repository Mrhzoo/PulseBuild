from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.digest_routes import router as digest_router
from app.api.inbound import router as inbound_router
from app.api.routes import router
from app.config import settings

app = FastAPI(title="PulseBuild", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.web_base_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router, prefix="/api")
app.include_router(digest_router, prefix="/api")
app.include_router(router, prefix="/api")
app.include_router(inbound_router, prefix="/api")


@app.get("/")
async def root() -> dict:
    return {"name": "PulseBuild", "promise": "See the risk to your cash flow before it hits your account.", "sla_channel": "email"}
