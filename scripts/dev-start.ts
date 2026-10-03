import { spawn, execSync, ChildProcess } from 'child_process';
import net from 'net';
import http from 'http';
import fs from 'fs';
import path from 'path';

// 1. Load Environment Variables from apps/api/.env if not present
const rootDir = path.resolve(__dirname, '..');
const apiEnvPath = path.join(rootDir, 'apps/api/.env');

if (fs.existsSync(apiEnvPath)) {
  const content = fs.readFileSync(apiEnvPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...vals] = trimmed.split('=');
      const val = vals.join('=').replace(/^["']|["']$/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  }
}

// Fallback DATABASE_URL if missing
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@127.0.0.1:5432/blog_management_dev?schema=public';
}

const spawnedProcesses: ChildProcess[] = [];
let isShuttingDown = false;

// Graceful cleanup on exit
function shutdown(exitCode = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log('\n[Shutdown] Gracefully stopping development server processes...');

  for (const child of spawnedProcesses) {
    if (child && !child.killed && child.pid) {
      try {
        if (process.platform === 'win32') {
          execSync(`taskkill /F /T /PID ${child.pid}`, { stdio: 'ignore' });
        } else {
          child.kill('SIGINT');
        }
      } catch {
        // Child process may already have terminated
      }
    }
  }

  console.log('[Shutdown] All development application processes stopped cleanly.');
  process.exit(exitCode);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
process.on('uncaughtException', (err) => {
  console.error('[Error] Uncaught exception:', err);
  shutdown(1);
});

// Helper: Check TCP Port availability
function isPortOpen(port: number, host = '127.0.0.1', timeoutMs = 1000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let status = false;

    socket.setTimeout(timeoutMs);
    socket.on('connect', () => {
      status = true;
      socket.destroy();
    });
    socket.on('timeout', () => {
      socket.destroy();
    });
    socket.on('error', () => {
      socket.destroy();
    });
    socket.on('close', () => {
      resolve(status);
    });

    socket.connect(port, host);
  });
}

// Helper: Check HTTP endpoint health
function checkHttp(url: string, timeoutMs = 2000): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      resolve(res.statusCode !== undefined);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Helper: Wait for condition with retries
async function waitFor(fn: () => Promise<boolean>, maxWaitMs = 20000, intervalMs = 500): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    if (await fn()) return true;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

// Step 1: Ensure PostgreSQL 17 is running
async function ensurePostgres(): Promise<void> {
  console.log('[PostgreSQL] Checking database engine status (Port 5432)...');

  const running = await isPortOpen(5432, '127.0.0.1');
  if (running) {
    console.log('[PostgreSQL] Server is running and accepting connections on 127.0.0.1:5432.');
    return;
  }

  console.log('[PostgreSQL] Server is stopped. Starting PostgreSQL 17 data directory...');

  const pgCtlPaths = [
    'C:\\PostgreSQL\\17\\bin\\pg_ctl.exe',
    'pg_ctl',
  ];

  let started = false;
  const dataDir = 'C:\\PostgreSQL\\17\\data';
  const logFile = 'C:\\PostgreSQL\\17\\data\\server.log';

  for (const pgCtl of pgCtlPaths) {
    try {
      execSync(`"${pgCtl}" -D "${dataDir}" -l "${logFile}" start`, { stdio: 'ignore' });
      started = true;
      break;
    } catch {
      // Continue to next path candidate
    }
  }

  if (!started) {
    console.error('❌ Failed to execute pg_ctl. Please ensure PostgreSQL 17 is installed at C:\\PostgreSQL\\17');
    process.exit(1);
  }

  const ready = await waitFor(() => isPortOpen(5432, '127.0.0.1'), 20000, 500);
  if (!ready) {
    console.error('❌ PostgreSQL failed to start accepting connections on port 5432 within 20 seconds.');
    process.exit(1);
  }

  console.log('[PostgreSQL] Started successfully and accepting connections on 127.0.0.1:5432.');
}

// Step 2: Verify Database Reachability
async function verifyDatabase(): Promise<void> {
  console.log('[Database] Verifying connectivity to database blog_management_dev...');

  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: ['error'],
    });

    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    console.log('[Database] Connected to blog_management_dev database successfully.');
  } catch (err) {
    console.error('❌ Database connectivity check failed:', (err as Error).message);
    console.error('   Please check apps/api/.env DATABASE_URL setting.');
    process.exit(1);
  }
}

// Step 3: Ensure Apollo GraphQL API Server (Port 4000)
async function ensureApi(): Promise<void> {
  const port4000Busy = await isPortOpen(4000, '127.0.0.1');
  if (port4000Busy) {
    const isApiHealthy = await waitFor(() => checkHttp('http://127.0.0.1:4000/graphql'), 3000, 500);
    if (isApiHealthy) {
      console.log('[API] Port 4000 is already running a healthy Apollo API server. Reusing instance.');
      return;
    } else {
      console.error('❌ Port 4000 is occupied by another non-API process. Please free port 4000 to proceed.');
      process.exit(1);
    }
  }

  console.log('[API] Starting Apollo GraphQL Server on port 4000...');

  const apiCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const apiChild = spawn(apiCmd, ['run', 'dev', '--workspace=apps/api'], {
    cwd: rootDir,
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
  });

  spawnedProcesses.push(apiChild);

  apiChild.stdout?.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) console.log(`[API] ${line.trim()}`);
    }
  });

  apiChild.stderr?.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) console.error(`[API] ${line.trim()}`);
    }
  });

  const ready = await waitFor(() => checkHttp('http://127.0.0.1:4000/graphql'), 20000, 500);
  if (!ready) {
    console.error('❌ Apollo GraphQL Server failed to start on port 4000 within 20 seconds.');
    shutdown(1);
  } else {
    console.log('[API] Apollo GraphQL Server ready at http://localhost:4000/graphql');
  }
}

// Step 4: Ensure Next.js Web Application (Port 3000)
async function ensureWeb(): Promise<void> {
  const port3000Busy = await isPortOpen(3000, '127.0.0.1');
  if (port3000Busy) {
    const isWebHealthy = await waitFor(() => checkHttp('http://127.0.0.1:3000'), 3000, 500);
    if (isWebHealthy) {
      console.log('[Web] Port 3000 is already running Next.js Web application. Reusing instance.');
      return;
    } else {
      console.error('❌ Port 3000 is occupied by another non-Next.js process. Please free port 3000 to proceed.');
      process.exit(1);
    }
  }

  console.log('[Web] Starting Next.js Web Application on port 3000...');

  const webCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const webChild = spawn(webCmd, ['run', 'dev', '--workspace=apps/web'], {
    cwd: rootDir,
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
  });

  spawnedProcesses.push(webChild);

  webChild.stdout?.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) console.log(`[WEB] ${line.trim()}`);
    }
  });

  webChild.stderr?.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) console.error(`[WEB] ${line.trim()}`);
    }
  });

  const ready = await waitFor(() => checkHttp('http://127.0.0.1:3000'), 25000, 500);
  if (!ready) {
    console.error('❌ Next.js Web Application failed to start on port 3000 within 25 seconds.');
    shutdown(1);
  } else {
    console.log('[Web] Next.js Web Application ready at http://localhost:3000');
  }
}

// Main Startup Entrypoint
async function main() {
  console.log('==============================================================================');
  console.log('STARTING BLOG MANAGEMENT LOCAL DEVELOPMENT ENVIRONMENT');
  console.log('==============================================================================\n');

  await ensurePostgres();
  await verifyDatabase();
  await ensureApi();
  await ensureWeb();

  console.log('\n==============================================================================');
  console.log('BLOG MANAGEMENT — LOCAL DEVELOPMENT STACK READY');
  console.log('==============================================================================');
  console.log('  [✓] PostgreSQL:  Running on 127.0.0.1:5432');
  console.log('  [✓] Database:    blog_management_dev connected');
  console.log('  [✓] API Server:  http://localhost:4000 (Apollo GraphQL)');
  console.log('  [✓] Web App:     http://localhost:3000 (Next.js Admin Panel)');
  console.log('==============================================================================');
  console.log('Press Ctrl+C to gracefully stop development servers.\n');
}

main().catch((err) => {
  console.error('❌ Unexpected error during dev startup:', err);
  shutdown(1);
});
