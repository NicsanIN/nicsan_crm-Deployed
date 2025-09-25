/**
 * Comprehensive Financial Data Validation Utilities
 * 
 * This module provides safe, consistent financial data handling across
 * frontend and backend to prevent data corruption.
 */

/**
 * Safely parse and validate financial values
 * @param {any} value - Input value to parse
 * @param {Object} options - Validation options
 * @param {number} options.min - Minimum allowed value (default: 0)
 * @param {number} options.max - Maximum allowed value (default: 999999999.99)
 * @param {number} options.defaultValue - Default value if invalid (default: 0)
 * @param {boolean} options.allowNegative - Allow negative values (default: false)
 * @param {boolean} options.allowZero - Allow zero values (default: true)
 * @param {string} options.fieldName - Field name for error messages
 * @returns {Object} - { value: number, isValid: boolean, error?: string }
 */
function validateFinancialValue(value, options = {}) {
  const {
    min = 0,
    max = 999999999.99,
    defaultValue = 0,
    allowNegative = false,
    allowZero = true,
    fieldName = 'Financial field'
  } = options;

  // Handle null/undefined/empty
  if (value === null || value === undefined || value === '') {
    return {
      value: defaultValue,
      isValid: true,
      error: null
    };
  }

  // Convert to string and clean
  let cleanValue = String(value).trim();
  
  // Remove common currency symbols and formatting
  cleanValue = cleanValue
    .replace(/[₹$€£¥]/g, '') // Remove currency symbols
    .replace(/,/g, '') // Remove commas
    .replace(/\s+/g, '') // Remove spaces
    .replace(/[^\d.-]/g, ''); // Keep only digits, dots, and minus

  // Handle empty after cleaning
  if (cleanValue === '' || cleanValue === '-') {
    return {
      value: defaultValue,
      isValid: true,
      error: null
    };
  }

  // Parse the number
  const num = parseFloat(cleanValue);
  
  // Check for NaN
  if (isNaN(num)) {
    return {
      value: defaultValue,
      isValid: false,
      error: `${fieldName}: Invalid number format`
    };
  }

  // Check for Infinity
  if (!isFinite(num)) {
    return {
      value: defaultValue,
      isValid: false,
      error: `${fieldName}: Value cannot be infinite`
    };
  }

  // Check negative values
  if (num < 0 && !allowNegative) {
    return {
      value: Math.abs(num), // Convert to positive
      isValid: false,
      error: `${fieldName}: Negative values not allowed`
    };
  }

  // Check zero values
  if (num === 0 && !allowZero) {
    return {
      value: defaultValue,
      isValid: false,
      error: `${fieldName}: Zero values not allowed`
    };
  }

  // Check bounds
  if (num < min) {
    return {
      value: min,
      isValid: false,
      error: `${fieldName}: Value below minimum (${min})`
    };
  }

  if (num > max) {
    return {
      value: max,
      isValid: false,
      error: `${fieldName}: Value above maximum (${max})`
    };
  }

  return {
    value: num,
    isValid: true,
    error: null
  };
}

/**
 * Validate premium amounts with business logic
 * @param {any} value - Premium value
 * @param {Object} context - Additional context for validation
 * @returns {Object} - Validation result
 */
function validatePremium(value, context = {}) {
  return validateFinancialValue(value, {
    min: 1, // Premium must be at least ₹1
    max: 10000000, // Maximum ₹1 crore premium
    allowZero: false,
    allowNegative: false,
    fieldName: 'Premium'
  });
}

/**
 * Validate IDV (Insured Declared Value) with business logic
 * @param {any} value - IDV value
 * @returns {Object} - Validation result
 */
function validateIDV(value) {
  return validateFinancialValue(value, {
    min: 1000, // Minimum ₹1000 IDV
    max: 100000000, // Maximum ₹10 crore IDV
    allowZero: false,
    allowNegative: false,
    fieldName: 'IDV'
  });
}

/**
 * Validate cashback amounts with business logic
 * @param {any} value - Cashback value
 * @param {number} totalPremium - Total premium for percentage validation
 * @returns {Object} - Validation result
 */
function validateCashback(value, totalPremium = 0) {
  const result = validateFinancialValue(value, {
    min: 0,
    max: totalPremium * 0.5, // Cashback cannot exceed 50% of premium
    allowZero: true,
    allowNegative: false,
    fieldName: 'Cashback'
  });

  // Additional business logic validation
  if (result.isValid && totalPremium > 0 && result.value > totalPremium * 0.5) {
    return {
      value: totalPremium * 0.5,
      isValid: false,
      error: 'Cashback: Cannot exceed 50% of total premium'
    };
  }

  return result;
}

/**
 * Validate brokerage amounts with business logic
 * @param {any} value - Brokerage value
 * @param {number} totalPremium - Total premium for percentage validation
 * @returns {Object} - Validation result
 */
function validateBrokerage(value, totalPremium = 0) {
  const result = validateFinancialValue(value, {
    min: 0,
    max: totalPremium * 0.15, // Brokerage cannot exceed 15% of premium
    allowZero: true,
    allowNegative: false,
    fieldName: 'Brokerage'
  });

  // Additional business logic validation
  if (result.isValid && totalPremium > 0 && result.value > totalPremium * 0.15) {
    return {
      value: totalPremium * 0.15,
      isValid: false,
      error: 'Brokerage: Cannot exceed 15% of total premium'
    };
  }

  return result;
}

/**
 * Validate percentage values (NCB, Discount, etc.)
 * @param {any} value - Percentage value
 * @param {number} maxPercent - Maximum allowed percentage (default: 100)
 * @returns {Object} - Validation result
 */
function validatePercentage(value, maxPercent = 100) {
  return validateFinancialValue(value, {
    min: 0,
    max: maxPercent,
    allowZero: true,
    allowNegative: false,
    fieldName: 'Percentage'
  });
}

/**
 * Legacy function for backward compatibility
 * @param {any} value - Input value
 * @param {number} maxValue - Maximum value
 * @param {number} defaultValue - Default value
 * @returns {number} - Safe numeric value
 */
function safeNumeric(value, maxValue = 999999999.99, defaultValue = 0) {
  const result = validateFinancialValue(value, {
    min: 0,
    max: maxValue,
    defaultValue,
    allowZero: true,
    allowNegative: false
  });
  
  return result.value;
}

/**
 * Enhanced number parsing for frontend (replaces the dangerous number() function)
 * @param {any} value - Input value
 * @param {Object} options - Validation options
 * @returns {number} - Safe numeric value
 */
function safeNumber(value, options = {}) {
  const result = validateFinancialValue(value, {
    min: 0,
    max: 999999999.99,
    defaultValue: 0,
    allowZero: true,
    allowNegative: false,
    ...options
  });
  
  return result.value;
}

module.exports = {
  validateFinancialValue,
  validatePremium,
  validateIDV,
  validateCashback,
  validateBrokerage,
  validatePercentage,
  safeNumeric,
  safeNumber
};
