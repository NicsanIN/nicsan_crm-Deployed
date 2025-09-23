# Three Insurer Rules Analysis - Current State After DIGIT Simplification

## Executive Summary

After the DIGIT simplification changes, here's the current state of all three major insurers in the NicsanCRM system. Each insurer now has different levels of complexity and processing rules.

---

## 🎯 **TATA AIG - Dynamic Rule-Based Extraction (Most Complex)**

### **Process Type**: Dynamic Rule-Based Extraction with Auto-Correction

### **1. Manufacturing Year Detection**
```javascript
// AI-powered year extraction from PDF text
extractManufacturingYear(pdfText) {
  const patterns = [
    /(?:manufacturing year|model year|year of manufacture|year)[\s:]*(\d{4})/i,
    /(\d{4})[\s]*(?:manufacturing|model|year)/i,
    /(?:vehicle year|car year)[\s:]*(\d{4})/i
  ];
  
  // Extract year and validate range (2000-2030)
  // Default to 2023+ logic if not found
}
```

### **2. Dynamic Rule Building (Year-Based)**
```javascript
if (insurer === 'TATA_AIG') {
  const manufacturingYear = this.extractManufacturingYear(pdfText);
  dynamicRules = this.buildTATAAIGTotalODRule(manufacturingYear);
}
```

### **3. Year-Based Field Mapping Rules**

#### **2022 and Below Logic (Calculation-Based)**:
```javascript
// OpenAI Rules:
- Net OD (₹): Extract "Total Own Damage Premium (A)" values
- Net Premium (₹): Extract "Net Premium" or "Net Premium (₹)" values
- Total OD (₹): CALCULATE Total OD = Net OD + "Total Add on Premium (C)"
  * CRITICAL: This is a CALCULATION, not direct extraction
  * Net OD comes from "Total Own Damage Premium (A)"
  * Add on Premium (C) comes from "Total Add on Premium (C)"
  * Total OD = Net OD + Add on Premium (C) - CALCULATION
  * VALIDATION: Total OD should equal Net OD + Add on Premium (C)
```

#### **2023 and Above Logic (Assignment-Based)**:
```javascript
// OpenAI Rules:
- Net OD (₹): Extract "Total Own Damage Premium (A)" values
- Net Premium (₹): Extract "Net Premium" or "Net Premium (₹)" values
- Total OD (₹): ASSIGN Total OD = Net Premium (same value)
  * CRITICAL: For newer vehicles, Total OD should equal Net Premium
  * Net Premium comes from "Net Premium" or "Net Premium (₹)" fields
  * Total OD should be EXACTLY the same value as Net Premium
  * VALIDATION: Total OD should EQUAL Net Premium
```

### **4. Auto-Correction Logic**

#### **2022 and Below Auto-Correction**:
```javascript
if (year <= 2022) {
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
}
```

#### **2023 and Above Auto-Correction**:
```javascript
else {
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

### **5. TATA AIG Characteristics**:
- **Complexity**: High (4 steps with dynamic rules)
- **Year Detection**: Yes (AI-powered regex patterns)
- **Dynamic Rules**: Yes (year-based logic)
- **Auto-Correction**: Yes (calculation-based for 2022-, assignment-based for 2023+)
- **Validation**: Yes (year-specific logic validation)
- **Confidence**: Standard (0.8)

---

## 📋 **RELIANCE GENERAL - Simple Extraction (Baseline)**

### **Process Type**: Simple Extraction with Basic Field Mapping

### **1. Standard OpenAI Extraction**
```javascript
// Standard OpenAI processing with RELIANCE_GENERAL rules
const openaiResult = await extractTextFromPDF(upload.s3_key, upload.insurer);
```

### **2. Simple Field Mapping Rules**
```javascript
// OpenAI Rules:
11. For RELIANCE_GENERAL policies specifically:
    - Net OD (₹): Extract from "Total Own Damage Premium" values
    - Total OD (₹): Extract from "Total Own Damage Premium" values  
    - Net Premium (₹): Extract from "Total Own Damage Premium" values
    - Total Premium (₹): Extract from "Total Premium Payable" values
```

### **3. Post-Processing Field Standardization**
```javascript
// Handle RELIANCE_GENERAL policies
if (extractedData.insurer === 'RELIANCE_GENERAL') {
  // All three fields (net_od, total_od, net_premium) should equal "Total Own Damage Premium"
  const totalOwnDamagePremium = extractedData.net_od || extractedData.total_od || extractedData.net_premium;
  if (totalOwnDamagePremium) {
    console.log(`🔧 RELIANCE_GENERAL: Setting all three fields to Total Own Damage Premium value: ${totalOwnDamagePremium}`);
    extractedData.net_od = totalOwnDamagePremium;
    extractedData.total_od = totalOwnDamagePremium;
    extractedData.net_premium = totalOwnDamagePremium;
  }
}
```

### **4. RELIANCE GENERAL Characteristics**:
- **Complexity**: Low (3 simple steps)
- **Field Mapping**: Simple (all from "Total Own Damage Premium")
- **Auto-Correction**: No
- **Validation**: Basic (no specific validation)
- **Confidence**: Standard (0.8)

---

## 🔄 **DIGIT - Simplified Extraction (After Changes)**

### **Process Type**: Simplified Extraction (Like RELIANCE GENERAL)

### **1. Standard OpenAI Extraction**
```javascript
// Standard OpenAI processing with simplified DIGIT rules
const openaiResult = await extractTextFromPDF(upload.s3_key, upload.insurer);
```

### **2. Simplified Field Mapping Rules**
```javascript
// OpenAI Rules (Simplified):
10. For DIGIT policies specifically:
    - Net OD (₹): Extract from "Net Premium" values
    - Total OD (₹): Extract from "Net Premium" values  
    - Net Premium (₹): Extract from "Net Premium" values
    - Total Premium (₹): Extract from "Final Premium" values
```

### **3. Post-Processing Field Standardization**
```javascript
// For DIGIT: Simple field mapping like RELIANCE GENERAL
if (extractedData.insurer === 'DIGIT') {
  console.log('🔍 Processing DIGIT with simplified extraction...');
  
  // Simple field standardization (like RELIANCE GENERAL)
  const netPremium = extractedData.net_premium;
  if (netPremium) {
    console.log(`🔧 DIGIT: Setting Net OD and Total OD to Net Premium value: ${netPremium}`);
    extractedData.net_od = netPremium;
    extractedData.total_od = netPremium;
  }
  
  // Keep basic validation but simplified
  if (extractedData.net_premium >= extractedData.total_premium) {
    console.log('⚠️ DIGIT Validation Failed: Net Premium >= Total Premium');
    extractedData.digit_bug_flag = 'NET_PREMIUM_NOT_LESS_THAN_TOTAL_PREMIUM';
    extractedData.confidence_score = Math.min(extractedData.confidence_score, 0.35);
  } else {
    console.log(`✅ DIGIT validation passed: Net Premium (${extractedData.net_premium}) < Total Premium (${extractedData.total_premium})`);
  }
}
```

### **4. DIGIT Characteristics (After Simplification)**:
- **Complexity**: Low (3 simple steps - same as RELIANCE GENERAL)
- **Field Mapping**: Simple (Net OD = Total OD = Net Premium)
- **Auto-Correction**: No
- **Validation**: Basic (Net Premium < Total Premium constraint)
- **Confidence**: Standard (0.8) with penalty (≤ 0.35) for validation failures

---

## 📊 **Comparison Summary**

| Aspect | TATA AIG | RELIANCE GENERAL | DIGIT (Simplified) |
|--------|----------|------------------|-------------------|
| **Process Type** | Dynamic Rule-Based | Simple Extraction | Simple Extraction |
| **Complexity** | High (4 steps) | Low (3 steps) | Low (3 steps) |
| **Year Detection** | ✅ Yes (AI-powered) | ❌ No | ❌ No |
| **Dynamic Rules** | ✅ Yes (Year-based) | ❌ No | ❌ No |
| **Auto-Correction** | ✅ Yes (Calculation/Assignment) | ❌ No | ❌ No |
| **Field Standardization** | ❌ No | ✅ Yes | ✅ Yes |
| **Validation** | ✅ Yes (Year logic) | ❌ No | ✅ Yes (Basic) |
| **Confidence Penalty** | ❌ No | ❌ No | ✅ Yes (≤ 0.35) |
| **Processing Time** | Medium | Fastest | Fastest |
| **Accuracy** | High (Auto-correction) | Standard | Standard |

---

## 🔍 **Detailed Rule Analysis**

### **1. TATA AIG Rules (Most Complex)**

#### **Manufacturing Year Detection**:
- **Pattern 1**: `(?:manufacturing year|model year|year of manufacture|year)[\s:]*(\d{4})`
- **Pattern 2**: `(\d{4})[\s]*(?:manufacturing|model|year)`
- **Pattern 3**: `(?:vehicle year|car year)[\s:]*(\d{4})`
- **Range Validation**: 2000-2030
- **Default**: 2023+ logic if not found

#### **2022 and Below Rules**:
- **Net OD**: "Total Own Damage Premium (A)"
- **Net Premium**: "Net Premium" or "Net Premium (₹)"
- **Total OD**: **CALCULATION** = Net OD + "Total Add on Premium (C)"
- **Add on Premium (C)**: "Total Add on Premium (C)" (with variations)
- **Validation**: Total OD must equal Net OD + Add on Premium (C)
- **Auto-Correction**: If calculation wrong, set Total OD to calculated value

#### **2023 and Above Rules**:
- **Net OD**: "Total Own Damage Premium (A)"
- **Net Premium**: "Net Premium" or "Net Premium (₹)"
- **Total OD**: **ASSIGNMENT** = Net Premium (same value)
- **Validation**: Total OD must equal Net Premium
- **Auto-Correction**: If assignment wrong, set Total OD to Net Premium value

### **2. RELIANCE GENERAL Rules (Baseline)**

#### **Field Mapping**:
- **Net OD**: "Total Own Damage Premium"
- **Total OD**: "Total Own Damage Premium"
- **Net Premium**: "Total Own Damage Premium"
- **Total Premium**: "Total Premium Payable"

#### **Post-Processing**:
- **Standardization**: All three fields (net_od, total_od, net_premium) set to same value
- **Source**: Use any of the three extracted values
- **No Validation**: No specific business rule validation

### **3. DIGIT Rules (Simplified)**

#### **Field Mapping**:
- **Net OD**: "Net Premium"
- **Total OD**: "Net Premium"
- **Net Premium**: "Net Premium"
- **Total Premium**: "Final Premium"

#### **Post-Processing**:
- **Standardization**: Net OD and Total OD set to Net Premium value
- **Validation**: Net Premium < Total Premium (hard constraint)
- **Confidence Penalty**: ≤ 0.35 if validation fails

---

## 🎯 **Key Differences After Simplification**

### **1. TATA AIG - Remains Most Complex**
- **Unique Feature**: Manufacturing year detection and dynamic rules
- **Unique Feature**: Auto-correction with calculation/assignment logic
- **Unique Feature**: Year-based field mapping (2022- vs 2023+)
- **Processing**: Medium complexity, high accuracy

### **2. RELIANCE GENERAL - Baseline Simple**
- **Unique Feature**: All premium fields from single source
- **Unique Feature**: No validation or auto-correction
- **Processing**: Fastest, standard accuracy

### **3. DIGIT - Now Simplified (Like RELIANCE GENERAL)**
- **Changed**: From multi-phase to simple extraction
- **Changed**: From pattern detection to simple field mapping
- **Changed**: From complex validation to basic validation
- **Retained**: Net Premium < Total Premium constraint
- **Retained**: Confidence penalty for validation failures
- **Processing**: Fastest (like RELIANCE GENERAL), standard accuracy

---

## 📈 **Processing Flow Comparison**

### **TATA AIG Flow**:
```
PDF Upload → Manufacturing Year Detection → Dynamic Rule Building → OpenAI Extraction → Auto-Correction → Validation → Final Result
```

### **RELIANCE GENERAL Flow**:
```
PDF Upload → OpenAI Extraction → Simple Field Mapping → Field Standardization → Final Result
```

### **DIGIT Flow (After Simplification)**:
```
PDF Upload → OpenAI Extraction → Simple Field Mapping → Basic Validation → Final Result
```

---

## 🏁 **Summary**

After the DIGIT simplification:

1. **TATA AIG**: Remains the most complex with dynamic year-based rules and auto-correction
2. **RELIANCE GENERAL**: Remains the baseline simple extraction
3. **DIGIT**: Now simplified to match RELIANCE GENERAL approach but with retained basic validation

The three insurers now have a clear hierarchy of complexity:
- **TATA AIG**: High complexity (dynamic rules + auto-correction)
- **DIGIT**: Low complexity (simple extraction + basic validation)
- **RELIANCE GENERAL**: Low complexity (simple extraction, no validation)

All three use the same base OpenAI extraction but with different post-processing rules and validation levels.
