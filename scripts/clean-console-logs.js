#!/usr/bin/env node

/**
 * Script to clean console.log statements for production
 * Keeps console.error for debugging but removes console.log
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const ROOT_DIR = path.join(__dirname, '..');
const PATTERNS_TO_CLEAN = [
  'console.log',
  'console.info',
  'console.warn'
];

const PATTERNS_TO_KEEP = [
  'console.error',
  'console.debug' // Keep for development debugging
];

// Directories to search
const SEARCH_PATTERNS = [
  'components/**/*.{ts,tsx,js,jsx}',
  'app/**/*.{ts,tsx,js,jsx}', 
  'lib/**/*.{ts,tsx,js,jsx}',
  'hooks/**/*.{ts,tsx,js,jsx}'
];

// Files to exclude
const EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/scripts/**',
  '**/__tests__/**',
  '**/*.test.*',
  '**/*.spec.*',
  '**/test/**'
];

function shouldCleanLine(line) {
  // Skip lines that contain console.error or console.debug
  for (const keepPattern of PATTERNS_TO_KEEP) {
    if (line.includes(keepPattern)) {
      return false;
    }
  }

  // Check if line contains patterns to clean
  for (const cleanPattern of PATTERNS_TO_CLEAN) {
    if (line.includes(cleanPattern)) {
      return true;
    }
  }

  return false;
}

function cleanFileConsoleStatements(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  let hasChanges = false;
  const cleanedLines = lines.map((line, index) => {
    if (shouldCleanLine(line)) {
      hasChanges = true;
      console.log(`🧹 Removing from ${path.relative(ROOT_DIR, filePath)}:${index + 1}: ${line.trim()}`);
      
      // Get the indentation of the line
      const indent = line.match(/^(\s*)/)[1];
      
      // Replace with a comment
      return `${indent}// console.log removed for production`;
    }
    return line;
  });

  if (hasChanges) {
    fs.writeFileSync(filePath, cleanedLines.join('\n'), 'utf8');
    return true;
  }
  
  return false;
}

function getAllFiles() {
  const allFiles = [];
  
  for (const pattern of SEARCH_PATTERNS) {
    const files = glob.sync(pattern, {
      cwd: ROOT_DIR,
      ignore: EXCLUDE_PATTERNS,
      absolute: true
    });
    allFiles.push(...files);
  }
  
  // Remove duplicates
  return [...new Set(allFiles)];
}

function main() {
  console.log('🚀 Starting console.log cleanup for production...\n');
  
  const files = getAllFiles();
  console.log(`📁 Found ${files.length} files to check\n`);

  let totalFilesChanged = 0;
  let totalStatementsRemoved = 0;

  for (const file of files) {
    const originalContent = fs.readFileSync(file, 'utf8');
    const originalCount = (originalContent.match(/console\.(log|info|warn)/g) || []).length;
    
    if (originalCount > 0) {
      const wasChanged = cleanFileConsoleStatements(file);
      
      if (wasChanged) {
        const newContent = fs.readFileSync(file, 'utf8');
        const newCount = (newContent.match(/console\.(log|info|warn)/g) || []).length;
        const removedCount = originalCount - newCount;
        
        totalFilesChanged++;
        totalStatementsRemoved += removedCount;
        
        console.log(`✅ ${path.relative(ROOT_DIR, file)}: removed ${removedCount} statements\n`);
      }
    }
  }

  console.log('='.repeat(60));
  console.log('📊 CLEANUP SUMMARY');
  console.log('='.repeat(60));
  console.log(`Files processed: ${files.length}`);
  console.log(`Files changed: ${totalFilesChanged}`);
  console.log(`Console statements removed: ${totalStatementsRemoved}`);
  console.log(`Console.error statements kept: ✓`);
  console.log('\n✨ Production console cleanup complete!');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { cleanFileConsoleStatements, getAllFiles };