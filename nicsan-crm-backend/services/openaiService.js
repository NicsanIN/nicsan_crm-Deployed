// OpenAI Service for PDF Data Extraction
// Replaces AWS Textract with OpenAI GPT-4o-mini for better accuracy

const OpenAI = require('openai');
const pdf = require('pdf-parse');
const { s3 } = require('../config/aws');

class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  // Download PDF from S3
  async downloadFromS3(s3Key) {
    try {
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: s3Key
      };
      
      const result = await s3.getObject(params).promise();
      console.log('✅ PDF downloaded from S3');
      return result.Body;
    } catch (error) {
      console.error('❌ Failed to download PDF from S3:', error);
      throw error;
    }
  }

  // Convert PDF to text
  async convertPDFToText(pdfBuffer) {
    try {
      const data = await pdf(pdfBuffer);
      console.log('✅ PDF converted to text');
      return data.text;
    } catch (error) {
      console.error('❌ Failed to convert PDF to text:', error);
      throw error;
    }
  }


  // Build dynamic TATA AIG rules based on manufacturing year
  buildTATAAIGTotalODRule(manufacturingYear) {
    const year = parseInt(manufacturingYear);
    
    if (year <= 2022) {
      return `
    - Total OD (₹): For vehicles 2022 and below, calculate Total OD (₹) = Net OD (₹) + "Total Add on Premium (C)" values
      * CRITICAL: This is a CALCULATION, not a direct extraction - ESSENTIAL for vehicles 2022 and below
      * RULE OVERRIDE: This rule OVERRIDES any other Total OD rules in this prompt for TATA AIG policies
      * PROHIBITED: DO NOT use "Total Own Damage Premium" for TATA AIG Total OD
      * PROHIBITED: DO NOT copy Net OD value for TATA AIG Total OD
      * PROHIBITED: DO NOT use RELIANCE_GENERAL rules for TATA AIG policies
      * FIELD DIFFERENTIATION: Total OD (₹) is CALCULATED from Net OD (₹) + Add on Premium (C) for TATA AIG 2022 and below
      * Net OD (₹) comes from "Total Own Damage Premium (A)" 
      * Add on Premium (C) comes from "Total Add on Premium (C)"
      * Total OD (₹) = Net OD (₹) + Add on Premium (C) - this is a CALCULATION
      * VALIDATION: Total OD should equal Net OD + Add on Premium (C) for 2022 and below models
      * If Total OD does NOT equal Net OD + Add on Premium (C), the calculation is INCORRECT
      * Look for ALL variations: "Add on Premium (C)", "Add-on Premium (C)", "Additional Premium (C)", "Addon Premium (C)", "Add On Premium (C)"
      * Accept different spacing: "Total Add on Premium (C)", "Total Add-on Premium (C)", "Total Add On Premium (C)", "Total Addon Premium (C)"
      * Look for field names containing: "Add on Premium", "Add-on Premium", "Additional Premium", "Addon Premium" with "(C)" or "C"
      * Case insensitive matching - search for ANY field with "add" + "premium" + "C" or "(C)"
      * This field typically appears in premium breakdown tables or add-on sections
      * If you find ANY field that looks like add-on premium with (C), extract it
      * If "Total Add on Premium (C)" not found, return null - DO NOT fallback to other sources`;
    } else {
      return `
    - Total OD (₹): For vehicles 2023 and above, set Total OD (₹) = Net Premium (₹) value
      * CRITICAL: For newer vehicles, Total OD should equal Net Premium
      * RULE OVERRIDE: This rule OVERRIDES any other Total OD rules in this prompt for TATA AIG policies
      * PROHIBITED: DO NOT use "Total Add on Premium (C)" for TATA AIG Total OD in 2023+ models
      * PROHIBITED: DO NOT use "Total Own Damage Premium" for TATA AIG Total OD in 2023+ models
      * PROHIBITED: DO NOT use RELIANCE_GENERAL rules for TATA AIG policies
      * FIELD DIFFERENTIATION: For 2023+ models, Total OD (₹) should EQUAL Net Premium (₹)
      * Net Premium (₹) comes from "Net Premium" or "Net Premium (₹)" fields
      * Total OD (₹) should be EXACTLY the same value as Net Premium (₹)
      * VALIDATION: Total OD should EQUAL Net Premium for 2023+ models
      * If Total OD does NOT equal Net Premium, the extraction is INCORRECT
      * Look for ALL variations: "Net Premium", "Net Premium (₹)", "Net Premium (Rs.)", "Net Premium Amount", "Total Net Premium", "Premium Amount", "Net Amount", "Premium (Net)"
      * Case insensitive matching - search for ANY field with "net" + "premium" or "premium" + "amount"
      * This field typically appears in premium summary sections or policy details
      * If you find ANY field that looks like net premium, extract it
      * STEP 1: Extract Net Premium value from the above field variations
      * STEP 2: Assign the EXACT same value to Total OD field
      * STEP 3: Ensure Total OD = Net Premium (same value, not different)
      * If "Net Premium" not found, return null - DO NOT fallback to other sources`;
    }
  }

  // Extract manufacturing year from PDF text
  extractManufacturingYear(pdfText) {
    try {
      // Look for manufacturing year patterns
      const patterns = [
        /(?:manufacturing year|model year|year of manufacture|year)[\s:]*(\d{4})/i,
        /(\d{4})[\s]*(?:manufacturing|model|year)/i,
        /(?:vehicle year|car year)[\s:]*(\d{4})/i
      ];
      
      for (const pattern of patterns) {
        const match = pdfText.match(pattern);
        if (match && match[1]) {
          const year = parseInt(match[1]);
          if (year >= 2000 && year <= 2030) { // Reasonable year range
            console.log(`📅 Manufacturing year extracted: ${year}`);
            return year.toString();
          }
        }
      }
      
      console.log('⚠️ Manufacturing year not found, defaulting to 2023+ logic');
      return '2023'; // Default to 2023+ logic
    } catch (error) {
      console.error('❌ Error extracting manufacturing year:', error);
      return '2023'; // Default to 2023+ logic
    }
  }

  // Extract policy data using OpenAI
  async extractPolicyData(pdfText, insurer) {
    try {
      console.log('🤖 Processing with OpenAI GPT-4o-mini...');
      
      // Build dynamic rules based on insurer and manufacturing year
      let dynamicRules = '';
      let otherInsurerRules = '';
      
      if (insurer === 'TATA_AIG') {
        const manufacturingYear = this.extractManufacturingYear(pdfText);
        dynamicRules = this.buildTATAAIGTotalODRule(manufacturingYear);
        otherInsurerRules = `
10. For TATA_AIG policies specifically:
    - Net OD (₹): Extract "Total Own Damage Premium (A)" values - this is the NET OD in TATA AIG
    - Net Premium (₹): Extract "Net Premium" or "Net Premium (₹)" values from policy - this is the NET PREMIUM in TATA AIG
    ${dynamicRules}
11. For RELIANCE_GENERAL policies specifically:
    - Net OD (₹): Extract from "Total Own Damage Premium" values
    - Total OD (₹): Extract from "Total Own Damage Premium" values  
    - Net Premium (₹): Extract from "Total Own Damage Premium" values
    - Total Premium (₹): Extract from "Total Premium Payable" values`;
        console.log(`🔧 TATA AIG rules applied for year: ${manufacturingYear}`);
      } else if (insurer === 'DIGIT') {
        // No other insurer rules for DIGIT - only DIGIT rules apply
        otherInsurerRules = '';
        console.log(`🔧 DIGIT rules applied - no conflicting rules included`);
      } else if (insurer === 'RELIANCE_GENERAL') {
        otherInsurerRules = `
10. For TATA_AIG policies specifically:
    - Net OD (₹): Extract "Total Own Damage Premium (A)" values - this is the NET OD in TATA AIG
    - Net Premium (₹): Extract "Net Premium" or "Net Premium (₹)" values from policy - this is the NET PREMIUM in TATA AIG
11. For RELIANCE_GENERAL policies specifically:
    - Net OD (₹): Extract from "Total Own Damage Premium" values
    - Total OD (₹): Extract from "Total Own Damage Premium" values  
    - Net Premium (₹): Extract from "Total Own Damage Premium" values
    - Total Premium (₹): Extract from "Total Premium Payable" values`;
        console.log(`🔧 RELIANCE_GENERAL rules applied`);
      }
      
      const prompt = `Extract insurance policy data from this text. Return ONLY a valid JSON object with these exact fields:
{
  "policy_number": "string",
  "vehicle_number": "string", 
  "insurer": "string",
  "product_type": "string",
  "vehicle_type": "string",
  "make": "string",
  "model": "string",
  "cc": "string",
  "manufacturing_year": "string",
  "expiry_date": "string",
  "idv": "number",
  "ncb": "number",
  "discount": "number",
  "net_od": "number",
  "add_on_premium_c": "number",
  "ref": "string",
  "total_od": "number",
  "net_premium": "number",
  "total_premium": "number",
  "customer_name": "string",
  "confidence_score": "number"
}

HIGHEST-PRIORITY RULES — APPLY WHEN DIGIT PATTERNS DETECTED:
- DIGIT PATTERN DETECTION: Look for these DIGIT indicators in the PDF text:
  * Company names: "Go Digit", "Digit General Insurance", "DIGIT", "Go Digit General Insurance Ltd."
  * Policy formats: DIGIT-specific policy layouts, headers, or terminology
  * Field patterns: "Net Premium" and "Final Premium" field combinations
- RULE APPLICATION: If ANY DIGIT patterns are found, use DIGIT rules below. If no DIGIT patterns found, use standard extraction rules.
- Source mapping for DIGIT (when DIGIT patterns detected):
  • Net Premium (₹): extract ONLY from "Net Premium" (same variants as above).
  • Total Premium (₹): extract ONLY from "Final Premium" (any variant: "Final Premium", "Final Premium (₹)", "Total Premium", "Total Premium (₹)", "Final Amount", "Total Amount").
- PROHIBITED SOURCES for the four fields above (reject completely if matched): 
  * Any "Own Damage Premium" field: "Own Damage Premium", "OD Premium", "Own Damage", "Basic OD Premium", "Total OD Premium", "Total Basic Own Damage Premium", "Total Own Damage Premium (A)"
  * Any "Act Premium" or "Third Party Premium" field: "Act Premium", "TP Premium", "Third Party Liability Premium", "Liability Premium", "Act", "Third Party Premium"
  * Any "Total Premium Payable" or similar: "Total Premium Payable", "Gross Premium", "Basic Premium", "Policy Premium", "Premium Subtotal"
  * Any "Addon Premium" or "Additional Premium": "Addon Premium", "Add on Premium", "Additional Premium", "Total Add on Premium (C)", "Add-on Premium"
  * Any "Service Tax" or "GST": "Service Tax", "GST", "CGST", "SGST", "IGST", "Tax", "Service Charge"
  * Any "Final Payable" or "Total Payable": "Final Payable", "Total Payable", "Grand Total", "Amount Payable", "Total Amount Payable"
  * Any other premium-related field name EXCEPT "Net Premium" and "Final Premium"
- VALIDATION (hard constraint): Net Premium < Total Premium and they must be DIFFERENT. If they are equal or reversed, set "confidence_score" ≤ 0.35.
- Examples (not literal values): "Net Premium" might be ~4902 while "Final Premium" might be ~6500 — they should differ.

OTHER EXTRACTION RULES:
2. Extract IDV (Insured Declared Value) from multiple sources with priority order
3. PRIORITY 1: Table data - "Vehicle IDV (₹)" or "Total IDV (₹)" in tables (ACCEPT these values)
4. PRIORITY 2: Policy year context - "Policy Year: 2024, Vehicle IDV: 495000" (ACCEPT policy year + IDV combinations)
5. PRIORITY 3: Header data - "IDV (₹):" in header sections (fallback when table data unavailable)
6. For IDV: ACCEPT both header "IDV (₹):" AND table "Vehicle IDV (₹)" or "Total IDV (₹)" values
7. Policy year and IDV can be combined - extract policy year context when available
8. For table data, extract IDV column value AND policy year when present
9. For TATA_AIG policies specifically: PRIORITIZE "Total IDV (₹)" as the primary source over "Vehicle IDV (₹)"
${otherInsurerRules}
12. For NCB: Extract percentage value, use 0 if not found (not 20)
13. For CUSTOMER_NAME: Extract customer name from policy holder information, insured name, or customer details section. Look for fields like "Policy Holder Name", "Insured Name", "Customer Name", "Name of Insured", etc.

For ${insurer} insurance policies. If a field is not found, use null. For dates (except issue_date which is not extracted), use YYYY-MM-DD format. For numbers, use actual numbers not strings.

Text to analyze:
${pdfText}`;

      const response = await this.client.chat.completions.create({
        model: process.env.OPENAI_MODEL_FAST || 'gpt-4o-mini',
        messages: [{
          role: "user",
          content: prompt
        }],
        temperature: 0.1,
        max_tokens: 1000
      });

      // Clean the response content to handle markdown formatting
      let content = response.choices[0].message.content;
      
      // Remove markdown code blocks if present
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Try to find JSON object if wrapped in other text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        content = jsonMatch[0];
      }
      
      const extractedData = JSON.parse(content);
      console.log('✅ OpenAI extraction completed');
      
      // Enhanced logging for DIGIT extraction debugging
      if (insurer === 'DIGIT') {
        console.log('🔍 DIGIT extraction results:');
        console.log(`  - net_od: ${extractedData.net_od}`);
        console.log(`  - total_od: ${extractedData.total_od}`);
        console.log(`  - net_premium: ${extractedData.net_premium}`);
        console.log(`  - total_premium: ${extractedData.total_premium}`);
        
        // Check for DIGIT bug
        if (extractedData.net_od === extractedData.total_premium) {
          console.log('⚠️ DIGIT Bug detected: All premium fields are equal!');
          console.log('🔍 This indicates OpenAI extracted total_premium from wrong source');
        } else {
          console.log('✅ DIGIT extraction appears correct: total_premium differs from Total OD Premium fields');
        }
      }
      
      // Enhanced logging for TATA AIG extraction debugging
      if (insurer === 'TATA_AIG') {
        const manufacturingYear = this.extractManufacturingYear(pdfText);
        const year = parseInt(manufacturingYear);
        
        console.log('🔍 TATA AIG extraction results:');
        console.log(`  - manufacturing_year: ${manufacturingYear}`);
        console.log(`  - net_od: ${extractedData.net_od}`);
        console.log(`  - total_od: ${extractedData.total_od}`);
        console.log(`  - net_premium: ${extractedData.net_premium}`);
        console.log(`  - total_premium: ${extractedData.total_premium}`);
        
        if (year <= 2022) {
          // Check if Total OD was calculated correctly for 2022 and below
          if (extractedData.net_od !== null && extractedData.add_on_premium_c !== null) {
            const expectedTotalOD = extractedData.net_od + extractedData.add_on_premium_c;
            if (extractedData.total_od === expectedTotalOD) {
              console.log('✅ TATA AIG 2022- Logic: Total OD correctly calculated as Net OD + Add on Premium (C)');
              console.log(`🔍 Calculation: ${extractedData.net_od} + ${extractedData.add_on_premium_c} = ${extractedData.total_od}`);
            } else {
              console.log('❌ TATA AIG 2022- Logic ERROR: Total OD calculation incorrect!');
              console.log('🔍 This indicates OpenAI did not follow calculation instructions');
              console.log(`🔍 Expected: ${extractedData.net_od} + ${extractedData.add_on_premium_c} = ${expectedTotalOD}`);
              console.log(`🔍 Actual: ${extractedData.total_od}`);
              
              // Auto-correct: Set Total OD to calculated value
              extractedData.total_od = expectedTotalOD;
              console.log('🔧 TATA AIG 2022- Auto-correction: Total OD set to calculated value');
              console.log(`🔧 Total OD corrected from ${extractedData.total_od} to ${expectedTotalOD}`);
            }
          } else {
            console.log('⚠️ Cannot validate Total OD calculation: Missing Net OD or Add on Premium (C)');
            console.log(`🔍 Net OD: ${extractedData.net_od}, Add on Premium (C): ${extractedData.add_on_premium_c}`);
            extractedData.total_od = null;
            console.log('🔧 Total OD set to null due to missing calculation components');
          }
        } else {
          // Check if Total OD equals Net Premium for 2023+ models
          if (extractedData.total_od === extractedData.net_premium) {
            console.log('✅ TATA AIG 2023+ Logic: Total OD correctly equals Net Premium');
          } else {
            console.log('❌ TATA AIG 2023+ Logic ERROR: Total OD should equal Net Premium but values differ');
            console.log('🔍 This indicates OpenAI did not follow assignment instructions');
            console.log('🔍 Expected: Total OD = Net Premium (same value)');
            console.log(`  - Net Premium: ${extractedData.net_premium}`);
            console.log(`  - Total OD: ${extractedData.total_od}`);
            
            // Auto-correct: Set Total OD to Net Premium value
            if (extractedData.net_premium !== null && extractedData.net_premium !== undefined) {
              extractedData.total_od = extractedData.net_premium;
              console.log('🔧 TATA AIG 2023+ Auto-correction: Total OD set to Net Premium value');
              console.log(`🔧 Total OD corrected from ${extractedData.total_od} to ${extractedData.net_premium}`);
            } else {
              console.log('⚠️ Cannot auto-correct: Net Premium is null or undefined');
              extractedData.total_od = null;
              console.log('🔧 Total OD set to null due to Net Premium extraction failure');
            }
          }
        }
      }
      
      return extractedData;
    } catch (error) {
      console.error('❌ OpenAI extraction failed:', error);
      throw error;
    }
  }

  // Main extraction method (replaces Textract)
  async extractTextFromPDF(s3Key, insurer = 'TATA_AIG') {
    try {
      console.log('🔄 Starting OpenAI PDF processing...');
      
      // 1. Download PDF from S3
      const pdfBuffer = await this.downloadFromS3(s3Key);
      
      // 2. Convert PDF to text
      const pdfText = await this.convertPDFToText(pdfBuffer);
      
      // 3. Extract data with OpenAI
      const extractedData = await this.extractPolicyData(pdfText, insurer);
      
      console.log('✅ OpenAI PDF processing completed');
      return extractedData;
    } catch (error) {
      console.error('❌ OpenAI PDF processing failed:', error);
      throw error;
    }
  }
}

module.exports = new OpenAIService();
