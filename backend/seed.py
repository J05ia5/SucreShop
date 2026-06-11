import sys
import os
from datetime import datetime, timedelta
# Adjust path to import from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine
from backend import models, auth

def seed_db():
    print("Iniciando el poblado de la base de datos...")
    
    # Recreate tables to ensure clean state
    models.Base.metadata.drop_all(bind=engine)
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # 1. CREATE USERS (STORE OWNERS & ADMIN)
        password_hash = auth.get_password_hash("sucreshop2026")
        admin_password_hash = auth.get_password_hash("jdksucreshop86642")
        nuevo_admin_hash = auth.get_password_hash("admin123")
        
        users_data = [
            {"email": "admin@sucreshop.com", "full_name": "Administrador SucreShop", "is_store_owner": False, "is_admin": True, "password_hash": admin_password_hash},
            {"email": "nuevo_admin@sucreshop.com", "full_name": "Nuevo Admin", "is_store_owner": False, "is_admin": True, "password_hash": nuevo_admin_hash},
            {"email": "gearbox@shop.com", "full_name": "Marcos GearBox", "is_store_owner": True, "is_admin": False, "password_hash": password_hash},
            {"email": "stylelab@shop.com", "full_name": "Valeria StyleLab", "is_store_owner": True, "is_admin": False, "password_hash": password_hash},
            {"email": "choco@shop.com", "full_name": "Juan ChocoDelight", "is_store_owner": True, "is_admin": False, "password_hash": password_hash},
            {"email": "ecohome@shop.com", "full_name": "Ana EcoHome", "is_store_owner": True, "is_admin": False, "password_hash": password_hash},
            {"email": "fitzone@shop.com", "full_name": "Carlos FitZone", "is_store_owner": True, "is_admin": False, "password_hash": password_hash},
            {"email": "belleza@shop.com", "full_name": "María BellaVida", "is_store_owner": True, "is_admin": False, "password_hash": password_hash},
            {"email": "cliente@user.com", "full_name": "José Comprador", "is_store_owner": False, "is_admin": False, "password_hash": password_hash},
            # Pending and rejected stores owners
            {"email": "chapaco@shop.com", "full_name": "Luis Sabor Chapaco", "is_store_owner": True, "is_admin": False, "password_hash": password_hash},
            {"email": "pixel@shop.com", "full_name": "Sofia Pixel Art", "is_store_owner": True, "is_admin": False, "password_hash": password_hash},
            {"email": "sushi@shop.com", "full_name": "Kenji SushiSucre", "is_store_owner": True, "is_admin": False, "password_hash": password_hash},
        ]
        
        db_users = {}
        for u in users_data:
            user = models.User(
                email=u["email"],
                full_name=u["full_name"],
                hashed_password=u["password_hash"],
                is_store_owner=u["is_store_owner"],
                is_admin=u["is_admin"]
            )
            db.add(user)
            db.flush() # Populate user.id
            db_users[u["email"]] = user
            
        print("-> Usuarios creados con éxito.")
        
        # 2. CREATE STORES
        stores_data = [
            {
                "owner_id": db_users["gearbox@shop.com"].id,
                "name": "GearBox Tech",
                "logo_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&h=200&fit=crop&q=80",
                "description": "Tu tienda de confianza para hardware premium, computadoras gamer y accesorios de última generación en Sucre.",
                "address": "Av. Las Américas #1024, Sucre",
                "phone": "+591 4 6451234",
                "website_url": "https://gearbox.com",
                "instagram_url": "https://instagram.com/gearbox_tech",
                "facebook_url": "https://facebook.com/gearbox_tech",
                "status": "approved",
                "rating": 4.8,
                "rating_count": 127,
            },
            {
                "owner_id": db_users["stylelab@shop.com"].id,
                "name": "StyleLab",
                "logo_url": "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=200&h=200&fit=crop&q=80",
                "description": "Prendas exclusivas, calzado deportivo y casual con el mejor estilo urbano y tallas para todos.",
                "address": "Calle Bolívar #450, Sucre",
                "phone": "+591 7 8901234",
                "instagram_url": "https://instagram.com/stylelab_bo",
                "status": "approved",
                "rating": 4.5,
                "rating_count": 89,
            },
            {
                "owner_id": db_users["choco@shop.com"].id,
                "name": "ChocoDelight",
                "logo_url": "https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=200&h=200&fit=crop&q=80",
                "description": "Artesanos del chocolate en la histórica Sucre. Bombones finos, tabletas de cacao orgánico sin azúcar y café molido gourmet.",
                "address": "Plaza 25 de Mayo #12, Sucre",
                "phone": "+591 4 6423456",
                "website_url": "https://chocodelight.shop",
                "instagram_url": "https://instagram.com/chocodelight",
                "status": "approved",
                "rating": 4.9,
                "rating_count": 215,
            },
            {
                "owner_id": db_users["ecohome@shop.com"].id,
                "name": "EcoHome",
                "logo_url": "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=200&h=200&fit=crop&q=80",
                "description": "Muebles de madera sustentable, decoración minimalista y organizadores ecológicos para tu hogar.",
                "address": "Calle Destacamento 111 #78, Sucre",
                "phone": "+591 7 1234567",
                "facebook_url": "https://facebook.com/ecohome_sucre",
                "status": "approved",
                "rating": 4.3,
                "rating_count": 52,
            },
            {
                "owner_id": db_users["fitzone@shop.com"].id,
                "name": "FitZone",
                "logo_url": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&h=200&fit=crop&q=80",
                "description": "Todo lo que necesitas para tu entrenamiento: pesas, mats de yoga, termos y accesorios de las mejores marcas.",
                "address": "Av. del Maestro #200, Sucre",
                "phone": "+591 7 5556677",
                "instagram_url": "https://instagram.com/fitzone_sucre",
                "status": "approved",
                "rating": 4.6,
                "rating_count": 73,
            },
            {
                "owner_id": db_users["belleza@shop.com"].id,
                "name": "BellaVida",
                "logo_url": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&h=200&fit=crop&q=80",
                "description": "Cosméticos naturales, cuidado de la piel y maquillaje profesional con ingredientes orgánicos bolivianos.",
                "address": "Calle Arenales #88, Sucre",
                "phone": "+591 7 9998877",
                "instagram_url": "https://instagram.com/bellavida_sucre",
                "website_url": "https://bellavida.bo",
                "status": "approved",
                "rating": 4.7,
                "rating_count": 98,
            },
            {
                "owner_id": db_users["chapaco@shop.com"].id,
                "name": "Sabor Chapaco",
                "logo_url": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=200&fit=crop&q=80",
                "description": "Comida típica tarijeña, vinos artesanales y empanadas blanqueadas traídas directamente del sur.",
                "address": "Calle Calvo #220, Sucre",
                "phone": "+591 7 4443322",
                "status": "pending",
                "rating": 0.0,
                "rating_count": 0,
            },
            {
                "owner_id": db_users["pixel@shop.com"].id,
                "name": "Pixel Art Studio",
                "logo_url": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&h=200&fit=crop&q=80",
                "description": "Cuadros pixelados, stickers de resina personalizados y arte geek para decorar tu setup.",
                "address": "Av. Hernando Siles #560, Sucre",
                "phone": "+591 7 1112233",
                "status": "rejected",
                "status_reason": "Falta subir el certificado de sanidad local o registro de comercio oficial.",
                "rating": 0.0,
                "rating_count": 0,
            },
            {
                "owner_id": db_users["sushi@shop.com"].id,
                "name": "SushiSucre",
                "logo_url": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200&h=200&fit=crop&q=80",
                "description": "Delicioso sushi tradicional y fusión con toques locales de ají sucrense. Calidad premium.",
                "address": "Calle España #110, Sucre",
                "phone": "+591 4 6438899",
                "status": "pending",
                "rating": 0.0,
                "rating_count": 0,
            }
        ]
        
        db_stores = {}
        for s in stores_data:
            store = models.Store(**s)
            db.add(store)
            db.flush()
            db_stores[s["name"]] = store
            
        print("-> Tiendas creadas con éxito.")
        
        # 3. CREATE PRODUCTS
        now = datetime.utcnow()
        products_data = [
            # ============================================================
            # GEARBOX TECH — Tecnología (7 products)
            # ============================================================
            {
                "store_id": db_stores["GearBox Tech"].id,
                "name": "Laptop Gamer Asus ROG Zephyrus",
                "description": "Portátil de alta gama con procesador AMD Ryzen 9, ideal para gaming pesado y renderizado 3D profesional.",
                "price": 1499.00,
                "stock": 4,
                "category": "Tecnología",
                "brand": "Asus",
                "color": "negro",
                "size": None,
                "specs": {"RAM": "16GB", "Disco": "SSD", "Almacenamiento": "1TB SSD", "Tarjeta Video": "RTX 4070"},
                "image_url": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&auto=format&fit=crop&q=60",
                "created_at": now - timedelta(days=2),
                "sales_count": 8,
                "rating": 4.9,
                "rating_count": 15
            },
            {
                "store_id": db_stores["GearBox Tech"].id,
                "name": "Celular Samsung Galaxy S24 Ultra",
                "description": "El smartphone insignia de Samsung con pantalla Dynamic AMOLED, cámara de 200MP y procesador Snapdragon 8 Gen 3.",
                "price": 1199.00,
                "stock": 7,
                "category": "Tecnología",
                "brand": "Samsung",
                "color": "gris",
                "size": None,
                "specs": {"RAM": "12GB", "Almacenamiento": "512GB SSD", "Pantalla": "6.8 pulgadas"},
                "image_url": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&auto=format&fit=crop&q=60",
                "created_at": now - timedelta(days=5),
                "sales_count": 12,
                "rating": 4.7,
                "rating_count": 22
            },
            {
                "store_id": db_stores["GearBox Tech"].id,
                "name": "Teclado Mecánico Razer BlackWidow V4",
                "description": "Teclado mecánico con switches táctiles amarillos Razer y retroiluminación RGB de alta definición.",
                "price": 169.50,
                "stock": 12,
                "category": "Tecnología",
                "brand": "Razer",
                "color": "negro",
                "size": None,
                "specs": {"Switches": "Razer Yellow", "Teclado": "Mecánico", "RGB": "Chroma"},
                "image_url": "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500&auto=format&fit=crop&q=60",
                "created_at": now - timedelta(days=10),
                "sales_count": 25,
                "rating": 4.5,
                "rating_count": 18
            },
            {
                "store_id": db_stores["GearBox Tech"].id,
                "name": "Audífonos Inalámbricos Sony WH-1000XM5",
                "description": "Auriculares supraaurales premium con la mejor cancelación activa de ruido del mercado y sonido de alta fidelidad.",
                "price": 349.00,
                "stock": 10,
                "category": "Tecnología",
                "brand": "Sony",
                "color": "negro",
                "size": None,
                "specs": {"Cancelación Ruido": "Activa", "Batería": "30 horas"},
                "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60",
                "created_at": now - timedelta(days=1),
                "sales_count": 18,
                "rating": 4.8,
                "rating_count": 30
            },
            {
                "store_id": db_stores["GearBox Tech"].id,
                "name": "Monitor Curvo LG UltraGear 27\"",
                "description": "Monitor gaming QHD de 27 pulgadas con panel VA curvo, 165Hz de tasa de refresco y 1ms de tiempo de respuesta.",
                "price": 389.00,
                "stock": 5,
                "category": "Tecnología",
                "brand": "LG",
                "color": "negro",
                "size": "27 pulgadas",
                "specs": {"Resolución": "2560x1440", "Refresco": "165Hz", "Panel": "VA Curvo"},
                "image_url": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60",
                "created_at": now - timedelta(days=3),
                "sales_count": 9,
                "rating": 4.6,
                "rating_count": 14
            },
            {
                "store_id": db_stores["GearBox Tech"].id,
                "name": "Mouse Gaming Logitech G Pro X Superlight",
                "description": "Ratón inalámbrico ultraligero de 63 gramos con sensor HERO 25K para precisión profesional en esports.",
                "price": 129.00,
                "stock": 18,
                "category": "Tecnología",
                "brand": "Logitech",
                "color": "blanco",
                "size": None,
                "specs": {"Sensor": "HERO 25K", "Peso": "63g", "Batería": "70 horas"},
                "image_url": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&auto=format&fit=crop&q=60",
                "created_at": now - timedelta(days=7),
                "sales_count": 32,
                "rating": 4.7,
                "rating_count": 28
            },
            {
                "store_id": db_stores["GearBox Tech"].id,
                "name": "Webcam Logitech Brio 4K",
                "description": "Cámara web profesional con resolución 4K Ultra HD, HDR y corrección automática de iluminación.",
                "price": 199.00,
                "stock": 8,
                "category": "Tecnología",
                "brand": "Logitech",
                "color": "negro",
                "size": None,
                "specs": {"Resolución": "4K UHD", "FPS": "90fps en 1080p", "HDR": "Sí"},
                "image_url": "https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=500&auto=format&fit=crop&q=60",
                "created_at": now - timedelta(days=4),
                "sales_count": 15,
                "rating": 4.4,
                "rating_count": 11
            },

            # ============================================================
            # STYLELAB — Moda (7 products)
            # ============================================================
            {
                "store_id": db_stores["StyleLab"].id,
                "name": "Zapatillas Deportivas Nike Air Max",
                "description": "Zapatillas de correr Nike clásicas con amortiguación de aire ultra cómoda, ideales para running y estilo de vida activo.",
                "price": 110.00,
                "stock": 8,
                "category": "Moda",
                "brand": "Nike",
                "color": "rojo",
                "size": "42",
                "specs": {"Deporte": "Running", "Ajuste": "Cordones"},
                "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60",
                "created_at": now - timedelta(days=8),
                "sales_count": 35,
                "rating": 4.6,
                "rating_count": 45
            },
            {
                "store_id": db_stores["StyleLab"].id,
                "name": "Zapatillas Deportivas Adidas Ultraboost",
                "description": "Calzado premium Adidas con suela Boost de retorno de energía y ajuste de calcetín Primeknit.",
                "price": 160.00,
                "stock": 5,
                "category": "Moda",
                "brand": "Adidas",
                "color": "negro",
                "size": "40",
                "specs": {"Deporte": "Running", "Estilo": "Urbano"},
                "image_url": "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=500&auto=format&fit=crop&q=60",
                "created_at": now - timedelta(days=12),
                "sales_count": 22,
                "rating": 4.8,
                "rating_count": 25
            },
            {
                "store_id": db_stores["StyleLab"].id,
                "name": "Camiseta Algodón Oversized StyleLab",
                "description": "Camiseta 100% algodón orgánico peinado de calce relajado y fresco. Diseño minimalista premium.",
                "price": 22.00,
                "stock": 25,
                "category": "Moda",
                "brand": "StyleLab",
                "color": "blanco",
                "size": "M",
                "specs": {"Material": "100% Algodón", "Corte": "Oversized"},
                "image_url": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format&fit=crop&q=60",
                "created_at": now - timedelta(days=4),
                "sales_count": 50,
                "rating": 4.2,
                "rating_count": 12
            },
            {
                "store_id": db_stores["StyleLab"].id,
                "name": "Vestido Casual Azul Elegante",
                "description": "Vestido ligero color azul marino con cinturón ajustable, perfecto para el clima cálido y reuniones semi-formales.",
                "price": 49.99,
                "stock": 0,
                "category": "Moda",
                "brand": "StyleLab",
                "color": "azul",
                "size": "S",
                "specs": {"Material": "Lino", "Estilo": "Casual"},
                "image_url": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop&q=60",
                "created_at": now - timedelta(days=15),
                "sales_count": 18,
                "rating": 4.3,
                "rating_count": 9
            },
            {
                "store_id": db_stores["StyleLab"].id,
                "name": "Mochila Urbana de Cuero Sintético",
                "description": "Mochila premium de cuero sintético vegano con compartimento acolchado para laptop de hasta 15.6 pulgadas.",
                "price": 65.00,
                "stock": 12,
                "category": "Moda",
                "brand": "StyleLab",
                "color": "marrón",
                "size": None,
                "specs": {"Material": "Cuero Sintético", "Capacidad": "22L", "Laptop": "Hasta 15.6\""},
                "image_url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=60",
                "created_at": now - timedelta(days=6),
                "sales_count": 27,
                "rating": 4.5,
                "rating_count": 19
            },
            {
                "store_id": db_stores["StyleLab"].id,
                "name": "Gafas de Sol Polarizadas Premium",
                "description": "Lentes de sol con protección UV400 y cristales polarizados anti-reflejos. Montura ultraligera de acetato.",
                "price": 38.00,
                "stock": 20,
                "category": "Moda",
                "brand": "StyleLab",
                "color": "negro",
                "size": None,
                "specs": {"Protección": "UV400", "Cristal": "Polarizado", "Montura": "Acetato"},
                "image_url": "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&auto=format&fit=crop&q=60",
                "created_at": now - timedelta(days=2),
                "sales_count": 41,
                "rating": 4.4,
                "rating_count": 33
            },
            {
                "store_id": db_stores["StyleLab"].id,
                "name": "Reloj Analógico Minimalista Clásico",
                "description": "Reloj de pulsera con diseño danés minimalista, correa de malla de acero y movimiento de cuarzo japonés.",
                "price": 89.00,
                "stock": 6,
                "category": "Moda",
                "brand": "StyleLab",
                "color": "plateado",
                "size": "40mm",
                "specs": {"Movimiento": "Cuarzo Japonés", "Cristal": "Zafiro", "Resistencia": "5 ATM"},
                "image_url": "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500&auto=format&fit=crop&q=60",
                "created_at": now - timedelta(days=9),
                "sales_count": 14,
                "rating": 4.7,
                "rating_count": 16
            },

            # ============================================================
            # CHOCODELIGHT — Comida (6 products)
            # ============================================================
            {
                "store_id": db_stores["ChocoDelight"].id,
                "name": "Chocolate Amargo 70% Cacao",
                "description": "Tableta artesanal de chocolate elaborado con cacao orgánico selecto. Sin azúcares añadidos, endulzado con stevia.",
                "price": 4.50,
                "stock": 60,
                "category": "Comida",
                "brand": "ChocoDelight",
                "color": "marrón",
                "size": "100g",
                "specs": {"azúcar": "sin azúcar", "tipo": "amargo", "cultivo": "orgánico"},
                "image_url": "https://images.unsplash.com/photo-1548907040-4d42b52125ca?w=500&auto=format&fit=crop&q=60",
                "created_at": now - timedelta(days=20),
                "sales_count": 120,
                "rating": 4.9,
                "rating_count": 85
            },
            {
                "store_id": db_stores["ChocoDelight"].id,
                "name": "Caja de Bombones Surtidos Finos",
                "description": "Selección de 12 bombones rellenos con sabores exóticos de Bolivia: maracuyá, locoto, menta y café.",
                "price": 18.00,
                "stock": 20,
                "category": "Comida",
                "brand": "ChocoDelight",
                "color": None,
                "size": "250g",
                "specs": {"tipo": "bombones", "relleno": "surtido"},
                "image_url": "https://images.unsplash.com/photo-1549007994-cb92ca817bc7?w=500&auto=format&fit=crop&q=60",
                "created_at": now - timedelta(days=3),
                "sales_count": 40,
                "rating": 4.7,
                "rating_count": 32
            },
            {
                "store_id": db_stores["ChocoDelight"].id,
                "name": "Café de Altura Orgánico Molido",
                "description": "Café gourmet producido de forma ecológica en el norte de La Paz, tostado artesanalmente en Sucre. Aroma intenso.",
                "price": 9.50,
                "stock": 35,
                "category": "Comida",
                "brand": "ChocoDelight",
                "color": None,
                "size": "450g",
                "specs": {"cultivo": "orgánico", "tostado": "medio"},
                "image_url": "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&auto=format&fit=crop&q=60",
                "created_at": now - timedelta(days=6),
                "sales_count": 75,
                "rating": 4.8,
                "rating_count": 40
            },
            {
                "store_id": db_stores["ChocoDelight"].id,
                "name": "Chocolate con Leche y Almendras",
                "description": "Tableta de chocolate cremoso con trozos de almendras tostadas. Elaboración artesanal con leche fresca de la región.",
                "price": 5.50,
                "stock": 45,
                "category": "Comida",
                "brand": "ChocoDelight",
                "color": "marrón",
                "size": "120g",
                "specs": {"tipo": "con leche", "relleno": "almendras", "cultivo": "orgánico"},
                "image_url": "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=500&auto=format&fit=crop&q=60",
                "created_at": now - timedelta(days=8),
                "sales_count": 88,
                "rating": 4.6,
                "rating_count": 55
            },
            {
                "store_id": db_stores["ChocoDelight"].id,
                "name": "Té de Hoja de Coca Premium",
                "description": "Infusión natural de hojas de coca seleccionadas de los Yungas. Energizante, digestivo y perfecto para combatir el soroche.",
                "price": 3.50,
                "stock": 80,
                "category": "Comida",
                "brand": "ChocoDelight",
                "color": "verde",
                "size": "50 bolsitas",
                "specs": {"tipo": "infusión", "origen": "Yungas", "orgánico": "sí"},
                "image_url": "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop&q=60",
                "created_at": now - timedelta(days=11),
                "sales_count": 150,
                "rating": 4.8,
                "rating_count": 92
            },
            {
                "store_id": db_stores["ChocoDelight"].id,
                "name": "Mermelada Artesanal de Tumbo",
                "description": "Mermelada casera hecha con tumbo fresco (banana passion fruit) de los valles de Chuquisaca. Sin conservantes.",
                "price": 6.00,
                "stock": 30,
                "category": "Comida",
                "brand": "ChocoDelight",
                "color": None,
                "size": "350g",
                "specs": {"sabor": "tumbo", "conservantes": "sin conservantes"},
                "image_url": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&auto=format&fit=crop&q=60",
                "created_at": now - timedelta(days=14),
                "sales_count": 35,
                "rating": 4.5,
                "rating_count": 20
            },

            # ============================================================
            # ECOHOME — Hogar (5 products)
            # ============================================================
            {
                "store_id": db_stores["EcoHome"].id,
                "name": "Lámpara de Mesa de Bambú Ecológica",
                "description": "Lámpara artesanal fabricada con bambú recolectado de forma sostenible. Emite una luz cálida y relajante.",
                "price": 28.00,
                "stock": 10,
                "category": "Hogar",
                "brand": "EcoHome",
                "color": "marrón",
                "size": "Mediano",
                "specs": {"Material": "Bambú", "Luz": "Cálida (LED)"},
                "image_url": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=60",
                "created_at": now - timedelta(days=11),
                "sales_count": 6,
                "rating": 4.4,
                "rating_count": 5
            },
            {
                "store_id": db_stores["EcoHome"].id,
                "name": "Mesa de Centro en Madera de Roble",
                "description": "Mesa de centro construida a mano con madera de roble reciclada. Estilo industrial-rústico que transforma cualquier sala.",
                "price": 145.00,
                "stock": 3,
                "category": "Hogar",
                "brand": "EcoHome",
                "color": "marrón",
                "size": "100x60cm",
                "specs": {"Material": "Roble Reciclado", "Estilo": "Rústico"},
                "image_url": "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=500&auto=format&fit=crop&q=60",
                "created_at": now - timedelta(days=14),
                "sales_count": 2,
                "rating": 5.0,
                "rating_count": 2
            },
            {
                "store_id": db_stores["EcoHome"].id,
                "name": "Set de Macetas de Cerámica (x3)",
                "description": "Juego de 3 macetas de cerámica esmaltada en tonos terrosos. Ideales para suculentas y plantas de interior.",
                "price": 24.00,
                "stock": 15,
                "category": "Hogar",
                "brand": "EcoHome",
                "color": "terracota",
                "size": "S/M/L",
                "specs": {"Material": "Cerámica", "Cantidad": "3 piezas", "Drenaje": "Con agujero"},
                "image_url": "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500&auto=format&fit=crop&q=60",
                "created_at": now - timedelta(days=5),
                "sales_count": 19,
                "rating": 4.6,
                "rating_count": 13
            },
            {
                "store_id": db_stores["EcoHome"].id,
                "name": "Vela Aromática de Soja Artesanal",
                "description": "Vela ecológica de cera de soja con aroma de lavanda y eucalipto. Duración aproximada de 45 horas.",
                "price": 12.00,
                "stock": 30,
                "category": "Hogar",
                "brand": "EcoHome",
                "color": "blanco",
                "size": "250g",
                "specs": {"Cera": "Soja", "Aroma": "Lavanda y Eucalipto", "Duración": "45 horas"},
                "image_url": "https://images.unsplash.com/photo-1602607650824-80d3232501e4?w=500&auto=format&fit=crop&q=60",
                "created_at": now - timedelta(days=2),
                "sales_count": 42,
                "rating": 4.7,
                "rating_count": 28
            },
            {
                "store_id": db_stores["EcoHome"].id,
                "name": "Estante Flotante de Pino Reciclado",
                "description": "Estante de pared minimalista fabricado con madera de pino reciclada y herrajes invisibles incluidos.",
                "price": 35.00,
                "stock": 8,
                "category": "Hogar",
                "brand": "EcoHome",
                "color": "marrón",
                "size": "60x20cm",
                "specs": {"Material": "Pino Reciclado", "Capacidad": "10kg", "Montaje": "Incluido"},
                "image_url": "https://images.unsplash.com/photo-1532372576444-dda954194ad0?w=500&auto=format&fit=crop&q=60",
                "created_at": now - timedelta(days=16),
                "sales_count": 11,
                "rating": 4.3,
                "rating_count": 7
            },

            # ============================================================
            # FITZONE — Deportes (6 products)
            # ============================================================
            {
                "store_id": db_stores["FitZone"].id,
                "name": "Mancuernas Ajustables de Hierro (Par)",
                "description": "Juego de pesas ajustables con discos intercambiables hasta completar un peso total de 20 kg por barra.",
                "price": 85.00,
                "stock": 6,
                "category": "Deportes",
                "brand": "FitZone",
                "color": "negro",
                "size": "20kg",
                "specs": {"Peso": "20kg", "Material": "Hierro Fundido"},
                "image_url": "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=500&auto=format&fit=crop&q=60",
                "created_at": now - timedelta(days=7),
                "sales_count": 14,
                "rating": 4.5,
                "rating_count": 10
            },
            {
                "store_id": db_stores["FitZone"].id,
                "name": "Tapete de Yoga Antideslizante (Mat)",
                "description": "Tapete de entrenamiento ecológico antideslizante con guías de alineación para tus posturas de yoga o pilates.",
                "price": 19.90,
                "stock": 15,
                "category": "Deportes",
                "brand": "FitZone",
                "color": "azul",
                "size": "6mm",
                "specs": {"Espesor": "6mm", "Material": "TPE Ecológico"},
                "image_url": "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=500&auto=format&fit=crop&q=60",
                "created_at": now - timedelta(days=9),
                "sales_count": 29,
                "rating": 4.3,
                "rating_count": 15
            },
            {
                "store_id": db_stores["FitZone"].id,
                "name": "Botella Térmica de Acero Inoxidable",
                "description": "Termo deportivo con aislamiento al vacío de doble pared. Mantiene frío 24h y caliente 12h.",
                "price": 14.50,
                "stock": 25,
                "category": "Deportes",
                "brand": "Puma",
                "color": "verde",
                "size": "750ml",
                "specs": {"Capacidad": "750ml", "Material": "Acero Inoxidable 18/8"},
                "image_url": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=60",
                "created_at": now - timedelta(days=13),
                "sales_count": 55,
                "rating": 4.6,
                "rating_count": 20
            },
            {
                "store_id": db_stores["FitZone"].id,
                "name": "Banda Elástica de Resistencia (Set x5)",
                "description": "Kit de 5 bandas elásticas de látex natural con diferentes niveles de resistencia. Incluye bolsa de transporte.",
                "price": 12.00,
                "stock": 40,
                "category": "Deportes",
                "brand": "FitZone",
                "color": "multicolor",
                "size": None,
                "specs": {"Niveles": "5 resistencias", "Material": "Látex Natural", "Incluye": "Bolsa"},
                "image_url": "https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=500&auto=format&fit=crop&q=60",
                "created_at": now - timedelta(days=3),
                "sales_count": 67,
                "rating": 4.4,
                "rating_count": 38
            },
            {
                "store_id": db_stores["FitZone"].id,
                "name": "Cuerda de Saltar Profesional con Contador",
                "description": "Cuerda de saltar con rodamientos de bola, mango ergonómico antideslizante y contador digital integrado.",
                "price": 8.50,
                "stock": 35,
                "category": "Deportes",
                "brand": "FitZone",
                "color": "negro",
                "size": None,
                "specs": {"Longitud": "Ajustable 3m", "Contador": "Digital", "Rodamientos": "Doble bola"},
                "image_url": "https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=500&auto=format&fit=crop&q=60",
                "created_at": now - timedelta(days=18),
                "sales_count": 48,
                "rating": 4.2,
                "rating_count": 22
            },
            {
                "store_id": db_stores["FitZone"].id,
                "name": "Guantes de Entrenamiento Pro",
                "description": "Guantes de gimnasio con protección de palma reforzada, muñequera ajustable y ventilación de malla transpirable.",
                "price": 15.00,
                "stock": 20,
                "category": "Deportes",
                "brand": "Nike",
                "color": "negro",
                "size": "L",
                "specs": {"Material": "Microfibra", "Protección": "Palma reforzada", "Cierre": "Velcro"},
                "image_url": "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=500&auto=format&fit=crop&q=60",
                "created_at": now - timedelta(days=10),
                "sales_count": 23,
                "rating": 4.5,
                "rating_count": 17
            },

            # ============================================================
            # BELLAVIDA — Belleza (6 products)
            # ============================================================
            {
                "store_id": db_stores["BellaVida"].id,
                "name": "Sérum Facial de Vitamina C",
                "description": "Sérum concentrado al 20% de vitamina C pura con ácido hialurónico. Ilumina, hidrata y reduce manchas.",
                "price": 22.00,
                "stock": 25,
                "category": "Belleza",
                "brand": "BellaVida",
                "color": None,
                "size": "30ml",
                "specs": {"Concentración": "20% Vitamina C", "Ingrediente": "Ácido Hialurónico", "Tipo Piel": "Todo tipo"},
                "image_url": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&auto=format&fit=crop&q=60",
                "created_at": now - timedelta(days=4),
                "sales_count": 62,
                "rating": 4.8,
                "rating_count": 47
            },
            {
                "store_id": db_stores["BellaVida"].id,
                "name": "Crema Hidratante de Quinua Orgánica",
                "description": "Crema facial nutritiva con extracto de quinua real boliviana y manteca de karité. Hidratación profunda 24h.",
                "price": 18.50,
                "stock": 20,
                "category": "Belleza",
                "brand": "BellaVida",
                "color": None,
                "size": "50ml",
                "specs": {"Ingrediente": "Quinua Real", "Hidratación": "24 horas", "Tipo Piel": "Seca/Mixta"},
                "image_url": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500&auto=format&fit=crop&q=60",
                "created_at": now - timedelta(days=7),
                "sales_count": 45,
                "rating": 4.7,
                "rating_count": 35
            },
            {
                "store_id": db_stores["BellaVida"].id,
                "name": "Paleta de Sombras Sunset 12 Tonos",
                "description": "Paleta profesional de maquillaje con 12 tonos cálidos entre mates y shimmer. Pigmentación de larga duración.",
                "price": 28.00,
                "stock": 15,
                "category": "Belleza",
                "brand": "BellaVida",
                "color": "multicolor",
                "size": None,
                "specs": {"Tonos": "12", "Acabado": "Mate y Shimmer", "Duración": "12 horas"},
                "image_url": "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500&auto=format&fit=crop&q=60",
                "created_at": now - timedelta(days=1),
                "sales_count": 38,
                "rating": 4.6,
                "rating_count": 29
            },
            {
                "store_id": db_stores["BellaVida"].id,
                "name": "Aceite de Rosa Mosqueta Puro",
                "description": "Aceite prensado en frío 100% puro de rosa mosqueta. Regenera cicatrices, estrías y nutre la piel en profundidad.",
                "price": 14.00,
                "stock": 30,
                "category": "Belleza",
                "brand": "BellaVida",
                "color": None,
                "size": "30ml",
                "specs": {"Pureza": "100%", "Extracción": "Prensado en frío", "Uso": "Facial y corporal"},
                "image_url": "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&auto=format&fit=crop&q=60",
                "created_at": now - timedelta(days=12),
                "sales_count": 55,
                "rating": 4.9,
                "rating_count": 42
            },
            {
                "store_id": db_stores["BellaVida"].id,
                "name": "Set de Brochas de Maquillaje Profesional",
                "description": "Kit de 12 brochas con cerdas sintéticas ultra suaves y mangos de bambú ecológico. Incluye estuche enrollable.",
                "price": 35.00,
                "stock": 10,
                "category": "Belleza",
                "brand": "BellaVida",
                "color": "rosa",
                "size": None,
                "specs": {"Cantidad": "12 brochas", "Cerda": "Sintética", "Mango": "Bambú"},
                "image_url": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&auto=format&fit=crop&q=60",
                "created_at": now - timedelta(days=6),
                "sales_count": 31,
                "rating": 4.5,
                "rating_count": 24
            },
            {
                "store_id": db_stores["BellaVida"].id,
                "name": "Labial Mate Larga Duración Rojo Cereza",
                "description": "Labial líquido con fórmula mate aterciopelada y fijación de hasta 16 horas. Enriquecido con vitamina E.",
                "price": 9.50,
                "stock": 40,
                "category": "Belleza",
                "brand": "BellaVida",
                "color": "rojo",
                "size": None,
                "specs": {"Acabado": "Mate", "Duración": "16 horas", "Ingrediente": "Vitamina E"},
                "image_url": "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500&auto=format&fit=crop&q=60",
                "created_at": now - timedelta(days=3),
                "sales_count": 73,
                "rating": 4.4,
                "rating_count": 51
            },
        ]
        
        for p in products_data:
            product = models.Product(**p)
            db.add(product)
            
        db.commit()
        
        total_products = len(products_data)
        total_stores = len([s for s in stores_data if s["status"] == "approved"])
        print(f"-> {total_products} productos agregados en {total_stores} tiendas aprobadas.")
        print("Base de datos poblada exitosamente con todos los requerimientos.")
        
    except Exception as e:
        db.rollback()
        print(f"Error al poblar la base de datos: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
