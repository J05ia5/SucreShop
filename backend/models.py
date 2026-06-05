import uuid
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    is_store_owner = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    
    # Relationships
    stores = relationship("Store", back_populates="owner")
    purchase_requests = relationship("PurchaseRequest", back_populates="buyer")

class Store(Base):
    __tablename__ = "stores"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, unique=True, index=True, nullable=False)
    logo_url = Column(String, nullable=True)
    description = Column(String, nullable=True)
    address = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    website_url = Column(String, nullable=True)
    instagram_url = Column(String, nullable=True)
    facebook_url = Column(String, nullable=True)
    twitter_url = Column(String, nullable=True)
    status = Column(String, default="pending")
    status_reason = Column(String, nullable=True)
    rating = Column(Float, default=0.0)
    rating_count = Column(Integer, default=0)
    
    # Relationships
    owner = relationship("User", back_populates="stores")
    products = relationship("Product", back_populates="store", cascade="all, delete-orphan")

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    price = Column(Float, nullable=False)
    stock = Column(Integer, default=0)
    image_url = Column(String, nullable=True)
    category = Column(String, index=True, nullable=False) # "Tecnología", "Moda", "Comida", "Hogar", "Deportes", "Belleza"
    brand = Column(String, index=True, nullable=True)
    color = Column(String, nullable=True)
    size = Column(String, nullable=True)
    specs = Column(JSON, nullable=True) # Dictionary of custom specs, e.g. {"RAM": "16GB", "Almacenamiento": "512GB"}
    created_at = Column(DateTime, server_default=func.now())
    sales_count = Column(Integer, default=0)
    rating = Column(Float, default=0.0)
    rating_count = Column(Integer, default=0)
    
    # Relationships
    store = relationship("Store", back_populates="products")
    requests = relationship("PurchaseRequest", back_populates="product", cascade="all, delete-orphan")

class PurchaseRequest(Base):
    __tablename__ = "purchase_requests"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="solicitado")
    payment_method = Column(String, nullable=True)
    product_key = Column(String, unique=True, nullable=False, default=lambda: f"SP-{uuid.uuid4().hex[:8].upper()}-{uuid.uuid4().hex[:4].upper()}")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    product = relationship("Product", back_populates="requests")
    buyer = relationship("User", back_populates="purchase_requests")
