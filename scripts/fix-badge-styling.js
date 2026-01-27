const fs = require('fs');

const dashboardPath = 'dashboards/measurements.json';
const dashboard = JSON.parse(fs.readFileSync(dashboardPath, 'utf8'));

const widgetId = '6ccd99bd-8562-4e6b-e42b-e7f3c026a129';
const widget = dashboard.configuration.widgets[widgetId];

let mdFunc = widget.config.settings.markdownTextFunction.body;

// 1. Replace the inline-styled typeBadge with CSS class-based styling
// Current broken code:
// var typeBadge = '<span style="display:inline-flex;align-items:center;padding:4px 8px;border-radius:8px;' +
//     'line-height:20px;font-size:12px;font-weight:500;color:#6c757d;background-color:rgba(108, 117, 125, 0.12);">' +
//     clientUtils.toKebabCase(installationTypeOptions) + '</span>';
//
// Should be:
// var typeBadge = '<span class="status-badge badge-type">' +
//     `{i18n:custom.diagnostics.action.edit-measurement-parameters.installation-type-options.${clientUtils.toKebabCase(installationTypeOptions)}.title}` +
//     '</span>';

const oldTypeBadge = `var typeBadge = '<span style="display:inline-flex;align-items:center;padding:4px 8px;border-radius:8px;' +
        'line-height:20px;font-size:12px;font-weight:500;color:#6c757d;background-color:rgba(108, 117, 125, 0.12);">' +
        clientUtils.toKebabCase(installationTypeOptions) + '</span>';`;

const newTypeBadge = `var typeBadge = '<span class="status-badge badge-type">' +
        \`{i18n:custom.diagnostics.action.edit-measurement-parameters.installation-type-options.\${clientUtils.toKebabCase(installationTypeOptions)}.title}\` +
        '</span>';`;

if (mdFunc.includes(oldTypeBadge)) {
    mdFunc = mdFunc.replace(oldTypeBadge, newTypeBadge);
    console.log('✓ Fixed typeBadge styling');
} else {
    console.log('⚠ typeBadge pattern not found, trying alternate approach...');
    // Try a more flexible regex replacement
    const typeBadgeRegex = /var typeBadge = '<span style="[^"]*">' \+\s*[^;]+clientUtils\.toKebabCase\(installationTypeOptions\)[^;]+;/s;
    if (typeBadgeRegex.test(mdFunc)) {
        mdFunc = mdFunc.replace(typeBadgeRegex, newTypeBadge);
        console.log('✓ Fixed typeBadge styling (alternate match)');
    } else {
        console.log('✗ Could not find typeBadge pattern');
    }
}

// 2. Replace inline-styled stateBadge with getStateBadge function
// Current broken code uses:
// var progressStyle = getProgressStyle(state);
// var stateBadge = createBadge(progressStyle.icon, progressStyle.label, progressStyle.color, progressStyle.bgColor);
//
// Should use getStateBadge:
// getStateBadge(state, 'state')

// First, add the getStateBadge function after getProgressStyle function if not exists
const getStateBadgeFuncExists = mdFunc.includes('function getStateBadge');

if (!getStateBadgeFuncExists) {
    const getStateBadgeFunc = `
    function getStateBadge(stateValue, type) {
        var badgeClass = '';
        var icon = '';
        var label = '';
        switch (stateValue) {
            case 'in preparation':
                badgeClass = 'badge-preparation'; icon = 'schedule';
                label = '{i18n:custom.diagnostics.state-filter.preparation.title}'; break;
            case 'active':
                badgeClass = 'badge-active'; icon = 'play_circle';
                label = '{i18n:custom.diagnostics.state-filter.active.title}'; break;
            case 'finished':
                badgeClass = 'badge-finished'; icon = 'check_circle';
                label = '{i18n:custom.diagnostics.state-filter.finished.title}'; break;
            case 'aborted':
                badgeClass = 'badge-aborted'; icon = 'cancel';
                label = '{i18n:custom.diagnostics.state-filter.aborted.title}'; break;
            case 'disconnected':
                badgeClass = 'badge-disconnected'; icon = 'link_off';
                label = '{i18n:device.inactive}'; break;
            default:
                badgeClass = 'badge-default'; icon = 'help';
                label = stateValue || 'N/A';
        }
        return '<span class="status-badge ' + badgeClass + '">' +
               '<mat-icon class="badge-icon">' + icon + '</mat-icon>' +
               '<span>' + label + '</span></span>';
    }
`;

    // Insert after createDateBadge function
    const insertPoint = mdFunc.indexOf('var instStyle = getInstallationTypeStyle');
    if (insertPoint !== -1) {
        mdFunc = mdFunc.slice(0, insertPoint) + getStateBadgeFunc + '\n    ' + mdFunc.slice(insertPoint);
        console.log('✓ Added getStateBadge function');
    } else {
        console.log('✗ Could not find insertion point for getStateBadge');
    }
}

// 3. Replace stateBadge assignment
// Old:
// var progressStyle = getProgressStyle(state);
// var stateBadge = createBadge(progressStyle.icon, progressStyle.label, progressStyle.color, progressStyle.bgColor);
//
// New:
// var stateBadge = getStateBadge(state, 'state');

const oldStateBadge1 = `var progressStyle = getProgressStyle(state);
    var stateBadge = createBadge(progressStyle.icon, progressStyle.label, progressStyle.color, progressStyle.bgColor);`;

const newStateBadge = `var stateBadge = getStateBadge(state, 'state');`;

if (mdFunc.includes(oldStateBadge1)) {
    mdFunc = mdFunc.replace(oldStateBadge1, newStateBadge);
    console.log('✓ Fixed stateBadge assignment');
} else {
    // Try alternate patterns
    const stateBadgeRegex = /var progressStyle = getProgressStyle\(state\);\s*var stateBadge = createBadge\([^)]+\);/;
    if (stateBadgeRegex.test(mdFunc)) {
        mdFunc = mdFunc.replace(stateBadgeRegex, newStateBadge);
        console.log('✓ Fixed stateBadge assignment (alternate match)');
    } else {
        console.log('⚠ stateBadge pattern not found');
    }
}

// 4. Fix progressBadge to use getStateBadge too
// Old:
// var progressBadge = '';
// if (progress && progress !== 'N/A') {
//     var pStyle = getProgressStyle(progress);
//     progressBadge = createBadge(pStyle.icon, pStyle.label, pStyle.color, pStyle.bgColor);
// }
//
// New:
// var progressBadge = (progress && progress !== 'N/A') ? getStateBadge(progress, 'progress') : '';

const oldProgressBadge = `var progressBadge = '';
    if (progress && progress !== 'N/A') {
        var pStyle = getProgressStyle(progress);
        progressBadge = createBadge(pStyle.icon, pStyle.label, pStyle.color, pStyle.bgColor);
    }`;

const newProgressBadge = `var progressBadge = (progress && progress !== 'N/A') ? getStateBadge(progress, 'progress') : '';`;

if (mdFunc.includes(oldProgressBadge)) {
    mdFunc = mdFunc.replace(oldProgressBadge, newProgressBadge);
    console.log('✓ Fixed progressBadge assignment');
} else {
    const progressBadgeRegex = /var progressBadge = '';\s*if \(progress && progress !== 'N\/A'\) \{\s*var pStyle = getProgressStyle\(progress\);\s*progressBadge = createBadge\([^)]+\);\s*\}/;
    if (progressBadgeRegex.test(mdFunc)) {
        mdFunc = mdFunc.replace(progressBadgeRegex, newProgressBadge);
        console.log('✓ Fixed progressBadge assignment (alternate match)');
    } else {
        console.log('⚠ progressBadge pattern not found');
    }
}

// Save the updated function
widget.config.settings.markdownTextFunction.body = mdFunc;
fs.writeFileSync(dashboardPath, JSON.stringify(dashboard, null, 2));

console.log('\n✓ Dashboard saved');
