# Weekly Rollover Report Implementation

## Overview

The Weekly Rollover Report is an automated reporting system that sends simplified rollover performance data to branch heads every week via email and WhatsApp. This report focuses on telecaller performance with rollover policies only, providing a clean, focused view of weekly conversions.

## Features

- **Weekly Schedule**: Automatically runs every Monday at 10:00 AM IST
- **Rollover Data Only**: Shows only rollover policies (not renewal)
- **Telecaller Performance**: Displays telecaller name and converted policies count
- **Sorted by Performance**: Telecallers sorted by converted count (descending)
- **Total Summary**: Includes total converted policies for the week
- **Branch-Specific**: Each branch head receives only their branch's data
- **Dual Delivery**: Sends via both email and WhatsApp

## Report Content

### Data Included

Each report contains:
- **Telecaller Name**: Name of the sales representative
- **Converted Policies**: Number of rollover policies converted that week
- **Total**: Sum of all converted policies across all telecallers

### Data Format

```
Telecaller Name | Converted Policies
----------------|-------------------
kumar          | 7 policies
KUAMNR         | 2 policies
Rahul Kumar    | 2 policies
dhruv          | 1 policies
----------------|-------------------
Total          | 12 policies
```

## Schedule

- **Frequency**: Weekly
- **Day**: Monday
- **Time**: 10:00 AM IST (4:30 AM UTC)
- **Week Period**: Previous week (Monday to Sunday)

## Recipients

Reports are sent to branch heads only:
- **MYSORE** branch head
- **BANASHANKARI** branch head
- **ADUGODI** branch head

Each branch head receives only their branch's data.

## Technical Implementation

### Files Created/Modified

#### New Files
1. **`nicsan-crm-backend/jobs/weeklyRolloverReport.js`**
   - Weekly scheduler class
   - Handles week calculation, data generation, email/WhatsApp sending
   - Schedules weekly cron job

#### Modified Files
1. **`nicsan-crm-backend/services/storageService.js`**
   - Added `calculateWeeklyRolloverReps(weekStart, weekEnd, branch)` function
   - Queries rollover policies grouped by telecaller

2. **`nicsan-crm-backend/services/emailService.js`**
   - Added `sendWeeklyRolloverReport(reportData, branch)` function
   - Added `generateWeeklyRolloverEmailContent(reportData, branch)` function
   - Generates simple 2-column HTML email template

3. **`nicsan-crm-backend/server.js`**
   - Added weekly scheduler initialization (lines 93-95)

4. **`nicsan-crm-backend/routes/reports.js`**
   - Added `/test-weekly-rollover-report` endpoint for testing

### Database Query

The report uses the following SQL query:

```sql
SELECT 
  COALESCE(caller_name, 'Unknown') as name,
  COUNT(*) FILTER (WHERE UPPER(COALESCE(rollover, '')) = 'ROLLOVER') as converted
FROM policies 
WHERE created_at >= $1 
  AND created_at <= $2 
  AND branch = $3
  AND UPPER(COALESCE(rollover, '')) = 'ROLLOVER'
GROUP BY COALESCE(caller_name, 'Unknown')
ORDER BY converted DESC
```

**Key Features:**
- Filters by `created_at` date range (week period)
- Filters by branch name
- Filters by rollover type only
- Groups by telecaller name
- Sorts by converted count (descending)

### Date Field Used

The report uses **`created_at`** (not `issue_date`) for filtering, ensuring:
- Consistency with other reports (Daily Reports, Monthly Breakdown)
- Data completeness (no policies excluded due to NULL dates)
- Accurate tracking of when policies were entered into the system

## Configuration

### Environment Variables Required

```env
# Branch Head Emails
MYSORE_BRANCH_HEAD_EMAIL=your-email@example.com
BANASHANKARI_BRANCH_HEAD_EMAIL=your-email@example.com
ADUGODI_BRANCH_HEAD_EMAIL=your-email@example.com

# Branch Head WhatsApp Numbers
MYSORE_BRANCH_HEAD_WHATSAPP=+91XXXXXXXXXX
BANASHANKARI_BRANCH_HEAD_WHATSAPP=+91XXXXXXXXXX
ADUGODI_BRANCH_HEAD_WHATSAPP=+91XXXXXXXXXX

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# WhatsApp API Configuration
WHATSAPP_ACCESS_TOKEN=your_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_id
```

### WhatsApp Template

**Template Name:** `weekly_rollover_report_branch1`

**Parameters (13 total):**
- {{1}} - Branch Name
- {{2}} - Week Period
- {{3}} - Total Policies
- {{4}} to {{13}} - Individual telecallers (one per parameter, up to 10 telecallers)

**Template Setup:**
1. Create template in Meta Business Manager
2. Category: UTILITY
3. Language: English
4. Use 13 parameters (each telecaller on separate line)
5. Submit for approval

## Email Format

### Email Subject
```
Weekly Rollover Report - [BRANCH] Branch - [Week Period]
```

### Email Content
- HTML table format
- 2 columns: Telecaller Name | Converted Policies
- Includes week period, total summary
- Professional styling with borders and formatting

### Sample Email
```
📊 Weekly Rollover Report - MYSORE Branch
Week: 27 Oct - 2 Nov 2025

Telecaller Performance:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Telecaller Name        | Converted Policies
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
kumar                  | 7
KUAMNR                 | 2
Rahul Kumar            | 2
dhruv                  | 1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                  | 12
```

## WhatsApp Format

### Message Structure
- Branch name
- Week period
- Telecaller list (one per line)
- Total policies

### Sample WhatsApp Message
```
📊 Weekly Rollover Report

Branch: ADUGODI

Week Period: 27 Oct - 2 Nov 2025

Telecaller Performance Summary:

Telecaller 1:
kumar - 2 policies

Telecaller 2:
KUAMNR - 1 policies

Telecaller 3:
Rahul Kumar - 1 policies

Total Converted Policies: 4
```

## Week Calculation

The report calculates the previous week (Monday to Sunday):

- **If today is Monday**: Reports previous week's Monday to Sunday
- **If today is Tuesday-Saturday**: Reports previous week's Monday to Sunday  
- **If today is Sunday**: Reports previous week's Monday to Sunday

Example:
- Current Date: Monday, Nov 3, 2025
- Report Period: Monday, Oct 27 - Sunday, Nov 2, 2025

## API Endpoints

### Test Endpoint

**POST** `/api/reports/test-weekly-rollover-report`

Test the weekly rollover report manually (requires authentication).

**Request Body (Optional):**
```json
{
  "weekStart": "2024-01-01",  // Optional: defaults to previous week
  "weekEnd": "2024-01-07",    // Optional: defaults to previous week
  "branch": "MYSORE"          // Optional: defaults to all branches
}
```

**Response:**
```json
{
  "success": true,
  "message": "Weekly rollover report test completed",
  "weekPeriod": {
    "start": "2024-01-01",
    "end": "2024-01-07"
  },
  "results": [
    {
      "branch": "MYSORE",
      "success": true,
      "email": {
        "sent": true,
        "recipients": ["email@example.com"],
        "messageId": "..."
      },
      "whatsapp": {
        "sent": true
      },
      "data": {
        "weekStart": "2024-01-01",
        "weekEnd": "2024-01-07",
        "totalTelecallers": 4,
        "totalPolicies": 12,
        "telecallers": [
          {
            "name": "kumar",
            "converted": 7
          }
        ]
      }
    }
  ]
}
```

## Testing

### Manual Testing via API

```bash
curl -X POST "http://localhost:3001/api/reports/test-weekly-rollover-report" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Manual Testing via Code

```javascript
const weeklyRolloverReportScheduler = require('./jobs/weeklyRolloverReport');
weeklyRolloverReportScheduler.testWeeklyRolloverReport();
```

## Differences from Daily Reports

| Feature | Daily Reports | Weekly Rollover Report |
|---------|---------------|------------------------|
| **Frequency** | Daily | Weekly (Monday) |
| **Schedule** | 10:30 AM IST | 10:00 AM IST |
| **Data Aggregation** | Branch + Vehicle Type | Telecaller only |
| **Data Type** | Rollover + Renewal | Rollover only |
| **Metrics** | Financial + OD amounts | Converted count only |
| **Recipients** | Founders + Branch Heads | Branch Heads only |
| **Date Range** | Single day | Week (7 days) |
| **Date Field** | `created_at` | `created_at` |
| **Complexity** | Detailed breakdown | Simplified |

## Error Handling

### No Data Found
- If no rollover policies exist for the week, the report is skipped
- Email/WhatsApp are not sent
- Logs indicate "No rollover policies found"

### Missing Configuration
- If branch head email/WhatsApp not configured, that branch report is skipped
- Other branches continue to receive reports
- Error logged but doesn't stop other branches

### WhatsApp Template Issues
- If template name doesn't match, error is logged
- Email report still sent successfully
- Check logs for template name mismatch

## Logging

The system provides detailed logging:

```
📊 Generating weekly rollover reports...
📅 Week period: 2025-10-27 to 2025-11-02
📊 Generating MYSORE branch weekly rollover report...
✅ Report data generated: 4 telecallers, 12 total policies
📧 Sending MYSORE branch weekly rollover email report...
✅ MYSORE branch weekly rollover report email sent successfully
📱 Sending MYSORE branch weekly rollover WhatsApp report...
✅ WhatsApp report sent to MYSORE branch head
```

## Maintenance

### Updating Branch List

To add/remove branches, modify `weeklyRolloverReport.js`:

```javascript
// Line ~60
const branches = ['MYSORE', 'BANASHANKARI', 'ADUGODI', 'NEW_BRANCH'];
```

### Changing Schedule

Modify the cron schedule in `weeklyRolloverReport.js`:

```javascript
// Line ~28
cron.schedule('30 4 * * 1', async () => {
  // '30 4 * * 1' = Monday 10:00 AM IST (4:30 AM UTC)
  // Change to: '0 4 * * 1' for 9:30 AM IST
}, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});
```

### Changing Max Telecallers

Modify the max telecallers limit:

```javascript
// Line ~221
const maxTelecallers = 10; // Change to desired number
```

## Troubleshooting

### Reports Not Sending

1. **Check scheduler status:**
   ```javascript
   weeklyRolloverReportScheduler.getStatus();
   ```

2. **Verify environment variables:**
   - Branch head emails configured
   - Branch head WhatsApp numbers configured
   - SMTP credentials valid
   - WhatsApp API credentials valid

3. **Check logs:**
   - Look for error messages in console
   - Verify database connection
   - Check date range calculations

### Empty Reports

- **No policies found:** Verify policies exist for the week period
- **Wrong branch:** Check `branch` field in policies table
- **Wrong rollover type:** Verify `rollover` field values are 'ROLLOVER' (case-insensitive)

### WhatsApp Template Errors

- **Template name mismatch:** Verify template name is exactly `weekly_rollover_report_branch1`
- **Parameter count mismatch:** Template must have 13 parameters
- **Template not approved:** Wait for Meta approval

## Security

- **Authentication Required:** Test endpoint requires Founder role
- **Branch Isolation:** Each branch head only receives their branch data
- **No Data Exposure:** Reports don't include sensitive financial details
- **Environment Variables:** Credentials stored in `.env` file

## Future Enhancements

Potential improvements:
- Configurable max telecallers per report
- Custom week periods via API
- Historical week comparison
- Performance trends
- Export to CSV functionality

## Support

For issues or questions:
1. Check application logs for detailed error messages
2. Verify environment variable configuration
3. Test database connectivity
4. Verify WhatsApp template approval status
5. Contact system administrator

---

**Last Updated:** January 2025  
**Version:** 1.0  
**Maintained By:** Development Team

