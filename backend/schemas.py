from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    is_store_owner: bool = False
    is_admin: bool = False

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    class Config:
        from_attributes = True

# Store schemas
class StoreBase(BaseModel):
    name: str
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    website_url: Optional[str] = None
    instagram_url: Optional[str] = None
    facebook_url: Optional[str] = None
    twitter_url: Optional[str] = None

class StoreCreate(StoreBase):
    pass

class StoreUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    website_url: Optional[str] = None
    instagram_url: Optional[str] = None
    facebook_url: Optional[str] = None
    twitter_url: Optional[str] = None
    logo_url: Optional[str] = None

class StoreResponse(StoreBase):
    id: int
    owner_id: int
    logo_url: Optional[str] = None
    status: str
    status_reason: Optional[str] = None
    rating: float
    rating_count: int
    class Config:
        from_attributes = True

# Product schemas
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    stock: int = 0
    category: str
    brand: Optional[str] = None
    color: Optional[str] = None
    size: Optional[str] = None
    specs: Optional[Dict[str, Any]] = None
    image_url: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    color: Optional[str] = None
    size: Optional[str] = None
    specs: Optional[Dict[str, Any]] = None
    image_url: Optional[str] = None

class ProductResponse(ProductBase):
    id: int
    store_id: int
    store_name: Optional[str] = None
    store_phone: Optional[str] = None
    created_at: datetime
    sales_count: int
    rating: float
    rating_count: int
    class Config:
        from_attributes = True

# AI Search Schemas
class AISearchInterpretation(BaseModel):
    original_query: str
    category: Optional[str] = None
    brand: Optional[str] = None
    max_price: Optional[float] = None
    min_price: Optional[float] = None
    color: Optional[str] = None
    size: Optional[str] = None
    specs: Dict[str, Any] = {}
    in_stock_only: bool = False
    explanation: str
    sort_by: Optional[str] = None

class AISearchResponse(BaseModel):
    interpretation: AISearchInterpretation
    results: List[ProductResponse]

# Purchase Request Schemas
class PurchaseRequestCreate(BaseModel):
    payment_method: str = "qr"

class PurchaseRequestResponse(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    product_image: Optional[str] = None
    product_price: Optional[float] = None
    store_name: Optional[str] = None
    store_phone: Optional[str] = None
    buyer_id: int
    buyer_name: str
    buyer_email: str
    buyer_phone: Optional[str] = None
    status: str
    payment_method: Optional[str] = None
    product_key: str
    created_at: datetime
    class Config:
        from_attributes = True

class AdminActionRequest(BaseModel):
    reason: str

class StoreAdminResponse(StoreResponse):
    owner_email: str
    owner_name: str
