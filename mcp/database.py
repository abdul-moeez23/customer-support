"""
database.py - MCP server database connection.

Connects to the SAME main PostgreSQL database as the backend to read:
  - DatabaseConnection records (credentials, db_type, host, etc.)
  - AllowedTable records (the access policy per connection)
"""

import os
from sqlalchemy import create_engine, Column, String, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgrespassword@db:5432/aicustomer"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ---------------------------------------------------------------------------
# Minimal ORM models — mirrors the backend models (read-only use here)
# ---------------------------------------------------------------------------

class Company(Base):
    __tablename__ = "companies"
    id = Column(String, primary_key=True)
    name = Column(String)


class DatabaseConnection(Base):
    __tablename__ = "database_connections"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"))
    name = Column(String)
    db_type = Column(String)
    host = Column(String)
    port = Column(String)
    username = Column(String)
    encrypted_password = Column(String)
    database_name = Column(String)

    allowed_tables = relationship("AllowedTable", back_populates="connection")
    company = relationship("Company")


class AllowedTable(Base):
    __tablename__ = "allowed_tables"
    id = Column(String, primary_key=True)
    connection_id = Column(String, ForeignKey("database_connections.id"))
    table_name = Column(String)

    connection = relationship("DatabaseConnection", back_populates="allowed_tables")

class APIConnection(Base):
    __tablename__ = "api_connections"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"))
    name = Column(String)
    base_url = Column(String)
    auth_type = Column(String)
    encrypted_api_key = Column(String)

    allowed_endpoints = relationship("AllowedEndpoint", back_populates="connection")
    company = relationship("Company")

class AllowedEndpoint(Base):
    __tablename__ = "allowed_endpoints"
    id = Column(String, primary_key=True)
    connection_id = Column(String, ForeignKey("api_connections.id"))
    path = Column(String)
    method = Column(String)
    description = Column(String)

    connection = relationship("APIConnection", back_populates="allowed_endpoints")


def get_db():
    """Yield a SQLAlchemy session; close it after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
