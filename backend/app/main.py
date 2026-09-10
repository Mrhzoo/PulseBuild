from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.billing_routes import router as billing_router
from app.api.contact_routes import router as contact_router
from app.api.digest_routes import router as digest_router
from app.api.flag_routes import router as flag_router
from app.api.inbound import router as inbound_router
from app.api.onboarding_routes import router as onboarding_router
from app.api.pilot_routes import router as pilot_router
from app.api.routes import router
from app.api.v15_routes import router as v15_router
from app.api.whatsapp_webhook import router as whatsapp_router
from app.config import settings

app = FastAPI(title="PulseBuild", version="0.1.8")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.web_base_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router, prefix="/api")
app.include_router(digest_router, prefix="/api")
app.include_router(flag_router, prefix="/api")
app.include_router(pilot_router, prefix="/api")
app.include_router(v15_router, prefix="/api")
app.include_router(billing_router, prefix="/api")
app.include_router(onboarding_router, prefix="/api")
app.include_router(whatsapp_router, prefix="/api")
app.include_router(contact_router, prefix="/api")
app.include_router(router, prefix="/api")
app.include_router(inbound_router, prefix="/api")


@app.get("/")
async def root() -> dict:
    return {"name": "PulseBuild", "promise": "See the risk to your cash flow before it hits your account.", "sla_channel": "email"}
