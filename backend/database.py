import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Database file location
DATABASE_URL = "sqlite:///./sucreshop.db"

# Create engine
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base class for models
Base = declarative_base()

# Dependency to get db session in endpoints
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
