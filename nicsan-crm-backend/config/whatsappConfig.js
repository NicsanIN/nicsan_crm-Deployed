// WhatsApp Cloud API Configuration
const whatsappConfig = {
    // API Configuration
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
    
    // API URLs
    apiVersion: 'v18.0',
    baseUrl: 'https://graph.facebook.com',
    
    // Rate Limits
    rateLimit: {
      messagesPerDay: 1000,
      messagesPerSecond: 10
    },
    
    // Message Templates
    templates: {
      policyNotification: {
        name: 'policy_notification',
        category: 'UTILITY',
        language: 'en',
        components: [
          {
            type: 'BODY',
            text: 'Dear {{customer_name}},\n\nYour motor insurance policy has been successfully processed!\n\nPolicy Number: {{policy_number}}\nVehicle: {{make}} {{model}}\nRegistration: {{vehicle_number}}\nValid From: {{issue_date}}\nValid Until: {{expiry_date}}\nPremium: ₹{{total_premium}}\n\nYour policy document is attached.\n\nThank you for choosing Nicsan Insurance!'
          }
        ]
      }
    },
    
    // Default Settings
    defaults: {
      messagingProduct: 'whatsapp',
      messageType: 'text',
      documentType: 'application/pdf'
    }
  };
  
  // Validation function
  const validateConfig = () => {
    const required = [
      'WHATSAPP_ACCESS_TOKEN',
      'WHATSAPP_PHONE_NUMBER_ID',
      'WHATSAPP_BUSINESS_ACCOUNT_ID'
    ];
    
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required WhatsApp environment variables: ${missing.join(', ')}`);
    }
    
    return true;
  };
  
  // Get API URL for specific endpoint
  const getApiUrl = (endpoint) => {
    return `${whatsappConfig.baseUrl}/${whatsappConfig.apiVersion}/${endpoint}`;
  };
  
  // Get message URL
  const getMessageUrl = () => {
    return getApiUrl(`${whatsappConfig.phoneNumberId}/messages`);
  };
  
  // Get media URL
  const getMediaUrl = (mediaId) => {
    return getApiUrl(mediaId);
  };
  
  // Get phone number info URL
  const getPhoneNumberUrl = () => {
    return getApiUrl(whatsappConfig.phoneNumberId);
  };
  
  module.exports = {
    whatsappConfig,
    validateConfig,
    getApiUrl,
    getMessageUrl,
    getMediaUrl,
    getPhoneNumberUrl
  };
  