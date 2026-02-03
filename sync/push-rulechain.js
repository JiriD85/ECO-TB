const fs = require('fs');
require('dotenv').config();

const BASE_URL = process.env.TB_BASE_URL;
const USERNAME = process.env.TB_USERNAME;
const PASSWORD = process.env.TB_PASSWORD;

async function main() {
  const filename = process.argv[2];
  if (!filename) {
    console.error('Usage: node push-rulechain.js <filename>');
    process.exit(1);
  }

  // Login
  const loginRes = await fetch(BASE_URL + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD })
  });
  const { token } = await loginRes.json();
  const headers = { 'Content-Type': 'application/json', 'X-Authorization': 'Bearer ' + token };

  // Read local rule chain
  const localData = JSON.parse(fs.readFileSync(filename, 'utf8'));
  const ruleChainId = localData.ruleChain.id.id;
  console.log('Rule Chain ID:', ruleChainId);
  console.log('Rule Chain Name:', localData.ruleChain.name);

  // Get current rule chain from server to get latest version
  const chainRes = await fetch(BASE_URL + '/api/ruleChain/' + ruleChainId, { headers });
  const serverChain = await chainRes.json();
  console.log('Server version:', serverChain.version);

  // Update local chain with server version
  localData.ruleChain.version = serverChain.version;

  // Save rule chain header
  const saveChainRes = await fetch(BASE_URL + '/api/ruleChain', {
    method: 'POST',
    headers,
    body: JSON.stringify(localData.ruleChain)
  });

  if (!saveChainRes.ok) {
    const err = await saveChainRes.text();
    console.error('Failed to save rule chain:', err);
    return;
  }
  const savedChain = await saveChainRes.json();
  console.log('Rule chain saved, new version:', savedChain.version);

  // Save metadata (nodes and connections)
  const metadataPayload = {
    ruleChainId: { entityType: 'RULE_CHAIN', id: ruleChainId },
    firstNodeIndex: localData.metadata.firstNodeIndex,
    nodes: localData.metadata.nodes,
    connections: localData.metadata.connections,
    ruleChainConnections: localData.metadata.ruleChainConnections || []
  };

  const saveMetaRes = await fetch(BASE_URL + '/api/ruleChain/metadata', {
    method: 'POST',
    headers,
    body: JSON.stringify(metadataPayload)
  });

  if (!saveMetaRes.ok) {
    const err = await saveMetaRes.text();
    console.error('Failed to save metadata:', err);
    return;
  }
  console.log('Rule chain metadata saved successfully!');

  // Update local file with new version
  localData.ruleChain.version = savedChain.version + 1;
  localData.metadata.version = savedChain.version + 1;
  fs.writeFileSync(filename, JSON.stringify(localData, null, 2));
  console.log('Local file updated with new version:', savedChain.version + 1);
}

main().catch(console.error);
