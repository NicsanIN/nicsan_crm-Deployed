@echo off
echo 🔧 Adding INTERNAL_TOKEN to .env file...
echo ========================================

REM Check if .env file exists
if not exist ".env" (
    echo ❌ .env file not found. Please create it first.
    pause
    exit /b 1
)

REM Add INTERNAL_TOKEN if it doesn't exist
findstr /C:"INTERNAL_TOKEN" .env >nul 2>&1
if errorlevel 1 (
    echo ✅ Adding INTERNAL_TOKEN to .env file...
    echo.>> .env
    echo # Lambda Integration>> .env
    echo INTERNAL_TOKEN=nicsan-crm-lambda-internal-token-2024-secure-key>> .env
    echo ✅ INTERNAL_TOKEN added successfully!
) else (
    echo ℹ️ INTERNAL_TOKEN already exists in .env file
)

echo.
echo 📋 Current .env configuration:
echo =============================
type .env
echo.
echo 🎉 Environment configuration updated!
pause


