# Nicsan CRM Backend

A robust backend API for the Nicsan CRM system with **dual storage architecture** - primary storage on AWS S3 and secondary storage on PostgreSQL.

## 🏗️ Architecture

### Dual Storage Strategy
- **Primary Storage**: AWS S3 (for files, PDFs, and raw data)
- **Secondary Storage**: PostgreSQL (for structured data and queries)
- **Sync**: All data is saved to both storages simultaneously

### Key Features
- ✅ JWT Authentication with role-based access
- ✅ PDF upload with AWS Textract processing
- ✅ Policy management with dual storage
- ✅ Dashboard metrics and KPI calculations
- ✅ Sales explorer and leaderboard
- ✅ File upload with S3 integration

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Create `.env` file:
```env
# Server
PORT=3001
NODE_ENV=development

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nicsan_crm
DB_USER=postgres
DB_PASSWORD=your_password

# AWS (S3 + Textract)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=nicsan-crm-uploads

# Environment Configuration
ENVIRONMENT=staging

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h
```

### 3. Database Setup
```bash
# Initialize database tables
npm run init-db

# Create default users
npm run init-users
```

### 4. Start Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

### Policies
- `POST /api/policies` - Create policy (dual storage)
- `GET /api/policies` - Get all policies
- `GET /api/policies/:id` - Get policy by ID
- `PUT /api/policies/:id` - Update policy
- `DELETE /api/policies/:id` - Delete policy

### PDF Upload
- `POST /api/upload/pdf` - Upload PDF with manual extras
- `POST /api/upload/:id/process` - Process PDF with Textract
- `GET /api/upload/:id/status` - Get upload status
- `GET /api/upload` - Get all uploads

### Dashboard
- `GET /api/dashboard/metrics` - Get KPI metrics
- `GET /api/dashboard/explorer` - Sales explorer data
- `GET /api/dashboard/leaderboard` - Rep leaderboard

## 🔐 Default Users

After running `npm run init-users`, these users are created:

- **Ops User**: `ops@nicsan.in` / `ops123`
- **Founder User**: `admin@nicsan.in` / `admin123`

## 🗄️ Database Schema

### Tables
- `users` - User accounts and authentication
- `policies` - Policy data with all fields
- `pdf_uploads` - PDF upload metadata and processing status

## 🔧 Development

### Scripts
- `npm run dev` - Start with nodemon (auto-restart)
- `npm run init-db` - Initialize database tables
- `npm run init-users` - Create default users

### Health Check
- `GET /health` - Server health status

## 🌐 Frontend Integration

The backend is designed to work seamlessly with the React frontend:
- CORS enabled for `localhost:3000`
- JWT token authentication
- File upload support
- Real-time status updates

## 📝 Notes

- All data is saved to both S3 and PostgreSQL simultaneously
- PDFs are processed with AWS Textract for data extraction
- JWT tokens are used for authentication
- Role-based access control (ops/founder)
- File uploads are limited to PDFs only

## 🔒 Security

- Passwords are hashed with bcrypt
- JWT tokens for authentication
- Role-based access control
- Input validation and sanitization
- CORS configuration for frontend

