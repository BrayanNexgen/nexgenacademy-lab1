#!/usr/bin/env node

/**
 * Code Health Analyzer - Generador
 *
 * Ejecutar: node agents/analyzer-generator.js
 * O via Claude Code: /schedule o /loop
 *
 * Analiza cambios recientes y propone mejoras en un PR draft
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  daysBack: 7,
  maxFuncLines: 50,
  maxNestingDepth: 4,
  skipDirs: ['node_modules', 'dist', '.next', '.git'],
  verifyBeforePR: true,
  timestamp: new Date().toISOString().split('T')[0],
};

const LOG_DIR = 'logs';
const REPO_ROOT = process.cwd();

function log(msg, level = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${msg}`);
}

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function getRecentChanges(daysBack) {
  try {
    const cmd = `git log --since="${daysBack} days ago" --name-only --pretty=format:"%H" -- "*.ts" "*.tsx"`;
    const output = execSync(cmd, { encoding: 'utf-8', cwd: REPO_ROOT });
    return output
      .split('\n')
      .filter(line => line && (line.endsWith('.ts') || line.endsWith('.tsx')))
      .filter((v, i, a) => a.indexOf(v) === i); // unique
  } catch (e) {
    log(`Failed to get recent changes: ${e.message}`, 'ERROR');
    return [];
  }
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const findings = [];

  // Check 1: Functions > 50 lines
  let inFunction = false;
  let funcStart = 0;
  let braceCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/^\s*(async\s+)?function\s+\w+|const\s+\w+\s*=\s*(async\s*)?\(|^\s*(export\s+)?(async\s+)?function/)) {
      inFunction = true;
      funcStart = i;
      braceCount = 0;
    }
    if (inFunction) {
      braceCount += (line.match(/{/g) || []).length;
      braceCount -= (line.match(/}/g) || []).length;
      if (braceCount === 0 && i > funcStart + 1) {
        const funcLength = i - funcStart;
        if (funcLength > CONFIG.maxFuncLines) {
          findings.push({
            type: 'LARGE_FUNCTION',
            line: funcStart + 1,
            length: funcLength,
            description: `Function at line ${funcStart + 1} is ${funcLength} lines (threshold: ${CONFIG.maxFuncLines})`,
          });
        }
        inFunction = false;
      }
    }
  }

  // Check 2: React components without full type annotations
  if (filePath.endsWith('.tsx')) {
    const componentMatch = content.match(/^(export\s+)?(async\s+)?function\s+(\w+)\s*\(([^)]*)\)/m);
    if (componentMatch) {
      const paramsStr = componentMatch[4];
      if (!paramsStr.includes(':') && paramsStr.trim()) {
        findings.push({
          type: 'UNTYPED_PROPS',
          line: 1,
          description: `Component '${componentMatch[3]}' has untyped parameters`,
        });
      }
    }
  }

  // Check 3: Unused variables (simplified)
  const unusedVars = content.match(/const\s+(_\w+|\w+_)\s*=/g) || [];
  if (unusedVars.length > 0) {
    findings.push({
      type: 'UNUSED_VARIABLE',
      count: unusedVars.length,
      description: `Found ${unusedVars.length} variables marked as unused`,
    });
  }

  return findings;
}

function generateAnalysisReport(files) {
  const allFindings = {};
  let totalFiles = 0;

  for (const file of files) {
    const fullPath = path.join(REPO_ROOT, file);
    if (!fs.existsSync(fullPath)) continue;

    totalFiles++;
    const findings = analyzeFile(fullPath);
    if (findings.length > 0) {
      allFindings[file] = findings;
    }
  }

  return {
    timestamp: CONFIG.timestamp,
    daysAnalyzed: CONFIG.daysBack,
    filesAnalyzed: totalFiles,
    filesWithFindings: Object.keys(allFindings).length,
    findings: allFindings,
    config: CONFIG,
  };
}

function createPRBranch(report) {
  const branchName = `chore/health-analysis-${CONFIG.timestamp}`;

  try {
    // Create branch
    execSync(`git checkout -b ${branchName}`, { cwd: REPO_ROOT });
    log(`✓ Created branch: ${branchName}`);

    // Create analysis summary file
    const analysisFile = path.join(REPO_ROOT, `docs/analysis-${CONFIG.timestamp}.json`);
    const docsDir = path.join(REPO_ROOT, 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    fs.writeFileSync(analysisFile, JSON.stringify(report, null, 2));

    // Stage and commit
    execSync(`git add ${analysisFile}`, { cwd: REPO_ROOT });
    const commitMsg = `chore: code health analysis - ${CONFIG.timestamp}\n\nAnalyzed ${report.filesAnalyzed} files\nFound ${report.filesWithFindings} files with potential improvements`;
    execSync(`git commit -m "${commitMsg}"`, { cwd: REPO_ROOT });
    log(`✓ Committed analysis to ${branchName}`);

    return branchName;
  } catch (e) {
    log(`Failed to create PR branch: ${e.message}`, 'ERROR');
    throw e;
  }
}

function verifyChanges() {
  log('Running verification checks...');
  const checks = {
    build: false,
    lint: false,
    typeCheck: false,
  };

  try {
    log('→ Build check');
    execSync('npm run build', { cwd: REPO_ROOT, stdio: 'pipe' });
    checks.build = true;
    log('✓ Build passed');
  } catch (e) {
    log('✗ Build failed', 'WARN');
  }

  try {
    log('→ Lint check');
    execSync('npm run lint', { cwd: REPO_ROOT, stdio: 'pipe' });
    checks.lint = true;
    log('✓ Lint passed');
  } catch (e) {
    log('✗ Lint failed (non-critical)', 'WARN');
  }

  return checks;
}

async function main() {
  log('=== Code Health Analyzer ===');
  ensureLogDir();

  try {
    log(`Analyzing changes from the last ${CONFIG.daysBack} days...`);
    const recentFiles = getRecentChanges(CONFIG.daysBack);

    if (recentFiles.length === 0) {
      log('No TypeScript/TSX files changed recently. Exiting.', 'WARN');
      return { status: 'NO_CHANGES', message: 'No recent changes to analyze' };
    }

    log(`Found ${recentFiles.length} modified files`);

    const report = generateAnalysisReport(recentFiles);
    log(`Analysis complete: ${report.filesWithFindings} files with findings`);

    // Save report
    const reportPath = path.join(LOG_DIR, `analyzer-${CONFIG.timestamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log(`Report saved to ${reportPath}`);

    if (CONFIG.verifyBeforePR) {
      verifyChanges();
    }

    const branchName = createPRBranch(report);

    log('=== Analysis Complete ===');
    return {
      status: 'SUCCESS',
      branch: branchName,
      filesAnalyzed: report.filesAnalyzed,
      findingsCount: report.filesWithFindings,
      message: `PR branch created: ${branchName}. Next: verifier will check it.`,
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
