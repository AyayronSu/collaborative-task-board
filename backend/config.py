import os

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "change-me-before-production")
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        "postgresql://postgres:password@localhost:5432/taskboard",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SESSION_COOKIE_HTTPONLY   = True
    SESSION_COOKIE_SAMESITE   = "Lax"
    SESSION_COOKIE_SECURE     = os.environ.get("FLASK_ENV") == "production"