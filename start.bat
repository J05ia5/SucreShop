@echo off
title SucreShop
cd /d "%~dp0"

echo ================================================
echo   SucreShop - Iniciando plataforma local
echo ================================================

echo.
echo [1/3] Instalando dependencias...
pip install -r requirements.txt -q

echo.
echo [2/3] Poblando base de datos...
python backend\seed.py

echo.
echo [3/3] Iniciando servidor...
echo.
echo   Abrir en el navegador: http://localhost:8000
echo   Presiona Ctrl+C para detener
echo.

python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

pause
