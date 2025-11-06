# PDF Upload Page - In-Depth Analysis

## 📋 Overview

The PDF Upload page (`src/pages/operations/PDFUpload/PDFUpload.tsx`) is a comprehensive document processing system that allows operations staff to upload insurance policy PDFs, extract data using AI (OpenAI GPT-4o-mini), and combine AI-extracted data with manual entries from sales representatives.

---

## 🏗️ Architecture & Data Flow

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/TypeScript)                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ PDFUpload.tsx Component                                   │  │
│  │  - User Interface                                         │  │
│  │  - Manual Extras Form                                     │  │
│  │  - File Upload (Drag & Drop)                              │  │
│  │  - Status Polling                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ DualStorageService                                        │  │
│  │  - Backend API → Mock Data Fallback Pattern               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js/Express)                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ POST /upload/pdf                                          │  │
│  │  - Receives PDF + Manual Extras                          │  │
│  │  - Validates insurer selection                           │  │
│  │  - Saves to S3 (Primary)                                  │  │
│  │  - Saves metadata to PostgreSQL (Secondary)               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ StorageService.savePDFUpload()                           │  │
│  │  - Generates unique upload ID                             │  │
│  │  - Uploads PDF to AWS S3                                  │  │
│  │  - Saves metadata to pdf_uploads table                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ StorageService.processPDF() (Auto-triggered)              │  │
│  │  - Downloads PDF from S3                                  │  │
│  │  - Converts PDF to text (pdf-parse)                       │  │
│  │  - Calls OpenAI GPT-4o-mini for extraction                │  │
│  │  - Updates status to 'REVIEW'                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ OpenAIService.extractPolicyData()                         │  │
│  │  - Uses insurer-specific extraction rules                │  │
│  │  - Returns structured JSON data                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Component Structure

### Main Component: `PageUpload`

**Location:** `src/pages/operations/PDFUpload/PDFUpload.tsx`

**Key State Variables:**
- `uploadStatus`: Current upload/processing status message
- `uploadedFiles`: Array of uploaded PDF files with metadata
- `selectedInsurer`: Currently selected insurer (default: 'TATA_AIG')
- `manualExtras`: Manual data entered by user (sales rep info, telecaller, etc.)
- `manualExtrasSaved`: Boolean flag indicating if manual extras have been saved
- `uploadedDocuments`: Additional documents (Aadhaar, PAN, RC)
- `callerNames`: List of telecaller names for autocomplete

**Key Features:**
1. **Two-Step Workflow**: Manual extras must be saved before PDF upload
2. **Real-time Status Polling**: Polls backend every 2 seconds for processing status
3. **Drag & Drop Interface**: User-friendly file upload
4. **Additional Documents**: Support for Aadhaar, PAN, RC uploads
5. **Upload History Table**: Shows all uploaded files with status

---

## 🔄 Detailed Workflow

### Step 1: Manual Extras Entry

**Purpose:** Collect manual information from sales representatives that may not be in the PDF.

**Fields:**
- **Executive**: Auto-filled from current logged-in user (disabled input)
- **Ops Executive**: Dropdown (NA, Ravi, Pavan, Manjunath)
- **Caller Name**: Autocomplete with suggestions + "Add new" option
- **Mobile Number**: Customer phone number
- **Rollover/Renewal**: Dropdown (ROLLOVER, RENEWAL)
- **Customer Email ID**: Email validation (must be valid email or "N/A")
- **Cashback (₹)**: Cashback amount
- **Customer Paid (₹)**: Amount or text (e.g., "Pending")
- **Customer Cheque No**: Customer's cheque number
- **Our Cheque No**: Company cheque number
- **Product Type**: Dropdown (Life, Motor, Health, Travel, Home, Cyber Insurance)
- **Vehicle Type**: Dropdown (Private Car, GCV, LCV, MCV, HCV)
- **Branch**: Required dropdown (MYSORE, BANASHANKARI, ADUGODI)
- **Payment Method**: INSURER or NICSAN
- **Payment Sub-Method**: (if NICSAN) DIRECT or EXECUTIVE
- **Remark**: Free text

**Validation Rules:**
1. Branch is **required** (must be selected)
2. Caller Name must exist in database (validated before save)
3. Customer Email must be valid format or "N/A"
4. At least one field must be filled

**Save Process:**
- Validates all fields
- Sets `manualExtrasSaved = true`
- Shows success message: "✅ Manual extras saved! Now drop your PDF..."

### Step 2: PDF Upload

**Prerequisites:**
- Manual extras must be saved (`manualExtrasSaved === true`)
- Insurer must be selected

**Upload Process:**
1. User drags/drops PDF or clicks "browse files"
2. `handleFiles()` function triggered
3. Creates FormData with:
   - PDF file
   - Selected insurer
   - All manual extras (prefixed with `manual_`)
4. Calls `DualStorageService.uploadPDF()`
5. Backend receives at `POST /upload/pdf`
6. Backend saves PDF to S3 and metadata to PostgreSQL
7. Backend **auto-triggers** OpenAI processing
8. Frontend receives upload ID and starts polling

**Backend Processing:**
- `storageService.savePDFUpload()` saves PDF to S3
- `storageService.processPDF()` automatically called
- OpenAI extracts data from PDF
- Status updated to 'REVIEW' when complete

### Step 3: Status Polling

**Polling Mechanism:**
- `pollUploadStatus()` function polls every 2 seconds
- Maximum 30 attempts (60 seconds total)
- Calls `DualStorageService.getUploadById(uploadId)`
- Updates local state and localStorage with status

**Status Transitions:**
- `UPLOADED` → Initial state after upload
- `PROCESSING` → OpenAI extraction in progress
- `REVIEW` → Extraction complete, ready for review
- `COMPLETED` → Policy confirmed and saved
- `FAILED` → Processing failed
- `INSURER_MISMATCH` → Detected insurer doesn't match selected insurer

**Notifications:**
- Browser notification when status becomes 'REVIEW'
- Alert popup: "🎉 PDF processed successfully! Ready for review."

---

## 🤖 AI Processing (OpenAI Integration)

### Insurer-Specific Extraction Rules

The system uses **dynamic extraction rules** based on the selected insurer:

#### TATA AIG (Dynamic Rules Based on Manufacturing Year)
- **2022 and below:**
  - Total OD = Net OD + Add on Premium (C)
  - Net OD from "Total Own Damage Premium (A)"
- **2023 and above:**
  - Total OD = Net Premium (same value)
  - Net Premium from "Net Premium" or "Net Premium (₹)"

#### DIGIT
- **PROHIBITED**: Does not extract Net OD, Total OD, Net Premium, Total Premium
- These fields return `null`
- Enhanced model extraction (includes variant, transmission, BSVI)

#### RELIANCE GENERAL
- Net OD, Total OD, Net Premium from "Total Own Damage Premium"
- Total Premium from "Total Premium Payable"

#### Other Insurers
- ICICI Lombard, Liberty General, Royal Sundaram, HDFC ERGO, Zurich Kotak
- Each has specific field extraction rules

### OpenAI Service Flow

1. **Download PDF from S3**: `downloadFromS3(s3Key)`
2. **Convert PDF to Text**: `convertPDFToText(pdfBuffer)` using `pdf-parse`
3. **Extract Manufacturing Year**: From PDF text (for TATA AIG rules)
4. **Build Dynamic Prompt**: Includes insurer-specific rules
5. **Call OpenAI GPT-4o-mini**: `client.chat.completions.create()`
6. **Parse Response**: Extract JSON from markdown code blocks
7. **Auto-Correct**: TATA AIG validation and correction logic
8. **Return Extracted Data**: Structured JSON with confidence score

### Data Validation & Auto-Correction

**IDV Validation:**
- Removes policy year prefix if detected (e.g., "2024495000" → 495000)
- Validates IDV is within reasonable range (100,000 - 10,000,000)

**TATA AIG Auto-Correction:**
- **2022-**: Validates Total OD = Net OD + Add on Premium (C)
- **2023+**: Validates Total OD = Net Premium
- Auto-corrects if validation fails

---

## 📊 Data Storage

### Dual Storage Pattern

**Primary Storage (S3):**
- PDF file stored at: `uploads/{insurer}/{timestamp}_{filename}`
- JSON data stored at: `policies/{policyId}.json`

**Secondary Storage (PostgreSQL):**
- `pdf_uploads` table:
  - `upload_id`: Unique identifier
  - `filename`: Original filename
  - `s3_key`: S3 key for PDF
  - `insurer`: Selected insurer
  - `status`: Current status (UPLOADED, PROCESSING, REVIEW, COMPLETED, FAILED)
  - `manual_extras`: JSON object with manual data
  - `extracted_data`: JSON object with AI-extracted data
  - `created_at`: Timestamp

### Data Flow After Upload

1. **Immediate**: PDF saved to S3, metadata saved to PostgreSQL
2. **Auto-Processing**: OpenAI extraction triggered automatically
3. **Status Update**: Status changes to 'REVIEW' when complete
4. **Review Page**: User can review and edit extracted data
5. **Confirmation**: Policy created from combined data
6. **Notifications**: Email and WhatsApp sent to customer (background)

---

## 🔍 Key Features

### 1. Telecaller Autocomplete

**Implementation:**
- `LabeledAutocompleteInput` component
- Loads telecallers on mount from `DualStorageService.getTelecallers()`
- Filters suggestions as user types (minimum 2 characters)
- Shows "Add new telecaller" option if no matches
- Validates telecaller exists in database before saving

**Add New Telecaller:**
- Calls `DualStorageService.addTelecaller()`
- Auto-selects newly added telecaller
- Refreshes suggestions list

### 2. Additional Documents Upload

**Supported Documents:**
- **Aadhaar Card**: ID proof
- **PAN Card**: Tax document
- **RC Document**: Vehicle registration

**Upload Process:**
- Each document type has separate upload button
- Validates file type (JPG, PNG, PDF)
- Validates file size (max 5MB)
- Links to PDF upload via `pdf_upload_id`
- Stores in `document_uploads` table

**Storage:**
- Documents stored in S3
- Metadata in PostgreSQL
- Linked to policy via `policy_number` (updated after policy creation)

### 3. Insurer Mismatch Detection

**Detection:**
- OpenAI extracts insurer name from PDF
- Compares with selected insurer
- If mismatch: Status set to `INSURER_MISMATCH`
- Upload continues (doesn't fail)

**User Experience:**
- Warning shown in upload status
- File still appears in upload history
- Can be reviewed and corrected

### 4. User Change Detection

**Implementation:**
- Uses `useUserChange()` hook
- Detects when logged-in user changes
- Resets all form state:
  - Clears manual extras
  - Clears upload status
  - Clears uploaded files
  - Resets document uploads

**Purpose:** Prevents data mixing between different users

---

## 🔐 Security & Validation

### Authentication
- Requires `authenticateToken` middleware
- Requires `requireOps` role (operations staff only)
- JWT token in Authorization header

### File Validation
- **File Type**: Only PDF, JPG, PNG allowed
- **File Size**: Max 10MB for PDFs, 5MB for documents
- **Multer**: Memory storage (no disk writes)

### Data Validation
- **Policy Number**: Must be unique (checked before save)
- **Vehicle Number**: Format validation (traditional or BH series)
- **Customer Email**: Format validation or "N/A"
- **Telecaller**: Must exist in database and be active
- **Branch**: Required field

### Financial Validation
- Premium, IDV, cashback, brokerage validated
- Uses `financialValidation.js` utilities
- Prevents invalid financial data

---

## 📱 Integration Points

### Review & Confirm Page
- Uploaded PDFs appear on Review page
- Combined data (AI + Manual) shown for editing
- User can edit any field before confirming

### Policy Creation
- On confirmation, policy created from combined data
- `POST /upload/:uploadId/confirm` endpoint
- Policy saved to `policies` table
- Upload status updated to 'COMPLETED'

### Customer Notifications
- **Email**: Policy PDF sent via `emailService.sendPolicyPDF()`
- **WhatsApp**: Policy PDF sent via `whatsappService.sendPolicyWhatsApp()`
- Runs in background (non-blocking)

---

## 🐛 Error Handling

### Upload Errors
- **No PDF file**: Returns 400 error
- **No insurer selected**: Frontend validation
- **Manual extras not saved**: Frontend validation
- **File too large**: Multer error
- **Invalid file type**: Multer error

### Processing Errors
- **OpenAI failure**: Falls back to mock data
- **PDF parsing error**: Logged, continues with mock data
- **Insurer mismatch**: Logged, status set to 'INSURER_MISMATCH'

### Network Errors
- **Backend unavailable**: Falls back to mock data (read operations)
- **Save operations**: Error propagated (no fallback)
- **Polling timeout**: Shows timeout message after 60 seconds

---

## 📈 Performance Considerations

### Upload Performance
- **S3 Upload**: Asynchronous, non-blocking
- **Database Save**: Fast (metadata only)
- **OpenAI Processing**: Asynchronous, runs in background

### Polling Optimization
- **Interval**: 2 seconds (reasonable balance)
- **Max Attempts**: 30 (60 seconds total)
- **Stops Early**: When status becomes REVIEW or COMPLETED

### Memory Management
- **Multer**: Memory storage (file in RAM temporarily)
- **PDF Buffer**: Loaded into memory for processing
- **Large Files**: 10MB limit prevents memory issues

---

## 🔄 State Management

### Local State
- React `useState` hooks for all component state
- No global state management (Redux, Zustand, etc.)

### Persistent Storage
- **localStorage**: Stores upload history (`nicsan_crm_uploads`)
- **PostgreSQL**: Primary data storage
- **S3**: File storage

### State Reset
- User change detection resets all state
- Manual extras cleared after successful upload
- Document uploads persist until user change

---

## 🎨 UI/UX Features

### Visual Feedback
- **Status Colors**: Different colors for different statuses
- **Progress Indicators**: Step indicators (1. Save Manual Extras, 2. Upload PDF)
- **Loading States**: Spinner during suggestions loading
- **Success Messages**: Green checkmarks and success messages

### Accessibility
- **Labels**: All inputs have labels
- **Required Fields**: Marked with red asterisk
- **Error Messages**: Clear error messages
- **Keyboard Navigation**: Standard form navigation

### Responsive Design
- **Grid Layout**: Responsive grid (1 column mobile, 2 columns desktop)
- **Table**: Horizontal scroll on mobile
- **Buttons**: Full-width on mobile

---

## 🔧 Technical Implementation Details

### File Upload
- **multer**: Handles multipart/form-data
- **Memory Storage**: Files stored in RAM, not disk
- **FormData**: Frontend creates FormData object

### API Integration
- **DualStorageService**: Wrapper for backend API
- **BackendApiService**: Direct API calls
- **Fallback Pattern**: Mock data on API failure (read only)

### PDF Processing
- **pdf-parse**: Converts PDF to text
- **OpenAI GPT-4o-mini**: Extracts structured data
- **Temperature**: 0.1 (low temperature for consistency)
- **Max Tokens**: 1000 (sufficient for JSON response)

### Database Operations
- **Knex.js**: Not used (direct `pg` queries)
- **Parameterized Queries**: Prevents SQL injection
- **Transactions**: Not used (single operations)

---

## 📝 Future Enhancements (Potential)

1. **Bulk Upload**: Multiple PDFs at once
2. **Batch Processing**: Process multiple uploads in parallel
3. **Progress Bar**: Real-time upload progress
4. **Retry Logic**: Automatic retry on failure
5. **Upload Queue**: Queue system for high-volume
6. **Webhook Support**: Real-time status updates instead of polling
7. **OCR Fallback**: Tesseract OCR if OpenAI fails
8. **PDF Preview**: Show PDF before upload
9. **Edit Before Upload**: Edit metadata before processing
10. **Template Matching**: Pre-fill from templates

---

## 🎯 Summary

The PDF Upload page is a sophisticated document processing system that:

1. **Collects Manual Data**: From sales representatives
2. **Uploads PDFs**: To S3 with metadata to PostgreSQL
3. **AI Extraction**: Uses OpenAI GPT-4o-mini with insurer-specific rules
4. **Real-time Status**: Polling for processing updates
5. **Additional Documents**: Supports Aadhaar, PAN, RC uploads
6. **Validation**: Comprehensive validation at multiple levels
7. **Error Handling**: Graceful fallbacks and error messages
8. **Integration**: Seamlessly integrates with Review page and policy creation

**Key Strengths:**
- Robust dual storage pattern
- Insurer-specific AI extraction rules
- Comprehensive validation
- Good error handling
- User-friendly interface

**Areas for Improvement:**
- Polling could be replaced with WebSockets
- Bulk upload support
- More detailed progress indicators
- Better error recovery mechanisms

