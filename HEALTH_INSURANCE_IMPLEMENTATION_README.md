# NicsanCRM - Health Insurance Implementation

## 🎯 Overview

This document outlines the comprehensive implementation of **Health Insurance** support in the NicsanCRM system, extending the existing Motor Insurance functionality to support both insurance types with dynamic form rendering and dedicated storage.

## 🚀 Features Implemented

### 1. Dynamic Product Type Selection
- **Product Type Field**: Moved to the top of the form for better UX
- **Dynamic Form Rendering**: Form fields change based on selected product type
- **Motor Insurance**: Traditional vehicle-based insurance fields
- **Health Insurance**: Person-based insurance with medical information

### 2. Health Insurance Form Fields

#### Core Health Insurance Fields
- **Policy Number**: Unique identifier for health insurance policy
- **Insurer**: Insurance company name
- **Issue Date**: Policy start date
- **Expiry Date**: Policy end date
- **Sum Insured**: Maximum coverage amount
- **Premium Amount**: Policy cost

#### Insured Persons Management
- **Multiple Persons**: Support for family/group health insurance
- **Add Person Button**: Dynamic addition of insured persons
- **Remove Person**: Individual person removal capability

#### Per-Person Information
- **Name**: Full name of insured person
- **PAN Card Number**: Tax identification
- **Aadhaar Card Number**: Government ID
- **Date of Birth**: Age calculation
- **Weight**: Physical measurements
- **Height**: Physical measurements

#### Medical History Tracking
- **Pre-existing Disease**: Checkbox for medical conditions
  - **Disease Name**: Specific condition details
  - **Years Affected**: Duration of condition
  - **Tablet Details**: Medication information
- **Surgery History**: Checkbox for surgical procedures
  - **Surgery Name**: Specific procedure details
  - **Surgery Details**: Comprehensive procedure information

### 3. Database Schema

#### Health Insurance Table (`health_insurance`)
```sql
CREATE TABLE health_insurance (
  id SERIAL PRIMARY KEY,
  policy_number VARCHAR(255) UNIQUE NOT NULL,
  insurer VARCHAR(255) NOT NULL,
  issue_date DATE,
  expiry_date DATE,
  sum_insured DECIMAL(15,2) DEFAULT 0,
  premium_amount DECIMAL(15,2) NOT NULL,
  executive VARCHAR(255),
  caller_name VARCHAR(255),
  mobile VARCHAR(20),
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  branch VARCHAR(255),
  remark TEXT,
  source VARCHAR(50) DEFAULT 'MANUAL_FORM',
  s3_key VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Health Insured Persons Table (`health_insured_persons`)
```sql
CREATE TABLE health_insured_persons (
  id SERIAL PRIMARY KEY,
  health_insurance_id INTEGER REFERENCES health_insurance(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  pan_card VARCHAR(20) NOT NULL,
  aadhaar_card VARCHAR(20) NOT NULL,
  date_of_birth DATE NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  height DECIMAL(5,2) NOT NULL,
  pre_existing_disease BOOLEAN DEFAULT FALSE,
  disease_name VARCHAR(255),
  disease_years INTEGER,
  tablet_details TEXT,
  surgery BOOLEAN DEFAULT FALSE,
  surgery_name VARCHAR(255),
  surgery_details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Backend API Implementation

#### New API Routes (`/api/health-insurance`)
- **POST /save**: Create new health insurance policy
- **GET /:policyNumber**: Retrieve specific health insurance policy
- **GET /**: List all health insurance policies with pagination
- **DELETE /:policyNumber**: Delete health insurance policy
- **PUT /:policyNumber**: Update health insurance policy (placeholder)

#### Storage Service Methods
- `checkHealthPolicyNumberExists(policyNumber)`: Check for duplicate policy numbers
- `saveHealthInsurance(healthData)`: Dual storage (PostgreSQL + S3)
- `saveHealthInsuranceToPostgreSQL(healthData)`: Database storage
- `saveInsuredPersons(healthInsuranceId, insuredPersons)`: Store multiple persons
- `getHealthInsurance(policyNumber)`: Retrieve policy with persons
- `getAllHealthInsurance(limit, offset)`: Paginated list
- `deleteHealthInsurance(policyNumber)`: Remove policy and S3 data

### 5. Frontend Integration

#### Dual Storage Service
- `saveHealthInsurance(healthData)`: Frontend service for health insurance
- **Fallback Pattern**: Backend API → Mock Data → Error handling
- **Real-time Sync**: WebSocket integration for live updates

#### Backend API Service
- `saveHealthInsurance(healthData)`: Direct backend communication
- **Authentication**: JWT token-based security
- **Error Handling**: Comprehensive error management

#### Form Components
- **LabeledInput**: Enhanced with `disabled` prop support
- **LabeledSelect**: Dropdown selections
- **LabeledCheckbox**: Boolean input handling
- **Conditional Rendering**: Dynamic field display based on selections

### 6. Validation & Security

#### Frontend Validation
- **Required Fields**: Policy number, insurer, premium amount
- **Format Validation**: PAN card, Aadhaar card, mobile number
- **Date Validation**: Issue date, expiry date, date of birth
- **Range Validation**: Weight, height, disease years
- **Conditional Validation**: Disease/surgery details when applicable

#### Backend Security
- **JWT Authentication**: All routes protected
- **Input Validation**: Server-side field validation
- **SQL Injection Prevention**: Parameterized queries
- **Duplicate Prevention**: Policy number uniqueness checks

### 7. User Experience Features

#### Form Layout
- **Top Row**: Product Type selection
- **Conditional Sections**: Health vs Motor insurance fields
- **Insured Persons**: Expandable person management
- **Medical Information**: Collapsible disease/surgery sections
- **Add/Remove**: Dynamic person management

#### Visual Indicators
- **Required Fields**: Red asterisk (*) indicators
- **Validation Messages**: Real-time error feedback
- **Success States**: Confirmation messages
- **Loading States**: Progress indicators

### 8. Data Flow Architecture

```
Frontend Form → DualStorageService → BackendApiService → Backend Routes → StorageService → Database + S3
```

#### Storage Strategy
1. **Primary Storage**: AWS S3 (JSON files)
2. **Secondary Storage**: PostgreSQL (structured data)
3. **Real-time Sync**: WebSocket notifications
4. **Fallback Handling**: Mock data for offline scenarios

## 🛠️ Technical Implementation

### Frontend Technologies
- **React 19.1.1**: Latest React with hooks
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Vite**: Fast build tool
- **Axios**: HTTP client for API calls

### Backend Technologies
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **PostgreSQL**: Relational database
- **AWS S3**: Cloud storage
- **JWT**: Authentication tokens
- **WebSocket**: Real-time communication

### Database Features
- **Foreign Key Relationships**: Data integrity
- **Cascade Delete**: Automatic cleanup
- **Indexes**: Performance optimization
- **Constraints**: Data validation

## 📋 Usage Instructions

### 1. Starting the System
```bash
# Backend
cd nicsan-crm-backend
npm install
npm start

# Frontend
cd ..
npm install
npm run dev
```

### 2. Creating Health Insurance Policy
1. Navigate to Manual Form
2. Select "Health Insurance" as Product Type
3. Fill in policy details (Policy Number, Insurer, Premium)
4. Add insured persons with their details
5. Fill medical history if applicable
6. Submit the form

### 3. Database Setup
```bash
# Initialize database tables
cd nicsan-crm-backend
npm run init-db
```

## 🔧 Configuration

### Environment Variables
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nicsan_crm
DB_USER=postgres
DB_PASSWORD=your_password

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your_bucket_name

# JWT
JWT_SECRET=your_jwt_secret
```

### API Endpoints
- **Health Insurance**: `http://localhost:3001/api/health-insurance`
- **Motor Insurance**: `http://localhost:3001/api/policies`
- **Authentication**: `http://localhost:3001/api/auth`

## 🎉 Benefits Achieved

### 1. **Unified System**
- Single interface for both Motor and Health insurance
- Consistent user experience across insurance types
- Shared authentication and user management

### 2. **Scalable Architecture**
- Modular component design
- Extensible form system
- Database schema supports future enhancements

### 3. **Data Integrity**
- Foreign key relationships
- Validation at multiple levels
- Duplicate prevention mechanisms

### 4. **User Experience**
- Dynamic form rendering
- Intuitive field organization
- Real-time validation feedback

### 5. **Performance**
- Dual storage optimization
- Efficient database queries
- Real-time synchronization

## 🚀 Future Enhancements

### Planned Features
- **PDF Generation**: Health insurance policy documents
- **Email Integration**: Policy notifications
- **WhatsApp Integration**: Customer communication
- **Reporting**: Health insurance analytics
- **API Integration**: Third-party insurance providers

### Technical Improvements
- **Caching**: Redis integration
- **Monitoring**: Application performance tracking
- **Testing**: Comprehensive test coverage
- **Documentation**: API documentation

## 📞 Support

For technical support or questions about the Health Insurance implementation:

- **Backend Issues**: Check server logs and database connectivity
- **Frontend Issues**: Verify TypeScript compilation and component rendering
- **Database Issues**: Ensure PostgreSQL is running and tables are created
- **API Issues**: Verify authentication tokens and endpoint availability

---

**Implementation Date**: December 2024  
**Version**: 1.0.0  
**Status**: Production Ready ✅
