# All Insurer Extraction Rules Analysis - Complete Overview

## Executive Summary

This comprehensive analysis covers all extraction rules implemented for different insurers in the NicsanCRM system. The system currently supports **6 insurers** with varying complexity levels, from simple field standardization to complex mathematical calculations with auto-correction.

---

## 📊 **Complete Insurer Overview**

| Insurer | Complexity | Processing Type | Validation | Sources | Calculations | Auto-Correction |
|---------|------------|-----------------|------------|---------|--------------|-----------------|
| **TATA AIG** | High | Multi-phase | Yes (Year-based) | Multiple | Yes | Yes |
| **LIBERTY GENERAL** | High | Multi-phase | Yes (Calculation-based) | 4 | Yes | Yes |
| **Generali Central** | Medium | Simple | None | 3 | No | No |
| **DIGIT** | Low | Simple | None | 2 | No | No |
| **RELIANCE GENERAL** | Low | Simple | None | 2 | No | No |
| **ICICI Lombard** | Low | Simple | None | 2 | No | No |

---

## 🔍 **Detailed Analysis by Insurer**

### **1. TATA AIG - High Complexity (Year-Based Logic)**

#### **OpenAI Extraction Rules**:
```javascript
// TATA AIG specific rules
- Net OD (₹): Extract "Total Own Damage Premium (A)" values - this is the NET OD in TATA AIG
- Net Premium (₹): Extract "Net Premium" or "Net Premium (₹)" values from policy - this is the NET PREMIUM in TATA AIG

// Dynamic rules based on manufacturing year:
// For 2022 and below:
- Total OD (₹): Calculate Total OD (₹) = Net OD (₹) + "Total Add on Premium (C)" values
- CRITICAL: This is a CALCULATION, not a direct extraction
- PROHIBITED: DO NOT use "Total Own Damage Premium" for TATA AIG Total OD
- VALIDATION: Total OD should equal Net OD + Add on Premium (C)

// For 2023 and above:
- Total OD (₹): Set Total OD (₹) = Net Premium (₹) value
- CRITICAL: For newer vehicles, Total OD should equal Net Premium
- PROHIBITED: DO NOT use "Total Add on Premium (C)" for TATA AIG Total OD in 2023+ models
- VALIDATION: Total OD should EQUAL Net Premium for 2023+ models
```

#### **Storage Processing Logic**:
```javascript
// Year-based validation and auto-correction
if (year <= 2022) {
  // Check if Total OD was calculated correctly for 2022 and below
  if (extractedData.net_od !== null && extractedData.add_on_premium_c !== null) {
    const expectedTotalOD = extractedData.net_od + extractedData.add_on_premium_c;
    if (extractedData.total_od === expectedTotalOD) {
      console.log('✅ TATA AIG 2022- Logic: Total OD correctly calculated');
    } else {
      console.log('❌ TATA AIG 2022- Logic ERROR: Total OD calculation incorrect!');
      // Auto-correct: Set Total OD to calculated value
      extractedData.total_od = expectedTotalOD;
      console.log('🔧 TATA AIG 2022- Auto-correction: Total OD set to calculated value');
    }
  }
} else {
  // Check if Total OD equals Net Premium for 2023+ models
  if (extractedData.total_od === extractedData.net_premium) {
    console.log('✅ TATA AIG 2023+ Logic: Total OD correctly equals Net Premium');
  } else {
    console.log('❌ TATA AIG 2023+ Logic ERROR: Total OD should equal Net Premium but values differ');
    // Auto-correct: Set Total OD to Net Premium value
    if (extractedData.net_premium !== null && extractedData.net_premium !== undefined) {
      extractedData.total_od = extractedData.net_premium;
      console.log('🔧 TATA AIG 2023+ Auto-correction: Total OD set to Net Premium value');
    }
  }
}
```

#### **Key Features**:
- ✅ **Year-Based Logic**: Different rules for 2022- vs 2023+
- ✅ **Mathematical Calculations**: Net OD + Add on Premium = Total OD (2022-)
- ✅ **Assignment Logic**: Total OD = Net Premium (2023+)
- ✅ **Auto-Correction**: Fixes calculation and assignment errors
- ✅ **Complex Validation**: Multiple validation scenarios
- ✅ **Manufacturing Year Detection**: Automatic year extraction from PDF

---

### **2. LIBERTY GENERAL - High Complexity (Calculation-Based)**

#### **OpenAI Extraction Rules**:
```javascript
// LIBERTY GENERAL INSURANCE specific rules
- Net OD (₹): Extract from "TOTAL OWN­DAMAGE PREMIUM (A)" values
- Total OD (₹): Calculate as "TOTAL OWN­DAMAGE PREMIUM (A)" + "TOTAL ADD­ON COVER PREMIUM (C)" values
- Net Premium (₹): Extract from "Net Premium" values
- Total Premium (₹): Extract from "TOTAL POLICY PREMIUM" values
- Add on Premium (C): Extract from "TOTAL ADD­ON COVER PREMIUM (C)" values
```

#### **Storage Processing Logic**:
```javascript
// Validate and auto-correct Total OD calculation
if (extractedData.net_od !== null && extractedData.add_on_premium_c !== null) {
  const expectedTotalOD = extractedData.net_od + extractedData.add_on_premium_c;
  if (extractedData.total_od !== expectedTotalOD) {
    console.log('❌ LIBERTY GENERAL Calculation ERROR: Total OD calculation incorrect!');
    console.log(`🔍 Expected: ${extractedData.net_od} + ${extractedData.add_on_premium_c} = ${expectedTotalOD}`);
    console.log(`🔍 Actual: ${extractedData.total_od}`);
    
    // Auto-correct: Set Total OD to calculated value
    extractedData.total_od = expectedTotalOD;
    console.log('🔧 LIBERTY GENERAL Auto-correction: Total OD set to calculated value');
  } else {
    console.log('✅ LIBERTY GENERAL Calculation: Total OD correctly calculated');
  }
} else {
  console.log('⚠️ Cannot validate Total OD calculation: Missing Net OD or Add on Premium (C)');
  if (extractedData.net_od === null) {
    extractedData.total_od = null;
    console.log('🔧 Total OD set to null due to missing Net OD');
  }
}
```

#### **Key Features**:
- ✅ **Mathematical Calculation**: Total OD = Net OD + Add-on Premium (C)
- ✅ **Auto-Correction**: Fixes calculation errors automatically
- ✅ **Validation**: Ensures calculation accuracy
- ✅ **Error Detection**: Identifies extraction problems
- ✅ **Quality Assurance**: Mathematical consistency ensured

---

### **3. Generali Central - Medium Complexity (Partial Standardization)**

#### **OpenAI Extraction Rules**:
```javascript
// Generali Central Insurance specific rules
- Net OD (₹): Extract from "Total Own Damage Premium(A)" values
- Total OD (₹): Extract from "Total Annual Premium (A+B)" values  
- Net Premium (₹): Extract from "Total Annual Premium (A+B)" values
- Total Premium (₹): Extract from "Total Premium" values
```

#### **Storage Processing Logic**:
```javascript
// Field standardization - Total OD and Net Premium from "Total Annual Premium (A+B)"
const totalAnnualPremiumAB = extractedData.total_od || extractedData.net_premium;
if (totalAnnualPremiumAB) {
  console.log(`🔧 Generali Central: Setting Total OD and Net Premium to Total Annual Premium (A+B) value: ${totalAnnualPremiumAB}`);
  extractedData.total_od = totalAnnualPremiumAB;
  extractedData.net_premium = totalAnnualPremiumAB;
}
```

#### **Key Features**:
- ✅ **Three Different Sources**: Net OD, Total OD/Net Premium, Total Premium
- ✅ **Partial Standardization**: Total OD and Net Premium are standardized
- ✅ **No Validation**: Simple field consistency only
- ✅ **No Calculations**: No mathematical operations

---

### **4. DIGIT - Low Complexity (Simple Standardization)**

#### **OpenAI Extraction Rules**:
```javascript
// DIGIT specific rules (simplified)
- Net OD (₹): Extract from "Net Premium" values
- Total OD (₹): Extract from "Net Premium" values  
- Net Premium (₹): Extract from "Net Premium" values
- Total Premium (₹): Extract from "Final Premium" values
```

#### **Storage Processing Logic**:
```javascript
// Simple field standardization (like RELIANCE GENERAL)
const netPremium = extractedData.net_premium;
if (netPremium) {
  console.log(`🔧 DIGIT: Setting Net OD and Total OD to Net Premium value: ${netPremium}`);
  extractedData.net_od = netPremium;
  extractedData.total_od = netPremium;
}
// No validation - just field standardization
```

#### **Key Features**:
- ✅ **Two Different Sources**: Net Premium vs Final Premium
- ✅ **Simple Standardization**: Net OD and Total OD equal Net Premium
- ✅ **No Validation**: No business rule checking
- ✅ **No Calculations**: No mathematical operations

---

### **5. RELIANCE GENERAL - Low Complexity (Simple Standardization)**

#### **OpenAI Extraction Rules**:
```javascript
// RELIANCE_GENERAL specific rules
- Net OD (₹): Extract from "Total Own Damage Premium" values
- Total OD (₹): Extract from "Total Own Damage Premium" values  
- Net Premium (₹): Extract from "Total Own Damage Premium" values
- Total Premium (₹): Extract from "Total Premium Payable" values
```

#### **Storage Processing Logic**:
```javascript
// For RELIANCE_GENERAL: All three fields (net_od, total_od, net_premium) should equal "Total Own Damage Premium"
const totalOwnDamagePremium = extractedData.net_od || extractedData.total_od || extractedData.net_premium;
if (totalOwnDamagePremium) {
  console.log(`🔧 RELIANCE_GENERAL: Setting all three fields to Total Own Damage Premium value: ${totalOwnDamagePremium}`);
  extractedData.net_od = totalOwnDamagePremium;
  extractedData.total_od = totalOwnDamagePremium;
  extractedData.net_premium = totalOwnDamagePremium;
}
```

#### **Key Features**:
- ✅ **Single Source for Most Fields**: All premium fields from "Total Own Damage Premium"
- ✅ **Complete Standardization**: All three fields are standardized
- ✅ **No Validation**: No business rule checking
- ✅ **No Calculations**: No mathematical operations

---

### **6. ICICI Lombard - Low Complexity (Simple Standardization)**

#### **OpenAI Extraction Rules**:
```javascript
// ICICI Lombard General Insurance specific rules
- Net OD (₹): Extract from "Total Own Damage Premium(A)" values
- Total OD (₹): Extract from "Total Own Damage Premium(A)" values  
- Net Premium (₹): Extract from "Total Own Damage Premium(A)" values
- Total Premium (₹): Extract from "Total Premium Payable" values
```

#### **Storage Processing Logic**:
```javascript
// Field standardization - all three fields from "Total Own Damage Premium(A)"
const totalOwnDamagePremiumA = extractedData.net_od || extractedData.total_od || extractedData.net_premium;
if (totalOwnDamagePremiumA) {
  console.log(`🔧 ICICI Lombard: Setting all three fields to Total Own Damage Premium(A) value: ${totalOwnDamagePremiumA}`);
  extractedData.net_od = totalOwnDamagePremiumA;
  extractedData.total_od = totalOwnDamagePremiumA;
  extractedData.net_premium = totalOwnDamagePremiumA;
}
```

#### **Key Features**:
- ✅ **Single Source for Most Fields**: All premium fields from "Total Own Damage Premium(A)"
- ✅ **Complete Standardization**: All three fields are standardized
- ✅ **No Validation**: No business rule checking
- ✅ **No Calculations**: No mathematical operations

---

## 🎯 **Field Mapping Summary**

### **Field Sources by Insurer**:

| Field | TATA AIG | LIBERTY GENERAL | Generali Central | DIGIT | RELIANCE GENERAL | ICICI Lombard |
|-------|----------|-----------------|------------------|-------|------------------|---------------|
| **Net OD** | Total Own Damage Premium (A) | TOTAL OWN­DAMAGE PREMIUM (A) | Total Own Damage Premium(A) | Net Premium | Total Own Damage Premium | Total Own Damage Premium(A) |
| **Total OD** | Calculated/Assigned | Calculated | Total Annual Premium (A+B) | Net Premium | Total Own Damage Premium | Total Own Damage Premium(A) |
| **Net Premium** | Net Premium | Net Premium | Total Annual Premium (A+B) | Net Premium | Total Own Damage Premium | Total Own Damage Premium(A) |
| **Total Premium** | Various | TOTAL POLICY PREMIUM | Total Premium | Final Premium | Total Premium Payable | Total Premium Payable |

---

## 🔍 **Processing Complexity Levels**

### **High Complexity (TATA AIG, LIBERTY GENERAL)**:
- **Mathematical Operations**: Calculations and assignments
- **Auto-Correction**: Automatic error fixing
- **Validation**: Business rule checking
- **Error Detection**: Problem identification
- **Quality Assurance**: Data consistency

### **Medium Complexity (Generali Central)**:
- **Multiple Sources**: Three different field sources
- **Partial Standardization**: Some fields standardized
- **No Calculations**: No mathematical operations
- **No Validation**: No business rule checking

### **Low Complexity (DIGIT, RELIANCE GENERAL, ICICI Lombard)**:
- **Simple Sources**: One or two field sources
- **Field Standardization**: Field consistency
- **No Calculations**: No mathematical operations
- **No Validation**: No business rule checking

---

## 🏁 **Summary**

### **Current Implementation Status**:

#### **Fully Implemented (6 Insurers)**:
1. **TATA AIG**: High complexity with year-based logic
2. **LIBERTY GENERAL**: High complexity with calculation validation
3. **Generali Central**: Medium complexity with partial standardization
4. **DIGIT**: Low complexity with simple standardization
5. **RELIANCE GENERAL**: Low complexity with complete standardization
6. **ICICI Lombard**: Low complexity with complete standardization

#### **Key Features by Complexity**:

##### **High Complexity**:
- Mathematical calculations and assignments
- Auto-correction capabilities
- Business rule validation
- Error detection and logging
- Quality assurance mechanisms

##### **Medium Complexity**:
- Multiple field sources
- Partial field standardization
- No mathematical operations
- No validation logic

##### **Low Complexity**:
- Simple field sources
- Complete field standardization
- No mathematical operations
- No validation logic

#### **System Architecture**:
- **OpenAI Service**: Handles field mapping rules for each insurer
- **Storage Service**: Handles post-processing, validation, and auto-correction
- **Insurer Detection**: Automatically identifies insurer from PDF content
- **Dual Processing**: OpenAI extraction + post-processing validation

The system provides a comprehensive solution for different insurer requirements, from simple field standardization to complex mathematical calculations with auto-correction capabilities.
