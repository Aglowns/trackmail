"""
Application Configuration

This module handles loading and validating environment variables using Pydantic Settings.
Pydantic automatically loads values from .env files and validates their types.

Why Pydantic Settings?
- Type safety: Ensures environment variables are the correct type
- Validation: Catches missing or invalid configuration at startup
- Documentation: Settings class documents all required config
- IDE support: Get autocomplete for configuration values
"""

from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    This class uses Pydantic BaseSettings to automatically load values
    from environment variables or a .env file.
    """
    
    # Supabase Configuration
    # These values come from your Supabase project dashboard
    supabase_url: str = Field(
        ...,
        description="Your Supabase project URL (e.g., https://xxxxx.supabase.co)"
    )
    supabase_anon_key: str = Field(
        ...,
        description="Supabase anonymous key (safe for frontend, respects RLS)"
    )
    supabase_service_role_key: str = Field(
        ...,
        description="Supabase service role key (backend only, bypasses RLS)"
    )
    supabase_jwt_secret: str | None = Field(
        default=None,
        description="Supabase JWT secret used to verify bearer tokens (optional; falls back to anon key if unset)"
    )
    
    # Database Configuration
    # Direct PostgreSQL connection string for migrations and advanced queries
    database_url: str = Field(
        ...,
        description="PostgreSQL connection string for direct database access"
    )
    
    # JWT Configuration
    # These settings are used to validate JWT tokens from Supabase Auth
    jwt_audience: str = Field(
        default="authenticated",
        description="Expected JWT audience claim (usually 'authenticated')"
    )
    jwt_issuer: str = Field(
        ...,
        description="Expected JWT issuer (your Supabase auth URL)"
    )
    
    # Application Settings
    environment: str = Field(
        default="development",
        description="Environment name (development, staging, production)"
    )
    log_level: str = Field(
        default="INFO",
        description="Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)"
    )
    
    # CORS Settings
    # Cross-Origin Resource Sharing - which frontend URLs can access the API
    cors_origins: str = Field(
        default="http://localhost:3000,http://localhost:5173",
        description="Allowed CORS origins (comma-separated in .env)"
    )
    
    # OpenAI Configuration
    openai_api_key: str | None = Field(
        default=None,
        description="OpenAI API key for AI-powered email classification and parsing (optional)"
    )
    
    # Stripe Configuration
    stripe_secret_key: str | None = Field(
        default=None,
        description="Stripe secret key for payment processing (required for subscriptions)"
    )
    stripe_publishable_key: str | None = Field(
        default=None,
        description="Stripe publishable key for frontend checkout (optional, for reference)"
    )
    stripe_webhook_secret: str | None = Field(
        default=None,
        description="Stripe webhook signing secret for verifying webhook events (required for webhooks)"
    )
    
    # Pydantic Settings configuration
    model_config = SettingsConfigDict(
        # Load from .env file
        env_file=".env",
        # Allow extra fields (for future expansion)
        extra="allow",
        # Case-insensitive environment variable names
        case_sensitive=False,
    )
    
    def get_cors_origins_list(self) -> List[str]:
        """
        Parse CORS_ORIGINS from comma-separated string to list.
        
        In .env file: CORS_ORIGINS=http://localhost:3000,http://localhost:5173
        This method converts it to: ["http://localhost:3000", "http://localhost:5173"]
        """
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


# Create a singleton instance of settings
# This instance is imported throughout the application
settings = Settings()

