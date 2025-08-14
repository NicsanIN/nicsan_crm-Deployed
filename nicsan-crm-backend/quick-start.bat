@echo off
echo 🚀 Nicsan CRM Quick Start
echo =========================

echo.
echo 📦 Installing dependencies...
call npm install

echo.
echo 🔧 Setting up environment...
call node setup-env.js

echo.
echo 🗄️ Setting up database schema...
call node setup-schema.js

echo.
echo 👥 Creating test users...
call node create-test-user.js

echo.
echo 🔨 Building project...
call npm run build

echo.
echo 🎉 Setup completed! Starting development server...
echo.
echo 📋 Test Credentials:
echo    Founder: admin@nicsan.in / admin123
echo    Ops: ops@nicsan.in / ops123
echo.
echo 🌐 Frontend: http://localhost:5173
echo 🔌 Backend: http://localhost:3001
echo.

call npm run dev

