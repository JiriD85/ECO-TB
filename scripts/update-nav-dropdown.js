/**
 * Update Navigation Widget with Dropdown Tab Selector for Mobile
 *
 * Replaces mat-tab-group with:
 * - Desktop (≥960px): Original mat-tab-group
 * - Mobile/Tablet (<960px): Dropdown selector with dynamic state loading
 */

const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, '..', 'dashboards', 'navigation.json');
const dashboard = JSON.parse(fs.readFileSync(dashboardPath, 'utf8'));

const NAV_WIDGET_ID = '1dd6b46f-3282-d932-e25d-d495ef9c2432';

// New markdownTextFunction with responsive dropdown
const newMarkdownTextFunction = `/*************************************************
 * Responsive Navigation: Dropdown (Mobile) + Tabs (Desktop)
 * Breakpoint: 960px
 * Source of truth: stateParams.tabMode.entityName
 *************************************************/

const sc =
  ctx.stateController ||
  (ctx.$scope && (ctx.$scope.stateController || (ctx.$scope.$parent && ctx.$scope.$parent.stateController)));

if (!sc || !ctx.$scope) {
  return '<div style="padding:12px;color:#b00020;">StateController / $scope nicht gefunden.</div>';
}

// Get user role from datasource
let userRole = '';
if (data && data.length > 0) {
  data.forEach(function(item) {
    if (item.role && !userRole) {
      userRole = item.role;
    }
  });
}

// Check admin permissions
const isTenantAdmin = ctx.currentUser && ctx.currentUser.authority === 'TENANT_ADMIN';
const adminRoles = ['ECO Administrator', 'Administrator', 'Belimo Retrofit Administrators', 'ECO Diagnostics Administrator'];
const isAdminRole = adminRoles.some(function(role) {
  return userRole === role || userRole.toLowerCase() === role.toLowerCase();
});
const canSeeAdmin = isTenantAdmin || isAdminRole;

// Define all tabs
const allTabs = [
  { id: 'home',        label: 'Home',        icon: 'home' },
  { id: 'assessment',  label: 'Assessment',  icon: 'assignment_turned_in' },
  { id: 'assetreport', label: 'Asset Report', icon: 'description' },
  { id: 'measurement', label: 'Measurement', icon: 'straighten' },
  { id: 'analysis',    label: 'Analysis',    icon: 'insights' },
  { id: 'alarming',    label: 'Alarming',    icon: 'notifications' },
  { id: 'administration', label: 'Administration', icon: 'settings', adminOnly: true }
];

// Filter tabs based on permissions
const tabs = allTabs.filter(function(tab) {
  return !tab.adminOnly || canSeeAdmin;
});

// State IDs (same as tab IDs in this case)
const tabToStateId = {
  home: 'home',
  assessment: 'assessment',
  assetreport: 'assetreport',
  measurement: 'measurement',
  analysis: 'analysis',
  alarming: 'alarming',
  administration: 'administration'
};

// Initialize tabMode
const params = (typeof sc.getStateParams === 'function' ? (sc.getStateParams() || {}) : {});
let tabMode;

if (params.tabMode && params.tabMode.entityName) {
  tabMode = String(params.tabMode.entityName);
} else {
  tabMode = 'home';
  params.tabMode = { entityName: tabMode };
  sc.updateState(null, params);
}

if (!tabs.some(t => t.id === tabMode)) tabMode = 'home';

// Find selected index
let selectedIndex = 0;
for (let i = 0; i < tabs.length; i++) {
  if (tabs[i].id === tabMode) { selectedIndex = i; break; }
}

// Store on ctx for Angular bindings
ctx.tbNavSelectedIndex = selectedIndex;
ctx.tbNavTabs = tabs;
ctx.tbNavCurrentTab = tabs[selectedIndex];
ctx.tbNavCurrentStateId = tabToStateId[tabs[selectedIndex].id] || tabs[selectedIndex].id;
ctx.tbNavTabToStateId = tabToStateId;

// Tab change handler (for both dropdown and tabs)
ctx.tbNavOnTabChange = function(ev) {
  try {
    const idx = ev && typeof ev.index === 'number' ? ev.index : 0;
    const t = tabs[idx] || tabs[0];

    ctx.tbNavSelectedIndex = idx;
    ctx.tbNavCurrentTab = t;
    ctx.tbNavCurrentStateId = tabToStateId[t.id] || t.id;

    const current = (typeof sc.getStateParams === 'function' ? (sc.getStateParams() || {}) : {});
    const p = Object.assign({}, current);
    p.tabMode = { entityName: t.id };

    sc.updateState(null, p);

    if (ctx.$scope && typeof ctx.$scope.$applyAsync === 'function') ctx.$scope.$applyAsync();
  } catch (e) {
    console.error('tbNavOnTabChange error', e);
  }
};

// Dropdown change handler - updates state and triggers view change
ctx.tbNavOnDropdownChange = function(tabId) {
  try {
    const idx = tabs.findIndex(t => t.id === tabId);
    if (idx >= 0) {
      const t = tabs[idx];

      // Update ctx bindings
      ctx.tbNavSelectedIndex = idx;
      ctx.tbNavCurrentTab = t;
      ctx.tbNavCurrentStateId = tabToStateId[t.id] || t.id;

      // Update state params
      const current = (typeof sc.getStateParams === 'function' ? (sc.getStateParams() || {}) : {});
      const p = Object.assign({}, current);
      p.tabMode = { entityName: t.id };

      sc.updateState(null, p);

      // Force Angular change detection
      if (ctx.$scope && typeof ctx.$scope.$applyAsync === 'function') {
        ctx.$scope.$applyAsync();
      }
    }
  } catch (e) {
    console.error('tbNavOnDropdownChange error', e);
  }
};

// Inject styles
(function injectStyles() {
  const styleId = 'tb-nav-responsive-v7';
  if (document.getElementById(styleId)) return;

  const css = \`
    /* ═══════════════════════════════════════════════════════════════
       RESPONSIVE NAVIGATION - Industrial Precision Design v7
       Card-consistent styling, unified visual language
       ═══════════════════════════════════════════════════════════════ */

    .tb-nav-root {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      min-height: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Roboto', sans-serif;
      background: #F5F7FA;
    }

    /* ─── Desktop Tabs (≥960px) ─── */
    .tb-nav-tabs-desktop {
      display: none;
    }

    @media (min-width: 960px) {
      .tb-nav-tabs-desktop {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      .tb-nav-dropdown-mobile {
        display: none !important;
      }
    }

    .tb-nav-tabs-desktop mat-tab-group {
      flex: 1 1 auto;
      min-height: 0;
      height: 100%;
    }

    .tb-nav-tabs-desktop .mat-mdc-tab-body-wrapper {
      flex: 1 1 auto;
      min-height: 0;
      height: 100%;
    }

    .tb-nav-tabs-desktop .mat-mdc-tab-body {
      height: 100%;
      min-height: 0;
    }

    .tb-nav-tabs-desktop .mat-mdc-tab-body-content {
      height: 100%;
      min-height: 0;
      overflow: auto;
    }

    .tb-tab-label {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .tb-tab-label mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      line-height: 18px;
    }

    /* ─── Mobile/Tablet Dropdown (<960px) ─── */
    .tb-nav-dropdown-mobile {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #F5F7FA;
      padding: 8px 12px 0 12px;
    }

    @media (min-width: 960px) {
      .tb-nav-dropdown-mobile {
        display: none;
      }
    }

    /* Dropdown Header - Card-style matching tiles below */
    .tb-nav-dropdown-header {
      background: #FFFFFF;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      border: 1px solid rgba(0, 0, 0, 0.04);
      padding: 0 12px;
      height: 44px;
      min-height: 44px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      position: relative;
      overflow: hidden;
    }

    /* Blue accent bar - matching cards */
    .tb-nav-dropdown-header::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: linear-gradient(180deg, #1976D2 0%, #42A5F5 100%);
      border-radius: 8px 0 0 8px;
    }

    .tb-nav-dropdown-select {
      flex: 1;
      margin-left: 4px;
    }

    /* Clean mat-form-field */
    .tb-nav-dropdown-select .mat-mdc-text-field-wrapper {
      background: transparent !important;
      padding: 0 !important;
      height: 44px !important;
    }

    .tb-nav-dropdown-select .mat-mdc-form-field-flex {
      height: 44px !important;
      align-items: center !important;
    }

    .tb-nav-dropdown-select .mat-mdc-form-field-infix {
      padding: 0 !important;
      min-height: 44px !important;
      height: 44px !important;
      display: flex !important;
      align-items: center !important;
      border-top: 0 !important;
      width: auto !important;
    }

    .tb-nav-dropdown-select .mat-mdc-form-field-subscript-wrapper,
    .tb-nav-dropdown-select .mdc-notched-outline {
      display: none !important;
    }

    .tb-nav-dropdown-select .mat-mdc-select-arrow-wrapper {
      height: 44px !important;
      display: flex !important;
      align-items: center !important;
      padding-left: 8px !important;
    }

    .tb-nav-dropdown-select .mat-mdc-select-arrow {
      color: #5E6278 !important;
    }

    /* Dropdown trigger - clean text style */
    .tb-nav-select-trigger {
      display: flex !important;
      align-items: center !important;
      gap: 10px;
      height: 44px;
    }

    .tb-nav-select-trigger mat-icon {
      color: #1976D2;
      font-size: 20px !important;
      width: 20px !important;
      height: 20px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex-shrink: 0;
    }

    .tb-nav-select-trigger > span:last-child {
      font-weight: 600;
      color: #1A1F36;
      font-size: 15px;
      letter-spacing: -0.01em;
    }

    /* Dropdown panel - card style */
    .cdk-overlay-pane .mat-mdc-select-panel {
      background: #FFFFFF !important;
      border-radius: 8px !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12) !important;
      border: 1px solid rgba(0, 0, 0, 0.04) !important;
      margin-top: 4px !important;
      padding: 4px 0 !important;
    }

    /* Dropdown options - matching card style */
    .tb-nav-select-option {
      display: flex !important;
      align-items: center !important;
      gap: 12px;
      padding: 4px 0 !important;
    }

    .tb-nav-select-option mat-icon {
      color: #1976D2;
      font-size: 20px !important;
      width: 20px !important;
      height: 20px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex-shrink: 0;
    }

    .tb-nav-select-option > span:last-child {
      font-weight: 500;
      color: #1A1F36;
      font-size: 14px;
    }

    .mat-mdc-option {
      min-height: 44px !important;
      padding: 0 16px !important;
    }

    .mat-mdc-option:hover {
      background: rgba(25, 118, 210, 0.04) !important;
    }

    .mat-mdc-option.mat-mdc-option-active {
      background: rgba(25, 118, 210, 0.08) !important;
    }

    /* Content area */
    .tb-nav-content {
      flex: 1 1 auto;
      min-height: 0;
      overflow: hidden;
    }

    .tb-nav-state {
      width: 100%;
      height: 100%;
      display: block;
    }
  \`;

  const styleEl = document.createElement('style');
  styleEl.id = styleId;
  styleEl.type = 'text/css';
  styleEl.appendChild(document.createTextNode(css));
  document.head.appendChild(styleEl);
})();

// Build Desktop Tabs HTML
let desktopTabsHtml = '';
for (let i = 0; i < tabs.length; i++) {
  const t = tabs[i];
  const stateId = tabToStateId[t.id] || t.id;

  desktopTabsHtml += ''
    + '<mat-tab>'
    +   '<ng-template mat-tab-label>'
    +     '<span class="tb-tab-label">'
    +       '<mat-icon>' + t.icon + '</mat-icon>'
    +       '<span>' + t.label + '</span>'
    +     '</span>'
    +   '</ng-template>'
    +   '<ng-template matTabContent>'
    +     '<tb-dashboard-state class="tb-nav-state"'
    +       ' [ctx]="ctx" [syncParentStateParams]="true" stateId="' + stateId + '">'
    +     '</tb-dashboard-state>'
    +   '</ng-template>'
    + '</mat-tab>';
}

// Build Dropdown Options HTML
let dropdownOptionsHtml = '';
for (let i = 0; i < tabs.length; i++) {
  const t = tabs[i];
  dropdownOptionsHtml += ''
    + '<mat-option [value]="\\'' + t.id + '\\'">'
    +   '<span class="tb-nav-select-option">'
    +     '<mat-icon>' + t.icon + '</mat-icon>'
    +     '<span>' + t.label + '</span>'
    +   '</span>'
    + '</mat-option>';
}

// Current tab state for mobile
const currentTab = tabs[selectedIndex];
const currentStateId = tabToStateId[currentTab.id] || currentTab.id;

return ''
  + '<section class="tb-nav-root">'

  // Desktop: mat-tab-group
  +   '<div class="tb-nav-tabs-desktop">'
  +     '<mat-tab-group mat-stretch-tabs="false"'
  +       ' [selectedIndex]="ctx.tbNavSelectedIndex"'
  +       ' (selectedTabChange)="ctx.tbNavOnTabChange($event)">'
  +       desktopTabsHtml
  +     '</mat-tab-group>'
  +   '</div>'

  // Mobile/Tablet: Dropdown + Dynamic Content
  +   '<div class="tb-nav-dropdown-mobile">'
  +     '<div class="tb-nav-dropdown-header">'
  +       '<mat-form-field class="tb-nav-dropdown-select" appearance="outline">'
  +         '<mat-select [value]="ctx.tbNavCurrentTab.id"'
  +           ' (selectionChange)="ctx.tbNavOnDropdownChange($event.value)">'
  +           '<mat-select-trigger>'
  +             '<span class="tb-nav-select-trigger">'
  +               '<mat-icon>{{ctx.tbNavCurrentTab.icon}}</mat-icon>'
  +               '<span>{{ctx.tbNavCurrentTab.label}}</span>'
  +             '</span>'
  +           '</mat-select-trigger>'
  +           dropdownOptionsHtml
  +         '</mat-select>'
  +       '</mat-form-field>'
  +     '</div>'
  +     '<div class="tb-nav-content">'
  +       '<tb-dashboard-state class="tb-nav-state"'
  +         ' [ctx]="ctx" [syncParentStateParams]="true" [stateId]="ctx.tbNavCurrentStateId">'
  +       '</tb-dashboard-state>'
  +     '</div>'
  +   '</div>'

  + '</section>';
`;

// Update widget
const widget = dashboard.configuration.widgets[NAV_WIDGET_ID];
if (widget && widget.config && widget.config.settings) {
    widget.config.settings.markdownTextFunction = newMarkdownTextFunction;
    console.log('✓ Updated navigation widget with responsive dropdown v3');
    console.log('  • Dynamic stateId binding: [stateId]="ctx.tbNavCurrentStateId"');
    console.log('  • Improved dropdown styling');

    fs.writeFileSync(dashboardPath, JSON.stringify(dashboard, null, 2));
    console.log('✓ Dashboard saved');
    console.log('\nChanges:');
    console.log('  • Desktop (≥960px): Original mat-tab-group');
    console.log('  • Mobile/Tablet (<960px): Dropdown with dynamic state loading');
    console.log('\nNext: Run "node sync/sync.js push navigation" to deploy');
} else {
    console.log('✗ Navigation widget not found');
}
