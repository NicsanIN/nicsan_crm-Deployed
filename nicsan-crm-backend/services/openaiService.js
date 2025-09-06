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

  // Extract DIGIT premiums using multi-phase approach
  async extractDigitPremiums(pdfText) {
    try {
      console.log('🔄 Starting multi-phase DIGIT extraction...');
      
      // Phase 1: Extract "Net Premium (₹)" for first three fields
      const netPremiumPrompt = `Find "Net Premium (₹)" value in this text. Return ONLY the number.
      Look for patterns like: "Net Premium (₹): 4902" or "Net Premium: 4902"
      DO NOT use "Total OD Premium" or "Own Damage Premium" - only "Net Premium (₹)"
      Text: ${pdfText}`;
      
      const netPremiumResponse = await this.client.chat.completions.create({
        model: process.env.OPENAI_MODEL_FAST || 'gpt-4o-mini',
        messages: [{ role: "user", content: netPremiumPrompt }],
        temperature: 0.1,
        max_tokens: 50
      });
      
      const netPremium = parseInt(netPremiumResponse.choices[0].message.content.trim());
      
      // Phase 2: Extract "Final Premium"
      const finalPremiumPrompt = `Find "Final Premium" value in this text. Return ONLY the number.
      Look for patterns like: "Final Premium: 6500" or "Final Premium (₹): 6500"
      DO NOT use "Net Premium (₹)" or "Total OD Premium" - only "Final Premium"
      Text: ${pdfText}`;
      
      const finalPremiumResponse = await this.client.chat.completions.create({
        model: process.env.OPENAI_MODEL_FAST || 'gpt-4o-mini',
        messages: [{ role: "user", content: finalPremiumPrompt }],
        temperature: 0.1,
        max_tokens: 50
      });
      
      const finalPremium = parseInt(finalPremiumResponse.choices[0].message.content.trim());
      
      // Phase 3: Validate and return
      if (netPremium && finalPremium && netPremium !== finalPremium) {
        console.log(`✅ Multi-phase extraction successful: Net Premium (₹)=${netPremium}, Final Premium=${finalPremium}`);
        return {
          net_od: netPremium,
          total_od: netPremium,
          net_premium: netPremium,
          total_premium: finalPremium,
          extraction_method: 'MULTI_PHASE'
        };
      }
      
      throw new Error('Multi-phase extraction failed - values not found or equal');
    } catch (error) {
      console.error('❌ Multi-phase extraction failed:', error);
      throw error;
    }
  }

  // Extract policy data using OpenAI
  async extractPolicyData(pdfText, insurer) {
    try {
      console.log('🤖 Processing with OpenAI GPT-4o-mini...');
      
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
  "issue_date": "string",
  "expiry_date": "string",
  "idv": "number",
  "ncb": "number",
  "discount": "number",
  "net_od": "number",
  "ref": "string",
  "total_od": "number",
  "net_premium": "number",
  "total_premium": "number",
  "confidence_score": "number"
}

CRITICAL EXTRACTION RULES:
1. Extract ONLY the individual vehicle IDV value (not total IDV, not table concatenations)
2. Look for "IDV (₹)" followed by a number in header sections
3. IGNORE table values like "Vehicle IDV (₹)" or "Total IDV (₹)"
4. Do NOT concatenate policy year with IDV values
5. For IDV: Look specifically for "IDV (₹):" in header sections, NOT "Vehicle IDV (₹)" or "Total IDV (₹)" in tables. TATA AIG uses "IDV (₹):" in policy header, ignore all table variations.
6. Policy year and IDV are SEPARATE fields - do not combine them
7. For table data, extract only the IDV column value, ignore policy year column
8. For NET OD: Extract "Total Own Damage Premium (A)" values - this is the NET OD in TATA AIG
9. For TOTAL OD: Extract "Total Premium" or "Total Amount" values - this is the TOTAL OD in TATA AIG
10. For DIGIT policies specifically:
    - Net OD (₹): Extract from "Net Premium (₹)" values
    - Total OD (₹): Extract from "Net Premium (₹)" values  
    - Net Premium (₹): Extract from "Net Premium (₹)" values
    - Total Premium (₹): Extract from "Final Premium" values
    
    CRITICAL DIGIT RULE: "Net Premium (₹)" and "Final Premium" are DIFFERENT fields!
    - "Net Premium (₹)" is typically smaller (e.g., 4902)
    - "Final Premium" is typically larger (e.g., 6500)
    - These values should be DIFFERENT!
    - Look for "Final Premium" or "Total Premium Payable" for total_premium
    - DO NOT use "Net Premium (₹)" value for total_premium!
11. For RELIANCE_GENERAL policies specifically:
    - Net OD (₹): Extract from "Total Own Damage Premium" values
    - Total OD (₹): Extract from "Total Own Damage Premium" values  
    - Net Premium (₹): Extract from "Total Own Damage Premium" values
    - Total Premium (₹): Extract from "Total Premium Payable" values
12. For NCB: Extract percentage value, use 0 if not found (not 20)

For ${insurer} insurance policies. If a field is not found, use null. For dates, use YYYY-MM-DD format. For numbers, use actual numbers not strings.

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
          console.log('✅ DIGIT extraction appears correct: total_premium differs from other premium fields');
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
