"""Application configuration using Pydantic Settings"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Server
    APP_NAME: str = "Document Intelligence Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 3000
    RELOAD: bool = False
    
    # Database
    MONGODB_URL: str = "mongodb://admin:admin123@localhost:27017"
    MONGODB_DB: str = "document-intelligence"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    REDIS_DB: int = 0
    
    # API Keys
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://keygateway1.arshnivlabs.com/v1"
    OPENROUTER_MODEL: str = "meta-llama/llama-3.3-70b-instruct"
    
    # Security
    JWT_SECRET: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    REFRESH_TOKEN_EXPIRATION_DAYS: int = 7
    
    # CORS
    FRONTEND_URL: str = "http://localhost:5173"
    ALLOWED_ORIGINS: list = ["http://localhost:5173", "http://localhost", "http://127.0.0.1:5173"]
    
    # File Upload
    MAX_FILE_SIZE_MB: int = 100
    UPLOAD_DIR: str = "uploads"
    ALLOWED_FILE_TYPES: list = [".pdf", ".txt", ".md"]
    
    # Features
    ENABLE_AUDIO_TTS: bool = False
    ENABLE_CUSTOM_TRAINING: bool = False
    ENABLE_INTEGRATIONS: bool = False
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"
    
    # Organization
    DEFAULT_ORGANIZATION_ID: str = "org_default"
    DEFAULT_USER_ID: str = "user_default"
    
    # Budget
    DEFAULT_MONTHLY_BUDGET: float = 100.0
    BUDGET_ALERT_THRESHOLDS: list = [75, 90]  # Percentages
    
    # Processing
    DOCUMENT_RETENTION_DAYS: int = 90
    CACHE_TTL_SECONDS: int = 86400  # 1 day
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create global settings instance
settings = Settings()
