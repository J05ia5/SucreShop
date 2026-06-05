import subprocess
import sys
import os

def main():
    print("=" * 50)
    print("  SucreShop - Iniciando plataforma")
    print("=" * 50)

    # 1. Install dependencies
    print("\n[1/3] Instalando dependencias...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt", "-q"])

    # 2. Seed database
    print("\n[2/3] Poblando base de datos...")
    subprocess.check_call([sys.executable, "backend/seed.py"])

    # 3. Start server
    print("\n[3/3] Iniciando servidor...")
    print("  Abrir en el navegador: http://localhost:8000")
    print("  Presiona Ctrl+C para detener\n")
    subprocess.check_call([
        sys.executable, "-m", "uvicorn", "backend.main:app",
        "--host", "0.0.0.0", "--port", "8000", "--reload"
    ])

if __name__ == "__main__":
    main()
