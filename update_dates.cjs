const fs = require('fs');
const path = require('path');

const files = [
  'src/components/CollectPaymentModal.tsx',
  'src/components/TopBar.tsx',
  'src/components/customers/CustomerDetailModal.tsx',
  'src/components/loans/LoanDetailModal.tsx',
  'src/components/loans/LoanFormModal.tsx',
  'src/components/loans/LoanRestructureModal.tsx',
  'src/pages/CollectionApprovals.tsx',
  'src/pages/Reports.tsx',
  'src/pages/StaffCollections.tsx',
  'src/services/customerDeletionService.ts',
  'src/services/fdService.ts',
  'src/services/loanSyncService.ts',
  'src/utils/dueStatusCalculator.ts'
];

for (const file of files) {
  const fullPath = path.join('d:/gvc', file);
  if (!fs.existsSync(fullPath)) continue;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let original = content;
  
  if (content.includes('new Date()') && !content.includes('import { getSLDateString')) {
    if (content.includes('new Date().toISOString()')) {
      const depth = file.split('/').length - 2;
      const prefix = depth === 0 ? './' : '../'.repeat(depth);
      
      content = content.replace(/(import .* from .*;)/, `$1\nimport { getSLDateString, getSLDateTimeString } from '${prefix}utils/dateUtils';`);
    }

    content = content.replace(/new Date\(\)\.toISOString\(\)\.slice\(0,\s*10\)/g, 'getSLDateString()');
    content = content.replace(/new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]/g, 'getSLDateString()');
    content = content.replace(/new Date\(\)\.toISOString\(\)/g, 'getSLDateTimeString()');
    
    if (file.includes('TopBar.tsx')) {
      content = content.replace(/new Date\(\)\.toLocaleDateString\('en-US', \{/g, "new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Colombo',");
    }
    
    if (content !== original) {
      fs.writeFileSync(fullPath, content);
      console.log('Updated ' + file);
    }
  }
}
