"""Application settings, loaded from environment / .env via pydantic-settings.

TODO (Mon): wire real values; everything below has safe defaults so imports work.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # LLMs
    anthropic_api_key: str = ""
    orchestrator_model: str = "claude-sonnet-4-6"
    agent_model: str = "claude-haiku-4-5"

    # Embeddings
    openai_api_key: str = ""
    voyage_api_key: str = ""
    embedding_provider: str = "openai"  # openai | voyage

    # Tracing
    langsmith_api_key: str = ""
    langsmith_tracing: bool = True
    langsmith_project: str = "ovenmind"

    # RAG
    chroma_persist_dir: str = "./chroma_db"

    # Alerts
    slack_webhook_url: str = ""

    # Cost guardrails — DO NOT REMOVE
    max_supervisor_turns: int = 8
    max_tokens_per_agent: int = 4000

    # Demo replay
    replay_speed: float = 3.0   # 1.0 = real-time; 3.0 compresses 60s -> ~20s
    use_run_cache: bool = True  # cache the first real agent run per scenario


settings = Settings()
