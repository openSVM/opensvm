#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Run a find command to locate files with the old import paths
console.log('Searching for files with old AI import paths...');
try {
  // Find files containing lib/ai imports
  const grepCommand = "grep -r --include='*.tsx' --include='*.ts' 'lib/ai' --exclude-dir=node_modules .";
  const result = execSync(grepCommand, { encoding: 'utf8' });
  
  // Parse the grep output to get files
  const filesToUpdate = new Set();
  result.split('\n').forEach(line => {
    if (!line) return;
    const filePath = line.split(':')[0];
    if (filePath) {
      filesToUpdate.add(filePath);
    }
  });
  
  console.log(`Found ${filesToUpdate.size} files with AI imports that need updating.`);
  
  // Update each file
  for (const filePath of filesToUpdate) {
    console.log(`Updating imports in ${filePath}...`);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace import paths
    content = content.replace(/from ['"]lib\/ai\/([^'"]+)['"]/g, "from 'components/ai/$1'");
    content = content.replace(/from ['"]@\/lib\/ai\/([^'"]+)['"]/g, "from '@/components/ai/$1'");
    content = content.replace(/import ['"]lib\/ai\/([^'"]+)['"]/g, "import 'components/ai/$1'");
    content = content.replace(/import ['"]@\/lib\/ai\/([^'"]+)['"]/g, "import '@/components/ai/$1'");
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
  }
  
  console.log('Import paths updated successfully!');
} catch (error) {
  console.error('Error updating import paths:', error);
  process.exit(1);
}
