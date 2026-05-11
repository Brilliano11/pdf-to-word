@echo off
echo ===========================================
echo   PDF2Word Converter - Starting Server...
echo ===========================================
echo.

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python tidak ditemukan! Silakan install Python 3.8+ terlebih dahulu.
    echo Download: https://www.python.org/downloads/
    pause
    exit /b 1
)

:: Check if pip packages are installed
echo [1/2] Mengecek dan menginstall dependencies...
pip install -r requirements.txt --quiet

echo.
echo [2/2] Menjalankan server...
echo.
echo =========================================
echo   Server berjalan di: http://localhost:5000
echo   Tekan Ctrl+C untuk menghentikan server
echo =========================================
echo.

:: Open browser after short delay
start /b cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:5000"

:: Start the Flask server
python app.py

pause
