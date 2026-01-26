/**
 * Fix duplicate measurement-title-block in header
 */
const fs = require('fs');

const DASHBOARD_PATH = 'dashboards/measurements.json';
const WIDGET_IDS = [
    '6ccd99bd-8562-4e6b-e42b-e7f3c026a129',
    'f0dfbf6c-c2b0-2975-eb81-df9748cae9a5'
];

const dashboard = JSON.parse(fs.readFileSync(DASHBOARD_PATH, 'utf8'));

for (const widgetId of WIDGET_IDS) {
    const widget = dashboard.configuration.widgets[widgetId];
    if (!widget) continue;

    const fn = widget.config.settings.markdownTextFunction;
    if (!fn || !fn.body) continue;

    // Count occurrences
    const count = (fn.body.match(/measurement-title-block/g) || []).length;
    console.log(`Widget ${widgetId}: ${count} occurrence(s)`);

    if (count > 1) {
        // Find the duplicate block and remove it
        // The structure is:
        // '</div>' +
        // '<div class="measurement-title-block">' + ... + '</div>' +   <-- first (keep)
        // '<div class="measurement-title-block">' + ... + '</div>' +   <-- second (remove)

        // Find first occurrence
        const firstIdx = fn.body.indexOf("'<div class=\"measurement-title-block\">'");
        if (firstIdx === -1) {
            console.log('  Could not find first title block');
            continue;
        }

        // Find where first block ends (after </div>')
        const firstEndTag = "</div>'";
        let firstEndIdx = fn.body.indexOf(firstEndTag, firstIdx);
        if (firstEndIdx === -1) {
            console.log('  Could not find first end tag');
            continue;
        }
        firstEndIdx += firstEndTag.length;

        // Check if there's another title block after the first one
        const afterFirst = fn.body.substring(firstEndIdx);
        const secondMatch = afterFirst.match(/^\s*\+\s*'<div class="measurement-title-block">'/);

        if (secondMatch) {
            // Find where second block ends
            const secondStart = firstEndIdx;
            const secondBlockStart = fn.body.indexOf("'<div class=\"measurement-title-block\">'", firstEndIdx);
            const secondEndIdx = fn.body.indexOf(firstEndTag, secondBlockStart) + firstEndTag.length;

            // Remove the second block (including the preceding + and whitespace)
            const beforeDuplicate = fn.body.substring(0, firstEndIdx);
            const afterDuplicate = fn.body.substring(secondEndIdx);

            fn.body = beforeDuplicate + afterDuplicate;
            console.log('  ✓ Removed duplicate title block');
        } else {
            console.log('  No immediate duplicate found after first block');
        }
    }
}

fs.writeFileSync(DASHBOARD_PATH, JSON.stringify(dashboard, null, 2));
console.log('Done');
