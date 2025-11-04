# WhatsApp Overall Report Template for Founders

## 📋 Template Information

**Template Name:** `daily_od_report_overall`  
**Language:** English (`en`)  
**Recipients:** Founders only (configured in environment variables)  
**Header Image:** Not required (currently set to `null`)

---

## 🔢 Template Parameters

The template sends **9 parameters** in the following order:

### Parameter Mapping

| Parameter | Variable | Description | Example Value |
|-----------|----------|-------------|---------------|
| {{1}} | Date | Report date in DD MMM YYYY format | `30 Oct 2025` |
| {{2}} | Total Policies | Total number of policies across all branches | `25` |
| {{3}} | Total OD | Total OD amount (all branches) | `2,45,678` |
| {{4}} | Rollover Count | Number of rollover policies | `15` |
| {{5}} | Rollover OD | Total OD from rollover policies | `1,50,000` |
| {{6}} | Renewal Count | Number of renewal policies | `10` |
| {{7}} | Renewal OD | Total OD from renewal policies | `95,678` |
| {{8}} | Number of Branches | Count of active branches | `3` |
| {{9}} | All Branches Details | Complete branch breakdown with vehicle types | See below |

---

## 📊 Parameter Details

### Parameter 1: Date
- **Format:** `DD MMM YYYY` (e.g., "30 Oct 2025")
- **Source:** Report date from database
- **Function:** `formatDate(reportData.date)`

### Parameter 2: Total Policies
- **Format:** Integer as string
- **Content:** Total count of all policies across all branches for the report date
- **Example:** `"25"`

### Parameter 3: Total OD
- **Format:** Indian currency format (without ₹ symbol)
- **Content:** Total OD amount across all branches
- **Example:** `"2,45,678"`
- **Note:** Currency symbol (₹) should be included in the template itself

### Parameter 4: Rollover Count
- **Format:** Integer as string
- **Content:** Total number of rollover policies
- **Example:** `"15"`

### Parameter 5: Rollover OD
- **Format:** Indian currency format (without ₹ symbol)
- **Content:** Total OD amount from rollover policies only
- **Example:** `"1,50,000"`

### Parameter 6: Renewal Count
- **Format:** Integer as string
- **Content:** Total number of renewal policies
- **Example:** `"10"`

### Parameter 7: Renewal OD
- **Format:** Indian currency format (without ₹ symbol)
- **Content:** Total OD amount from renewal policies only
- **Example:** `"95,678"`

### Parameter 8: Number of Branches
- **Format:** Integer as string
- **Content:** Count of branches that have policies for the report date
- **Example:** `"3"`

### Parameter 9: All Branches Details
- **Format:** Single-line text string (no newlines, tabs, or >4 consecutive spaces)
- **Content:** Complete breakdown of all branches with their vehicle types

#### Structure of Parameter 9:
Each branch is formatted as:
```
🏢 BRANCH_NAME: Total ₹AMOUNT (COUNT policies) - 🚗 VehicleType: Rollover ₹AMOUNT (COUNT policies) | Renewal ₹AMOUNT (COUNT policies) [vehicle types...] [space] [next branch...]
```

#### Example of Parameter 9:
```
🏢 ADUGODI: Total ₹17,904 (1 policies) - 🚗 Private Car: Rollover ₹17,904 (1 policies) | Renewal ₹0 (0 policies) 🏢 MYSORE: Total ₹14,463 (1 policies) - 🚗 Private Car: Rollover ₹14,463 (1 policies) | Renewal ₹0 (0 policies)
```

**Note:** All branches are concatenated with a single space separator. The visual formatting (line breaks, spacing) must be handled by the Meta template design itself since WhatsApp API parameters cannot contain newlines.

---

## 💻 Code Implementation

### Location
**File:** `nicsan-crm-backend/jobs/dailyReport.js`  
**Function:** `prepareOverallTemplateParameters(reportData)`

### Parameter Generation Logic

```javascript
prepareOverallTemplateParameters(reportData) {
  // Format currency (removes ₹ symbol)
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0).replace('₹', '');
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Format branches (single line, no newlines)
  const branchesText = reportData.branches
    .map((branch) => {
      const vehicleTypesText = branch.vehicleTypes
        .map((vehicleType) => {
          const rolloverAmount = formatCurrency(vehicleType.rollover?.amount || 0);
          const rolloverCount = vehicleType.rollover?.count || 0;
          const renewalAmount = formatCurrency(vehicleType.renewal?.amount || 0);
          const renewalCount = vehicleType.renewal?.count || 0;
          
          return `🚗 ${vehicleType.vehicleType || 'Unknown'}: Rollover ₹${rolloverAmount} (${rolloverCount} policies) | Renewal ₹${renewalAmount} (${renewalCount} policies)`;
        })
        .join(' '); // Single space between vehicle types

      const branchHeader = `🏢 ${branch.branchName}: Total ₹${formatCurrency(branch.totalOD)} (${branch.totalPolicies} policies)`;
      const vehicleSection = vehicleTypesText.length > 0 ? `- ${vehicleSection}` : '';
      return `${branchHeader} ${vehicleSection}`.trim();
    })
    .join(' '); // Space separator between branches

  return [
    formatDate(reportData.date),                    // {{1}} - Date
    (reportData.summary.totalPolicies || 0).toString(),    // {{2}} - Total Policies
    formatCurrency(reportData.summary.totalOD || 0),        // {{3}} - Total OD
    (reportData.summary.rolloverCount || 0).toString(),    // {{4}} - Rollover Count
    formatCurrency(reportData.summary.rolloverOD || 0),     // {{5}} - Rollover OD
    (reportData.summary.renewalCount || 0).toString(),      // {{6}} - Renewal Count
    formatCurrency(reportData.summary.renewalOD || 0),      // {{7}} - Renewal OD
    reportData.branches.length.toString(),                  // {{8}} - Number of Branches
    branchesText || 'No branches'                           // {{9}} - All Branches Details
  ];
}
```

---

## 📱 Meta Business Manager Template Structure

### Required Template Format

The template in Meta Business Manager should be structured as follows:

```
📊 Daily OD Report - Overall Summary

📅 {{1}}

📈 Company Summary:
Total Policies: {{2}}
Total OD: ₹{{3}}

Rollover: {{4}} policies (₹{{5}})
Renewal: {{6}} policies (₹{{7}})

🏢 Branches ({{8}}):

{{9}}

---
Generated by Nicsan CRM System
```

### Important Notes for Meta Template:

1. **Currency Symbols:** Add `₹` symbol in the template (parameters don't include it)
2. **Line Breaks:** Use line breaks in the template text (not in parameters)
3. **Parameter Limits:** Each parameter can be max 1024 characters
4. **Formatting:** Use emojis and formatting in the template text itself
5. **Single Line Constraint:** Parameter {{9}} must be designed to handle single-line input gracefully

---

## 🔄 Data Flow

```
Database Query (policies table)
    ↓
generateReportData(date)
    ↓
Overall Report Data Object
    ↓
prepareOverallTemplateParameters(reportData)
    ↓
9 Parameter Array
    ↓
whatsappService.sendTemplateMessage()
    ↓
Meta WhatsApp Cloud API
    ↓
WhatsApp Message to Founders
```

---

## ✅ Environment Variables Required

```env
# Founder WhatsApp Numbers (at least one required)
FOUNDER_WHATSAPP_1=XXXXXXXXXX
FOUNDER_WHATSAPP_2=XXXXXXXXXX  # Optional
FOUNDER_WHATSAPP_3=XXXXXXXXXX  # Optional

# WhatsApp API Configuration
WHATSAPP_ACCESS_TOKEN=your_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_id
```

---

## 📊 Sample Report Data Structure

```javascript
{
  date: "2025-10-30",
  summary: {
    totalPolicies: 25,
    totalOD: 245678,
    rolloverCount: 15,
    rolloverOD: 150000,
    renewalCount: 10,
    renewalOD: 95678
  },
  branches: [
    {
      branchName: "ADUGODI",
      totalPolicies: 10,
      totalOD: 100000,
      vehicleTypes: [
        {
          vehicleType: "Private Car",
          rollover: { amount: 60000, count: 6 },
          renewal: { amount: 40000, count: 4 }
        }
      ]
    },
    {
      branchName: "MYSORE",
      totalPolicies: 15,
      totalOD: 145678,
      vehicleTypes: [
        {
          vehicleType: "Private Car",
          rollover: { amount: 90000, count: 9 },
          renewal: { amount: 55678, count: 6 }
        }
      ]
    }
  ]
}
```

---

## 🎯 Key Differences from Branch Head Reports

| Feature | Overall Report (Founders) | Branch Report (Branch Heads) |
|---------|--------------------------|------------------------------|
| **Recipients** | Founders only | Individual branch heads |
| **Data Scope** | All branches combined | Single branch only |
| **Rollover/Renewal** | Shows both | Rollover ONLY |
| **Template Name** | `daily_od_report_overall` | `daily_od_report_branch` |
| **Parameters** | 9 parameters | 7 parameters |
| **Branch Details** | All branches in one parameter | Only their own branch |

---

## ⚠️ Important Constraints

1. **No Newlines in Parameters:** WhatsApp API doesn't allow newlines (`\n`), tabs (`\t`), or more than 4 consecutive spaces in template parameters
2. **Parameter Length:** Each parameter can be maximum 1024 characters
3. **Emoji Support:** Emojis can be included in template parameters (they work fine)
4. **Currency Format:** Indian currency format with commas (e.g., `2,45,678`)
5. **Date Format:** Indian date format (`DD MMM YYYY`, e.g., "30 Oct 2025")

---

## 🧪 Testing

To test the overall report WhatsApp template:

1. **Manual Test via API:**
   ```bash
   # Use the test endpoint
   POST /api/reports/test-whatsapp-reports
   Body: { "date": "2025-10-30" }
   ```

2. **Check Logs:**
   - Look for: `✅ Overall WhatsApp report sent to [phone]`
   - Verify Message ID is returned

3. **Verify Delivery:**
   - Check founder's WhatsApp
   - Confirm all 9 parameters are correctly displayed
   - Verify branch details are readable despite single-line format

---

## 📝 Summary

The overall WhatsApp template for founders provides:
- ✅ Complete company-wide summary (all branches)
- ✅ Both rollover and renewal data
- ✅ Branch-by-branch breakdown
- ✅ Vehicle type breakdown per branch
- ✅ Formatted currency values
- ✅ Indian date format

The template is designed to match the email report content (excluding the 7-day and 12-month trends) while adhering to WhatsApp template message constraints.

