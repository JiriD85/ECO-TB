const { Buffer } = require('buffer');

const getFetch = () => {
  if (typeof fetch === 'function') {
    return fetch;
  }
  return (...args) =>
    import('node-fetch').then(({ default: fetchFn }) => fetchFn(...args));
};

const fetchFn = getFetch();

class ThingsBoardApi {
  constructor({ baseUrl, username, password, logger = console }) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.username = username;
    this.password = password;
    this.logger = logger;
    this.token = null;
    this.refreshToken = null;
    this.tokenExp = null;
  }

  async login() {
    const response = await fetchFn(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: this.username,
        password: this.password,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Login failed: ${response.status} ${text}`);
    }

    const data = await response.json();
    this.token = data.token;
    this.refreshToken = data.refreshToken;
    this.tokenExp = decodeJwtExp(this.token);
    this.logger.log('Logged in to ThingsBoard');
  }

  async refresh() {
    if (!this.refreshToken) {
      await this.login();
      return;
    }

    const response = await fetchFn(`${this.baseUrl}/api/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: this.refreshToken }),
    });

    if (!response.ok) {
      this.logger.warn('Token refresh failed, re-authenticating');
      await this.login();
      return;
    }

    const data = await response.json();
    this.token = data.token;
    this.refreshToken = data.refreshToken || this.refreshToken;
    this.tokenExp = decodeJwtExp(this.token);
    this.logger.log('Token refreshed');
  }

  async ensureToken() {
    if (!this.token || isTokenExpired(this.tokenExp)) {
      await this.refresh();
    }
  }

  async request(method, path, body) {
    await this.ensureToken();

    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Authorization': `Bearer ${this.token}`,
    };

    let response = await fetchFn(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
      await this.refresh();
      headers['X-Authorization'] = `Bearer ${this.token}`;
      response = await fetchFn(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Request failed: ${method} ${path} ${response.status} ${text}`
      );
    }

    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }
    return response.text();
  }

  uploadDashboard(dashboard) {
    return this.request('POST', '/api/dashboard', dashboard);
  }

  uploadRuleChain(ruleChain) {
    return this.request('POST', '/api/ruleChain', ruleChain);
  }

  uploadWidgetsBundle(bundle) {
    return this.request('POST', '/api/widgetsBundle', bundle);
  }

  async getDashboards() {
    const response = await this.request('GET', '/api/tenant/dashboards?pageSize=1000&page=0');
    return response.data || response || [];
  }

  async getDashboard(dashboardId) {
    return this.request('GET', `/api/dashboard/${dashboardId}`);
  }

  async getRuleChains() {
    const response = await this.request('GET', '/api/ruleChains?pageSize=1000&page=0');
    return response.data || response || [];
  }

  async getRuleChain(ruleChainId) {
    return this.request('GET', `/api/ruleChain/${ruleChainId}`);
  }

  async getRuleChainMetadata(ruleChainId) {
    return this.request('GET', `/api/ruleChain/${ruleChainId}/metadata`);
  }

  async exportRuleChain(ruleChainId) {
    // Combine ruleChain info with metadata for full export
    const ruleChain = await this.getRuleChain(ruleChainId);
    const metadata = await this.getRuleChainMetadata(ruleChainId);

    // Build export format matching ThingsBoard's export structure
    return {
      ruleChain: {
        name: ruleChain.name,
        type: ruleChain.type || 'CORE',
        firstRuleNodeId: ruleChain.firstRuleNodeId,
        root: ruleChain.root || false,
        debugMode: ruleChain.debugMode || false,
        configuration: ruleChain.configuration || null,
        additionalInfo: ruleChain.additionalInfo || null
      },
      metadata: metadata
    };
  }

  async importRuleChain(ruleChainExport, existingId = null) {
    // For new rule chains or updates, we need to:
    // 1. Create/Update the rule chain itself (with current version for optimistic locking)
    // 2. Update the metadata (nodes and connections)

    const ruleChainData = { ...ruleChainExport.ruleChain };
    const metadataData = ruleChainExport.metadata;

    // Step 1: Create or update rule chain
    if (existingId) {
      // Fetch current version to avoid 409 conflicts
      const current = await this.getRuleChain(existingId);
      ruleChainData.id = current.id;
      ruleChainData.version = current.version;
      ruleChainData.createdTime = current.createdTime;
      ruleChainData.tenantId = current.tenantId;
    }
    const ruleChainResult = await this.request('POST', '/api/ruleChain', ruleChainData);
    const ruleChainId = ruleChainResult.id.id;

    // Step 2: Update metadata (nodes and connections)
    // POST /api/ruleChain/metadata (not /api/ruleChain/{id}/metadata which is GET only)
    if (metadataData) {
      // Fetch current metadata version
      const currentMetadata = await this.getRuleChainMetadata(ruleChainId);

      const metadataPayload = {
        ...metadataData,
        ruleChainId: { id: ruleChainId, entityType: 'RULE_CHAIN' },
        version: currentMetadata.version
      };
      await this.request('POST', '/api/ruleChain/metadata', metadataPayload);
    }

    return ruleChainResult;
  }

  async getWidgetsBundles() {
    const response = await this.request('GET', '/api/widgetsBundles?pageSize=1000&page=0');
    return response.data || response || [];
  }

  // ==================== JS Resources (JS Modules) ====================

  async getResources(resourceType = null) {
    let path = '/api/resource?pageSize=1000&page=0';
    if (resourceType) {
      path += `&resourceType=${resourceType}`;
    }
    const response = await this.request('GET', path);
    return response.data || response || [];
  }

  async getJsModules() {
    return this.getResources('JS_MODULE');
  }

  async getResource(resourceId) {
    return this.request('GET', `/api/resource/${resourceId}`);
  }

  async downloadResource(resourceId) {
    await this.ensureToken();
    const url = `${this.baseUrl}/api/resource/${resourceId}/download`;
    const response = await fetchFn(url, {
      method: 'GET',
      headers: {
        'X-Authorization': `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Download failed: ${response.status} ${text}`);
    }

    return response.text();
  }

  async uploadResource(title, resourceType, resourceKey, data, existingId = null, resourceSubType = null) {
    // ThingsBoard expects JSON with base64-encoded data
    const base64Data = Buffer.from(data, 'utf8').toString('base64');

    const resourcePayload = {
      title: title,
      resourceType: resourceType,
      resourceKey: resourceKey,
      fileName: resourceKey,
      data: base64Data,
    };

    if (resourceSubType) {
      resourcePayload.resourceSubType = resourceSubType;
    }

    if (existingId) {
      resourcePayload.id = { id: existingId, entityType: 'TB_RESOURCE' };
    }

    return this.request('POST', '/api/resource', resourcePayload);
  }

  async uploadJsModule(title, resourceKey, jsContent, existingId = null) {
    // JavaScript type must be 'MODULE' (resourceSubType)
    return this.uploadResource(title, 'JS_MODULE', resourceKey, jsContent, existingId, 'MODULE');
  }

  // ==================== White Labeling / Custom Translation ====================

  async getWhiteLabelingParams() {
    return this.request('GET', '/api/whiteLabel/whiteLabelParams');
  }

  async getLoginWhiteLabelingParams() {
    return this.request('GET', '/api/noauth/whiteLabel/loginWhiteLabelParams');
  }

  async getCustomTranslation(locale) {
    try {
      return await this.request('GET', `/api/translation/custom/${locale}`);
    } catch (err) {
      // Return empty object if no custom translation exists for this locale
      if (err.message.includes('404')) {
        return {};
      }
      throw err;
    }
  }

  async saveCustomTranslation(locale, translationMap) {
    // ThingsBoard expects multipart/form-data with a JSON file
    // Use native https module for full control over Content-Type
    await this.ensureToken();

    const jsonContent = JSON.stringify(translationMap, null, 2);
    const boundary = '----FormBoundary' + Math.random().toString(36).substring(2);

    const parts = [];
    parts.push(`--${boundary}\r\n`);
    parts.push(`Content-Disposition: form-data; name="file"; filename="${locale}.json"\r\n`);
    parts.push(`Content-Type: application/json\r\n\r\n`);
    parts.push(jsonContent);
    parts.push(`\r\n--${boundary}--\r\n`);

    const body = Buffer.from(parts.join(''), 'utf8');

    const parsedUrl = new URL(this.baseUrl);
    const https = require('https');
    const http = require('http');
    const transport = parsedUrl.protocol === 'https:' ? https : http;

    return new Promise((resolve, reject) => {
      const req = transport.request({
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: `/api/translation/custom/${locale}/upload`,
        method: 'POST',
        headers: {
          'X-Authorization': `Bearer ${this.token}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length,
        },
      }, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(responseData ? JSON.parse(responseData) : {});
          } else {
            reject(new Error(`Upload translation failed: ${res.statusCode} ${responseData}`));
          }
        });
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  async getAvailableLocales() {
    return this.request('GET', '/api/translation/availableLocales');
  }
}

function decodeJwtExp(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf8')
    );
    return payload.exp ? payload.exp * 1000 : null;
  } catch (err) {
    return null;
  }
}

function isTokenExpired(exp) {
  if (!exp) return true;
  const now = Date.now();
  return now >= exp - 60 * 1000;
}

module.exports = { ThingsBoardApi };
