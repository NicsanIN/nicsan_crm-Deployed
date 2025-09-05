// Insurer Detection Service for PDF Content Analysis
const OpenAI = require('openai');
const pdf = require('pdf-parse');

class InsurerDetectionService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  // Convert PDF to text
  async convertPDFToText(pdfBuffer) {
    try {
      const data = await pdf(pdfBuffer);
      return data.text;
    } catch (error) {
      console.error('❌ Failed to convert PDF to text:', error);
      throw error;
    }
  }

  // Detect insurer from PDF content
  async detectInsurerFromPDF(pdfBuffer) {
    try {
      console.log('🔍 Detecting insurer from PDF content...');
      
      // Convert PDF to text
      const pdfText = await this.convertPDFToText(pdfBuffer);
      
      // Use OpenAI to detect insurer
      const prompt = `Analyze this insurance policy text and identify the insurer. 
      Return ONLY the insurer name from these exact options: TATA_AIG, DIGIT, RELIANCE_GENERAL, or UNKNOWN.
      
      Look for:
      - Company logos or headers
      - Insurer names in text
      - Policy format patterns
      - Company-specific terminology
      
      Text to analyze (first 2000 characters):
      ${pdfText.substring(0, 2000)}`;
      
      const response = await this.client.chat.completions.create({
        model: process.env.OPENAI_MODEL_FAST || 'gpt-4o-mini',
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 50
      });
      
      const detectedInsurer = response.choices[0].message.content.trim();
      console.log(`✅ Detected insurer: ${detectedInsurer}`);
      
      return detectedInsurer;
    } catch (error) {
      console.error('❌ Insurer detection failed:', error);
      return 'UNKNOWN';
    }
  }
}

module.exports = new InsurerDetectionService();
