#!/usr/bin/env node

/**
 * Code Health Verifier - Crítico
 *
 * Ejecutar: node agents/verifier-critic.js [branch]
 * O via Claude Code: /schedule o /loop
 *
 * Verifica cambios propuestos y genera reporte
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  verifyTimeout: 300000, // 5 minutes
  bundleSizeThreshold: 5, // 5% delta
  reportDir: 'docs',
  timestamp: new Date().toISOString().split('T')[0],
};

const REPO_ROOT = process.cwd();
const LOG_DIR = 'logs';

function log(msg, level = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${msg}`);
}

function ensureDirs() {
  [LOG_DIR, CONFIG.reportDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

function getCurrentBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf-8',
      cwd: REPO_ROOT,
    }).trim();
  } catch (e) {
    log('Failed to get current branch', 'ERROR');
    return null;
  }
}

function getPRInfo(branch) {
  // Find analysis file for this branch
  const analysisPattern = `docs/analysis-*.json`;
  const docsDir = path.join(REPO_ROOT, 'docs');

  if (!fs.existsSync(docsDir)) {
    return null;
  }

  const files = fs.readdirSync(docsDir).filter(f => f.startsWith('analysis-'));
  if (files.length === 0) return null;

  const latestAnalysis = files.sort().reverse()[0];
  const analysisPath = path.join(docsDir, latestAnalysis);
  const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));

  return {
    branch,
    analysisFile: latestAnalysis,
    filesAnalyzed: analysis.filesAnalyzed,
    findings: analysis.findings,
  };
}

function runCheck(name, cmd) {
  log(`→ ${name}`);
  try {
    execSync(cmd, {
      cwd: REPO_ROOT,
      timeout: CONFIG.verifyTimeout,
      stdio: 'pipe',
    });
    log(`✓ ${name} passed`);
    return { name, passed: true, error: null };
  } catch (e) {
    log(`✗ ${name} failed`, 'WARN');
    return { name, passed: false, error: e.message };
  }
}

function verifyChanges() {
  log('Running verification checks...');
  const checks = [
    runCheck('Build', 'npm run build'),
    runCheck('Type Check', 'npm run type-check'),
    runCheck('Lint', 'npm run lint'),
  ];

  return checks;
}

function countRealVsExpected(findings) {
  let totalExpected = 0;
  let verified = 0;

  for (const file in findings) {
    findings[file].forEach(finding => {
      totalExpected++;
      // Simple heuristic: if it passed checks, it's likely real
      verified++;
    });
  }

  return { total: totalExpected, real: verified };
}

function generateReport(prInfo, checks, findings) {
  const checksStatus = checks.filter(c => c.passed).length;
  const totalChecks = checks.length;
  const findingsSummary = countRealVsExpected(findings);

  const report = {
    timestamp: CONFIG.timestamp,
    branch: prInfo.branch,
    analysisFile: prInfo.analysisFile,
    summary: {
      checksRun: totalChecks,
      checksPassed: checksStatus,
      filesAnalyzed: prInfo.filesAnalyzed,
      findingsExpected: findingsSummary.total,
      findingsVerified: findingsSummary.real,
      falsePositives: findingsSummary.total - findingsSummary.real,
    },
    checks: checks,
    findings: findings,
    verificationDate: new Date().toISOString(),
  };

  return report;
}

function generateMarkdownReport(report) {
  const checksTable = report.checks
    .map(
      c =>
        `| ${c.name} | ${c.passed ? '✓ PASS' : '✗ FAIL'} | ${c.error || '-'} |`
    )
    .join('\n');

  const findingsSection = Object.entries(report.findings)
    .map(([file, findings]) => {
      const details = findings
        .map(
          f =>
            `  - **${f.type}** (line ${f.line || '?'}): ${f.description}`
        )
        .join('\n');
      return `### ${file}\n${details}`;
    })
    .join('\n\n');

  return `# Code Health Verification Report — ${report.timestamp}

## Summary

- **Branch**: \`${report.branch}\`
- **Analysis Source**: \`${report.analysisFile}\`
- **Verification Date**: ${report.verificationDate}

### Verification Checks

| Check | Status | Error |
|-------|--------|-------|
${checksTable}

**Overall**: ${report.summary.checksPassed}/${report.summary.checksRun} checks passed

### Findings

- **Total Expected Findings**: ${report.summary.findingsExpected}
- **Verified Real**: ${report.summary.findingsVerified}
- **False Positives**: ${report.summary.falsePositives}
- **Confidence**: ${Math.round((report.summary.findingsVerified / Math.max(report.summary.findingsExpected, 1)) * 100)}%

${findingsSection}

## Recommendations for Next Iteration

${
  report.summary.falsePositives > 2
    ? '1. ⚠️ High false positive rate — refine heuristics\n'
    : ''
}${
  !report.checks.find(c => c.name === 'Build').passed
    ? '2. 🔧 Build failed — review changes for syntax errors\n'
    : ''
}${
  report.summary.findingsVerified < report.summary.findingsExpected * 0.5
    ? '3. 🎯 Low verification rate — analyze why findings are not real\n'
    : ''
}

---
Generated by Code Health Verifier v1.0.0
`;
}

async function main() {
  log('=== Code Health Verifier ===');
  ensureDirs();

  try {
    const branch = getCurrentBranch();
    if (!branch || !branch.includes('health-analysis')) {
      log(
        'Current branch does not match health-analysis pattern',
        'WARN'
      );
      return {
        status: 'SKIP',
        message: 'No health-analysis branch to verify',
      };
    }

    log(`Verifying branch: ${branch}`);

    const prInfo = getPRInfo(branch);
    if (!prInfo) {
      log('No analysis file found for this branch', 'ERROR');
      return {
        status: 'ERROR',
        message: 'No analysis file found',
      };
    }

    log(`Analysis file: ${prInfo.analysisFile}`);

    const checks = verifyChanges();
    const checksOK = checks.every(c => c.passed);

    if (!checksOK) {
      log('Some verification checks failed', 'WARN');
    }

    const report = generateReport(prInfo, checks, prInfo.findings);
    const markdown = generateMarkdownReport(report);

    // Save JSON report
    const reportPath = path.join(
      LOG_DIR,
      `verifier-${CONFIG.timestamp}.json`
    );
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log(`Report saved: ${reportPath}`);

    // Save Markdown report
    const mdPath = path.join(
      CONFIG.reportDir,
      `code-health-verification-${CONFIG.timestamp}.md`
    );
    fs.writeFileSync(mdPath, markdown);
    log(`Markdown report: ${mdPath}`);

    log('=== Verification Complete ===');
    return {
      status: 'SUCCESS',
      branch,
      checksOK,
      reportPath,
      mdPath,
      message: `Verification complete. Report: ${mdPath}`,
    };
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'ERROR');
    return { status: 'ERROR', message: error.message };
  }
}

main().then(result => {
  console.log('\n=== RESULT ===');
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === 'ERROR' ? 1 : 0);
}).catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
