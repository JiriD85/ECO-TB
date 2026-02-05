const fs = require('fs');
const dashboard = JSON.parse(fs.readFileSync('dashboards/measurements.json', 'utf8'));

function searchInObject(obj, path = '') {
  if (!obj || typeof obj !== 'object') return;

  if (obj.customHtml && typeof obj.customHtml === 'string') {
    if (obj.customHtml.includes('Add Project') || obj.customHtml.includes('Edit Project')) {
      const usesSection = obj.customHtml.includes('section-header');
      const filename = (obj.name || 'unknown').replace(/\s+/g, '_') + '_' + (usesSection ? 'CORRECT' : 'WRONG') + '.html';
      fs.writeFileSync('/tmp/' + filename, obj.customHtml);
      console.log('Saved:', filename, '- uses section-header:', usesSection);
    }
  }

  for (const key in obj) {
    searchInObject(obj[key], path + '.' + key);
  }
}

searchInObject(dashboard);
