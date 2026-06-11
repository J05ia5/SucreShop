import re
import os
import json
from typing import Dict, Any, List

import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY and GEMINI_API_KEY != "tu_api_key_de_gemini_aqui":
    genai.configure(api_key=GEMINI_API_KEY)
else:
    GEMINI_API_KEY = None

# Categories configured in SucreShop
CATEGORIES = {
    "Tecnología": [
        "celular", "telefono", "computadora", "computador", "laptop", "notebook", "pc", 
        "tablet", "pantalla", "televisor", "tv", "audifono", "auricular", "parlante", 
        "camara", "reloj inteligente", "smartwatch", "gadget", "consola", "nintendo", 
        "playstation", "xbox", "gamer", "teclado", "mouse", "ram", "memoria", "procesador", "ssd"
    ],
    "Moda": [
        "ropa", "vestido", "pantalon", "jeans", "camisa", "camiseta", "polera", "chamarra", 
        "abrigo", "zapato", "zapatilla", "tenis", "bota", "sandalia", "taco", "falda", 
        "blusa", "calcetin", "sombrero", "gorra", "moda", "estilo", "cartera", "bolso"
    ],
    "Comida": [
        "chocolate", "dulce", "pastel", "cafe", "te", "comida", "snack", "postre", 
        "bebida", "pan", "galleta", "saludable", "organico", "azucar", "sin azucar", 
        "amargo", "delicia", "restaurante", "alimento", "cacao"
    ],
    "Hogar": [
        "mueble", "sofa", "mesa", "silla", "cama", "colchon", "decoracion", "lampara", 
        "espejo", "alfombra", "cocina", "plato", "taza", "licuadora", "microondas", 
        "organizador", "jardin", "planta", "sabana", "almohada"
    ],
    "Deportes": [
        "balon", "pelota", "pesas", "mancuernas", "cinta", "ejercicio", "gimnasio", 
        "gym", "deporte", "bicicleta", "casco", "termo", "mochila", "yoga", "mat", 
        "raqueta", "running", "correr", "entrenar"
    ],
    "Belleza": [
        "maquillaje", "crema", "perfume", "labial", "mascara", "skincare", "piel", 
        "cabello", "shampoo", "acondicionador", "esmalte", "suero", "locion", "facial", 
        "corporal", "estetica", "cosmetico"
    ]
}

BRANDS = [
    "nike", "adidas", "puma", "under armour", "apple", "samsung", "xiaomi", "dell", 
    "hp", "lenovo", "asus", "nestle", "chocodelight", "stylelab", "gearbox", "ecohome", 
    "ikea", "sony", "bose", "rolex", "casio"
]

COLORS = [
    "rojo", "roja", "rojos", "rojas", "azul", "azules", "verde", "verdes", "negro", 
    "negra", "negros", "negras", "blanco", "blanca", "blancos", "blancas", "amarillo", 
    "gris", "rosa", "marron", "cafe"
]

SIZES = ["xs", "s", "m", "l", "xl", "xxl"]

def normalize_text(text: str) -> str:
    """Removes accents and converts to lowercase."""
    if not text:
        return ""
    text = text.lower()
    replacements = {
        "á": "a", "é": "e", "í": "i", "ó": "o", "ú": "u",
        "ü": "u", "ñ": "ñ"
    }
    for orig, rep in replacements.items():
        text = text.replace(orig, rep)
    return text

def parse_query_legacy(raw_query: str) -> Dict[str, Any]:
    query = normalize_text(raw_query)
    
    # 1. Detect Category
    detected_category = None
    category_scores = {cat: 0 for cat in CATEGORIES}
    
    for cat, keywords in CATEGORIES.items():
        for kw in keywords:
            pattern = r'\b' + re.escape(kw) + r'\w*\b'
            matches = re.findall(pattern, query)
            category_scores[cat] += len(matches)
            
    max_score = max(category_scores.values())
    if max_score > 0:
        detected_category = [cat for cat, score in category_scores.items() if score == max_score][0]

    # 2. Detect Brand
    detected_brand = None
    for brand in BRANDS:
        pattern = r'\b' + re.escape(brand) + r'\b'
        if re.search(pattern, query):
            detected_brand = brand.title()
            break

    # 3. Detect Colors
    detected_color = None
    for color in COLORS:
        pattern = r'\b' + re.escape(color) + r'\b'
        if re.search(pattern, query):
            if color in ["roja", "rojos", "rojas"]:
                detected_color = "rojo"
            elif color in ["negra", "negros", "negras"]:
                detected_color = "negro"
            elif color in ["blanca", "blancos", "blancas"]:
                detected_color = "blanco"
            else:
                detected_color = color
            break

    # 4. Detect Sizes
    detected_size = None
    talla_match = re.search(r'\btalla\s+([a-zA-Z0-9\-]+)\b', query)
    if talla_match:
        detected_size = talla_match.group(1).upper()
    else:
        for size in SIZES:
            pattern = r'\b' + re.escape(size) + r'\b'
            if re.search(pattern, query):
                detected_size = size.upper()
                break
        
        # Shoe sizes detection if Moda or shoe terms exist
        if detected_category == "Moda" or any(kw in query for kw in ["zapato", "zapatilla", "tenis", "bota", "sandalia"]):
            num_match = re.search(r'\b(3[4-9]|4[0-6])\b', query)
            if num_match:
                detected_size = num_match.group(1)

    # 5. Detect Prices
    max_price = None
    min_price = None
    
    max_price_match = re.search(
        r'(?:menos\s+de|bajo|hasta|maximo|menor\s+a|por\s+debajo\s+de|limit\s+de)\s*(?:\$|usd)?\s*(\d+(?:\.\d+)?)', 
        query
    )
    if max_price_match:
        max_price = float(max_price_match.group(1))
        
    min_price_match = re.search(
        r'(?:mas\s+de|sobre|minimo|mayor\s+a|por\s+encima\s+de)\s*(?:\$|usd)?\s*(\d+(?:\.\d+)?)', 
        query
    )
    if min_price_match:
        min_price = float(min_price_match.group(1))

    is_budget = False
    if any(kw in query for kw in ["barato", "barata", "economico", "economica", "oferta", "descuento", "precio bajo"]):
        is_budget = True

    # 6. Detect Stock / Availability
    in_stock_only = False
    if any(kw in query for kw in ["en stock", "disponible", "disponibles", "inmediato", "inmediata", "hay", "existencia"]):
        in_stock_only = True

    # 7. Specs parsing (category specific)
    specs = {}
    
    # RAM check
    ram_match = re.search(r'\b(\d+)\s*(?:gb|gigas)\s*de?\s*ram\b|\bram\s*(?:de)?\s*(\d+)\s*(?:gb|gigas)\b|\b(\d+)\s*gb\s*ram\b', query)
    if ram_match:
        ram_val = next(val for val in ram_match.groups() if val is not None)
        specs["RAM"] = f"{ram_val}GB"
        detected_category = "Tecnología"
    else:
        # Check standalone memory number (like "16gb")
        mem_match = re.search(r'\b(\d+)\s*gb\b', query)
        # Avoid size matches or other checks
        if mem_match and not (detected_category == "Moda" and mem_match.group(1) in ["38", "40", "42"]):
            specs["RAM"] = f"{mem_match.group(1)}GB"
            detected_category = "Tecnología"

    # SSD or hard drive
    if "ssd" in query or "disco solido" in query:
        specs["Disco"] = "SSD"
        detected_category = "Tecnología"
    elif "hdd" in query or "disco duro" in query:
        specs["Disco"] = "HDD"
        detected_category = "Tecnología"

    # Food restrictions
    if any(kw in query for kw in ["sin azucar", "sugar free", "libre de azucar", "0 azucar"]):
        specs["azúcar"] = "sin azúcar"
        detected_category = "Comida"
    elif any(kw in query for kw in ["amargo", "dark", "negro amargo"]):
        specs["tipo"] = "amargo"
        detected_category = "Comida"
    elif any(kw in query for kw in ["organico", "organic", "ecologico"]):
        specs["cultivo"] = "orgánico"
        detected_category = "Comida"

    # 7.5. Detect Sorting Intent
    sort_by = None
    query_norm = normalize_text(raw_query)
    if any(kw in query_norm for kw in ["reciente", "recientes", "nuevo", "nuevos", "nueva", "nuevas", "ultimo", "ultimos", "ultima", "ultimas", "publicacion", "creado", "creados"]):
        sort_by = "recent"
    elif any(kw in query_norm for kw in ["mas vendido", "mas vendidos", "mas comprado", "mas comprados", "vendido", "vendidos", "comprado", "comprados", "popular", "populares", "ventas"]):
        sort_by = "most_purchased"
    elif any(kw in query_norm for kw in ["mejor calificado", "mejor calificados", "mejor valorado", "mejor valorados", "mejor calificada", "mejor calificadas", "puntuacion", "estrellas", "estrella", "calificacion", "calificaciones"]):
        sort_by = "best_rated"
    elif any(kw in query_norm for kw in ["barato", "baratos", "barata", "baratas", "economico", "economicos", "economica", "economicas", "precio bajo", "precios bajos", "menor precio", "menores precios"]):
        sort_by = "price_asc"
    elif any(kw in query_norm for kw in ["caro", "caros", "cara", "caras", "costoso", "costosos", "costosa", "costosas", "mayor precio", "mayores precios", "precio alto", "precios altos"]):
        sort_by = "price_desc"

    # 8. Build Explanation
    explanations = []
    if detected_category:
        explanations.append(f"categoría **{detected_category}**")
    if detected_brand:
        explanations.append(f"marca **{detected_brand}**")
    if detected_color:
        explanations.append(f"color **{detected_color}**")
    if detected_size:
        explanations.append(f"talla/tamaño **{detected_size}**")
    if min_price and max_price:
        explanations.append(f"precio entre **${min_price:.2f}** y **${max_price:.2f}**")
    elif max_price:
        explanations.append(f"precio máximo de **${max_price:.2f}**")
    elif min_price:
        explanations.append(f"precio mínimo de **${min_price:.2f}**")
    
    for key, val in specs.items():
        explanations.append(f"especificación {key}: **{val}**")
    if in_stock_only:
        explanations.append("solo productos **en stock**")
    
    if sort_by == "recent":
        explanations.append("ordenando por **más recientes**")
    elif sort_by == "most_purchased":
        explanations.append("ordenando por **más vendidos**")
    elif sort_by == "best_rated":
        explanations.append("ordenando por **mejor calificados**")
    elif sort_by == "price_asc" or is_budget:
        explanations.append("ordenando por **menor precio**")
    elif sort_by == "price_desc":
        explanations.append("ordenando por **mayor precio**")

    if not explanations:
        explanation = "Busqué coincidencias generales por texto para tu consulta."
    else:
        explanation = "Entendí que buscas un producto de " + ", ".join(explanations) + "."

    return {
        "original_query": raw_query,
        "category": detected_category,
        "brand": detected_brand,
        "max_price": max_price,
        "min_price": min_price,
        "color": detected_color,
        "size": detected_size,
        "specs": specs,
        "in_stock_only": in_stock_only,
        "is_budget": is_budget,
        "explanation": explanation,
        "sort_by": sort_by
    }

def parse_query(raw_query: str) -> Dict[str, Any]:
    if not GEMINI_API_KEY:
        print("Using legacy parsing (No API key found)")
        return parse_query_legacy(raw_query)

    prompt = f"""
Actúa como un asistente de compras inteligente para SucreShop, un ecommerce local.
Debes interpretar la consulta del usuario y extraer los parámetros de búsqueda en formato JSON estricto.

Reglas:
- category: Puede ser null o una de estas: "Tecnología", "Moda", "Comida", "Hogar", "Deportes", "Belleza".
- brand: Nombre de la marca (con mayúscula inicial) o null.
- max_price: Número float o null. Si dice "barato" o "económico" no pongas max_price pero pon is_budget en true.
- min_price: Número float o null.
- color: color en minúsculas o null.
- size: string (talla/tamaño, ej: "M", "42", "250g") o null.
- specs: diccionario con especificaciones clave-valor (ej: {{"RAM": "16GB", "Disco": "SSD"}}) o {{}}.
- in_stock_only: booleano. True si busca algo "disponible", "en stock".
- is_budget: booleano. True si busca ofertas, descuentos o algo barato.
- sort_by: Puede ser null o uno de: "recent", "most_purchased", "best_rated", "price_asc", "price_desc".
- explanation: Una frase corta amigable en primera persona explicando qué entendiste (Ej: "Entendí que buscas zapatillas Nike talla 42 por menos de $100.").

Consulta del usuario: "{raw_query}"

Devuelve ÚNICAMENTE un JSON válido (sin formato Markdown, sin ```json).
    """

    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith('```json'):
            text = text[7:]
        if text.startswith('```'):
            text = text[3:]
        if text.endswith('```'):
            text = text[:-3]
        text = text.strip()
        
        parsed_data = json.loads(text)
        
        # Ensure all required keys exist
        default_data = parse_query_legacy(raw_query) # get default structure
        
        result = {
            "original_query": raw_query,
            "category": parsed_data.get("category"),
            "brand": parsed_data.get("brand"),
            "max_price": parsed_data.get("max_price"),
            "min_price": parsed_data.get("min_price"),
            "color": parsed_data.get("color"),
            "size": parsed_data.get("size"),
            "specs": parsed_data.get("specs", {}),
            "in_stock_only": parsed_data.get("in_stock_only", False),
            "is_budget": parsed_data.get("is_budget", False),
            "explanation": parsed_data.get("explanation", default_data["explanation"]),
            "sort_by": parsed_data.get("sort_by")
        }
        print("Using Gemini parsing.")
        return result
    except Exception as e:
        print(f"Gemini API error: {{e}}. Falling back to legacy parsing.")
        return parse_query_legacy(raw_query)
