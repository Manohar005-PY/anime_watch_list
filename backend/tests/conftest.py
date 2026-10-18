import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# Ensure test environment
os.environ["ENVIRONMENT"] = "test"
os.environ["DATABASE_URL"] = "sqlite:///./test_kage.db"

from app.core.config import settings
settings.DATABASE_URL = "sqlite:///./test_kage.db"
settings.ENVIRONMENT = "test"

from app.core.database import Base, get_db
from app.main import app

# Create test engine
test_engine = create_engine(
    "sqlite:///./test_kage.db",
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("./test_kage.db"):
        try:
            os.remove("./test_kage.db")
        except Exception:
            pass


@pytest.fixture
def db():
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db):
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def user_a(client):
    """Register and log in User A."""
    email = "user_a@example.com"
    pwd = "PasswordA123!"
    client.post("/api/v1/auth/register", json={
        "email": email,
        "password": pwd,
        "display_name": "Spike Spiegel"
    })
    res = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": pwd
    })
    token = res.cookies.get(settings.SESSION_COOKIE_NAME)
    client.cookies.clear()
    return {
        "email": email,
        "password": pwd,
        "cookie": token,
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"},
        "user_id": res.json()["user_id"]
    }


@pytest.fixture
def user_b(client):
    """Register and log in User B."""
    email = "user_b@example.com"
    pwd = "PasswordB123!"
    client.post("/api/v1/auth/register", json={
        "email": email,
        "password": pwd,
        "display_name": "Faye Valentine"
    })
    res = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": pwd
    })
    token = res.cookies.get(settings.SESSION_COOKIE_NAME)
    client.cookies.clear()
    return {
        "email": email,
        "password": pwd,
        "cookie": token,
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"},
        "user_id": res.json()["user_id"]
    }
