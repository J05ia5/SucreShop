import sys
import os
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
        
        users_data = [
            {"email": "admin@sucreshop.com", "full_name": "Administrador SucreShop", "is_store_owner": False, "is_admin": True, "password_hash": admin_password_hash},
            {"email": "gearbox@shop.com", "full_name": "Marcos GearBox", "is_store_owner": True, "is_admin": False, "password_hash": password_hash},
            {"email": "stylelab@shop.com", "full_name": "Valeria StyleLab", "is_store_owner": True, "is_admin": False, "password_hash": password_hash},
            {"email": "choco@shop.com", "full_name": "Juan ChocoDelight", "is_store_owner": True, "is_admin": False, "password_hash": password_hash},
            {"email": "ecohome@shop.com", "full_name": "Ana EcoHome", "is_store_owner": True, "is_admin": False, "password_hash": password_hash},
            {"email": "fitzone@shop.com", "full_name": "Carlos FitZone", "is_store_owner": True, "is_admin": False, "password_hash": password_hash},
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
                "logo_url": "/uploads/default_logo.png",
                "description": "Tu tienda de confianza para hardware premium, computadoras gamer y accesorios de última generación en Sucre.",
                "address": "Av. Las Américas #1024, Sucre",
                "phone": "+591 4 6451234",
                "website_url": "https://gearbox.com",
                "instagram_url": "https://instagram.com/gearbox_tech",
                "facebook_url": "https://facebook.com/gearbox_tech",
                "status": "approved",
            },
            {
                "owner_id": db_users["stylelab@shop.com"].id,
                "name": "StyleLab",
                "logo_url": "/uploads/default_logo.png",
                "description": "Prendas exclusivas, calzado deportivo y casual con el mejor estilo urbano y tallas para todos.",
                "address": "Calle Bolívar #450, Sucre",
                "phone": "+591 7 8901234",
                "instagram_url": "https://instagram.com/stylelab_bo",
                "status": "approved",
            },
            {
                "owner_id": db_users["choco@shop.com"].id,
                "name": "ChocoDelight",
                "logo_url": "/uploads/default_logo.png",
                "description": "Artesanos del chocolate en la histórica Sucre. Bombones finos, tabletas de cacao orgánico sin azúcar y café molido gourmet.",
                "address": "Plaza 25 de Mayo #12, Sucre",
                "phone": "+591 4 6423456",
                "website_url": "https://chocodelight.shop",
                "instagram_url": "https://instagram.com/chocodelight",
                "status": "approved",
            },
            {
                "owner_id": db_users["ecohome@shop.com"].id,
                "name": "EcoHome",
                "logo_url": "/uploads/default_logo.png",
                "description": "Muebles de madera sustentable, decoración minimalista y organizadores ecológicos para tu hogar.",
                "address": "Calle Destacamento 111 #78, Sucre",
                "phone": "+591 7 1234567",
                "facebook_url": "https://facebook.com/ecohome_sucre",
                "status": "approved",
            },
            {
                "owner_id": db_users["fitzone@shop.com"].id,
                "name": "FitZone",
                "logo_url": "/uploads/default_logo.png",
                "description": "Todo lo que necesitas para tu entrenamiento: pesas, mats de yoga, termos y accesorios de las mejores marcas.",
                "address": "Av. del Maestro #200, Sucre",
                "phone": "+591 7 5556677",
                "instagram_url": "https://instagram.com/fitzone_sucre",
                "status": "approved",
            },
            {
                "owner_id": db_users["chapaco@shop.com"].id,
                "name": "Sabor Chapaco",
                "logo_url": "/uploads/default_logo.png",
                "description": "Comida típica tarijeña, vinos artesanales y empanadas blanqueadas traídas directamente del sur.",
                "address": "Calle Calvo #220, Sucre",
                "phone": "+591 7 4443322",
                "status": "pending",
            },
            {
                "owner_id": db_users["pixel@shop.com"].id,
                "name": "Pixel Art Studio",
                "logo_url": "/uploads/default_logo.png",
                "description": "Cuadros pixelados, stickers de resina personalizados y arte geek para decorar tu setup.",
                "address": "Av. Hernando Siles #560, Sucre",
                "phone": "+591 7 1112233",
                "status": "rejected",
                "status_reason": "Falta subir el certificado de sanidad local o registro de comercio oficial.",
            },
            {
                "owner_id": db_users["sushi@shop.com"].id,
                "name": "SushiSucre",
                "logo_url": "/uploads/default_logo.png",
                "description": "Delicioso sushi tradicional y fusión con toques locales de ají sucrense. Calidad premium.",
                "address": "Calle España #110, Sucre",
                "phone": "+591 4 6438899",
                "status": "pending",
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
        products_data = [
            # GearBox Tech
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
                "image_url": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&auto=format&fit=crop&q=60"
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
                "image_url": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&auto=format&fit=crop&q=60"
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
                "image_url": "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500&auto=format&fit=crop&q=60"
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
                "specs": {"Cancelación Ruido": "Activa", "Batería": "30 horas", "RAM": "None"},
                "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60"
            },
            
            # StyleLab
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
                "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60"
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
                "image_url": "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=500&auto=format&fit=crop&q=60"
            },
            {
                "store_id": db_stores["StyleLab"].id,
                "name": "Camiseta Algodón Oversized StyleLab",
                "description": "Camiseta 100% algodón orgánico peinado de calce relajado y fresco. Diseño minimalista.",
                "price": 22.00,
                "stock": 25,
                "category": "Moda",
                "brand": "StyleLab",
                "color": "blanco",
                "size": "M",
                "specs": {"Material": "100% Algodón", "Corte": "Oversized"},
                "image_url": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60"
            },
            {
                "store_id": db_stores["StyleLab"].id,
                "name": "Vestido Casual Azul Elegante",
                "description": "Vestido ligero color azul marino con cinturón ajustable, perfecto para el clima cálido y reuniones semi-formales.",
                "price": 49.99,
                "stock": 0, # Out of stock for testing
                "category": "Moda",
                "brand": "StyleLab",
                "color": "azul",
                "size": "S",
                "specs": {"Material": "Lino", "Estilo": "Casual"},
                "image_url": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop&q=60"
            },
            
            # ChocoDelight
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
                "image_url": "https://images.unsplash.com/photo-1548907040-4d42b52125ca?w=500&auto=format&fit=crop&q=60"
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
                "image_url": "https://images.unsplash.com/photo-1549007994-cb92ca817bc7?w=500&auto=format&fit=crop&q=60"
            },
            {
                "store_id": db_stores["ChocoDelight"].id,
                "name": "Café de Altura Orgánico Molido",
                "description": "Café gourmet producido de forma ecológica en el norte de La Paz, tostado en Sucre. Aroma intenso.",
                "price": 9.50,
                "stock": 35,
                "category": "Comida",
                "brand": "ChocoDelight",
                "color": None,
                "size": "450g",
                "specs": {"cultivo": "orgánico", "tostado": "medio"},
                "image_url": "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&auto=format&fit=crop&q=60"
            },
            
            # EcoHome
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
                "image_url": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=60"
            },
            {
                "store_id": db_stores["EcoHome"].id,
                "name": "Mesa de Centro en Madera de Roble",
                "description": "Mesa de centro construida a mano con madera de roble reciclada. Estilo industrial-rústico.",
                "price": 145.00,
                "stock": 3,
                "category": "Hogar",
                "brand": "EcoHome",
                "color": "marrón",
                "size": "100x60cm",
                "specs": {"Material": "Roble Reciclado", "Estilo": "Rústico"},
                "image_url": "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=500&auto=format&fit=crop&q=60"
            },
            
            # FitZone
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
                "image_url": "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=500&auto=format&fit=crop&q=60"
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
                "image_url": "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=500&auto=format&fit=crop&q=60"
            },
            {
                "store_id": db_stores["FitZone"].id,
                "name": "Botella Térmica de Acero Inoxidable",
                "description": "Termo deportivo con aislamiento al vacío de doble pared que mantiene tus bebidas frías por 24 horas y calientes por 12 horas.",
                "price": 14.50,
                "stock": 25,
                "category": "Deportes",
                "brand": "Puma", # Brand mapping test
                "color": "verde",
                "size": "750ml",
                "specs": {"Capacidad": "750ml", "Material": "Acero Inoxidable 18/8"},
                "image_url": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=60"
            }
        ]
        
        for p in products_data:
            product = models.Product(**p)
            db.add(product)
            
        db.commit()
        print("-> Productos agregados con éxito.")
        print("Base de datos poblada exitosamente con todos los requerimientos.")
        
    except Exception as e:
        db.rollback()
        print(f"Error al poblar la base de datos: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
