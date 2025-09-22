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
    - Total OD (₹): Extract "Total Add on Premium (C)" values - this is needed for vehicles 2022 and below
      * CRITICAL: This field is ESSENTIAL for vehicles 2022 and below - MUST be extracted
      * RULE OVERRIDE: This rule OVERRIDES any other Total OD rules in this prompt for TATA AIG policies
      * PROHIBITED: DO NOT use "Total Own Damage Premium" for TATA AIG Total OD
      * PROHIBITED: DO NOT copy Net OD value for TATA AIG Total OD
      * PROHIBITED: DO NOT use RELIANCE_GENERAL rules for TATA AIG policies
      * FIELD DIFFERENTIATION: Total OD (₹) is DIFFERENT from Net OD (₹) for TATA AIG 2022 and below
      * Net OD (₹) comes from "Total Own Damage Premium (A)" 
      * Total OD (₹) comes from "Total Add on Premium (C)"
      * These are SEPARATE fields with DIFFERENT values - DO NOT copy Net OD to Total OD
      * VALIDATION: Total OD should NOT equal Net OD for 2022 and below models
      * If Total OD equals Net OD, the extraction is INCORRECT
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
      if (insurer === 'TATA_AIG') {
        const manufacturingYear = this.extractManufacturingYear(pdfText);
        dynamicRules = this.buildTATAAIGTotalODRule(manufacturingYear);
        console.log(`🔧 TATA AIG rules applied for year: ${manufacturingYear}`);
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
  "ref": "string",
  "total_od": "number",
  "net_premium": "number",
  "total_premium": "number",
  "customer_name": "string",
  "confidence_score": "number"
}

🚨 CRITICAL EXTRACTION RULES - DIGIT POLICIES (HIGHEST PRIORITY):
1. For DIGIT policies specifically - THESE RULES OVERRIDE ALL OTHERS:
    - Net OD (₹): MUST extract from "Total OD Premium" values ONLY
    - Total OD (₹): MUST extract from "Total OD Premium" values ONLY  
    - Net Premium (₹): MUST extract from "Total OD Premium" values ONLY
    - Total Premium (₹): MUST extract from "Final Premium" values ONLY
    - DO NOT use "Own Damage Premium" for any of these fields!
    - DO NOT use "Net Premium (₹)" for any of these fields!
    - "Total OD Premium" and "Final Premium" are DIFFERENT fields!
    - "Total OD Premium" is typically smaller (e.g., 4902)
    - "Final Premium" is typically larger (e.g., 6500)
    - These values should be DIFFERENT!

OTHER EXTRACTION RULES:
2. Extract IDV (Insured Declared Value) from multiple sources with priority order
3. PRIORITY 1: Table data - "Vehicle IDV (₹)" or "Total IDV (₹)" in tables (ACCEPT these values)
4. PRIORITY 2: Policy year context - "Policy Year: 2024, Vehicle IDV: 495000" (ACCEPT policy year + IDV combinations)
5. PRIORITY 3: Header data - "IDV (₹):" in header sections (fallback when table data unavailable)
6. For IDV: ACCEPT both header "IDV (₹):" AND table "Vehicle IDV (₹)" or "Total IDV (₹)" values
7. Policy year and IDV can be combined - extract policy year context when available
8. For table data, extract IDV column value AND policy year when present
9. For TATA_AIG policies specifically: PRIORITIZE "Total IDV (₹)" as the primary source over "Vehicle IDV (₹)"
10. For TATA_AIG policies specifically:
    - Net OD (₹): Extract "Total Own Damage Premium (A)" values - this is the NET OD in TATA AIG
    - Net Premium (₹): Extract "Net Premium" or "Net Premium (₹)" values from policy - this is the NET PREMIUM in TATA AIG
    ${dynamicRules}
11. For RELIANCE_GENERAL policies specifically:
    - Net OD (₹): Extract from "Total Own Damage Premium" values
    - Total OD (₹): Extract from "Total Own Damage Premium" values  
    - Net Premium (₹): Extract from "Total Own Damage Premium" values
    - Total Premium (₹): Extract from "Total Premium Payable" values
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
          // Check if Total OD was extracted correctly for 2022 and below
          if (extractedData.total_od === extractedData.net_od) {
            console.log('❌ TATA AIG 2022- Logic ERROR: Total OD equals Net OD - extraction failed!');
            console.log('🔍 This indicates OpenAI used wrong source for Total OD');
            console.log('🔍 Expected: Total OD from "Total Add on Premium (C)"');
            console.log('🔍 Actual: Total OD copied from Net OD value');
            
            // Set Total OD to null to indicate extraction failure
            extractedData.total_od = null;
            console.log('🔧 Total OD set to null due to extraction failure');
          } else {
            console.log('✅ TATA AIG 2022- Logic: Total OD correctly extracted from Add on Premium (C)');
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
