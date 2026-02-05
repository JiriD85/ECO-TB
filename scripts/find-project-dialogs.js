const fs = require('fs');
const dashboard = JSON.parse(fs.readFileSync('dashboards/measurements.json', 'utf8'));

const results = [];

function searchInObject(obj, path = '') {
  if (!obj || typeof obj !== 'object') return;

  // Check if this is an action with customHtml
  if (obj.customHtml && typeof obj.customHtml === 'string') {
    if (obj.customHtml.includes('Add Project') || obj.customHtml.includes('Edit Project')) {
      // Extract the header class and first legend
      const headerMatch = obj.customHtml.match(/mat-toolbar[^>]*class="([^"]+)"/);
      const sectionMatch = obj.customHtml.match(/<div class="section-header"/);
      const fieldsetMatch = obj.customHtml.match(/<fieldset/);

      results.push({
        path: path.substring(0, 80),
        name: obj.name || 'unknown',
        id: obj.id || 'unknown',
        headerClass: headerMatch ? headerMatch[1] : 'not found',
        usesSection: sectionMatch ? 'YES (section-header)' : 'NO',
        usesFieldset: fieldsetMatch ? 'YES (fieldset)' : 'NO',
        htmlLength: obj.customHtml.length
      });
    }
  }

  for (const key in obj) {
    searchInObject(obj[key], path + '.' + key);
  }
}

searchInObject(dashboard);
console.log('Found', results.length, 'dialogs:\n');
results.forEach((r, i) => {
  console.log(`${i+1}. ${r.name} (id: ${r.id})`);
  console.log(`   Header class: ${r.headerClass}`);
  console.log(`   Uses section-header: ${r.usesSection}`);
  console.log(`   Uses fieldset: ${r.usesFieldset}`);
  console.log(`   HTML length: ${r.htmlLength}`);
  console.log('');
});
