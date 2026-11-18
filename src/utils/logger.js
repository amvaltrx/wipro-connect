/**
 * Simple colored console logger for Wipro Connect
 */

const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function timestamp() {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

export const logger = {
  info(msg, ...args) {
    console.log(`${colors.dim}[${timestamp()}]${colors.reset} ${colors.green}[INFO]${colors.reset} ${msg}`, ...args);
  },
  warn(msg, ...args) {
    console.warn(`${colors.dim}[${timestamp()}]${colors.reset} ${colors.yellow}[WARN]${colors.reset} ${msg}`, ...args);
  },
  error(msg, ...args) {
    console.error(`${colors.dim}[${timestamp()}]${colors.reset} ${colors.red}[ERROR]${colors.reset} ${msg}`, ...args);
  },
  wa(msg, ...args) {
    console.log(`${colors.dim}[${timestamp()}]${colors.reset} ${colors.cyan}[WhatsApp]${colors.reset} ${msg}`, ...args);
  },
  discord(msg, ...args) {
    console.log(`${colors.dim}[${timestamp()}]${colors.reset} ${colors.magenta}[Discord]${colors.reset} ${msg}`, ...args);
  },
};
