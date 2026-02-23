# 🏢 Nicsan CRM - Insurance Management System

A comprehensive insurance CRM system built with modern technologies, featuring dual storage architecture, real-time synchronization, and advanced AI-powered document processing.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Authentication](#authentication)
- [Database Schema](#database-schema)
- [Cloud Storage](#cloud-storage)
- [Email & WhatsApp Integration](#email--whatsapp-integration)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

Nicsan CRM is a comprehensive insurance management system designed for insurance brokers and companies. It provides end-to-end policy management, from document upload and AI-powered data extraction to customer communication and business analytics.

### Key Capabilities

- **Document Processing**: AI-powered PDF text extraction using OpenAI GPT-4o-mini
- **Dual Storage**: AWS S3 (primary) + PostgreSQL (secondary) with automatic fallback
- **Real-time Sync**: Cross-device synchronization with WebSocket support
- **Customer Communication**: Automated email and WhatsApp notifications
- **Business Intelligence**: Comprehensive analytics and reporting
- **Role-based Access**: Granular permissions for operations and founders

## 🏗️ Architecture

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React 19)    │◄──►│   (Node.js)     │◄──►│   (PostgreSQL)  │
│   TypeScript    │    │   Express.js    │    │   RDS/Aurora    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Cloud Storage │    │   AI Services   │    │   Communication  │
│   (AWS S3)      │    │   (OpenAI)      │    │   (Email/WhatsApp)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Dual Storage Pattern

The system implements a sophisticated dual storage architecture:

1. **Primary Storage**: AWS S3 for documents and JSON data
2. **Secondary Storage**: PostgreSQL for relational data and fallback
3. **Mock Data**: Development fallback for offline scenarios
4. **Smart Sync**: Real-time cross-device synchronization

## ✨ Features

### 🔐 Authentication & Authorization

- **JWT-based Authentication**: Secure token-based authentication
- **Role-based Access Control**: Granular permissions (Founder, Ops, Admin)
- **Automatic Token Management**: Proactive refresh and expiration handling
- **Cross-device Sync**: Real-time authentication state updates
- **Password Security**: bcrypt hashing with 12 salt rounds

### 📄 Document Management

- **PDF Upload**: Drag-and-drop file upload with validation
- **AI Text Extraction**: OpenAI GPT-4o-mini for intelligent data extraction
- **Insurer Detection**: Automatic insurer identification from documents
- **Confidence Scoring**: Quality assessment of extracted data
- **Manual Correction**: Review and edit extracted data before submission

### 📊 Operations Management

#### Operations Pages
- **PDF Upload**: Automated document processing
- **Review & Confirm**: Data validation and correction
- **Manual Form**: Direct data entry with 50+ fields
- **Grid Entry**: Bulk data entry with Excel-like interface
- **Policy Detail**: Individual policy management
- **Settings**: Operations-specific configuration

#### Key Features
- **Auto-complete**: Smart suggestions for telecallers, insurers, vehicles
- **Real-time Validation**: Vehicle number, email, and financial validation
- **Quick-fill**: Common value auto-population
- **Batch Operations**: Bulk policy creation and management

### 📈 Business Intelligence

#### Founder Pages
- **Company Overview**: High-level business metrics and trends
- **KPI Dashboard**: Real-time performance monitoring
- **Sales Explorer**: Advanced analytics with multi-dimensional filtering
- **Rep Leaderboard**: Sales representative performance tracking
- **Data Sources**: Data quality and source analysis
- **Payments**: Financial transaction management
- **Monthly Costs**: Cost management and budgeting
- **Settings**: System-wide configuration

#### Analytics Features
- **Real-time Dashboards**: Auto-refresh every 30 seconds
- **Interactive Charts**: Recharts integration for data visualization
- **Export Capabilities**: CSV and PDF export functionality
- **Trend Analysis**: Historical data and forecasting
- **Performance Metrics**: GWP, Net Revenue, Policy Count, Growth Rates

### 💬 Communication System

#### Email Integration
- **Policy Notifications**: Automated policy PDF delivery
- **Daily Reports**: Comprehensive business metrics
- **Branch Reports**: Targeted reports for branch heads
- **Professional Templates**: Branded HTML emails with mobile responsiveness
- **Multi-recipient Support**: Founder and branch head distribution

#### WhatsApp Integration
- **Policy Delivery**: Text + PDF document delivery
- **Professional Templates**: Branded message formatting
- **Rate Limit Compliance**: 1000 messages/day, 10 messages/second
- **Phone Number Validation**: International format support
- **Error Handling**: Comprehensive retry mechanisms

## 🛠️ Technology Stack

### Frontend
- **React 19**: Latest React with TypeScript
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library
- **Recharts**: Data visualization
- **Socket.IO Client**: Real-time communication
- **jsPDF**: PDF generation
- **Lucide React**: Icon library

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **PostgreSQL**: Relational database
- **Knex.js**: SQL query builder
- **JWT**: JSON Web Tokens for authentication
- **bcryptjs**: Password hashing
- **Socket.IO**: WebSocket communication
- **node-cron**: Task scheduling

### Cloud & AI
- **AWS S3**: Cloud storage
- **AWS Textract**: Document text extraction (legacy)
- **OpenAI GPT-4o-mini**: AI-powered text extraction
- **WhatsApp Business API**: Customer communication
- **Nodemailer**: Email service
- **AWS SDK**: Cloud service integration

### Development Tools
- **TypeScript**: Type safety
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Docker**: Containerization
- **Git**: Version control

## 🚀 Installation

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 13+
- AWS Account (for S3 and other services)
- OpenAI API Key
- WhatsApp Business API credentials

### Backend Setup

```bash
# Navigate to backend directory
cd nicsan-crm-backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Initialize database
npm run init-db

# Run migrations
npm run migrate:latest

# Start development server
npm run dev
```

### Frontend Setup

```bash
# Navigate to root directory
cd .

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/nicsan_crm
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nicsan_crm
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# AWS
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket_name

# OpenAI
OPENAI_API_KEY=your_openai_key

# WhatsApp
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Report Recipients
FOUNDER_EMAIL_1=founder1@company.com
FOUNDER_EMAIL_2=founder2@company.com
MYSORE_BRANCH_HEAD_EMAIL=mysore@company.com
BANASHANKARI_BRANCH_HEAD_EMAIL=banashankari@company.com
ADUGODI_BRANCH_HEAD_EMAIL=adugodi@company.com
```

#### Frontend (.env)
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api
VITE_WEBSOCKET_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3001
VITE_API_TIMEOUT=30000
VITE_ENABLE_DEBUG_LOGGING=true
```

## ⚙️ Configuration

### Database Configuration

The system uses Knex.js for database management with environment-specific configurations:

```typescript
// knexfile.ts
const development: Knex.Config = {
  client: "pg",
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'nicsan_crm',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'your_password',
    ssl: false
  }
};
```

### AWS S3 Configuration

```javascript
// config/aws.js
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1'
  // Uses IAM Task Role for authentication
});
```

### OpenAI Configuration

```javascript
// services/openaiService.js
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
```

## 📚 API Documentation

### Authentication Endpoints

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### Policy Management

```http
POST /api/policies
Authorization: Bearer <token>
Content-Type: application/json

{
  "policy_number": "POL123456",
  "vehicle_number": "KA01AB1234",
  "insurer": "Bajaj Allianz",
  "total_premium": 25000,
  "customer_name": "John Doe"
}
```

### Document Upload

```http
POST /api/upload/pdf
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <PDF file>
insurer: "TATA AIG"
```

### Dashboard Analytics

```http
GET /api/dashboard/metrics
Authorization: Bearer <token>
```

## 🔐 Authentication

### User Roles

- **Founder**: Full system access including analytics, user management, and settings
- **Ops**: Operations access for data entry and policy management
- **Admin**: Administrative access for system management

### Authentication Flow

1. **Login**: User provides email and password
2. **Token Generation**: JWT token created with user information
3. **Token Storage**: Token stored in localStorage
4. **API Requests**: Token included in Authorization header
5. **Token Validation**: Automatic validation on each request
6. **Token Refresh**: Proactive refresh before expiration

### Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Role-based Access**: Granular permission control
- **Automatic Logout**: Token expiration handling
- **Cross-device Sync**: Real-time authentication updates

## 🗄️ Database Schema

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'ops',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Policies Table
```sql
CREATE TABLE policies (
  id SERIAL PRIMARY KEY,
  policy_number VARCHAR(255) UNIQUE NOT NULL,
  vehicle_number VARCHAR(255) NOT NULL,
  insurer VARCHAR(255) NOT NULL,
  total_premium DECIMAL(15,2) NOT NULL,
  customer_name VARCHAR(255),
  s3_key VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Additional Tables
- **health_insurance**: Health insurance policies
- **health_insured_persons**: Health insurance beneficiaries
- **telecallers**: Sales representatives
- **pdf_uploads**: Document upload tracking
- **settings**: System configuration
- **monthly_recurring_costs**: Cost management
- **password_change_logs**: Security audit trail

## ☁️ Cloud Storage

### AWS S3 Integration

The system uses AWS S3 as primary storage for:

- **Document Storage**: PDF files and images
- **JSON Data**: Policy data and extracted information
- **Backup Storage**: Automatic backup of critical data
- **CDN Integration**: CloudFront for fast content delivery

### S3 Key Structure

```
policies/
├── 2024/
│   ├── 01/
│   │   ├── policy_12345.json
│   │   └── documents/
│   │       └── policy_12345.pdf
│   └── 02/
└── uploads/
    ├── pdf/
    └── documents/
```

### Storage Features

- **Automatic Backup**: Redundant storage across multiple regions
- **Version Control**: File versioning for document management
- **Access Control**: IAM-based permission management
- **Cost Optimization**: Intelligent storage tiering

## 📧 Email & WhatsApp Integration

### Email Service

#### Features
- **Policy Notifications**: Automated policy PDF delivery
- **Daily Reports**: Comprehensive business metrics
- **Professional Templates**: Branded HTML emails
- **Mobile Responsive**: Optimized for all devices
- **Multi-recipient Support**: Founder and branch distribution

#### Email Templates
- **Policy Notification**: Customer policy delivery
- **Daily OD Report**: Business metrics for founders
- **Branch Reports**: Targeted reports for branch heads
- **Professional Branding**: Nicsan Insurance styling

### WhatsApp Service

#### Features
- **Policy Delivery**: Text + PDF document delivery
- **Professional Templates**: Branded message formatting
- **Rate Limit Compliance**: 1000 messages/day, 10 messages/second
- **Phone Number Validation**: International format support
- **Error Handling**: Comprehensive retry mechanisms

#### Message Templates
```
🏆 *Nicsan Insurance*

Dear {customer_name},

Your motor insurance policy has been successfully processed!

📋 *Policy Details:*
• Policy Number: *{policy_number}*
• Vehicle: {make} {model}
• Registration: {vehicle_number}
• Valid From: {issue_date}
• Valid Until: {expiry_date}
• Premium: *₹{total_premium}*

📎 Your policy document is attached to this message.
```

## 🚀 Deployment

### Docker Deployment

#### Backend Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

#### Frontend Build
```bash
# Build frontend
npm run build

# Serve with nginx
docker run -d -p 80:80 -v $(pwd)/dist:/usr/share/nginx/html nginx
```

### Environment-Specific Configuration

#### Development
- Local PostgreSQL database
- Local file storage
- Mock data fallbacks

#### Staging
- RDS PostgreSQL database
- S3 cloud storage
- Real API integrations

#### Production
- RDS PostgreSQL with read replicas
- S3 with CloudFront CDN
- Full monitoring and logging

### Monitoring & Logging

- **Health Checks**: `/api/health` endpoint
- **Error Tracking**: Comprehensive error logging
- **Performance Monitoring**: Request timing and database queries
- **Security Logging**: Authentication and authorization events

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Standards

- **TypeScript**: Use TypeScript for type safety
- **ESLint**: Follow ESLint configuration
- **Prettier**: Use Prettier for code formatting
- **Git**: Use conventional commit messages

### Testing

```bash
# Run backend tests
cd nicsan-crm-backend
npm test

# Run frontend tests
npm test
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:

- **Email**: support@nicsanin.com
- **Phone**: +91-9035568421
- **Website**: https://www.nicsanin.com

## 🙏 Acknowledgments

- **OpenAI**: For AI-powered document processing
- **AWS**: For cloud storage and services
- **WhatsApp**: For business communication API
- **React Team**: For the excellent frontend framework
- **Node.js Community**: For the robust backend ecosystem

---

**Built with ❤️ by the Nicsan Insurance Team**