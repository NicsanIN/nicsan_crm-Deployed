# Database Migration Guide

## 🏗️ Environment-Specific Database Setup

### **Your Device (Main Development)**
- **Staging**: `https://staging.nicsanin.com` → Staging RDS PostgreSQL
- **Production**: `https://crm.nicsanin.com` → Production RDS PostgreSQL

### **Teammates' Devices**
- **Local**: `http://localhost:3001` → Local PostgreSQL

## 🔧 Environment Variables Setup

### **For Staging RDS Connection:**
```env
# Set these environment variables before running staging migrations
DATABASE_URL=postgresql://username:password@staging-rds-endpoint:5432/nicsan_crm_staging?sslmode=require
# OR individual variables:
DB_HOST=staging-rds-endpoint.amazonaws.com
DB_PORT=5432
DB_NAME=nicsan_crm_staging
DB_USER=staging_user
DB_PASSWORD=staging_password
DB_SSL=true
```

### **For Production RDS Connection:**
```env
# Set these environment variables before running production migrations
DATABASE_URL=postgresql://username:password@production-rds-endpoint:5432/nicsan_crm_production?sslmode=require
# OR individual variables:
DB_HOST=production-rds-endpoint.amazonaws.com
DB_PORT=5432
DB_NAME=nicsan_crm_production
DB_USER=production_user
DB_PASSWORD=production_password
DB_SSL=true
```

## 🚀 Migration Commands

### **For Teammates (Local Development):**
```bash
npm run migrate:latest          # Run all pending migrations
npm run migrate:rollback        # Rollback last migration (one step back)
npm run migrate:rollback:all    # Rollback ALL migrations (nuclear option)
npm run migrate:status          # Check migration status
npm run migrate:make <name>     # Create new migration
```

### **For Staging Environment (Your Device):**
```bash
npm run migrate:staging         # Run migrations on staging RDS (one step forward)
npm run migrate:staging:rollback # Rollback staging migration (one step back)
npm run migrate:staging:rollback:all # Rollback ALL staging migrations
npm run migrate:staging:status  # Check staging migration status
```

### **For Production Environment (Your Device):**
```bash
npm run migrate:production      # Run migrations on production RDS (one step forward)
npm run migrate:production:rollback # Rollback production migration (one step back)
npm run migrate:production:rollback:all # Rollback ALL production migrations
npm run migrate:production:status  # Check production migration status
```

## 📋 Migration Workflow

1. **Teammates create migrations locally**
2. **Test migrations on local database**
3. **Push migration files to git**
4. **Apply to staging**: `npm run migrate:staging`
5. **Test on staging environment**
6. **Apply to production**: `npm run migrate:production`

## 🔄 Rollback & Forward Functionality

### **One Step Forward (Apply Migrations):**
```bash
# Apply next pending migration
npm run migrate:latest          # Local
npm run migrate:staging         # Staging RDS
npm run migrate:production      # Production RDS
```

### **One Step Back (Rollback Migrations):**
```bash
# Rollback last applied migration
npm run migrate:rollback        # Local
npm run migrate:staging:rollback # Staging RDS
npm run migrate:production:rollback # Production RDS
```

### **Nuclear Option (Rollback All):**
```bash
# Rollback ALL migrations (use with extreme caution!)
npm run migrate:rollback:all    # Local
npm run migrate:staging:rollback:all # Staging RDS
npm run migrate:production:rollback:all # Production RDS
```

### **Check Migration Status:**
```bash
# See which migrations are applied/pending
npm run migrate:status          # Local
npm run migrate:staging:status  # Staging RDS
npm run migrate:production:status # Production RDS
```

## ⚠️ Important Notes

- **Always backup production database before migrations**
- **Test migrations on staging first**
- **Use reversible migrations (up/down functions)**
- **Never run destructive migrations on production**
- **Have rollback plan ready**
- **Rollback ALL is dangerous - only use in emergencies**

## 🔍 Environment-Specific Configs

The `knexfile.ts` now includes separate configurations for:
- **Development**: Local PostgreSQL (no SSL)
- **Staging**: RDS PostgreSQL (with SSL, smaller pool)
- **Production**: RDS PostgreSQL (with SSL, larger pool)

Each environment uses the appropriate `NODE_ENV` to select the correct configuration.
