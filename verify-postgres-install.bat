@echo off
echo 🗄️ PostgreSQL Installation Verification
echo =====================================

echo.
echo 🔍 Checking PostgreSQL installation...

echo 📍 Looking for PostgreSQL in Program Files...
if exist "C:\Program Files\PostgreSQL\16\bin\psql.exe" (
    echo ✅ PostgreSQL 16 found in Program Files
    set "PGPATH=C:\Program Files\PostgreSQL\16\bin"
) else if exist "C:\Program Files\PostgreSQL\15\bin\psql.exe" (
    echo ✅ PostgreSQL 15 found in Program Files
    set "PGPATH=C:\Program Files\PostgreSQL\15\bin"
) else if exist "C:\Program Files\PostgreSQL\14\bin\psql.exe" (
    echo ✅ PostgreSQL 14 found in Program Files
    set "PGPATH=C:\Program Files\PostgreSQL\14\bin"
) else (
    echo ❌ PostgreSQL not found in Program Files
    echo    Please install PostgreSQL first
    pause
    exit /b 1
)

echo.
echo 🔍 Checking if PostgreSQL service is running...
sc query postgresql-x64-16 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ PostgreSQL service found
    sc query postgresql-x64-16 | findstr "RUNNING"
    if %errorlevel% equ 0 (
        echo ✅ PostgreSQL service is running
    ) else (
        echo ⚠️ PostgreSQL service is not running
        echo    Starting PostgreSQL service...
        net start postgresql-x64-16
    )
) else (
    echo ⚠️ PostgreSQL service not found, checking alternative names...
    sc query postgresql-x64-15 >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ PostgreSQL 15 service found
        net start postgresql-x64-15
    ) else (
        echo ❌ PostgreSQL service not found
        echo    Please check installation
        pause
        exit /b 1
    )
)

echo.
echo 🔍 Testing database connection...
"%PGPATH%\psql.exe" -h localhost -U postgres -d postgres -c "SELECT version();" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Database connection successful
) else (
    echo ❌ Database connection failed
    echo    Testing with our Node.js script...
    node test-db-simple.js
    if %errorlevel% equ 0 (
        echo ✅ Node.js connection successful
    ) else (
        echo ❌ Both connections failed
        echo    Please check your password and try again
        pause
        exit /b 1
    )
)

echo.
echo 🗄️ Creating nicsan_crm database...
"%PGPATH%\psql.exe" -h localhost -U postgres -d postgres -c "CREATE DATABASE nicsan_crm;" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Database 'nicsan_crm' created successfully
) else (
    echo ⚠️ Database might already exist, checking...
    "%PGPATH%\psql.exe" -h localhost -U postgres -d nicsan_crm -c "SELECT 1;" >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ Database 'nicsan_crm' already exists
    ) else (
        echo ❌ Failed to create/verify database
        pause
        exit /b 1
    )
)

echo.
echo 🎉 PostgreSQL is ready!
echo 📊 Database: nicsan_crm
echo 🔌 Port: 5432
echo 👤 User: postgres
echo.
echo 🚀 You can now run the setup scripts:
echo    node setup-schema.js
echo    node create-test-user.js
echo    npm run dev
echo.
echo Press any key to close...
pause > nul


