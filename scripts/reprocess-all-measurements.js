#!/usr/bin/env node
/**
 * Reprocess all Calculated Fields for all active Measurements
 *
 * This script:
 * 1. Fetches all Measurement assets
 * 2. For each measurement, triggers reprocessing of all 9 Calculated Fields
 * 3. Shows progress and logs errors
 *
 * Usage: node scripts/reprocess-all-measurements.js
 */

const path = require('path');
const { loadConfig } = require('../sync/config');
const { ThingsBoardApi } = require('../sync/api');

// Calculated Field IDs to reprocess
const CALCULATED_FIELDS = [
  { id: '6cac3240-0211-11f1-9b0a-33b9bcf3ddd0', name: 'derived_basic' },
  { id: '8d2f1a50-0211-11f1-9979-9f3434877bb4', name: 'derived_power' },
  { id: 'aee1f6e0-0211-11f1-9979-9f3434877bb4', name: 'derived_schedule' },
  { id: '30eb6890-0133-11f1-9979-9f3434877bb4', name: 'oscillation_detection' },
  { id: '684c01c0-0127-11f1-9979-9f3434877bb4', name: 'dT_collapse_flag' },
  { id: '685884e0-0127-11f1-9979-9f3434877bb4', name: 'flow_spike_flag' },
  { id: 'a065a960-0129-11f1-9979-9f3434877bb4', name: 'power_stability' },
  { id: 'a06e8300-0129-11f1-9979-9f3434877bb4', name: 'runtime_pct' },
  { id: 'aedba340-012a-11f1-9979-9f3434877bb4', name: 'cycling_flag' },
];

// Delay between measurements (ms) to avoid overloading the server
const DELAY_BETWEEN_MEASUREMENTS = 500;

class ReprocessScript {
  constructor() {
    this.api = null;
    this.stats = {
      totalMeasurements: 0,
      successfulMeasurements: 0,
      failedMeasurements: 0,
      totalCfJobs: 0,
      failedCfJobs: 0,
      errors: [],
    };
  }

  async init() {
    const config = loadConfig();
    this.api = new ThingsBoardApi({ ...config, logger: { log: () => {}, warn: console.warn } });
    await this.api.login();
    console.log('Connected to ThingsBoard\n');
  }

  async getMeasurements() {
    console.log('Fetching all Measurement assets...');
    const response = await this.api.request('GET', '/api/tenant/assets?type=Measurement&pageSize=1000&page=0');
    const measurements = response.data || response || [];
    console.log(`Found ${measurements.length} measurements\n`);
    return measurements;
  }

  async getEntityTimestamps(measurementId) {
    // Get the createdTime from entity info
    const entity = await this.api.request('GET', `/api/asset/${measurementId}`);
    const startTs = entity.createdTime || Date.now() - (365 * 24 * 60 * 60 * 1000); // fallback: 1 year ago
    const endTs = Date.now();
    return { startTs, endTs };
  }

  async reprocessCalculatedField(cfId, cfName, measurementId, measurementName, startTs, endTs) {
    try {
      const url = `/api/calculatedField/${cfId}/reprocess?entityId=${measurementId}&entityType=ASSET&startTs=${startTs}&endTs=${endTs}`;
      await this.api.request('GET', url);
      this.stats.totalCfJobs++;
      return true;
    } catch (error) {
      this.stats.failedCfJobs++;
      const errorMsg = `  CF ${cfName} failed for ${measurementName}: ${error.message}`;
      this.stats.errors.push(errorMsg);
      console.error(errorMsg);
      return false;
    }
  }

  async reprocessMeasurement(measurement, index, total) {
    const measurementId = measurement.id.id;
    const measurementName = measurement.name;

    console.log(`[${index + 1}/${total}] Reprocessing: ${measurementName}`);

    try {
      const { startTs, endTs } = await this.getEntityTimestamps(measurementId);
      const startDate = new Date(startTs).toISOString().split('T')[0];
      const endDate = new Date(endTs).toISOString().split('T')[0];
      console.log(`  Time range: ${startDate} to ${endDate}`);

      let allSuccess = true;
      for (const cf of CALCULATED_FIELDS) {
        const success = await this.reprocessCalculatedField(
          cf.id, cf.name, measurementId, measurementName, startTs, endTs
        );
        if (!success) allSuccess = false;
      }

      if (allSuccess) {
        this.stats.successfulMeasurements++;
        console.log(`  Started ${CALCULATED_FIELDS.length} CF jobs successfully`);
      } else {
        this.stats.failedMeasurements++;
        console.log(`  Some CF jobs failed (see errors above)`);
      }

    } catch (error) {
      this.stats.failedMeasurements++;
      const errorMsg = `  Failed to process ${measurementName}: ${error.message}`;
      this.stats.errors.push(errorMsg);
      console.error(errorMsg);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async run() {
    console.log('='.repeat(60));
    console.log('Reprocess All Measurements - Calculated Fields');
    console.log('='.repeat(60) + '\n');

    await this.init();

    const measurements = await this.getMeasurements();
    this.stats.totalMeasurements = measurements.length;

    if (measurements.length === 0) {
      console.log('No measurements found. Exiting.');
      return;
    }

    console.log('Starting reprocessing...\n');
    console.log('-'.repeat(60));

    for (let i = 0; i < measurements.length; i++) {
      await this.reprocessMeasurement(measurements[i], i, measurements.length);

      // Add delay between measurements to avoid server overload
      if (i < measurements.length - 1) {
        await this.sleep(DELAY_BETWEEN_MEASUREMENTS);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total measurements:      ${this.stats.totalMeasurements}`);
    console.log(`Successful:              ${this.stats.successfulMeasurements}`);
    console.log(`Failed:                  ${this.stats.failedMeasurements}`);
    console.log(`Total CF jobs started:   ${this.stats.totalCfJobs}`);
    console.log(`Failed CF jobs:          ${this.stats.failedCfJobs}`);

    if (this.stats.errors.length > 0) {
      console.log('\nErrors encountered:');
      this.stats.errors.forEach(err => console.log(err));
    }

    console.log('\nNote: Reprocess jobs run asynchronously on the server.');
    console.log('Check ThingsBoard logs for completion status.');
  }
}

// Main entry point
const script = new ReprocessScript();
script.run().catch(error => {
  console.error('Script failed:', error.message);
  process.exit(1);
});
