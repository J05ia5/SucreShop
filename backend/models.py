from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    is_store_owner = Column(Boolean, default=False)
    
    # Relationships
    stores = relationship("Store", back_populates="owner")

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
    
    # Relationships
    store = relationship("Store", back_populates="products")
