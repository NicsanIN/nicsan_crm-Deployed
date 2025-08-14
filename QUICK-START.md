# 🚀 Nicsan CRM Quick Start Guide

## 🎯 What You'll Get
A fully functional insurance CRM system with:
- **Frontend**: Modern React UI with role-based access
- **Backend**: Node.js API with PostgreSQL database
- **Features**: Policy management, PDF processing, analytics dashboard
- **Authentication**: JWT-based security with Ops/Founder roles

## ⚡ Quick Start (5 minutes)

### 1. Prerequisites
- ✅ Node.js 18+ installed
- ✅ PostgreSQL 12+ installed
- ✅ Git (for cloning)

### 2. Clone & Setup
```bash
# Clone the project
git clone <your-repo-url>
cd NicsanCRM

# Install frontend dependencies
npm install

# Setup backend
cd nicsan-crm-backend
npm install
```

### 3. Database Setup
```bash
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE nicsan_crm;
\q

# Run setup scripts
node setup-env.js
node setup-schema.js
node create-test-user.js
```

### 4. Start the System
```bash
# Terminal 1: Start backend
cd nicsan-crm-backend
npm run dev

# Terminal 2: Start frontend
cd ../
npm run dev
```

### 5. Login & Test
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001
- **Founder**: admin@nicsan.in / admin123
- **Ops**: ops@nicsan.in / ops123

## 🔧 Detailed Setup

### Backend Configuration
The backend automatically creates a `.env` file with:
- Database connection (PostgreSQL)
- JWT secret for authentication
- AWS configuration (dummy values for dev)
- CORS settings for frontend

### Database Schema
Automatically creates:
- `users` table with role-based access
- `policies` table for insurance data
- `pdf_uploads` table for file processing
- `audit_logs` table for compliance

### Test Data
Pre-loaded with:
- Sample policies and uploads
- Test user accounts
- Demo dashboard metrics

## 🌟 Features to Explore

### Operations Role (Ops)
- **PDF Upload**: Drag & drop insurance PDFs
- **Manual Entry**: Comprehensive policy forms
- **Grid Entry**: Bulk policy creation
- **Review & Confirm**: Validate extracted data

### Founder Role
- **Dashboard**: Company overview and KPIs
- **Analytics**: Sales trends and performance
- **Leaderboard**: Sales rep performance
- **Data Sources**: PDF vs Manual analysis

## 🚨 Troubleshooting

### Backend Won't Start
```bash
# Check if port 3001 is free
netstat -an | grep 3001

# Verify database connection
psql -h localhost -U postgres -d nicsan_crm
```

### Frontend Can't Connect
```bash
# Check backend health
curl http://localhost:3001/health

# Verify CORS settings in .env
CORS_ORIGIN=http://localhost:5173
```

### Database Issues
```bash
# Reset database
dropdb nicsan_crm
createdb nicsan_crm
node setup-schema.js
```

## 📱 Development Workflow

### Making Changes
1. **Frontend**: Edit files in `src/` - hot reload enabled
2. **Backend**: Edit files in `nicsan-crm-backend/src/` - nodemon auto-restart
3. **Database**: Schema changes require manual migration

### Testing
- **Frontend**: Built-in React dev tools
- **Backend**: Health endpoint at `/health`
- **API**: Test with Postman or curl

### Deployment
- **Frontend**: `npm run build` creates production build
- **Backend**: `npm run build && npm start` for production
- **Database**: Update `.env` with production credentials

## 🔐 Security Notes

### Development
- JWT secret is pre-configured
- AWS credentials are dummy values
- Database password is 'password' (change for production)

### Production
- Change all default passwords
- Use strong JWT secrets
- Configure real AWS credentials
- Enable SSL for database
- Set proper CORS origins

## 📚 Next Steps

1. **Explore the UI**: Try both Ops and Founder roles
2. **Test PDF Upload**: Upload sample insurance documents
3. **Create Policies**: Use manual entry forms
4. **View Analytics**: Check dashboard metrics
5. **Customize**: Modify forms, fields, and workflows

## 🆘 Need Help?

- **Backend Issues**: Check console logs and database connection
- **Frontend Issues**: Check browser console and network tab
- **Database Issues**: Verify PostgreSQL is running and accessible
- **API Issues**: Test endpoints with Postman or curl

---

**🎉 You're all set! The Nicsan CRM is ready to use.**

