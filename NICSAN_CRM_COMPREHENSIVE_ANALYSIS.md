# NicsanCRM - Complete End-to-End Analysis

## Executive Summary

NicsanCRM is a sophisticated insurance CRM system built with modern web technologies, featuring a dual-storage architecture (PostgreSQL + AWS S3), AI-powered PDF processing, real-time cross-device synchronization, and comprehensive business intelligence capabilities. The system serves both operational teams and founders with role-based access and specialized workflows.

## Architecture Overview

### Technology Stack

**Frontend:**
- React 19.1.1 with TypeScript
- Vite 7.1.2 for build tooling
- Tailwind CSS 3.4.17 for styling
- Recharts 3.1.2 for data visualization
- Socket.IO Client 4.7.5 for real-time communication
- IndexedDB (idb 8.0.0) for offline storage
- jsPDF 3.0.3 for document generation

**Backend:**
- Node.js with Express.js
- PostgreSQL with Knex.js ORM
- AWS S3 for file storage
- OpenAI GPT-4o-mini for AI processing
- Socket.IO Server for real-time features
- Redis for caching
- JWT with bcryptjs for authentication

### Dual Storage Pattern

The system implements a sophisticated dual storage pattern:
1. **Primary Storage**: PostgreSQL for structured data and metadata
2. **Secondary Storage**: AWS S3 for files and JSON data
3. **Fallback Strategy**: Mock data when backend is unavailable
4. **Real-time Sync**: WebSocket-based cross-device synchronization

## Database Schema

### Core Tables

**Users Table:**
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

**Policies Table:**
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

**PDF Uploads Table:**
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

**Health Insurance Table:**
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

**Health Insured Persons Table:**
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

## Frontend Architecture

### Application Structure

**Main Application (`src/NicsanCRMMock.tsx`):**
- Role-based routing (Operations vs. Founder)
- Authentication management
- Context providers for cross-device sync
- Debug mode with backend status indicators

**Context Providers:**
- `AuthProvider`: User authentication and session management
- `CrossDeviceSyncProvider`: Real-time synchronization across devices
- `SettingsProvider`: Application settings management

### Operations Pages

#### 1. PDF Upload (`src/pages/operations/PDFUpload/PDFUpload.tsx`)
**Features:**
- Drag-and-drop PDF upload interface
- Insurer selection (TATA_AIG, DIGIT, RELIANCE_GENERAL, etc.)
- Manual extras input (executive, caller name, mobile, cashback, etc.)
- Real-time upload status polling
- AutocompleteInput for caller names with telecaller management
- Automatic OpenAI processing after upload

**Key Components:**
- File upload with validation
- Manual extras form with validation
- Upload status tracking
- Telecaller autocomplete with add-new functionality

#### 2. Review & Confirm (`src/pages/operations/ReviewConfirm/ReviewConfirm.tsx`)
**Features:**
- PDF data review and editing interface
- Manual extras review and modification
- Confidence score display
- Data validation before confirmation
- Verification modal for contact details
- Support for both real and mock data

**Key Components:**
- Editable PDF extracted data
- Manual extras editing
- Validation and error handling
- Confirmation workflow

#### 3. Manual Form (`src/pages/operations/ManualForm/ManualForm.tsx`)
**Features:**
- Comprehensive policy entry form
- Support for both motor and health insurance
- Advanced validation (progressive and strict modes)
- Two-way binding for cashback calculations
- QuickFill feature for pre-populating from previous policies
- Real-time validation with error tray

**Key Components:**
- `LabeledInput`, `LabeledSelect`, `LabeledCheckbox` components
- `AutocompleteInput` for caller names
- Validation system with field-level and cross-field validation
- QuickFill functionality for efficiency

#### 4. Grid Entry (`src/pages/operations/GridEntry/GridEntry.tsx`)
**Features:**
- Excel-like grid interface for bulk data entry
- Copy-paste from Excel with automatic parsing
- Real-time validation and error highlighting
- Batch saving with individual row status tracking
- Retry failed entries functionality
- Date format conversion (DD-MM-YYYY to YYYY-MM-DD)

**Key Components:**
- Dynamic table with inline editing
- Excel paste handling with TSV parsing
- Row status management (pending, saving, saved, error)
- Batch operations with progress tracking

#### 5. Policy Detail (`src/pages/operations/PolicyDetail/PolicyDetail.tsx`)
**Features:**
- Comprehensive policy information display
- Support for both motor and health insurance
- Search functionality (vehicle number, policy number, customer name)
- Insured persons section for health insurance
- Financial information breakdown
- Audit trail and activity timeline

**Key Components:**
- Policy search with multiple criteria
- Conditional rendering for motor vs. health insurance
- Financial metrics display
- Audit trail visualization

#### 6. Settings (`src/pages/operations/Settings/Settings.tsx`)
**Features:**
- Password change functionality
- Account settings management
- User preference configuration

### Founder Pages

#### 1. Company Overview (`src/pages/founders/CompanyOverview/CompanyOverview.tsx`)
**Features:**
- High-level financial metrics display
- 14-day trend chart for GWP and Net revenue
- Total OD breakdown with detailed analysis
- Real-time data source indicators

**Key Components:**
- `Tile` components for metrics display
- `Recharts` integration for trend visualization
- `TotalODBreakdown` component for detailed analysis

#### 2. KPI Dashboard (`src/pages/founders/KPIDashboard/KPIDashboard.tsx`)
**Features:**
- Comprehensive KPI calculations
- Business metrics and projections
- Financial ratios and performance indicators
- Settings-based calculations (brokerage percentage, rep costs, etc.)

**Key Components:**
- KPI calculation engine
- Business projection algorithms
- Financial ratio analysis
- Performance trend analysis

#### 3. Rep Leaderboard (`src/pages/founders/RepLeaderboard/PageLeaderboard.tsx`)
**Features:**
- Sales representative performance tracking
- Sortable metrics (converted, GWP, brokerage, cashback, net, total OD)
- PDF export functionality
- Performance comparison and ranking

**Key Components:**
- Sortable table with performance metrics
- PDF generation with jsPDF
- Performance ranking algorithms

#### 4. Sales Explorer (`src/pages/founders/SalesExplorer/PageExplorer.tsx`)
**Features:**
- Advanced filtering by make, model, insurer, branch, etc.
- Vehicle state prefix filtering (KA, MH, DL, etc.)
- Date range filtering (issue date, expiry date)
- Cashback percentage filtering
- CSV export functionality

**Key Components:**
- Multi-criteria filtering system
- Vehicle number prefix extraction
- State name mapping
- CSV export with formatted data

#### 5. Data Sources (`src/pages/founders/DataSource/DataSource.tsx`)
**Features:**
- Data source contribution analysis
- Bar chart visualization
- PDF vs Manual vs CSV comparison
- Data ingestion source tracking

**Key Components:**
- `Recharts` bar chart integration
- Data source aggregation
- Contribution analysis

#### 6. Payments (`src/pages/founders/Payments/Payments.tsx`)
**Features:**
- Executive payment tracking
- Month/year filtering
- Payment status management (received/pending)
- Executive summary and detailed views
- Payment marking functionality

**Key Components:**
- Payment status tracking
- Executive summary calculations
- Payment marking workflow
- Date filtering system

#### 7. Dev/Test (`src/pages/founders/DevTest/DevTest.tsx`)
**Features:**
- Lightweight testing for core form math
- Cashback calculation validation
- Test case execution and reporting
- No external testing framework dependency

**Key Components:**
- Test case execution engine
- Math validation algorithms
- Test result reporting

#### 8. Settings (`src/pages/founders/Settings/Settings.tsx`)
**Features:**
- Business settings management
- Telecaller management
- Password management
- User management
- Tabbed interface for different settings categories

**Key Components:**
- Tabbed settings interface
- Business settings configuration
- User management system
- Telecaller management

## Backend Architecture

### Server Configuration (`nicsan-crm-backend/server.js`)
**Features:**
- Express.js server with middleware setup
- CORS configuration
- JSON parsing and URL encoding
- WebSocket service initialization
- Health check endpoint
- Error handling and 404 middleware

### Database Configuration (`nicsan-crm-backend/config/database.js`)
**Features:**
- PostgreSQL connection pooling
- Database initialization with table creation
- Schema migration support
- Default data insertion
- Connection error handling

### AWS Configuration (`nicsan-crm-backend/config/aws.js`)
**Features:**
- S3 bucket configuration
- File upload and deletion
- JSON data storage and retrieval
- S3 key generation with insurer detection
- Environment-based key prefixes

### Storage Service (`nicsan-crm-backend/services/storageService.js`)
**Features:**
- Dual storage implementation
- Policy saving with validation
- PDF processing with OpenAI integration
- Dashboard metrics calculation
- Sales rep analysis
- Vehicle analysis
- Settings management
- Health insurance support

### OpenAI Service (`nicsan-crm-backend/services/openaiService.js`)
**Features:**
- PDF text extraction
- AI-powered data extraction
- Insurer-specific rules and validation
- Confidence scoring
- Automatic correction and validation
- Dynamic rule building based on manufacturing year

### WebSocket Service (`nicsan-crm-backend/services/websocketService.js`)
**Features:**
- Real-time cross-device synchronization
- Device registration and management
- User session tracking
- Policy change notifications
- Upload change notifications
- Dashboard update notifications
- Connection cleanup and management

## API Routes

### Authentication Routes (`nicsan-crm-backend/routes/auth.js`)
- User login with JWT token generation
- Password validation
- Token refresh functionality

### Policy Routes (`nicsan-crm-backend/routes/policies.js`)
- Policy CRUD operations
- Policy search (vehicle number, policy number)
- Duplicate policy number checking
- Manual form submission
- Grid entry batch processing

### Upload Routes (`nicsan-crm-backend/routes/upload.js`)
- PDF file upload with validation
- OpenAI processing integration
- Upload status tracking
- Upload confirmation workflow
- Email and WhatsApp integration

### Dashboard Routes (`nicsan-crm-backend/routes/dashboard.js`)
- Dashboard metrics calculation
- KPI data aggregation
- Sales rep analysis
- Vehicle analysis
- Financial metrics

### Settings Routes (`nicsan-crm-backend/routes/settings.js`)
- Business settings management
- Configuration updates
- Settings retrieval

## Services and Utilities

### Dual Storage Service (`src/services/dualStorageService.ts`)
**Features:**
- Backend API integration
- Mock data fallback
- Data source tracking
- Error handling and recovery
- Service abstraction layer

### Backend API Service (`src/services/backendApiService.ts`)
**Features:**
- HTTP client with authentication
- Token management and refresh
- API timeout handling
- Error handling and retry logic
- Request/response type definitions

### Cross-Device Sync Service (`src/services/crossDeviceSyncService.ts`)
**Features:**
- Offline data management
- Conflict resolution
- Data synchronization
- Status tracking
- Change notifications

### WebSocket Sync Service (`src/services/websocketSyncService.ts`)
**Features:**
- Real-time communication
- Device registration
- Message broadcasting
- Connection management
- Event handling

## AI and Machine Learning Integration

### OpenAI GPT-4o-mini Integration
**Features:**
- PDF text extraction and processing
- Insurer-specific data extraction rules
- Confidence scoring for extracted data
- Automatic validation and correction
- Dynamic rule building based on policy characteristics

**Insurer-Specific Rules:**
- TATA AIG: Dynamic rules based on manufacturing year
- DIGIT: Simplified extraction with null values for premium fields
- RELIANCE_GENERAL: Total Own Damage Premium extraction
- ICICI Lombard: Total Own Damage Premium (A) extraction
- LIBERTY GENERAL: Calculation validation for Total OD
- ROYAL SUNDARAM: NET PREMIUM (A + B) extraction
- HDFC ERGO: Total Package Premium (a+b) extraction
- ZURICH KOTAK: Calculation validation with Personal Accident Premium

## Real-Time Features

### Cross-Device Synchronization
**Features:**
- WebSocket-based real-time updates
- Device registration and management
- User session tracking
- Policy change notifications
- Upload status updates
- Dashboard refresh triggers

### Offline Support
**Features:**
- IndexedDB for offline data storage
- Conflict resolution mechanisms
- Data synchronization on reconnection
- Offline indicator and status tracking

## Security Features

### Authentication & Authorization
**Features:**
- JWT token-based authentication
- Password hashing with bcryptjs
- Role-based access control (ops vs. founder)
- Token refresh mechanisms
- Session management

### Data Validation
**Features:**
- Input validation and sanitization
- Business rule validation
- Cross-field validation
- File upload validation
- SQL injection prevention

### CORS and Security Headers
**Features:**
- CORS configuration for cross-origin requests
- Security headers implementation
- Rate limiting
- Error handling without information leakage

## Performance Optimizations

### Frontend Optimizations
**Features:**
- React 19 with modern hooks
- Component memoization
- Lazy loading for large datasets
- Efficient state management
- Optimized re-rendering

### Backend Optimizations
**Features:**
- Database connection pooling
- Query optimization
- Caching strategies
- Batch processing for grid entries
- Efficient file handling

### Data Management
**Features:**
- Dual storage pattern for reliability
- Fallback mechanisms
- Data source tracking
- Error recovery
- Performance monitoring

## Business Logic

### Policy Management
**Features:**
- Motor insurance policy handling
- Health insurance policy management
- Policy validation and verification
- Duplicate prevention
- Audit trail maintenance

### Financial Calculations
**Features:**
- Cashback percentage calculations
- Brokerage calculations
- Net revenue calculations
- KPI computations
- Business projections

### Reporting and Analytics
**Features:**
- Dashboard metrics
- KPI tracking
- Performance analysis
- Financial reporting
- Data visualization

## Integration Ecosystem

### External Services
**Features:**
- AWS S3 for file storage
- OpenAI for AI processing
- Email service integration
- WhatsApp integration
- PDF generation

### Data Sources
**Features:**
- PDF upload processing
- Manual form entry
- CSV import functionality
- Grid entry system
- API data integration

## Deployment Architecture

### Environment Configuration
**Features:**
- Development, staging, production environments
- Environment-specific configurations
- Database connection management
- AWS service configuration
- Debug mode controls

### Infrastructure Requirements
**Features:**
- Node.js runtime
- PostgreSQL database
- Redis for caching
- Nginx for reverse proxy
- AWS services (S3, etc.)

## Conclusion

NicsanCRM represents a comprehensive, modern insurance CRM solution with sophisticated architecture, AI-powered processing, real-time synchronization, and extensive business intelligence capabilities. The system successfully balances operational efficiency with analytical depth, providing both operational teams and founders with the tools they need to manage insurance policies effectively.

The dual storage pattern ensures data reliability, while the AI integration provides intelligent data extraction and processing. The real-time synchronization capabilities enable seamless cross-device collaboration, and the comprehensive reporting system provides valuable business insights.

The system is well-architected for scalability, maintainability, and extensibility, with clear separation of concerns and modern development practices throughout.