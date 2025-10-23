# Daily Total OD Reports

This document explains the daily Total OD email reports feature for Nicsan CRM founders.

## Overview

The system automatically sends daily email reports to founders containing:
- **Branch-wise breakdown** of Total OD amounts
- **Vehicle type-wise analysis** within each branch
- **Rollover vs Renewal** classification for each vehicle type
- **Summary statistics** and totals

## Features

### 📊 Report Structure
- **Summary Section**: Total policies, Total OD, Rollover/Renewal breakdown
- **Branch Analysis**: Each branch with its performance metrics
- **Vehicle Type Breakdown**: Private Car, Two Wheeler, Commercial, etc.
- **Rollover/Renewal Classification**: Clear distinction between policy types

### 📧 Email Format
- **HTML Email**: Professional formatting with tables and styling
- **Text Fallback**: Plain text version for all email clients
- **Responsive Design**: Mobile-friendly email templates
- **Currency Formatting**: Indian Rupee formatting (₹1,23,456)

### ⏰ Scheduling
- **Daily at 9:00 AM IST**: Automatic report generation
- **Timezone Support**: Asia/Kolkata timezone
- **Skip Empty Days**: No email sent if no policies found
- **Error Handling**: Robust error handling and logging

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Founder Email Addresses
FOUNDER_EMAIL_1=founder1@company.com
FOUNDER_EMAIL_2=founder2@company.com

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Optional: Disable reports
DAILY_REPORT_ENABLED=true
```

### Database Requirements

The system uses existing database tables:
- `policies` table with fields: `branch`, `vehicle_type`, `rollover`, `total_od`, `created_at`
- No additional tables required

## API Endpoints

### Get Daily Report Data
```http
GET /api/reports/daily-od-report?date=2024-01-15
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2024-01-15",
    "summary": {
      "totalPolicies": 45,
      "totalOD": 1250000,
      "rolloverCount": 30,
      "renewalCount": 15,
      "rolloverOD": 850000,
      "renewalOD": 400000
    },
    "branches": [
      {
        "branchName": "Mumbai",
        "totalOD": 750000,
        "totalPolicies": 25,
        "vehicleTypes": [
          {
            "vehicleType": "Private Car",
            "rollover": { "amount": 500000, "count": 20 },
            "renewal": { "amount": 150000, "count": 5 }
          }
        ]
      }
    ]
  }
}
```

### Send Daily Report Email
```http
POST /api/reports/send-daily-od-report
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2024-01-15"
}
```

## Sample Email Report

### HTML Format
```html
📊 Daily Total OD Report
Monday, January 15, 2024

📈 Summary
- Total Policies: 45
- Total OD Amount: ₹12,50,000
- Rollover Policies: 30 (₹8,50,000)
- Renewal Policies: 15 (₹4,00,000)

🏢 Branch: Mumbai
Branch Total: ₹7,50,000 (25 policies)

🚗 Private Car
| Type     | Amount      | Policies |
|----------|-------------|----------|
| Rollover | ₹5,00,000   | 20       |
| Renewal  | ₹1,50,000   | 5        |
```

## Implementation Details

### Files Created/Modified

1. **`routes/reports.js`** - API endpoints for report generation
2. **`services/emailService.js`** - Enhanced with daily report email functionality
3. **`jobs/dailyReport.js`** - Scheduled job for automatic report generation
4. **`server.js`** - Added reports route and scheduler initialization
5. **`package.json`** - Added `node-cron` dependency

### Database Queries

The system uses optimized SQL queries:

```sql
-- Main report query
SELECT 
  COALESCE(branch, 'Unknown') as branch,
  COALESCE(vehicle_type, 'Unknown') as vehicle_type,
  COALESCE(rollover, 'Unknown') as rollover_status,
  COUNT(*) as policy_count,
  SUM(COALESCE(total_od, 0)) as total_od_amount
FROM policies 
WHERE DATE(created_at) = $1
GROUP BY branch, vehicle_type, rollover
ORDER BY branch, vehicle_type, rollover_status;

-- Summary query
SELECT 
  COUNT(*) as total_policies,
  SUM(COALESCE(total_od, 0)) as total_od,
  COUNT(CASE WHEN rollover = 'Rollover' THEN 1 END) as rollover_count,
  COUNT(CASE WHEN rollover = 'Renewal' THEN 1 END) as renewal_count
FROM policies 
WHERE DATE(created_at) = $1;
```

## Testing

### Manual Testing
```bash
# Test report generation
curl -X GET "http://localhost:3001/api/reports/daily-od-report?date=2024-01-15" \
  -H "Authorization: Bearer <token>"

# Test email sending
curl -X POST "http://localhost:3001/api/reports/send-daily-od-report" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"date":"2024-01-15"}'
```

### Development Mode
In development mode, the scheduler runs every hour for testing (commented out by default).

## Troubleshooting

### Common Issues

1. **No emails received**
   - Check `FOUNDER_EMAIL_1` and `FOUNDER_EMAIL_2` environment variables
   - Verify SMTP configuration
   - Check server logs for errors

2. **Empty reports**
   - Verify policies exist for the date
   - Check `branch`, `vehicle_type`, `rollover` fields are populated
   - Ensure `total_od` values are not null

3. **Scheduler not running**
   - Check server startup logs
   - Verify `node-cron` dependency is installed
   - Check timezone configuration

### Logs

The system provides detailed logging:
```
📊 Generating daily OD report...
📧 Sending daily OD report email...
✅ Daily OD report sent successfully
📬 Recipients: founder1@company.com, founder2@company.com
📧 Message ID: <message-id>
```

## Security

- **Authentication Required**: All endpoints require valid JWT token
- **Founder Role Required**: Only founders can access report endpoints
- **Email Security**: SMTP credentials stored in environment variables
- **Data Privacy**: No sensitive customer data in email reports

## Performance

- **Optimized Queries**: Efficient database queries with proper indexing
- **Async Processing**: Non-blocking email sending
- **Error Handling**: Graceful failure handling
- **Resource Management**: Proper cleanup and memory management

## Future Enhancements

Potential improvements:
- **PDF Attachments**: Include PDF reports as attachments
- **Custom Time Ranges**: Weekly/monthly reports
- **Advanced Filtering**: Date ranges, specific branches
- **Dashboard Integration**: Real-time report viewing
- **Alert System**: Threshold-based notifications
