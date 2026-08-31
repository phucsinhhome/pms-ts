#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath || !outputPath) {
  fail('Usage: node ua-tour-analyze.js <input.json> <output.json>');
}

let data;
try {
  data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
} catch (e) {
  fail('Failed to read/parse input file: ' + e.message);
}

const nodes = Array.isArray(data.nodes) ? data.nodes : [];
const edges = Array.isArray(data.edges) ? data.edges : [];
const layers = Array.isArray(data.layers) ? data.layers : [];

if (nodes.length === 0) {
  fail('No nodes found in input.');
}

const nodeById = new Map();
nodes.forEach(n => nodeById.set(n.id, n));

// ---- Fan-in / Fan-out ----
const fanIn = new Map();
const fanOut = new Map();
nodes.forEach(n => { fanIn.set(n.id, 0); fanOut.set(n.id, 0); });

edges.forEach(e => {
  if (nodeById.has(e.source)) fanOut.set(e.source, (fanOut.get(e.source) || 0) + 1);
  if (nodeById.has(e.target)) fanIn.set(e.target, (fanIn.get(e.target) || 0) + 1);
});

function nodeName(n) {
  return n.name || (n.filePath ? path.basename(n.filePath) : n.id);
}

const fanInRanking = nodes
  .map(n => ({ id: n.id, fanIn: fanIn.get(n.id) || 0, name: nodeName(n) }))
  .sort((a, b) => b.fanIn - a.fanIn)
  .slice(0, 20);

const fanOutRanking = nodes
  .map(n => ({ id: n.id, fanOut: fanOut.get(n.id) || 0, name: nodeName(n) }))
  .sort((a, b) => b.fanOut - a.fanOut)
  .slice(0, 20);

// ---- Entry Point Candidates ----
const ENTRY_FILENAMES = new Set([
  'index.ts', 'index.js', 'index.tsx', 'index.jsx', 'main.ts', 'main.js', 'app.ts', 'app.js',
  'server.ts', 'server.js', 'mod.rs', 'main.go', 'main.py', 'main.rs', 'manage.py', 'app.py',
  'wsgi.py', 'asgi.py', 'run.py', '__main__.py', 'Application.java', 'Main.java', 'Program.cs',
  'config.ru', 'index.php', 'App.swift', 'Application.kt', 'main.cpp', 'main.c'
]);

const fanOutValues = nodes.map(n => fanOut.get(n.id) || 0).sort((a, b) => a - b);
const fanInValues = nodes.map(n => fanIn.get(n.id) || 0).sort((a, b) => a - b);

function percentileThreshold(sortedValues, percentileFromTop) {
  if (sortedValues.length === 0) return 0;
  const idx = Math.max(0, Math.floor(sortedValues.length * (1 - percentileFromTop)));
  return sortedValues[idx];
}

const fanOutTop10Threshold = percentileThreshold(fanOutValues, 0.10);
const fanInBottom25Threshold = sortedBottom25(fanInValues);

function sortedBottom25(sortedValues) {
  if (sortedValues.length === 0) return 0;
  const idx = Math.min(sortedValues.length - 1, Math.floor(sortedValues.length * 0.25));
  return sortedValues[idx];
}

function isRootOrOneLevelDeep(filePath) {
  if (!filePath) return false;
  const normalized = filePath.replace(/\\/g, '/').replace(/^\.\//, '');
  const parts = normalized.split('/').filter(Boolean);
  return parts.length <= 2;
}

const entryScores = [];
nodes.forEach(n => {
  let score = 0;
  const fp = n.filePath || '';
  const base = path.basename(fp || n.name || '');
  const normalized = fp.replace(/\\/g, '/').replace(/^\.\//, '');

  if (n.type === 'document') {
    const isRootReadme = /^readme\.md$/i.test(base) && normalized.split('/').filter(Boolean).length <= 1;
    const isRootMd = /\.md$/i.test(base) && normalized.split('/').filter(Boolean).length <= 1;
    if (isRootReadme) score += 5;
    else if (isRootMd) score += 2;
  } else {
    if (ENTRY_FILENAMES.has(base)) score += 3;
    if (isRootOrOneLevelDeep(fp)) score += 1;
    if ((fanOut.get(n.id) || 0) >= fanOutTop10Threshold && (fanOut.get(n.id) || 0) > 0) score += 1;
    if ((fanIn.get(n.id) || 0) <= fanInBottom25Threshold) score += 1;
  }

  if (score > 0) {
    entryScores.push({ id: n.id, score, name: nodeName(n), summary: n.summary || '' });
  }
});

entryScores.sort((a, b) => b.score - a.score);
const entryPointCandidates = entryScores.slice(0, 5);

// ---- BFS from top code entry point ----
function isCodeNode(n) {
  return n && n.type !== 'document';
}

let bfsStart = null;
for (const cand of entryPointCandidates) {
  const n = nodeById.get(cand.id);
  if (isCodeNode(n)) { bfsStart = cand.id; break; }
}
if (!bfsStart) {
  // fallback: highest-fanout code node
  const codeNodes = nodes.filter(isCodeNode);
  codeNodes.sort((a, b) => (fanOut.get(b.id) || 0) - (fanOut.get(a.id) || 0));
  if (codeNodes.length > 0) bfsStart = codeNodes[0].id;
}

const adjacency = new Map();
nodes.forEach(n => adjacency.set(n.id, []));
edges.forEach(e => {
  if ((e.type === 'imports' || e.type === 'calls') && adjacency.has(e.source) && nodeById.has(e.target)) {
    adjacency.get(e.source).push(e.target);
  }
});

const bfsOrder = [];
const depthMap = {};
if (bfsStart) {
  const visited = new Set([bfsStart]);
  const queue = [[bfsStart, 0]];
  let qi = 0;
  while (qi < queue.length) {
    const [cur, depth] = queue[qi++];
    bfsOrder.push(cur);
    depthMap[cur] = depth;
    const neighbors = adjacency.get(cur) || [];
    for (const nb of neighbors) {
      if (!visited.has(nb)) {
        visited.add(nb);
        queue.push([nb, depth + 1]);
      }
    }
  }
}

const byDepth = {};
Object.entries(depthMap).forEach(([id, d]) => {
  const key = String(d);
  if (!byDepth[key]) byDepth[key] = [];
  byDepth[key].push(id);
});

// ---- Non-Code File Inventory ----
const nonCodeFiles = {
  documentation: [],
  infrastructure: [],
  data: [],
  config: []
};

nodes.forEach(n => {
  const entry = { id: n.id, name: nodeName(n), type: n.type, summary: n.summary || '' };
  if (n.type === 'document') nonCodeFiles.documentation.push(entry);
  else if (n.type === 'service' || n.type === 'pipeline' || n.type === 'resource') nonCodeFiles.infrastructure.push(entry);
  else if (n.type === 'table' || n.type === 'schema' || n.type === 'endpoint') nonCodeFiles.data.push(entry);
  else if (n.type === 'config') nonCodeFiles.config.push(entry);
});

// ---- Tightly Coupled Clusters ----
const edgeSet = new Set();
const edgeTypeByPair = new Map();
edges.forEach(e => {
  if (!nodeById.has(e.source) || !nodeById.has(e.target)) return;
  if (e.type !== 'imports' && e.type !== 'calls') return;
  edgeSet.add(e.source + '->' + e.target);
});

const pairKey = (a, b) => [a, b].sort().join('|');
const bidirectionalPairs = [];
const seenPairs = new Set();
edges.forEach(e => {
  if (!nodeById.has(e.source) || !nodeById.has(e.target)) return;
  if (e.type !== 'imports' && e.type !== 'calls') return;
  if (e.source === e.target) return;
  const reverseKey = e.target + '->' + e.source;
  if (edgeSet.has(reverseKey)) {
    const key = pairKey(e.source, e.target);
    if (!seenPairs.has(key)) {
      seenPairs.add(key);
      bidirectionalPairs.push([e.source, e.target]);
    }
  }
});

// Union-Find to group bidirectional pairs into clusters
const parent = new Map();
function find(x) {
  if (!parent.has(x)) parent.set(x, x);
  let root = x;
  while (parent.get(root) !== root) root = parent.get(root);
  let cur = x;
  while (parent.get(cur) !== root) {
    const next = parent.get(cur);
    parent.set(cur, root);
    cur = next;
  }
  return root;
}
function union(a, b) {
  const ra = find(a), rb = find(b);
  if (ra !== rb) parent.set(ra, rb);
}

bidirectionalPairs.forEach(([a, b]) => { find(a); find(b); union(a, b); });

const groups = new Map();
parent.forEach((_, id) => {
  const root = find(id);
  if (!groups.has(root)) groups.set(root, new Set());
  groups.get(root).add(id);
});

// Expand: add nodes connecting to 2+ existing cluster members
let clusterCandidates = Array.from(groups.values()).map(s => new Set(s));

clusterCandidates = clusterCandidates.map(clusterSet => {
  let changed = true;
  let iterations = 0;
  while (changed && clusterSet.size < 5 && iterations < 10) {
    changed = false;
    iterations++;
    const connectionCount = new Map();
    edges.forEach(e => {
      if (!nodeById.has(e.source) || !nodeById.has(e.target)) return;
      if (e.type !== 'imports' && e.type !== 'calls') return;
      if (clusterSet.has(e.source) && !clusterSet.has(e.target)) {
        connectionCount.set(e.target, (connectionCount.get(e.target) || 0) + 1);
      } else if (clusterSet.has(e.target) && !clusterSet.has(e.source)) {
        connectionCount.set(e.source, (connectionCount.get(e.source) || 0) + 1);
      }
    });
    for (const [candidate, count] of connectionCount.entries()) {
      if (count >= 2 && clusterSet.size < 5) {
        clusterSet.add(candidate);
        changed = true;
      }
    }
  }
  return clusterSet;
});

function countInternalEdges(nodeSet) {
  let count = 0;
  edges.forEach(e => {
    if (nodeSet.has(e.source) && nodeSet.has(e.target) && e.source !== e.target) count++;
  });
  return count;
}

let clusters = clusterCandidates
  .filter(s => s.size >= 2 && s.size <= 5)
  .map(s => ({ nodes: Array.from(s), edgeCount: countInternalEdges(s) }))
  .sort((a, b) => b.edgeCount - a.edgeCount)
  .slice(0, 10);

// dedupe identical clusters
const seenClusterKeys = new Set();
clusters = clusters.filter(c => {
  const key = c.nodes.slice().sort().join('|');
  if (seenClusterKeys.has(key)) return false;
  seenClusterKeys.add(key);
  return true;
});

// ---- Node Summary Index ----
const nodeSummaryIndex = {};
nodes.forEach(n => {
  nodeSummaryIndex[n.id] = { name: nodeName(n), type: n.type, summary: n.summary || '' };
});

const result = {
  scriptCompleted: true,
  entryPointCandidates,
  fanInRanking,
  fanOutRanking,
  bfsTraversal: {
    startNode: bfsStart,
    order: bfsOrder,
    depthMap,
    byDepth
  },
  nonCodeFiles,
  clusters,
  layers: {
    count: layers.length,
    list: layers
  },
  nodeSummaryIndex,
  totalNodes: nodes.length,
  totalEdges: edges.length
};

try {
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
} catch (e) {
  fail('Failed to write output file: ' + e.message);
}

console.log('Analysis complete. Output written to ' + outputPath);
process.exit(0);
