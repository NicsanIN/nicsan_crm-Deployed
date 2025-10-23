# Branch-Specific Daily Reports Configuration

## Overview
The system now supports both founder-level overall reports AND branch-specific reports for individual branch heads. This provides comprehensive reporting at both executive and operational levels.

## Report Types

### 1. Founder Reports (Overall)
- **Recipients:** Founders (FOUNDER_EMAIL_1, FOUNDER_EMAIL_2)
- **Content:** Company-wide data from all branches
- **Purpose:** Executive overview and strategic decision making

### 2. Branch Reports (Individual)
- **Recipients:** Individual branch heads
- **Content:** Branch-specific data only
- **Purpose:** Operational management and branch performance tracking

## Environment Variables Required

Add these environment variables to your `.env` file:

```env
# Founder Emails (Overall Reports) - EXISTING
FOUNDER_EMAIL_1=founder1@company.com
FOUNDER_EMAIL_2=founder2@company.com

# Branch Head Emails (Branch-Specific Reports) - NEW
MYSORE_BRANCH_HEAD_EMAIL=mysore.head@company.com
BANASHANKARI_BRANCH_HEAD_EMAIL=banashankari.head@company.com
ADUGODI_BRANCH_HEAD_EMAIL=adugodi.head@company.com

# Email Configuration (EXISTING)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Report Schedule

**Daily at 9:00 AM IST:**
1. **Overall Report** → Sent to Founders (company-wide data)
2. **Mumbai Report** → Sent to Mumbai Branch Head (Mumbai data only)
3. **Delhi Report** → Sent to Delhi Branch Head (Delhi data only)
4. **Bangalore Report** → Sent to Bangalore Branch Head (Bangalore data only)

## Report Content Differences

### Founder Report (Overall)
```
📊 Daily Total OD Report - Company Overview
├── 📈 Company Summary (All Branches Combined)
├── 📊 Branch Performance Comparison
├── 📊 Vehicle Type Analysis (Company-wide)
├── 📊 Daily Breakdown (All Branches)
├── 📈 Monthly Breakdown (All Branches)
└── 📋 Executive Summary
```

### Branch Report (Example: Mumbai)
```
📊 Daily Total OD Report - MYSORE Branch
├── 📈 MYSORE Branch Summary Only
├── 📊 MYSORE Vehicle Types Only
├── 📊 MYSORE Rollover/Renewal Only
├── 📊 MYSORE Daily Breakdown
├── 📈 MYSORE Monthly Breakdown
└── 📋 MYSORE Performance Metrics
```

## Database Requirements

The system uses the existing `branch` field in the `policies` table:
- **MYSORE:** Policies with `branch = 'MYSORE'`
- **BANASHANKARI:** Policies with `branch = 'BANASHANKARI'`
- **ADUGODI:** Policies with `branch = 'ADUGODI'`

## Implementation Features

### 1. Dual Report System
- **Founder Reports:** Continue exactly as before (no changes)
- **Branch Reports:** New functionality added alongside

### 2. Branch-Specific Data Filtering
- Each branch report only includes data for that specific branch
- Vehicle type breakdowns are branch-specific
- Rollover/Renewal analysis is branch-specific
- Daily and monthly trends are branch-specific

### 3. Email Templates
- **Founder Template:** Company-wide branding and comprehensive data
- **Branch Template:** Branch-specific branding and focused data
- Both templates include HTML and text versions

### 4. Error Handling
- If no email is configured for a branch head, that branch report is skipped
- If no data exists for a branch, that branch report is skipped
- Founder reports continue regardless of branch report status

## Testing

### Manual Testing
```bash
# Test the complete dual report system
cd nicsan-crm-backend
node -e "
const dailyReportScheduler = require('./jobs/dailyReport');
dailyReportScheduler.testDailyReport();
"
```

### Environment Setup
1. Ensure all environment variables are set
2. Verify database connection
3. Confirm email configuration
4. Test with sample data

## Benefits

### For Founders
- **Complete Overview:** All branches in one comprehensive report
- **Cross-Branch Analysis:** Compare branch performance
- **Strategic Decision Making:** Company-wide insights
- **Executive Summary:** High-level metrics

### For Branch Heads
- **Focused Data:** Only their branch information
- **Branch Performance:** Specific branch metrics
- **Targeted Insights:** Branch-specific trends
- **Accountability:** Clear branch performance visibility

## Troubleshooting

### Common Issues

1. **Branch reports not sending:**
   - Check if branch head email is configured
   - Verify environment variables are set correctly

2. **No data in branch reports:**
   - Ensure policies have correct `branch` field values
   - Check if policies exist for the specific date

3. **Email delivery issues:**
   - Verify SMTP configuration
   - Check email addresses are valid
   - Ensure proper authentication

### Logs to Check
```bash
# Check scheduler logs
tail -f logs/daily-report.log

# Check email service logs
tail -f logs/email-service.log
```

## Configuration Examples

### Production Environment
```env
# Founder Emails
FOUNDER_EMAIL_1=ceo@company.com
FOUNDER_EMAIL_2=coo@company.com

# Branch Head Emails
MUMBAI_BRANCH_HEAD_EMAIL=mumbai.manager@company.com
DELHI_BRANCH_HEAD_EMAIL=delhi.manager@company.com
BANGALORE_BRANCH_HEAD_EMAIL=bangalore.manager@company.com
```

### Development Environment
```env
# Founder Emails
FOUNDER_EMAIL_1=dev.founder1@company.com
FOUNDER_EMAIL_2=dev.founder2@company.com

# Branch Head Emails
MUMBAI_BRANCH_HEAD_EMAIL=dev.mumbai@company.com
DELHI_BRANCH_HEAD_EMAIL=dev.delhi@company.com
BANGALORE_BRANCH_HEAD_EMAIL=dev.bangalore@company.com
```

## Support

For any issues with branch-specific reports:
1. Check environment variable configuration
2. Verify database branch field values
3. Test email connectivity
4. Review application logs
5. Contact system administrator
