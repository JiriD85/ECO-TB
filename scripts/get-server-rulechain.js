const { loadConfig } = require('../sync/config');
const { ThingsBoardApi } = require('../sync/api');

async function main() {
  const config = loadConfig();
  const api = new ThingsBoardApi({ ...config, logger: console });
  await api.login();

  // Get all rule chains
  const ruleChains = await api.getRuleChains();
  const measurement = ruleChains.find(rc => rc.name === 'Measurement');

  if (!measurement) {
    console.log('Rule Chain "Measurement" not found');
    return;
  }

  console.log('Found Rule Chain:', measurement.name, 'ID:', measurement.id.id);

  // Get the full rule chain with metadata
  const fullRc = await api.request('GET', '/api/ruleChain/' + measurement.id.id + '/metadata');

  // Find all switch nodes and output their scripts
  const switchNodes = fullRc.nodes.filter(n => n.type === 'org.thingsboard.rule.engine.filter.TbJsSwitchNode');

  console.log('\n=== Switch Nodes auf dem SERVER ===\n');
  for (const node of switchNodes) {
    console.log('--- ' + node.name + ' ---');
    console.log('Script:');
    console.log(node.configuration.tbelScript || node.configuration.jsScript || 'NONE');
    console.log('');
  }
}

main().catch(e => console.error(e));
