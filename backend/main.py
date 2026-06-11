import os
import shutil
from typing import List, Optional
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from backend.database import engine, get_db
from backend import models, schemas, auth
from backend.ai_search import parse_query, normalize_text

# Create database tables if they do not exist
models.Base.metadata.create_all(bind=engine)

# Ensure upload directory exists
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title="SucreShop API",
    description="Backend para la plataforma de tiendas locales SucreShop con búsqueda inteligente de IA.",
    version="1.0.0"
)

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AUTHENTICATION ENDPOINTS ---

@app.post("/api/auth/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(
    email: str = Form(...),
    password: str = Form(...),
    full_name: str = Form(...),
    is_store_owner: bool = Form(False),
    store_name: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    # Check if email is already taken
    db_user = db.query(models.User).filter(models.User.email == email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya está registrado."
        )
        
    # If registering as store owner, store_name is required
    if is_store_owner and not store_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe proporcionar un nombre para la tienda si se registra como comercio."
        )
        
    # Check store name uniqueness
    if is_store_owner:
        db_store = db.query(models.Store).filter(models.Store.name == store_name).first()
        if db_store:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre de la tienda ya está registrado por otro comercio."
            )

    hashed_password = auth.get_password_hash(password)
    new_user = models.User(
        email=email,
        hashed_password=hashed_password,
        full_name=full_name,
        is_store_owner=is_store_owner
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # If store owner, create the Store record
    if is_store_owner:
        new_store = models.Store(
            owner_id=new_user.id,
            name=store_name,
            description=f"Bienvenido a la página oficial de {store_name}.",
            logo_url="/uploads/default_logo.png" # Default placeholder
        )
        db.add(new_store)
        db.commit()
        
    return new_user

@app.post("/api/auth/login")
def login(
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    search_email = email
    if email.lower() == "admin":
        search_email = "admin@sucreshop.com"
        
    user = db.query(models.User).filter(models.User.email == search_email).first()
    if not user or not auth.verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo electrónico o contraseña incorrectos."
        )
        
    access_token = auth.create_access_token(data={"sub": user.email})
    
    # If owner, find store id
    store_id = None
    if user.is_store_owner:
        store = db.query(models.Store).filter(models.Store.owner_id == user.id).first()
        if store:
            store_id = store.id
            
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "is_store_owner": user.is_store_owner,
            "is_admin": user.is_admin,
            "store_id": store_id
        }
    }

@app.get("/api/auth/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


# --- PUBLIC STORE ENDPOINTS ---

@app.get("/api/stores", response_model=List[schemas.StoreResponse])
def get_all_stores(db: Session = Depends(get_db)):
    return db.query(models.Store).filter(models.Store.status == "approved").all()

@app.get("/api/stores/{store_id}", response_model=schemas.StoreResponse)
def get_store_by_id(store_id: int, db: Session = Depends(get_db)):
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="La tienda no existe.")
    return store

@app.get("/api/stores/{store_id}/products", response_model=List[schemas.ProductResponse])
def get_store_products(store_id: int, db: Session = Depends(get_db)):
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="La tienda no existe.")
        
    products = db.query(models.Product).filter(models.Product.store_id == store_id).all()
    
    # Add store name and phone to schema responses
    for p in products:
        p.store_name = store.name
        p.store_phone = store.phone
    return products


# --- PUBLIC PRODUCT LISTINGS & SEARCH ---

@app.get("/api/products", response_model=List[schemas.ProductResponse])
def get_all_products(
    category: Optional[str] = None,
    brand: Optional[str] = None,
    max_price: Optional[float] = None,
    min_price: Optional[float] = None,
    in_stock: Optional[bool] = None,
    min_rating: Optional[float] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Product).join(models.Store).filter(models.Store.status == "approved")
    if category:
        query = query.filter(models.Product.category == category)
    if brand:
        query = query.filter(models.Product.brand.ilike(f"%{brand}%"))
    if max_price:
        query = query.filter(models.Product.price <= max_price)
    if min_price:
        query = query.filter(models.Product.price >= min_price)
    if in_stock:
        query = query.filter(models.Product.stock > 0)
    if min_rating:
        query = query.filter(models.Product.rating >= min_rating)
        
    products = query.all()
    for p in products:
        store = db.query(models.Store).filter(models.Store.id == p.store_id).first()
        p.store_name = store.name if store else "Tienda Desconocida"
        p.store_phone = store.phone if store else None
    return products

@app.get("/api/search", response_model=schemas.AISearchResponse)
def ai_search(query: str, db: Session = Depends(get_db)):
    interpretation = parse_query(query)
    
    # Build query filters dynamically
    db_query = db.query(models.Product).join(models.Store).filter(models.Store.status == "approved")
    
    if interpretation["category"]:
        db_query = db_query.filter(models.Product.category == interpretation["category"])
        
    if interpretation["brand"]:
        db_query = db_query.filter(models.Product.brand.ilike(f"%{interpretation['brand']}%"))
        
    if interpretation["max_price"] is not None:
        db_query = db_query.filter(models.Product.price <= interpretation["max_price"])
    if interpretation["min_price"] is not None:
        db_query = db_query.filter(models.Product.price >= interpretation["min_price"])
        
    if interpretation["color"]:
        db_query = db_query.filter(models.Product.color.ilike(f"%{interpretation['color']}%"))
        
    if interpretation["size"]:
        db_query = db_query.filter(models.Product.size == interpretation["size"])
        
    if interpretation["in_stock_only"]:
        db_query = db_query.filter(models.Product.stock > 0)
        
    products = db_query.all()
    
    # Filter by custom specs and text search fallback
    filtered_products = []
    for product in products:
        match = True
        
        # 1. Specs match
        if interpretation["specs"]:
            for spec_key, spec_val in interpretation["specs"].items():
                p_specs = product.specs or {}
                found = False
                for pk, pv in p_specs.items():
                    if pk.lower() == spec_key.lower() and str(pv).lower() == str(spec_val).lower():
                        found = True
                        break
                if not found:
                    match = False
                    break
                    
        # 2. Text fallback (if no specific filters other than stock/sorting were detected)
        has_structural_filters = (
            interpretation["category"] or 
            interpretation["brand"] or 
            interpretation["color"] or 
            interpretation["size"] or 
            interpretation["max_price"] is not None or 
            interpretation["min_price"] is not None or 
            interpretation["specs"]
        )
        if match and not has_structural_filters:
            q_terms = normalize_text(query).split()
            if q_terms:
                term_matches = False
                p_name = normalize_text(product.name)
                p_desc = normalize_text(product.description or "")
                p_brand = normalize_text(product.brand or "")
                p_cat = normalize_text(product.category)
                for term in q_terms:
                    if len(term) < 3 and term not in ["tv", "pc", "m", "s", "l"]:
                        continue
                    if term in p_name or term in p_desc or term in p_brand or term in p_cat:
                        term_matches = True
                        break
                # Only invalidate match if we actually had long-enough search terms and none matched
                if any(len(t) >= 3 for t in q_terms) and not term_matches:
                    match = False
                    
        if match:
            filtered_products.append(product)
            
    # Apply sorting
    sort_val = interpretation.get("sort_by")
    if sort_val == "recent":
        filtered_products.sort(key=lambda p: p.created_at or datetime.min, reverse=True)
    elif sort_val == "most_purchased":
        filtered_products.sort(key=lambda p: p.sales_count or 0, reverse=True)
    elif sort_val == "best_rated":
        filtered_products.sort(key=lambda p: p.rating or 0.0, reverse=True)
    elif sort_val == "price_asc" or interpretation["is_budget"]:
        filtered_products.sort(key=lambda p: p.price)
    elif sort_val == "price_desc":
        filtered_products.sort(key=lambda p: p.price, reverse=True)
        
    response_results = []
    for p in filtered_products:
        store = db.query(models.Store).filter(models.Store.id == p.store_id).first()
        response_results.append(
            schemas.ProductResponse(
                id=p.id,
                store_id=p.store_id,
                store_name=store.name if store else "Tienda Desconocida",
                store_phone=store.phone if store else None,
                name=p.name,
                description=p.description,
                price=p.price,
                stock=p.stock,
                category=p.category,
                brand=p.brand,
                color=p.color,
                size=p.size,
                specs=p.specs,
                image_url=p.image_url,
                created_at=p.created_at,
                sales_count=p.sales_count,
                rating=p.rating,
                rating_count=p.rating_count
            )
        )
        
    return {
        "interpretation": interpretation,
        "results": response_results
    }


# --- INTERACTIVE RATING & TRANSACTION ENDPOINTS ---

@app.post("/api/products/{product_id}/rate")
def rate_product(
    product_id: int,
    rating: float = Form(...),
    db: Session = Depends(get_db)
):
    if rating < 1.0 or rating > 5.0:
        raise HTTPException(status_code=400, detail="La calificación debe estar entre 1 y 5.")
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="El producto no existe.")
        
    current_sum = product.rating * product.rating_count
    product.rating_count += 1
    product.rating = round((current_sum + rating) / product.rating_count, 2)
    
    db.commit()
    db.refresh(product)
    return {
        "message": "Producto calificado exitosamente.",
        "rating": product.rating,
        "rating_count": product.rating_count
    }

@app.post("/api/stores/{store_id}/rate")
def rate_store(
    store_id: int,
    rating: float = Form(...),
    db: Session = Depends(get_db)
):
    if rating < 1.0 or rating > 5.0:
        raise HTTPException(status_code=400, detail="La calificación debe estar entre 1 y 5.")
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="La tienda no existe.")
        
    current_sum = store.rating * store.rating_count
    store.rating_count += 1
    store.rating = round((current_sum + rating) / store.rating_count, 2)
    
    db.commit()
    db.refresh(store)
    return {
        "message": "Tienda calificada exitosamente.",
        "rating": store.rating,
        "rating_count": store.rating_count
    }

@app.post("/api/products/{product_id}/purchase")
def purchase_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="El producto no existe.")
    if product.stock <= 0:
        raise HTTPException(status_code=400, detail="El producto está agotado.")
        
    product.stock -= 1
    product.sales_count += 1
    
    db.commit()
    db.refresh(product)
    return {
        "message": "Reserva confirmada con éxito.",
        "stock": product.stock,
        "sales_count": product.sales_count
    }


# --- PURCHASE REQUEST ENDPOINTS ---

@app.post("/api/products/{product_id}/request", response_model=schemas.PurchaseRequestResponse, status_code=status.HTTP_201_CREATED)
def create_purchase_request(
    product_id: int,
    req: schemas.PurchaseRequestCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="El producto no existe.")
    if product.stock <= 0:
        raise HTTPException(status_code=400, detail="El producto está agotado.")

    store = db.query(models.Store).filter(models.Store.id == product.store_id).first()

    new_request = models.PurchaseRequest(
        product_id=product_id,
        buyer_id=current_user.id,
        payment_method=req.payment_method,
        status="solicitado"
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    new_request.product_name = product.name
    new_request.product_image = product.image_url
    new_request.product_price = product.price
    new_request.store_name = store.name if store else None
    new_request.store_phone = store.phone if store else None
    new_request.buyer_name = current_user.full_name
    new_request.buyer_email = current_user.email
    return new_request

@app.get("/api/stores/me/requests", response_model=List[schemas.PurchaseRequestResponse])
def get_store_requests(
    db: Session = Depends(get_db),
    current_store: models.Store = Depends(auth.get_current_store)
):
    requests = (
        db.query(models.PurchaseRequest)
        .join(models.Product)
        .filter(models.Product.store_id == current_store.id)
        .order_by(models.PurchaseRequest.created_at.desc())
        .all()
    )
    for r in requests:
        r.product_name = r.product.name
        r.product_image = r.product.image_url
        r.product_price = r.product.price
        r.store_name = current_store.name
        r.store_phone = current_store.phone
        r.buyer_name = r.buyer.full_name
        r.buyer_email = r.buyer.email
        r.buyer_phone = None
    return requests

@app.put("/api/requests/{request_id}/confirm", response_model=schemas.PurchaseRequestResponse)
def confirm_purchase_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_store: models.Store = Depends(auth.get_current_store)
):
    req = db.query(models.PurchaseRequest).filter(models.PurchaseRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="La solicitud no existe.")
    if req.product.store_id != current_store.id:
        raise HTTPException(status_code=403, detail="No tienes permiso para modificar esta solicitud.")
    if req.status != "solicitado":
        raise HTTPException(status_code=400, detail=f"La solicitud está en estado '{req.status}', no se puede confirmar.")

    product = req.product
    if product.stock <= 0:
        raise HTTPException(status_code=400, detail="El producto ya no tiene stock disponible.")

    product.stock -= 1
    product.sales_count += 1
    req.status = "comprado"
    db.commit()
    db.refresh(req)

    req.product_name = product.name
    req.product_image = product.image_url
    req.product_price = product.price
    req.store_name = current_store.name
    req.store_phone = current_store.phone
    req.buyer_name = req.buyer.full_name
    req.buyer_email = req.buyer.email
    return req

@app.put("/api/requests/{request_id}/deliver", response_model=schemas.PurchaseRequestResponse)
def deliver_purchase_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_store: models.Store = Depends(auth.get_current_store)
):
    req = db.query(models.PurchaseRequest).filter(models.PurchaseRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="La solicitud no existe.")
    if req.product.store_id != current_store.id:
        raise HTTPException(status_code=403, detail="No tienes permiso para modificar esta solicitud.")
    if req.status != "comprado":
        raise HTTPException(status_code=400, detail=f"La solicitud está en estado '{req.status}', solo se puede entregar si está 'comprado'.")

    req.status = "entregado"
    db.commit()
    db.refresh(req)

    req.product_name = req.product.name
    req.product_image = req.product.image_url
    req.product_price = req.product.price
    req.store_name = current_store.name
    req.store_phone = current_store.phone
    req.buyer_name = req.buyer.full_name
    req.buyer_email = req.buyer.email
    return req

@app.put("/api/requests/{request_id}/reject", response_model=schemas.PurchaseRequestResponse)
def reject_purchase_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_store: models.Store = Depends(auth.get_current_store)
):
    req = db.query(models.PurchaseRequest).filter(models.PurchaseRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="La solicitud no existe.")
    if req.product.store_id != current_store.id:
        raise HTTPException(status_code=403, detail="No tienes permiso para rechazar esta solicitud.")
    if req.status != "solicitado":
        raise HTTPException(status_code=400, detail=f"No se puede rechazar una solicitud en estado '{req.status}'.")

    req.status = "rechazado"
    db.commit()
    db.refresh(req)

    req.buyer_name = req.buyer.full_name
    req.buyer_email = req.buyer.email
    return req


# --- STORE OWNER MANAGEMENT ENDPOINTS ---

@app.get("/api/stores/me/profile", response_model=schemas.StoreResponse)
def get_my_store(
    current_store: models.Store = Depends(auth.get_current_store)
):
    return current_store

@app.put("/api/stores/me/profile", response_model=schemas.StoreResponse)
def update_my_store(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    website_url: Optional[str] = Form(None),
    instagram_url: Optional[str] = Form(None),
    facebook_url: Optional[str] = Form(None),
    twitter_url: Optional[str] = Form(None),
    logo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_store: models.Store = Depends(auth.get_current_store)
):
    # Check if another store has the same name
    existing_store = db.query(models.Store).filter(models.Store.name == name, models.Store.id != current_store.id).first()
    if existing_store:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de la tienda ya está en uso."
        )

    current_store.name = name
    current_store.description = description
    current_store.address = address
    current_store.phone = phone
    current_store.website_url = website_url
    current_store.instagram_url = instagram_url
    current_store.facebook_url = facebook_url
    current_store.twitter_url = twitter_url
    
    # Handle logo upload
    if logo:
        # Secure filename
        extension = os.path.splitext(logo.filename)[1]
        filename = f"logo_{current_store.id}{extension}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(logo.file, buffer)
            
        current_store.logo_url = f"/uploads/{filename}"
        
    db.commit()
    db.refresh(current_store)
    return current_store

# Create/Edit/Delete products for store

@app.post("/api/products/create", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    price: float = Form(...),
    stock: int = Form(0),
    category: str = Form(...),
    brand: Optional[str] = Form(None),
    color: Optional[str] = Form(None),
    size: Optional[str] = Form(None),
    specs_json: Optional[str] = Form(None), # Dynamic specs as JSON string
    image: Optional[UploadFile] = File(None),
    image_url_fallback: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_store: models.Store = Depends(auth.get_current_store)
):
    import json
    specs = {}
    if specs_json:
        try:
            specs = json.loads(specs_json)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Formato JSON de especificaciones inválido.")
            
    final_image_url = "/uploads/default_product.png"
    if image:
        # Save image file
        import uuid
        extension = os.path.splitext(image.filename)[1]
        filename = f"product_{uuid.uuid4().hex}{extension}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        final_image_url = f"/uploads/{filename}"
    elif image_url_fallback:
        final_image_url = image_url_fallback

    new_product = models.Product(
        store_id=current_store.id,
        name=name,
        description=description,
        price=price,
        stock=stock,
        category=category,
        brand=brand,
        color=color,
        size=size,
        specs=specs,
        image_url=final_image_url
    )
    
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    new_product.store_name = current_store.name
    return new_product

@app.put("/api/products/{product_id}/update", response_model=schemas.ProductResponse)
def update_product(
    product_id: int,
    name: str = Form(...),
    description: Optional[str] = Form(None),
    price: float = Form(...),
    stock: int = Form(0),
    category: str = Form(...),
    brand: Optional[str] = Form(None),
    color: Optional[str] = Form(None),
    size: Optional[str] = Form(None),
    specs_json: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    image_url_fallback: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_store: models.Store = Depends(auth.get_current_store)
):
    product = db.query(models.Product).filter(
        models.Product.id == product_id, 
        models.Product.store_id == current_store.id
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="El producto no existe en su tienda.")
        
    import json
    specs = {}
    if specs_json:
        try:
            specs = json.loads(specs_json)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Formato JSON de especificaciones inválido.")

    product.name = name
    product.description = description
    product.price = price
    product.stock = stock
    product.category = category
    product.brand = brand
    product.color = color
    product.size = size
    product.specs = specs
    
    if image:
        import uuid
        extension = os.path.splitext(image.filename)[1]
        filename = f"product_{uuid.uuid4().hex}{extension}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        product.image_url = f"/uploads/{filename}"
    elif image_url_fallback:
        product.image_url = image_url_fallback
        
    db.commit()
    db.refresh(product)
    product.store_name = current_store.name
    return product

@app.delete("/api/products/{product_id}/delete")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_store: models.Store = Depends(auth.get_current_store)
):
    product = db.query(models.Product).filter(
        models.Product.id == product_id, 
        models.Product.store_id == current_store.id
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="El producto no existe en su tienda.")
        
    db.delete(product)
    db.commit()
    return {"detail": "Producto eliminado exitosamente."}


# --- ADMINISTRATIVE ENDPOINTS ---

@app.get("/api/admin/stores", response_model=List[schemas.StoreAdminResponse])
def admin_get_stores(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin)
):
    stores = db.query(models.Store).all()
    results = []
    for store in stores:
        owner = db.query(models.User).filter(models.User.id == store.owner_id).first()
        results.append(
            schemas.StoreAdminResponse(
                id=store.id,
                owner_id=store.owner_id,
                name=store.name,
                description=store.description,
                address=store.address,
                phone=store.phone,
                website_url=store.website_url,
                instagram_url=store.instagram_url,
                facebook_url=store.facebook_url,
                twitter_url=store.twitter_url,
                logo_url=store.logo_url,
                status=store.status,
                status_reason=store.status_reason,
                rating=store.rating,
                rating_count=store.rating_count,
                owner_email=owner.email if owner else "Sin correo",
                owner_name=owner.full_name if owner else "Sin nombre"
            )
        )
    return results

@app.post("/api/admin/stores/{store_id}/approve", response_model=schemas.StoreResponse)
def admin_approve_store(
    store_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin)
):
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="La tienda no existe.")
    
    store.status = "approved"
    store.status_reason = None
    db.commit()
    db.refresh(store)
    return store

@app.post("/api/admin/stores/{store_id}/reject", response_model=schemas.StoreResponse)
def admin_reject_store(
    store_id: int,
    req: schemas.AdminActionRequest,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin)
):
    if not req.reason.strip():
        raise HTTPException(status_code=400, detail="Debe ingresar un motivo obligatorio para el rechazo.")
        
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="La tienda no existe.")
    
    store.status = "rejected"
    store.status_reason = req.reason.strip()
    db.commit()
    db.refresh(store)
    return store

@app.post("/api/admin/stores/{store_id}/delete", response_model=schemas.StoreResponse)
def admin_delete_store(
    store_id: int,
    req: schemas.AdminActionRequest,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin)
):
    if not req.reason.strip():
        raise HTTPException(status_code=400, detail="Debe ingresar un motivo obligatorio para la eliminación.")
        
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="La tienda no existe.")
    
    store.status = "deleted"
    store.status_reason = req.reason.strip()
    db.commit()
    db.refresh(store)
    return store

# --- SERVING STATIC FILES ---

# Create default assets if they do not exist
DEFAULT_LOGO_PATH = os.path.join(UPLOAD_DIR, "default_logo.png")
if not os.path.exists(DEFAULT_LOGO_PATH):
    # Create a tiny dummy image or write a text-placeholder image if needed, or we can just copy a mock or write a simple placeholder.
    # Actually, let's write a simple 1x1 pixel image bytes or let the browser fail gracefully, or write a dummy text file renamed to .png.
    # A standard 1x1 transparent png bytes:
    png_bytes = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82'
    with open(DEFAULT_LOGO_PATH, "wb") as f:
        f.write(png_bytes)

DEFAULT_PRODUCT_PATH = os.path.join(UPLOAD_DIR, "default_product.png")
if not os.path.exists(DEFAULT_PRODUCT_PATH):
    with open(DEFAULT_PRODUCT_PATH, "wb") as f:
        f.write(png_bytes)

# Mount upload directory for static product images and logos
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Mount compiled React frontend if it exists, otherwise fallback to legacy
if os.path.exists(os.path.join("frontend", "dist")):
    app.mount("/", StaticFiles(directory=os.path.join("frontend", "dist"), html=True), name="frontend")
else:
    app.mount("/", StaticFiles(directory="frontend_legacy", html=True), name="frontend")
