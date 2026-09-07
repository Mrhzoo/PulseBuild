from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"
    app_secret_key: str = "change-me"
    api_base_url: str = "http://localhost:8000"
    web_base_url: str = "http://localhost:3000"

    database_url: str = "postgresql+asyncpg://pulsebuild:pulsebuild@localhost:5432/pulsebuild"
    redis_url: str = "redis://localhost:6379/0"

    s3_endpoint_url: str = "http://localhost:9000"
    s3_access_key: str = "minio"
    s3_secret_key: str = "minio-secret"
    s3_bucket: str = "pulsebuild-docs"
    s3_region: str = "eu-central-1"

    data_region: str = "eu-central-1"
    default_country: str = "UAE"
    default_currency: str = "AED"

    llm_classify_model: str = "gpt-4.1-mini"
    llm_reasoning_model: str = "gpt-4.1"
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    enable_live_llm: bool = False
    tenant_daily_token_cap: int = 250_000

    postmark_server_token: str = ""
    postmark_inbound_secret: str = ""
    mail_from: str = "briefing@pulsebuild.local"
    file_encryption_key: str = ""
    local_upload_dir: str = "./data/uploads"


settings = Settings()
