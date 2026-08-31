const fs = require('fs');
const path = require('path');

function main() {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3];
  if (!inputPath || !outputPath) {
    console.error('Usage: node ua-arch-analyze.js <input.json> <output.json>');
    process.exit(1);
  }
  const raw = fs.readFileSync(inputPath, 'utf8');
  const data = JSON.parse(raw);
  const fileNodes = data.fileNodes || [];
  const importEdges = data.importEdges || [];
  const allEdges = data.allEdges || [];

  const nodeById = new Map(fileNodes.map(n => [n.id, n]));

  // A. Directory Grouping
  const filePaths = fileNodes.map(n => n.filePath).filter(Boolean);
  function commonPrefix(paths) {
    if (paths.length === 0) return '';
    let prefix = paths[0];
    for (const p of paths.slice(1)) {
      let i = 0;
      while (i < prefix.length && i < p.length && prefix[i] === p[i]) i++;
      prefix = prefix.slice(0, i);
    }
    // trim to last '/'
    const idx = prefix.lastIndexOf('/');
    return idx >= 0 ? prefix.slice(0, idx + 1) : '';
  }
  const prefix = commonPrefix(filePaths);

  function groupForPath(fp) {
    if (!fp) return 'root';
    let rest = fp.startsWith(prefix) ? fp.slice(prefix.length) : fp;
    const parts = rest.split('/').filter(Boolean);
    if (parts.length <= 1) {
      // flat - group by extension/pattern
      const base = parts[0] || fp;
      if (/\.test\.|\.spec\./.test(base)) return 'test';
      if (/\.config\./.test(base)) return 'config';
      const ext = base.includes('.') ? base.split('.').pop() : 'other';
      return `root-${ext}`;
    }
    return parts[0];
  }

  const directoryGroups = {};
  for (const n of fileNodes) {
    const g = groupForPath(n.filePath);
    if (!directoryGroups[g]) directoryGroups[g] = [];
    directoryGroups[g].push(n.id);
  }

  // B. Node Type Grouping
  const nodeTypeGroups = {};
  for (const n of fileNodes) {
    if (!nodeTypeGroups[n.type]) nodeTypeGroups[n.type] = [];
    nodeTypeGroups[n.type].push(n.id);
  }

  // C. Import Adjacency Matrix
  const fileFanOut = {};
  const fileFanIn = {};
  const importAdj = new Map(); // id -> Set(targets)
  for (const e of importEdges) {
    if (!nodeById.has(e.source) || !nodeById.has(e.target)) continue;
    fileFanOut[e.source] = (fileFanOut[e.source] || 0) + 1;
    fileFanIn[e.target] = (fileFanIn[e.target] || 0) + 1;
    if (!importAdj.has(e.source)) importAdj.set(e.source, new Set());
    importAdj.get(e.source).add(e.target);
  }

  function groupOf(id) {
    const n = nodeById.get(id);
    if (!n) return null;
    return groupForPath(n.filePath);
  }

  const groupImportsFrom = {}; // group -> set of groups it imports from
  const groupImportedBy = {}; // group -> set of groups that import it
  for (const e of importEdges) {
    if (!nodeById.has(e.source) || !nodeById.has(e.target)) continue;
    const gs = groupOf(e.source);
    const gt = groupOf(e.target);
    if (!gs || !gt) continue;
    if (!groupImportsFrom[gs]) groupImportsFrom[gs] = new Set();
    groupImportsFrom[gs].add(gt);
    if (!groupImportedBy[gt]) groupImportedBy[gt] = new Set();
    groupImportedBy[gt].add(gs);
  }

  // D. Cross-Category Dependency Analysis
  const crossCategoryMap = new Map();
  for (const e of allEdges) {
    const sn = nodeById.get(e.source);
    const tn = nodeById.get(e.target);
    if (!sn || !tn) continue;
    if (sn.type === tn.type) continue; // cross-category only, non-import handled separately below too
    const key = `${sn.type}|${tn.type}|${e.type}`;
    crossCategoryMap.set(key, (crossCategoryMap.get(key) || 0) + 1);
  }
  const crossCategoryEdges = [];
  for (const [key, count] of crossCategoryMap.entries()) {
    const [fromType, toType, edgeType] = key.split('|');
    crossCategoryEdges.push({ fromType, toType, edgeType, count });
  }

  // E. Inter-Group Import Frequency
  const interGroupMap = new Map();
  for (const e of importEdges) {
    if (!nodeById.has(e.source) || !nodeById.has(e.target)) continue;
    const gs = groupOf(e.source);
    const gt = groupOf(e.target);
    if (!gs || !gt) continue;
    const key = `${gs}|${gt}`;
    interGroupMap.set(key, (interGroupMap.get(key) || 0) + 1);
  }
  const interGroupImports = [];
  for (const [key, count] of interGroupMap.entries()) {
    const [from, to] = key.split('|');
    interGroupImports.push({ from, to, count });
  }

  // F. Intra-Group Import Density
  const intraGroupDensity = {};
  for (const g of Object.keys(directoryGroups)) {
    let internalEdges = 0;
    let totalEdges = 0;
    for (const e of importEdges) {
      if (!nodeById.has(e.source) || !nodeById.has(e.target)) continue;
      const gs = groupOf(e.source);
      const gt = groupOf(e.target);
      if (gs !== g && gt !== g) continue;
      totalEdges++;
      if (gs === g && gt === g) internalEdges++;
    }
    intraGroupDensity[g] = {
      internalEdges,
      totalEdges,
      density: totalEdges > 0 ? +(internalEdges / totalEdges).toFixed(3) : 0
    };
  }

  // G. Directory Pattern Matching
  const dirPatternTable = [
    [['routes', 'api', 'controllers', 'endpoints', 'handlers'], 'api'],
    [['services', 'core', 'lib', 'domain', 'logic'], 'service'],
    [['models', 'db', 'data', 'persistence', 'repository', 'entities'], 'data'],
    [['components', 'views', 'pages', 'ui', 'layouts', 'screens'], 'ui'],
    [['middleware', 'plugins', 'interceptors', 'guards'], 'middleware'],
    [['utils', 'helpers', 'common', 'shared', 'tools'], 'utility'],
    [['config', 'constants', 'env', 'settings'], 'config'],
    [['__tests__', 'test', 'tests', 'spec', 'specs'], 'test'],
    [['types', 'interfaces', 'schemas', 'contracts', 'dtos'], 'types'],
    [['hooks'], 'hooks'],
    [['store', 'state', 'reducers', 'actions', 'slices'], 'state'],
    [['assets', 'static', 'public'], 'assets'],
    [['migrations'], 'data'],
    [['management', 'commands'], 'config'],
    [['templatetags'], 'utility'],
    [['signals'], 'service'],
    [['serializers'], 'api'],
    [['cmd'], 'entry'],
    [['internal'], 'service'],
    [['pkg'], 'utility'],
    [['dto', 'request', 'response'], 'types'],
    [['entity'], 'data'],
    [['controller'], 'api'],
    [['routers'], 'api'],
    [['composables'], 'service'],
    [['blueprints'], 'api'],
    [['mailers', 'jobs', 'channels'], 'service'],
    [['bin'], 'entry'],
    [['docs', 'documentation', 'wiki'], 'documentation'],
    [['deploy', 'deployment', 'infra', 'infrastructure'], 'infrastructure'],
    [['.github', '.gitlab', '.circleci'], 'ci-cd'],
    [['k8s', 'kubernetes', 'helm', 'charts'], 'infrastructure'],
    [['terraform', 'tf'], 'infrastructure'],
    [['docker'], 'infrastructure'],
    [['sql', 'database', 'schema'], 'data'],
  ];

  function matchPattern(dirName) {
    const lower = dirName.toLowerCase();
    for (const [names, label] of dirPatternTable) {
      if (names.includes(lower)) return label;
    }
    return null;
  }

  const patternMatches = {};
  for (const g of Object.keys(directoryGroups)) {
    const m = matchPattern(g);
    if (m) patternMatches[g] = m;
  }

  // File-level pattern overrides (informational)
  const fileLevelMatches = {};
  for (const n of fileNodes) {
    const fp = n.filePath || '';
    const base = path.basename(fp);
    let label = null;
    if (/\.test\.|\.spec\.|^test_|_test\.go$|Test\.java$|_spec\.rb$|Test\.php$|Tests\.cs$/.test(base)) label = 'test';
    else if (/\.d\.ts$/.test(base)) label = 'types';
    else if (base === 'index.ts' || base === 'index.js' || base === '__init__.py') label = 'entry';
    else if (base === 'manage.py') label = 'entry';
    else if (base === 'wsgi.py' || base === 'asgi.py') label = 'config';
    else if (base === 'main.rs' || base === 'lib.rs') label = 'entry';
    else if (base === 'Application.java' || base === 'Program.cs') label = 'entry';
    else if (base === 'config.ru') label = 'entry';
    else if (['Cargo.toml', 'go.mod', 'Gemfile', 'pom.xml', 'build.gradle', 'composer.json'].includes(base)) label = 'config';
    else if (base === 'Dockerfile' || base.startsWith('docker-compose')) label = 'infrastructure';
    else if (/\.tf$|\.tfvars$/.test(base)) label = 'infrastructure';
    else if (fp.includes('.github/workflows/') || base === '.gitlab-ci.yml' || base === 'Jenkinsfile') label = 'ci-cd';
    else if (/\.sql$/.test(base)) label = 'data';
    else if (/\.graphql$|\.gql$|\.proto$/.test(base)) label = 'types';
    else if (/\.md$|\.rst$/.test(base)) label = 'documentation';
    else if (base === 'Makefile') label = 'infrastructure';
    if (label) fileLevelMatches[n.id] = label;
  }

  // H. Deployment Topology Detection
  const infraFiles = [];
  let hasDockerfile = false, hasCompose = false, hasK8s = false, hasTerraform = false, hasCI = false;
  for (const n of fileNodes) {
    const fp = n.filePath || '';
    const base = path.basename(fp);
    if (base === 'Dockerfile' || /^Dockerfile\./.test(base)) { hasDockerfile = true; infraFiles.push(fp); }
    else if (base.startsWith('docker-compose')) { hasCompose = true; infraFiles.push(fp); }
    else if (/\.ya?ml$/.test(base) && /k8s|kubernetes/i.test(fp)) { hasK8s = true; infraFiles.push(fp); }
    else if (/\.tf$|\.tfvars$/.test(base)) { hasTerraform = true; infraFiles.push(fp); }
    else if (fp.includes('.github/workflows/') || base === '.gitlab-ci.yml' || base === 'Jenkinsfile') { hasCI = true; infraFiles.push(fp); }
    else if (base === '.dockerignore') { infraFiles.push(fp); }
  }

  // I. Data Pipeline Detection
  const schemaFiles = [];
  const migrationFiles = [];
  const dataModelFiles = [];
  const apiHandlerFiles = [];
  for (const n of fileNodes) {
    const fp = n.filePath || '';
    const base = path.basename(fp);
    if (/\.sql$/.test(base) || /\.graphql$|\.gql$|\.proto$|\.prisma$/.test(base)) schemaFiles.push(fp);
    if (fp.includes('migrations/')) migrationFiles.push(fp);
    if (/\/(models|db|data|entities)\//i.test(fp)) dataModelFiles.push(fp);
    if (/\/(routes|api|controllers|endpoints|handlers)\//i.test(fp)) apiHandlerFiles.push(fp);
  }

  // J. Documentation Coverage
  const docFiles = fileNodes.filter(n => n.type === 'document' || /\.md$|\.rst$/.test(n.filePath || ''));
  const groupsWithDocsSet = new Set();
  for (const d of docFiles) {
    const g = groupForPath(d.filePath);
    groupsWithDocsSet.add(g);
  }
  const totalGroups = Object.keys(directoryGroups).length;
  const groupsWithDocs = [...groupsWithDocsSet].filter(g => directoryGroups[g]).length;
  const undocumentedGroups = Object.keys(directoryGroups).filter(g => !groupsWithDocsSet.has(g));
  const docCoverage = {
    groupsWithDocs,
    totalGroups,
    coverageRatio: totalGroups > 0 ? +(groupsWithDocs / totalGroups).toFixed(3) : 0,
    undocumentedGroups
  };

  // K. Dependency Direction
  const dependencyDirection = [];
  const seenPairs = new Set();
  for (const { from, to, count } of interGroupImports) {
    if (from === to) continue;
    const pairKey = [from, to].sort().join('|');
    if (seenPairs.has(pairKey)) continue;
    const reverse = interGroupImports.find(x => x.from === to && x.to === from);
    const reverseCount = reverse ? reverse.count : 0;
    if (count > reverseCount) {
      dependencyDirection.push({ dependent: from, dependsOn: to });
    } else if (reverseCount > count) {
      dependencyDirection.push({ dependent: to, dependsOn: from });
    }
    seenPairs.add(pairKey);
  }

  // fileStats
  const filesPerGroup = {};
  for (const g of Object.keys(directoryGroups)) filesPerGroup[g] = directoryGroups[g].length;
  const nodeTypeCounts = {};
  for (const t of Object.keys(nodeTypeGroups)) nodeTypeCounts[t] = nodeTypeGroups[t].length;

  const result = {
    scriptCompleted: true,
    directoryGroups,
    nodeTypeGroups,
    crossCategoryEdges,
    interGroupImports,
    intraGroupDensity,
    patternMatches,
    fileLevelMatches,
    deploymentTopology: {
      hasDockerfile,
      hasCompose,
      hasK8s,
      hasTerraform,
      hasCI,
      infraFiles
    },
    dataPipeline: {
      schemaFiles,
      migrationFiles,
      dataModelFiles,
      apiHandlerFiles
    },
    docCoverage,
    dependencyDirection,
    fileStats: {
      totalFileNodes: fileNodes.length,
      filesPerGroup,
      nodeTypeCounts
    },
    fileFanIn,
    fileFanOut
  };

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log('Analysis complete. Output written to', outputPath);
}

try {
  main();
  process.exit(0);
} catch (err) {
  console.error('Fatal error:', err && err.stack ? err.stack : err);
  process.exit(1);
}
