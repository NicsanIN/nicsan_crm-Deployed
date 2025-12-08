# WhatsApp Bulk Messaging Feature

## 📋 Overview

The WhatsApp Bulk Messaging feature allows operations users to send WhatsApp messages to multiple customers simultaneously. This feature is designed for quick customer notifications and follow-ups, particularly useful for contacting customers about their vehicle information.

## ✨ Features

- **Bulk Messaging**: Send WhatsApp messages to multiple customers at once
- **Data Validation**: Automatic validation of phone numbers and vehicle numbers
- **Rate Limiting**: Built-in rate limiting (100ms delay) to comply with WhatsApp API limits
- **Database Storage**: All sent messages are stored in the database for audit trail
- **Status Tracking**: Real-time status updates for each message (pending, sending, sent, error)
- **Error Handling**: Comprehensive error handling with detailed error messages
- **User Tracking**: Tracks which user sent each message

## 🏗️ Architecture

### Frontend Component
- **Location**: `src/pages/operations/WhatsAppBulk/WhatsAppBulk.tsx`
- **Navigation**: Operations → WhatsApp Bulk
- **UI**: Table-based interface similar to Grid Entry page

### Backend API
- **Route**: `nicsan-crm-backend/routes/whatsapp.js`
- **Endpoint**: `POST /api/whatsapp/bulk-send`
- **Authentication**: Required (JWT token)
- **Authorization**: Operations role required

### Database
- **Table**: `whatsapp_bulk_messages`
- **Schema**: See Database Schema section below

## 📊 Database Schema

### Table: `whatsapp_bulk_messages`

```sql
CREATE TABLE whatsapp_bulk_messages (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  vehicle_number VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  whatsapp_message_id VARCHAR(255),
  error_message TEXT,
  sent_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes

```sql
CREATE INDEX idx_whatsapp_bulk_messages_phone ON whatsapp_bulk_messages(phone_number);
CREATE INDEX idx_whatsapp_bulk_messages_status ON whatsapp_bulk_messages(status);
CREATE INDEX idx_whatsapp_bulk_messages_created_at ON whatsapp_bulk_messages(created_at DESC);
```

### Fields Description

| Field | Type | Description |
|-------|------|-------------|
| `id` | SERIAL | Primary key, auto-increment |
| `customer_name` | VARCHAR(255) | Customer's name |
| `phone_number` | VARCHAR(20) | Phone number (formatted with +91) |
| `vehicle_number` | VARCHAR(255) | Vehicle registration number |
| `status` | VARCHAR(50) | Message status: 'SENT' or 'FAILED' |
| `whatsapp_message_id` | VARCHAR(255) | WhatsApp API message ID (if successful) |
| `error_message` | TEXT | Error details (if failed) |
| `sent_by` | INTEGER | User ID who sent the message (foreign key to users table) |
| `created_at` | TIMESTAMP | When the message was sent |
| `updated_at` | TIMESTAMP | Last update timestamp |

## 🔌 API Endpoint

### POST `/api/whatsapp/bulk-send`

Send WhatsApp messages to multiple customers.

#### Authentication
- **Required**: Yes
- **Method**: Bearer Token (JWT)
- **Role**: Operations, Founder, or Admin

#### Request Body

```json
{
  "entries": [
    {
      "customer_name": "John Doe",
      "phone_number": "9876543210",
      "vehicle_number": "KA01AB1234"
    },
    {
      "customer_name": "Jane Smith",
      "phone_number": "9876543211",
      "vehicle_number": "KA02CD5678"
    }
  ]
}
```

#### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `entries` | Array | Yes | Array of customer entries |
| `entries[].customer_name` | String | Yes | Customer's name |
| `entries[].phone_number` | String | Yes | Phone number (10 digits starting with 6-9) |
| `entries[].vehicle_number` | String | Yes | Vehicle registration number |

#### Response (Success)

```json
{
  "success": true,
  "data": {
    "total": 2,
    "successful": 2,
    "failed": 0,
    "results": [
      {
        "index": 0,
        "success": true,
        "messageId": "wamid.xxx",
        "customer_name": "John Doe",
        "phone_number": "+919876543210",
        "vehicle_number": "KA01AB1234"
      },
      {
        "index": 1,
        "success": true,
        "messageId": "wamid.yyy",
        "customer_name": "Jane Smith",
        "phone_number": "+919876543211",
        "vehicle_number": "KA02CD5678"
      }
    ]
  }
}
```

#### Response (Error)

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "Row 1: Customer name is required",
    "Row 2: Invalid phone number format"
  ]
}
```

## 📱 WhatsApp Message Template

The system automatically generates messages using the following template:

```
🏆 *Nicsan Insurance*

Dear {customer_name},

Your vehicle {vehicle_number} information has been received.

We will contact you shortly regarding your insurance needs.

Best regards,
*Nicsan Insurance Team*
```

## ✅ Validation Rules

### Phone Number Validation
- **Format**: 10 digits starting with 6-9
- **Accepted formats**:
  - `9876543210` (10 digits)
  - `+919876543210` (with country code)
  - `919876543210` (without + prefix)
- **Auto-formatting**: Automatically adds `+91` prefix if missing

### Vehicle Number Validation
- **Traditional format**: `KA01AB1234` (2 letters, 2 digits, 1-2 letters, 4 digits)
- **BH Series format**: `23BH7699J` (2 digits, BH, 4 digits, 1-2 letters)
- **Case**: Automatically converted to uppercase

### Customer Name Validation
- **Required**: Yes
- **Min length**: 1 character
- **Trimmed**: Leading/trailing spaces removed

## ⚡ Rate Limiting

- **Delay**: 100ms between messages
- **Reason**: WhatsApp API limit is 10 messages/second
- **Implementation**: Automatic delay between each message send

## 🎯 Usage Guide

### Frontend Usage

1. **Navigate to WhatsApp Bulk**
   - Go to Operations → WhatsApp Bulk

2. **Add Entries**
   - Click "Add New Row" button
   - Fill in Customer Name, Phone Number, and Vehicle Number

3. **Validate Entries**
   - Click "Validate All" to check all entries before sending
   - Fix any validation errors shown

4. **Send Messages**
   - Click "Send All" button
   - Watch real-time status updates for each row
   - Green = Sent successfully
   - Red = Failed

5. **Clear Entries**
   - Click "Clear All" to remove all rows
   - Or click delete icon (🗑️) to remove individual rows

### Status Indicators

- **Pending** (no indicator): Entry not yet sent
- **Sending** (blue): Message is being sent
- **Sent** (green): Message sent successfully
- **Error** (red): Message failed to send

## 🔍 Error Handling

### Common Errors

1. **Invalid Phone Number**
   - Error: "Invalid phone number format. Must be 10 digits starting with 6-9"
   - Solution: Check phone number format

2. **Invalid Vehicle Number**
   - Error: "Invalid vehicle number format"
   - Solution: Use standard Indian vehicle number format

3. **WhatsApp API Error**
   - Error: Various WhatsApp API errors
   - Solution: Check WhatsApp API configuration and rate limits

4. **Database Error**
   - Error: "Failed to store WhatsApp message in database"
   - Solution: Check database connection and table existence

## 📈 Database Queries

### Get All Sent Messages

```sql
SELECT * FROM whatsapp_bulk_messages 
ORDER BY created_at DESC;
```

### Get Successful Messages

```sql
SELECT * FROM whatsapp_bulk_messages 
WHERE status = 'SENT' 
ORDER BY created_at DESC;
```

### Get Failed Messages

```sql
SELECT * FROM whatsapp_bulk_messages 
WHERE status = 'FAILED' 
ORDER BY created_at DESC;
```

### Get Messages by User

```sql
SELECT * FROM whatsapp_bulk_messages 
WHERE sent_by = 1 
ORDER BY created_at DESC;
```

### Get Messages by Date Range

```sql
SELECT * FROM whatsapp_bulk_messages 
WHERE created_at BETWEEN '2024-01-01' AND '2024-01-31'
ORDER BY created_at DESC;
```

### Statistics

```sql
-- Total messages sent
SELECT COUNT(*) as total FROM whatsapp_bulk_messages;

-- Success rate
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN status = 'SENT' THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed,
  ROUND(100.0 * SUM(CASE WHEN status = 'SENT' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM whatsapp_bulk_messages;
```

## 🔐 Security

- **Authentication**: JWT token required
- **Authorization**: Only Operations, Founder, and Admin roles can access
- **Input Validation**: All inputs are validated before processing
- **SQL Injection Protection**: Parameterized queries used
- **Rate Limiting**: Built-in rate limiting to prevent abuse

## 🚀 Setup & Installation

### Database Setup

The table is automatically created when the database initializes. If you need to create it manually:

```sql
-- Run the SQL from Database Schema section above
-- Or run: npm run init-db
```

### Environment Variables

Ensure these WhatsApp environment variables are set:

```env
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
```

### Testing

1. **Test Single Entry**
   ```bash
   curl -X POST http://localhost:3001/api/whatsapp/bulk-send \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "entries": [{
         "customer_name": "Test Customer",
         "phone_number": "9876543210",
         "vehicle_number": "KA01AB1234"
       }]
     }'
   ```

2. **Test Multiple Entries**
   - Use the frontend interface
   - Add multiple rows
   - Click "Send All"

## 📝 Notes

- **Message Text**: The message text is NOT stored in the database (only customer info and status)
- **Rate Limiting**: 100ms delay ensures compliance with WhatsApp's 10 messages/second limit
- **Error Recovery**: Failed messages are stored in database for retry capability
- **User Tracking**: All messages are linked to the user who sent them
- **WhatsApp Message ID**: Stored for successful sends for tracking purposes

## 🔄 Future Enhancements

Potential improvements:
- Retry failed messages functionality
- Message template customization
- Scheduled sending
- Export sent messages to CSV
- Analytics dashboard for sent messages
- Duplicate phone number detection
- Bulk import from CSV/Excel

## 📞 Support

For issues or questions:
- Check error messages in the UI
- Review server logs for detailed errors
- Verify WhatsApp API configuration
- Check database connection

## 📄 Related Documentation

- [WhatsApp Service Documentation](../services/whatsappService.js)
- [Main README](../README.md)
- [API Documentation](../README.md#api-documentation)

---

**Last Updated**: January 2025
**Version**: 1.0.0
