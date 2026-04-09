const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
// Point to the monorepo root (two levels up from apps/mobile)
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo so Metro can see packages/* changes
config.watchFolders = [workspaceRoot];

// 2. Tell Metro where to look for node_modules — project first, then workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. pnpm uses symlinks — this lets Metro follow them correctly
config.resolver.unstable_enableSymlinks = true;

// 4. Prevent Metro from getting confused by hoisted vs non-hoisted duplicates
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
