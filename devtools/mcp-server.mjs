#!/usr/bin/env node
/**
 * SiteMap devtools — MCP server for Claude
 *
 * Exposes the local PowerSync SQLite database (from the iOS Simulator)
 * as MCP tools so Claude can read table data directly.
 *
 * Registered in .claude/settings.json as an MCP server.
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import Database from 'better-sqlite3';

// ── Config ──────────────────────────────────────────────────────────────────

const DB_FILENAMES = ['sitemap-db.sqlite'];
const BUNDLE_ID = 'org.reactjs.native.example.SiteMap';

// ── Database discovery (shared with server.mjs) ─────────────────────────────

function findSimulatorDb() {
  try {
    const boostedUuid = execSync(
      `xcrun simctl list devices booted --json 2>/dev/null | python3 -c "import sys,json; devs=json.load(sys.stdin)['devices']; print(next(d['udid'] for runtimes in devs.values() for d in runtimes if d.get('state')=='Booted'))"`,
      { shell: '/bin/zsh', timeout: 5000 }
    ).toString().trim();

    if (boostedUuid) {
      const containerPath = execSync(
        `xcrun simctl get_app_container "${boostedUuid}" "${BUNDLE_ID}" data 2>/dev/null`,
        { shell: '/bin/zsh', timeout: 5000 }
      ).toString().trim();

      if (containerPath) {
        const searchDirs = [
          `${containerPath}/Library`,
          `${containerPath}/Documents`,
          `${containerPath}/Documents/databases`,
        ];
        for (const dir of searchDirs) {
          for (const name of DB_FILENAMES) {
            const candidate = `${dir}/${name}`;
            if (existsSync(candidate)) return candidate;
          }
        }
      }
    }
  } catch { /* fall through */ }

  try {
    for (const name of DB_FILENAMES) {
      const mdfind = execSync(
        `mdfind -name "${name}" 2>/dev/null | grep -i simulator | head -5`,
        { shell: '/bin/zsh', timeout: 5000 }
      ).toString().trim();

      if (mdfind) {
        const paths = mdfind.split('\n').filter(Boolean);
        if (paths.length === 1) return paths[0];
        const newest = execSync(
          `ls -t ${paths.map(p => `"${p}"`).join(' ')} 2>/dev/null | head -1`,
          { shell: '/bin/zsh' }
        ).toString().trim();
        return newest || paths[0];
      }
    }
  } catch { /* fall through */ }

  return null;
}

let _db = null;
let _dbPath = null;

function getDb() {
  const path = findSimulatorDb();
  if (!path) throw new Error('Database not found. Make sure the SiteMap app has been run in a simulator.');
  if (!_db || path !== _dbPath) {
    if (_db) { try { _db.close(); } catch {} }
    _db = new Database(path, { readonly: true, fileMustExist: true });
    _dbPath = path;
  }
  return _db;
}

// ── MCP protocol over stdio ─────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'list_tables',
    description: 'List all tables in the SiteMap mobile SQLite database with row counts and column names.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'query_table',
    description: 'Read rows from a specific table in the SiteMap mobile SQLite database.',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        limit: { type: 'number', description: 'Max rows to return (default 50, max 500)' },
        offset: { type: 'number', description: 'Row offset for pagination (default 0)' },
      },
      required: ['table'],
    },
  },
  {
    name: 'run_sql',
    description: 'Run a read-only SQL query (SELECT/PRAGMA only) against the SiteMap mobile SQLite database.',
    inputSchema: {
      type: 'object',
      properties: {
        sql: { type: 'string', description: 'SQL query (SELECT or PRAGMA only)' },
      },
      required: ['sql'],
    },
  },
];

function handleListTables() {
  const db = getDb();
  const tables = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`)
    .all()
    .map((r) => r.name);

  const result = tables.map((name) => {
    try {
      const count = db.prepare(`SELECT COUNT(*) AS n FROM "${name}"`).get().n;
      const columns = db.prepare(`PRAGMA table_info("${name}")`).all().map((c) => c.name);
      return { name, count, columns };
    } catch {
      return { name, count: -1, columns: [] };
    }
  });

  return JSON.stringify(result, null, 2);
}

function handleQueryTable(args) {
  const db = getDb();
  const table = args.table;
  const limit = Math.min(500, Math.max(1, args.limit ?? 50));
  const offset = Math.max(0, args.offset ?? 0);

  const count = db.prepare(`SELECT COUNT(*) AS n FROM "${table}"`).get().n;
  const rows = db.prepare(`SELECT * FROM "${table}" ORDER BY rowid DESC LIMIT ? OFFSET ?`).all(limit, offset);

  return JSON.stringify({ table, total: count, limit, offset, rows }, null, 2);
}

function handleRunSql(args) {
  const sql = args.sql.trim();
  const lower = sql.toLowerCase();
  if (!lower.startsWith('select') && !lower.startsWith('pragma')) {
    throw new Error('Only SELECT and PRAGMA statements are allowed.');
  }

  const db = getDb();
  const rows = db.prepare(sql).all();
  return JSON.stringify({ sql, count: rows.length, rows }, null, 2);
}

function callTool(name, args) {
  switch (name) {
    case 'list_tables': return handleListTables();
    case 'query_table': return handleQueryTable(args);
    case 'run_sql': return handleRunSql(args);
    default: throw new Error(`Unknown tool: ${name}`);
  }
}

// ── JSON-RPC stdio transport ────────────────────────────────────────────────

let buffer = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;

  // MCP uses Content-Length framing
  while (true) {
    const headerEnd = buffer.indexOf('\r\n\r\n');
    if (headerEnd === -1) break;

    const header = buffer.slice(0, headerEnd);
    const match = header.match(/Content-Length:\s*(\d+)/i);
    if (!match) { buffer = buffer.slice(headerEnd + 4); continue; }

    const len = parseInt(match[1], 10);
    const bodyStart = headerEnd + 4;
    if (buffer.length < bodyStart + len) break; // wait for more data

    const body = buffer.slice(bodyStart, bodyStart + len);
    buffer = buffer.slice(bodyStart + len);

    try {
      const msg = JSON.parse(body);
      handleMessage(msg);
    } catch (e) {
      sendError(null, -32700, 'Parse error: ' + e.message);
    }
  }
});

function send(obj) {
  const body = JSON.stringify(obj);
  const frame = `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`;
  process.stdout.write(frame);
}

function sendResult(id, result) {
  send({ jsonrpc: '2.0', id, result });
}

function sendError(id, code, message) {
  send({ jsonrpc: '2.0', id, error: { code, message } });
}

function handleMessage(msg) {
  const { id, method, params } = msg;

  if (method === 'initialize') {
    return sendResult(id, {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'sitemap-mobile-db', version: '1.0.0' },
    });
  }

  if (method === 'notifications/initialized') {
    return; // no response needed
  }

  if (method === 'tools/list') {
    return sendResult(id, { tools: TOOLS });
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params;
    try {
      const text = callTool(name, args || {});
      return sendResult(id, { content: [{ type: 'text', text }] });
    } catch (e) {
      return sendResult(id, {
        content: [{ type: 'text', text: `Error: ${e.message}` }],
        isError: true,
      });
    }
  }

  if (method === 'ping') {
    return sendResult(id, {});
  }

  // Unknown method
  if (id !== undefined) {
    sendError(id, -32601, `Method not found: ${method}`);
  }
}

process.stderr.write('[sitemap-mobile-db] MCP server started\n');
