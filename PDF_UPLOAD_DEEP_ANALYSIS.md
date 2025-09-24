# PDF Upload Page - Deep Analysis: Data Storage Flow

## 📋 Overview

The PDF upload page in NicsanCRM implements a sophisticated dual-storage architecture where data flows through multiple storage layers after PDF upload and manual extras entry. This analysis examines the complete data storage flow from frontend to backend.

## 🔄 Complete Data Flow

### 1. Frontend Data Collection

#### Manual Extras Collection
```typescript
const [manualExtras, setManualExtras] = useState({
  executive: '',           // Sales rep name
  opsExecutive: '',        // Ops executive name
  callerName: '',         // Telecaller name (with autocomplete)
  mobile: '',             // Customer mobile
  customerEmail: '',     // Customer email
  rollover: '',          // Internal code
  remark: '',            // Additional notes
  brokerage: '0',        // Commission amount
  cashback: '',          // Total cashback
  customerPaid: '',      // Amount or text (e.g., 5000 or Pending)
  customerChequeNo: '',  // Customer's cheque number
  ourChequeNo: '',       // Company's cheque number
  customerName: '',      // Customer name
  branch: ''             // Branch name (required field)
});
```

#### PDF File Selection
- **File Types**: PDF only (validated by multer)
- **Size Limit**: 10MB maximum
- **Insurer Selection**: Required before upload
- **Validation**: Manual extras must be saved before PDF upload

### 2. Data Storage Architecture

#### Dual Storage Pattern
The system implements a sophisticated dual-storage pattern:

```
Frontend → Backend API → PostgreSQL (Primary) → AWS S3 (Secondary)
    ↓
Mock Data (Fallback)
```

#### Storage Layers
1. **Primary Storage**: PostgreSQL database
2. **Secondary Storage**: AWS S3 cloud storage
3. **Fallback Storage**: Mock data for development

### 3. Backend Data Processing

#### PDF Upload Route (`/api/upload/pdf`)
```javascript
router.post('/pdf', authenticateToken, requireOps, upload.single('pdf'), async (req, res) => {
  // 1. Extract manual extras from form data
  const manualExtras = {};
  Object.keys(req.body).forEach(key => {
    if (key.startsWith('manual_')) {
      const fieldName = key.replace('manual_', '');
      manualExtras[fieldName] = req.body[key];
    }
  });

  // 2. Create upload data structure
  const uploadData = {
    file: req.file,        // PDF file buffer
    insurer,              // Selected insurer
    manualExtras          // Manual extras object
  };

  // 3. Save to dual storage
  const result = await storageService.savePDFUpload(uploadData);
});
```

#### Storage Service Implementation
```javascript
async savePDFUpload(uploadData) {
  const { file, insurer, manualExtras } = uploadData;
  
  // 1. Upload to S3 (Primary Storage) with insurer detection
  const s3Key = await generateS3Key(file.originalname, insurer, file.buffer);
  const s3Result = await uploadToS3(file, s3Key);
  
  // 2. Save metadata to PostgreSQL (Secondary Storage)
  const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  
  const pgQuery = `
    INSERT INTO pdf_uploads (upload_id, filename, s3_key, insurer, status, manual_extras)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  
  const pgResult = await query(pgQuery, [
    uploadId,
    file.originalname,
    s3Key,
    insurer,
    'UPLOADED',
    JSON.stringify(manualExtras || {})
  ]);
}
```

### 4. Database Schema

#### PDF Uploads Table
```sql
CREATE TABLE pdf_uploads (
  id SERIAL PRIMARY KEY,
  upload_id VARCHAR(255) UNIQUE NOT NULL,
  filename VARCHAR(255) NOT NULL,
  s3_key VARCHAR(500) NOT NULL,
  s3_url VARCHAR(500),
  insurer VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'UPLOADED',
  manual_extras JSONB,
  extracted_data JSONB,
  processing_errors TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Policies Table (After Confirmation)
```sql
CREATE TABLE policies (
  id SERIAL PRIMARY KEY,
  policy_number VARCHAR(255) UNIQUE NOT NULL,
  vehicle_number VARCHAR(255) NOT NULL,
  insurer VARCHAR(255) NOT NULL,
  caller_name VARCHAR(255),
  branch VARCHAR(255),
  mobile VARCHAR(20),
  issue_date DATE,
  expiry_date DATE,
  rollover VARCHAR(50),
  total_premium DECIMAL(15,2),
  total_od DECIMAL(15,2),
  net_od DECIMAL(15,2),
  net_premium DECIMAL(15,2),
  cashback_percent DECIMAL(5,2),
  cashback_amount DECIMAL(15,2),
  brokerage DECIMAL(15,2),
  net_revenue DECIMAL(15,2),
  s3_key VARCHAR(500),
  source VARCHAR(50) DEFAULT 'PDF_UPLOAD',
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. AWS S3 Storage

#### S3 Key Generation
```javascript
const generateS3Key = async (filename, selectedInsurer, fileBuffer) => {
  // Detect insurer from PDF content
  const detectedInsurer = await insurerDetectionService.detectInsurerFromPDF(fileBuffer);
  
  // Use detected insurer if available, otherwise use selected insurer
  const insurer = detectedInsurer !== 'UNKNOWN' ? detectedInsurer : selectedInsurer;
  
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const extension = filename.split('.').pop();
  
  // Add environment prefix for staging
  const envPrefix = process.env.ENVIRONMENT === 'staging' ? 'local-staging/' : '';
  return `${envPrefix}uploads/${insurer}/${timestamp}_${randomId}.${extension}`;
};
```

#### S3 Storage Structure
```
nicsan-crm-uploads/
├── local-staging/                    # Staging environment
│   └── uploads/
│       ├── TATA_AIG/
│       │   ├── 1703123456789_abc123.pdf
│       │   └── 1703123456790_def456.pdf
│       ├── DIGIT/
│       │   └── 1703123456791_ghi789.pdf
│       └── RELIANCE_GENERAL/
│           └── 1703123456792_jkl012.pdf
└── uploads/                         # Production environment
    └── [same structure]
```

### 6. Data Processing Flow

#### Step 1: PDF Upload
1. **Frontend**: User selects insurer and fills manual extras
2. **Validation**: Manual extras must be saved before PDF upload
3. **Upload**: PDF file sent to backend with FormData
4. **Backend**: File received via multer middleware
5. **Storage**: PDF uploaded to S3 with insurer-specific key
6. **Database**: Upload metadata saved to PostgreSQL

#### Step 2: AI Processing
1. **Trigger**: Automatic OpenAI processing after upload
2. **Extraction**: PDF text extracted using pdf-parse
3. **AI Analysis**: GPT-4o-mini processes text with insurer-specific prompts
4. **Validation**: Extracted data validated and corrected
5. **Storage**: Results stored in `extracted_data` JSONB field

#### Step 3: Review & Confirmation
1. **Frontend**: User reviews extracted data
2. **Editing**: User can modify extracted fields
3. **Confirmation**: User confirms or rejects data
4. **Policy Creation**: Confirmed data saved as policy
5. **Dual Storage**: Policy saved to both PostgreSQL and S3

### 7. Real-time Synchronization

#### WebSocket Integration
```javascript
// Notify WebSocket clients of policy creation
websocketService.notifyPolicyChange(policyData.userId || 'system', 'created', savedPolicy);
```

#### Cross-Device Sync
- **Device Registration**: Each device registers with unique ID
- **User Sessions**: Track user sessions across devices
- **Real-time Updates**: Broadcast changes to all connected devices
- **Conflict Resolution**: Handle simultaneous edits

### 8. Data Validation

#### Frontend Validation
```typescript
// Required field validation
if (!manualExtras.branch || manualExtras.branch.trim() === '') {
  alert('Branch field is required! Please enter branch name.');
  return;
}

// Vehicle number format validation
const cleanVehicleNumber = policyData.vehicle_number.replace(/\s/g, '');
const traditionalPattern = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;
const bhSeriesPattern = /^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$/;

if (!traditionalPattern.test(cleanVehicleNumber) && !bhSeriesPattern.test(cleanVehicleNumber)) {
  throw new Error(`Invalid vehicle number format: ${policyData.vehicle_number}`);
}
```

#### Backend Validation
```javascript
// Duplicate policy number check
const isDuplicate = await this.checkPolicyNumberExists(policy_number);
if (isDuplicate) {
  throw new Error(`Policy number '${policy_number}' already exists. Please use a different policy number.`);
}

// Required fields validation
if (!policyData.policy_number || !policyData.vehicle_number) {
  return res.status(400).json({
    success: false,
    error: 'Policy number and vehicle number are required'
  });
}
```

### 9. Error Handling

#### Insurer Mismatch Detection
```javascript
// Handle insurer mismatch error specifically
if (result.data?.status === 'INSURER_MISMATCH') {
  setUploadStatus(`❌ Insurer Mismatch: ${result.error}`);
  
  // Add to uploaded files list with INSURER_MISMATCH status
  const newFile = {
    id: result.data.uploadId,
    filename: file.name,
    status: 'INSURER_MISMATCH',
    insurer: selectedInsurer,
    s3_key: result.data?.s3Key || `uploads/${Date.now()}_${file.name}`,
    time: new Date().toLocaleTimeString(),
    size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
    extracted_data: {
      insurer: selectedInsurer,
      status: 'INSURER_MISMATCH',
      error: result.error
    }
  };
}
```

#### Fallback Mechanisms
```javascript
// Dual storage pattern with fallback
return this.executeDualStoragePattern(
  () => this.backendApiService.uploadPDF(file, manualExtras, insurer),
  mockData,
  'Upload PDF'
);
```

### 10. Data Persistence

#### Local Storage (Frontend)
```javascript
// Save to localStorage so Review page can access it
const allUploads = [newFile, ...uploadedFiles];
localStorage.setItem('nicsan_crm_uploads', JSON.stringify(allUploads));
console.log('💾 Saved uploads to localStorage:', allUploads);
```

#### Database Persistence
```javascript
// PostgreSQL insert with JSONB for manual extras
const pgQuery = `
  INSERT INTO pdf_uploads (upload_id, filename, s3_key, insurer, status, manual_extras)
  VALUES ($1, $2, $3, $4, $5, $6)
  RETURNING *
`;

const pgResult = await query(pgQuery, [
  uploadId,
  file.originalname,
  s3Key,
  insurer,
  'UPLOADED',
  JSON.stringify(manualExtras || {})
]);
```

#### S3 Persistence
```javascript
// Upload PDF to S3 with insurer-specific key
const s3Result = await uploadToS3(file, s3Key);

// Save policy data as JSON to S3
const s3Key = generatePolicyS3Key(policyId, policyData.source);
const s3Result = await uploadJSONToS3(policyData, s3Key);
```

## 🔍 Key Storage Locations

### 1. **Frontend Storage**
- **localStorage**: Upload history and temporary data
- **State Management**: React state for form data
- **Session Storage**: User authentication tokens

### 2. **Backend Database (PostgreSQL)**
- **pdf_uploads**: Upload metadata and status
- **policies**: Confirmed policy data
- **users**: User authentication and roles
- **settings**: System configuration

### 3. **Cloud Storage (AWS S3)**
- **PDF Files**: Original uploaded PDFs
- **JSON Data**: Structured policy data
- **Backups**: Data redundancy and recovery

### 4. **AI Processing**
- **OpenAI API**: PDF text extraction and analysis
- **Insurer Detection**: Automatic insurer identification
- **Data Validation**: Confidence scoring and error detection

## 📊 Data Flow Summary

```
User Input → Frontend Validation → Backend API → PostgreSQL → AWS S3
     ↓
Manual Extras → FormData → Backend Processing → Database Storage
     ↓
PDF File → Multer → S3 Upload → Metadata Storage → AI Processing
     ↓
Extracted Data → Validation → Review → Confirmation → Policy Creation
     ↓
Final Policy → Dual Storage → WebSocket Sync → Cross-Device Updates
```

## 🎯 Conclusion

The PDF upload page implements a comprehensive data storage system with:

- **Dual Storage Architecture**: PostgreSQL + AWS S3 for high availability
- **Real-time Synchronization**: WebSocket-based cross-device updates
- **AI Integration**: OpenAI for intelligent PDF processing
- **Data Validation**: Multi-layer validation and error handling
- **Fallback Mechanisms**: Mock data for development and testing
- **Security**: JWT authentication and role-based access control

This architecture ensures data integrity, high availability, and seamless user experience across all devices and scenarios.
