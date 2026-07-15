/**
 * MANIFIESTO DE VERIFICACIÓN - Estanterías
 * Orquesta la ejecución de invariantes y sondas
 */

import { invariants } from './invariants/shelves.js';
import { probes } from './probes/shelves.js';

export const verificationManifest = {
  feature: 'Estanterías',
  version: '1.0',

  invariants: [
    {
      id: 'INV-001',
      name: invariants['INV-001-unique-location'].name,
      critical: true,
      check: invariants['INV-001-unique-location'].check,
    },
    {
      id: 'INV-002',
      name: invariants['INV-002-capacity-limit'].name,
      critical: true,
      check: invariants['INV-002-capacity-limit'].check,
    },
    {
      id: 'INV-003',
      name: invariants['INV-003-sum-of-books'].name,
      critical: false,
      check: invariants['INV-003-sum-of-books'].check,
    },
    {
      id: 'INV-004',
      name: invariants['INV-004-dom-contract'].name,
      critical: true, // CONTRATO EN EL DOM ES CRÍTICO
      check: invariants['INV-004-dom-contract'].check,
    },
  ],

  probes: [
    {
      id: 'SONDA-001',
      name: probes['SONDA-001-happy-path'].name,
      type: 'green',
      execute: probes['SONDA-001-happy-path'].execute,
    },
    {
      id: 'SONDA-002',
      name: probes['SONDA-002-capacity-edge-case'].name,
      type: 'orange',
      execute: probes['SONDA-002-capacity-edge-case'].execute,
    },
    {
      id: 'SONDA-003',
      name: probes['SONDA-003-remove-book-arithmetic'].name,
      type: 'red',
      execute: probes['SONDA-003-remove-book-arithmetic'].execute,
    },
    {
      id: 'SONDA-004',
      name: probes['SONDA-004-broken-contract'].name,
      type: 'red',
      adversarial: true,
      execute: probes['SONDA-004-broken-contract'].execute,
    },
    {
      id: 'SONDA-005',
      name: probes['SONDA-005-hardcoded-arithmetic'].name,
      type: 'red',
      adversarial: true,
      execute: probes['SONDA-005-hardcoded-arithmetic'].execute,
    },
  ],

  async runAll(page) {
    const results = {
      invariants: [],
      probes: [],
      summary: { passed: 0, failed: 0 },
    };

    console.log('🔍 Ejecutando verificación de Estanterías...\n');

    // Ejecutar invariantes
    console.log('📋 INVARIANTES:');
    for (const inv of this.invariants) {
      const result = await inv.check(page);
      results.invariants.push({ id: inv.id, ...result });
      const status = result.passed ? '✓' : '✗';
      console.log(`  ${status} ${inv.id}: ${result.message}`);
      if (result.passed) results.summary.passed++;
      else results.summary.failed++;
    }

    // Ejecutar sondas
    console.log('\n🔬 SONDAS:');
    for (const probe of this.probes) {
      const result = await probe.execute(page);
      results.probes.push({ id: probe.id, ...result });
      const status = result.passed ? '✓' : '✗';
      console.log(`  ${status} ${probe.id}: ${result.message}`);
      if (result.passed) results.summary.passed++;
      else results.summary.failed++;
    }

    return results;
  },
};
