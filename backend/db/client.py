from supabase import create_client, Client
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    supabase_url: str
    supabase_service_key: str
    supabase_anon_key: str
    anthropic_api_key: str
    reddit_client_id: str = "skip"
    reddit_client_secret: str = "skip"
    reddit_user_agent: str = "NicheAgent/1.0"
    apify_api_token: str = ""
    environment: str = "development"
    allowed_origins: str = "http://localhost:3000"
    secret_key: str = "changeme"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

_client: Client | None = None

def get_db() -> Client:
    global _client
    if _client is None:
        _client = create_client(settings.supabase_url, settings.supabase_service_key)
    return _client
