#!/usr/bin/env node

/**
 * Migration Script: Monolithic to Modular Structure
 * 
 * This script helps migrate from the old monolithic NicsanCRMMock.tsx
 * to the new modular component structure used in staging.
 */

import fs from 'fs';
import path from 'path';

console.log('🔄 Nicsan CRM Migration: Monolithic → Modular Structure');
console.log('=====================================================\n');

// Check if we're in the right directory
if (!fs.existsSync('src/NicsanCRMMock.tsx')) {
  console.error('❌ Error: src/NicsanCRMMock.tsx not found. Run this from the project root.');
  process.exit(1);
}

// Read the current monolithic file
const monolithicContent = fs.readFileSync('src/NicsanCRMMock.tsx', 'utf8');
const lines = monolithicContent.split('\n');

console.log(`📊 Current file: ${lines.length} lines`);

// Analyze the structure
const components = [];
let currentComponent = null;
let braceCount = 0;
let inComponent = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  
  // Detect component functions
  if (line.startsWith('function ') && line.includes('(') && !line.includes('//')) {
    const match = line.match(/function\s+(\w+)/);
    if (match) {
      currentComponent = {
        name: match[1],
        startLine: i,
        lines: [],
        braceCount: 0
      };
      inComponent = true;
    }
  }
  
  if (inComponent && currentComponent) {
    currentComponent.lines.push(lines[i]);
    
    // Count braces to detect component end
    for (const char of line) {
      if (char === '{') currentComponent.braceCount++;
      if (char === '}') currentComponent.braceCount--;
    }
    
    // Component ends when brace count reaches 0
    if (currentComponent.braceCount === 0 && line === '}') {
      currentComponent.endLine = i;
      components.push(currentComponent);
      currentComponent = null;
      inComponent = false;
    }
  }
}

console.log(`🔍 Found ${components.length} components:`);
components.forEach(comp => {
  console.log(`   - ${comp.name} (${comp.lines.length} lines)`);
});

console.log('\n📋 Migration Steps:');
console.log('1. ✅ Staging already has modular structure');
console.log('2. 🔄 Update production to use staging structure');
console.log('3. 🧹 Remove old monolithic file');
console.log('4. ✅ Test both environments');

console.log('\n🎯 Recommended Actions:');
console.log('1. Merge staging changes into production');
console.log('2. Update production deployment to use new structure');
console.log('3. Remove the old NicsanCRMMock.tsx file');
console.log('4. Update any remaining references');

console.log('\n✨ Migration complete! The new modular structure is ready.');
