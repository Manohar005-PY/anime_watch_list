from app.core.config import settings
from app.services.metadata.base import BaseMetadataProvider
from app.services.metadata.kitsu import KitsuProvider
from app.services.metadata.mock import MockMetadataProvider

_provider_instance: BaseMetadataProvider = None


def get_metadata_provider() -> BaseMetadataProvider:
    """Singleton factory returning the configured metadata provider instance."""
    global _provider_instance
    if _provider_instance is None:
        provider_name = (settings.METADATA_PROVIDER or "kitsu").lower().strip()
        if provider_name == "mock":
            _provider_instance = MockMetadataProvider()
        else:
            _provider_instance = KitsuProvider()
    return _provider_instance


def reset_metadata_provider_for_testing(provider: BaseMetadataProvider = None):
    """Utility to inject a mock provider during test runs."""
    global _provider_instance
    _provider_instance = provider
