const fs = require('fs');
const path = require('path');

/**
 * Reads PORT from apps/web/.env.local (wins) or apps/web/.env.
 * Used by dev/start scripts and by the Electron shell in development.
 */
function readPortFromEnvFile(filePath) {
  try {
    const txt = fs.readFileSync(filePath, 'utf8');
    const m = txt.match(/^PORT\s*=\s*"?(\d+)"?/m);
    if (m) return m[1];
  } catch {
    /* missing or unreadable */
  }
  return null;
}

function getWebDevPort() {
  const base = path.join(__dirname, '..');
  const fromLocal = readPortFromEnvFile(path.join(base, '.env.local'));
  if (fromLocal) return fromLocal;
  const fromEnv = readPortFromEnvFile(path.join(base, '.env'));
  if (fromEnv) return fromEnv;
  if (process.env.PORT) return String(process.env.PORT);
  return '3000';
}

if (require.main === module) {
  process.stdout.write(getWebDevPort());
}

module.exports = { getWebDevPort };
