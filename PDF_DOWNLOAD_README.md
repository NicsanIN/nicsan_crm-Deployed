# PDF Download Functionality - Rep Leaderboard

## Overview
This document describes the PDF download functionality implemented for the Rep Leaderboard in the NicsanCRM application.

## Features
- **Download Format**: PDF
- **Data Source**: Rep Leaderboard from the dashboard
- **Fields Included**: 
  - Telecaller
  - Leads Assigned
  - Converted
  - Total OD

## Technical Implementation

### Frontend Dependencies
```json
{
  "jspdf": "^2.5.1",
  "jspdf-autotable": "^3.6.0"
}
```

### Key Components
- **File**: `src/NicsanCRMMock.tsx`
- **Function**: `downloadPDF()`
- **Button**: "Download PDF" in Rep Leaderboard section

### PDF Generation Process
1. **Data Collection**: Retrieves current leaderboard data
2. **Formatting**: Converts data to PDF table format
3. **Styling**: Applies consistent formatting and colors
4. **Download**: Triggers automatic download with filename `rep-leaderboard-{timestamp}.pdf`

### PDF Specifications
- **Page Size**: A4
- **Orientation**: Portrait
- **Header**: "Rep Leaderboard Report" with timestamp
- **Table**: 4 columns with optimized widths
- **Colors**: 
  - Header: Slate background (#475569) with white text
  - Alternating rows: Light gray (#f8fafc)
- **Font**: Default system font, 10pt size

### Column Layout
| Column | Width | Content |
|--------|-------|---------|
| Telecaller | 50 units | Rep name |
| Leads Assigned | 30 units | Number of leads |
| Converted | 25 units | Number of conversions |
| Total OD | 45 units | Total OD amount (₹X.Xk format) |

### Usage
1. Navigate to **Founders** → **Rep Leaderboard**
2. Click the **"Download PDF"** button
3. PDF will automatically download to your default download folder
4. Filename format: `rep-leaderboard-YYYY-MM-DD-HH-MM-SS.pdf`

### Browser Compatibility
- Chrome (recommended)
- Firefox
- Safari
- Edge

### Data Requirements
- Requires active leaderboard data
- Falls back to mock data if backend unavailable
- Handles empty states gracefully

### Error Handling
- **No data**: Shows empty table with headers
- **Network issues**: Uses cached/mock data
- **Browser compatibility**: Graceful degradation

## File Structure
```
src/
├── NicsanCRMMock.tsx          # Main component with downloadPDF function
├── services/
│   ├── backendApiService.ts   # Data fetching
│   └── dualStorageService.ts  # Mock data fallback
```

## Dependencies Installation
```bash
npm install jspdf jspdf-autotable
```

## TypeScript Support
```typescript
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}
```

## Notes
- PDF generation is client-side (no server processing required)
- File size is optimized for quick download
- Table automatically fits within A4 page width
- No external API calls required for PDF generation
