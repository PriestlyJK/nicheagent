from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.client import settings
from api.routes import niches, users, social

app = FastAPI(title="NicheAgent API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(niches.router, prefix="/api/niches", tags=["niches"])
app.include_router(users.router,  prefix="/api/users",  tags=["users"])
app.include_router(social.router, prefix="/api/social", tags=["social"])

@app.get("/health")
def health():
    return {"status": "ok", "env": settings.environment}
