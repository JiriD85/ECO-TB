#!/usr/bin/env node
const fs = require('fs/promises');
const path = require('path');
const { loadConfig } = require('./config');
const { ThingsBoardApi } = require('./api');

async function fetchAndSaveWidgets() {
  const config = loadConfig();
  const api = new ThingsBoardApi({ ...config, logger: { log: () => {}, warn: console.warn, error: console.error } });
  await api.login();
  console.log('Logged in to ThingsBoard');

  // Clean and create templates directory
  const templatesDir = path.join(process.cwd(), 'templates', 'widgets');
  await fs.rm(templatesDir, { recursive: true, force: true });
  await fs.mkdir(templatesDir, { recursive: true });

  // Get all widget bundles
  const bundlesResponse = await api.request('GET', '/api/widgetsBundles?pageSize=1000&page=0');
  const bundles = bundlesResponse.data || bundlesResponse;
  console.log('Found', bundles.length, 'widget bundles');

  // Save bundles index
  await fs.writeFile(
    path.join(templatesDir, '_bundles_index.json'),
    JSON.stringify(bundles.map(b => ({
      id: b.id.id,
      alias: b.alias,
      title: b.title,
      description: b.description
    })), null, 2)
  );

  // Get ALL widget types
  const allWidgetsResponse = await api.request('GET', '/api/widgetTypes?pageSize=2000&page=0');
  const allWidgets = allWidgetsResponse.data || allWidgetsResponse || [];
  console.log('Found', allWidgets.length, 'total widget types');

  // Group widgets by widgetType (timeseries, latest, static, etc.)
  const widgetsByType = new Map();

  for (const widget of allWidgets) {
    const widgetType = widget.widgetType || 'unknown';
    if (!widgetsByType.has(widgetType)) {
      widgetsByType.set(widgetType, []);
    }
    widgetsByType.get(widgetType).push(widget);
  }

  // Save widgets grouped by type
  for (const [widgetType, widgets] of widgetsByType) {
    const typeDir = path.join(templatesDir, 'by_type', widgetType);
    await fs.mkdir(typeDir, { recursive: true });

    // Save type index
    await fs.writeFile(
      path.join(typeDir, '_index.json'),
      JSON.stringify(widgets.map(w => ({
        fqn: w.fqn,
        name: w.name,
        deprecated: w.deprecated || false,
        scada: w.scada || false
      })), null, 2)
    );

    console.log('  Type ' + widgetType + ':', widgets.length, 'widgets');
  }

  // Save all widgets in a flat structure for easy access
  const allWidgetsDir = path.join(templatesDir, 'all');
  await fs.mkdir(allWidgetsDir, { recursive: true });

  // Create a comprehensive index
  await fs.writeFile(
    path.join(allWidgetsDir, '_index.json'),
    JSON.stringify(allWidgets.map(w => ({
      fqn: w.fqn,
      name: w.name,
      widgetType: w.widgetType,
      deprecated: w.deprecated || false,
      scada: w.scada || false,
      description: w.description || ''
    })), null, 2)
  );

  // Save each widget by FQN
  for (const widget of allWidgets) {
    const fileName = (widget.fqn || widget.name || 'unknown').replace(/[^a-zA-Z0-9_.-]/g, '_');
    await fs.writeFile(
      path.join(allWidgetsDir, fileName + '.json'),
      JSON.stringify(widget, null, 2)
    );
  }

  console.log('\n  All widgets saved to templates/widgets/all/');

  // Fetch detailed widget descriptors (with full descriptor including code)
  console.log('\nFetching detailed descriptors for all widgets...');

  const detailedDir = path.join(templatesDir, 'detailed');
  await fs.mkdir(detailedDir, { recursive: true });

  let detailedCount = 0;
  for (const widget of allWidgets) {
    try {
      const detailed = await api.request('GET', '/api/widgetType/' + widget.id.id);
      const fileName = (detailed.fqn || detailed.name || 'unknown').replace(/[^a-zA-Z0-9_.-]/g, '_');
      await fs.writeFile(
        path.join(detailedDir, fileName + '.json'),
        JSON.stringify(detailed, null, 2)
      );
      detailedCount++;
      if (detailedCount % 50 === 0) {
        console.log('  Fetched', detailedCount, '/', allWidgets.length, 'detailed widgets...');
      }
    } catch (err) {
      // Skip widgets that can't be fetched
    }
  }

  console.log('  Total detailed widgets saved:', detailedCount);
  console.log('\nDone! Templates saved to templates/widgets/');
}

fetchAndSaveWidgets().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
