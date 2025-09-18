# NicsanCRM - Comprehensive End-to-End Project Analysis Report

## Executive Summary

NicsanCRM is a sophisticated insurance Customer Relationship Management (CRM) system built with modern web technologies. The application implements a dual-storage architecture with role-based access control, real-time synchronization, and advanced PDF processing capabilities using AI/ML services.

## 🏗️ Architecture Overview

### Technology Stack
- **Frontend**: React 19.1.1 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js + PostgreSQL
- **Cloud Storage**: AWS S3 + OpenAI GPT-4o-mini
- **Real-time**: Socket.IO for WebSocket connections
- **Authentication**: JWT-based with bcrypt password hashing
- **Database**: PostgreSQL with Knex.js migrations

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React/TS)    │◄──►│   (Node.js)     │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Dual Storage  │    │   Cloud Storage │    │   Real-time     │
│   Service       │    │   (AWS S3)      │    │   (Socket.IO)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Mock Data     │    │   OpenAI API    │
│   Fallback      │    │   (GPT-4o-mini) │
└─────────────────┘    └─────────────────┘
```

## 🔐 Authentication & Authorization

### User Roles
1. **Operations (Ops)**: Data entry, PDF processing, policy management
2. **Founder**: Analytics, reporting, business intelligence, settings management

### Security Features
- JWT token-based authentication with 24-hour expiration
- Password hashing using bcrypt with 12 salt rounds
- Role-based access control (RBAC)
- CORS protection
- Input validation and sanitization
- SQL injection prevention through parameterized queries

### Default Users
- **Ops User**: `ops@nicsan.in` / `NicsanOps2024!@#`
- **Founder User**: `admin@nicsan.in` / `NicsanAdmin2024!@#`

## 📊 Database Schema

### Core Tables

#### 1. Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'ops',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. Policies Table
```sql
CREATE TABLE policies (
  id SERIAL PRIMARY KEY,
  policy_number VARCHAR(255) UNIQUE NOT NULL,
  vehicle_number VARCHAR(255) NOT NULL,
  insurer VARCHAR(255) NOT NULL,
  product_type VARCHAR(255) DEFAULT 'Private Car',
  vehicle_type VARCHAR(255) DEFAULT 'Private Car',
  make VARCHAR(255),
  model VARCHAR(255),
  cc VARCHAR(50),
  manufacturing_year VARCHAR(10),
  issue_date DATE,
  expiry_date DATE,
  idv DECIMAL(15,2) DEFAULT 0,
  ncb DECIMAL(15,2) DEFAULT 0,
  discount DECIMAL(15,2) DEFAULT 0,
  net_od DECIMAL(15,2) DEFAULT 0,
  ref VARCHAR(255),
  total_od DECIMAL(15,2) DEFAULT 0,
  net_premium DECIMAL(15,2) DEFAULT 0,
  total_premium DECIMAL(15,2) NOT NULL,
  cashback_percentage DECIMAL(15,2) DEFAULT 0,
  cashback_amount DECIMAL(15,2) DEFAULT 0,
  customer_paid DECIMAL(15,2) DEFAULT 0,
  customer_cheque_no VARCHAR(255),
  our_cheque_no VARCHAR(255),
  executive VARCHAR(255),
  caller_name VARCHAR(255),
  mobile VARCHAR(20),
  rollover VARCHAR(255),
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  branch VARCHAR(255),
  remark TEXT,
  brokerage DECIMAL(15,2) DEFAULT 0,
  cashback DECIMAL(15,2) DEFAULT 0,
  source VARCHAR(50) DEFAULT 'MANUAL_FORM',
  s3_key VARCHAR(500),
  confidence_score DECIMAL(4,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. PDF Uploads Table
```sql
CREATE TABLE pdf_uploads (
  id SERIAL PRIMARY KEY,
  upload_id VARCHAR(255) UNIQUE NOT NULL,
  filename VARCHAR(255) NOT NULL,
  s3_key VARCHAR(500) NOT NULL,
  insurer VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'UPLOADED',
  extracted_data JSONB,
  manual_extras JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4. Settings Table
```sql
CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```