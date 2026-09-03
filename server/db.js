import { DatabaseSync } from 'node:sqlite';
import pg from 'pg';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dns from 'node:dns';

dns.setDefaultResultOrder('ipv4first');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = process.env.DATABASE_PATH || path.join(DEFAULT_DATA_DIR, 'checklist.db');
const DATA_DIR = path.dirname(DB_PATH);
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(DATA_DIR, 'backups');

export const isPostgres = !!process.env.DATABASE_URL;

let pgPool = null;
let sqliteDb = null;

if (isPostgres) {
 pgPool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL, 
  ssl: { rejectUnauthorized: false },
  max: 1
});
} else {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  sqliteDb = new DatabaseSync(DB_PATH);
}

// Convert SQLite ? to Postgres $1, $2, etc.
function convertPlaceholders(sql) {
  if (!isPostgres) return sql;
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

export async function queryGet(sql, params = []) {
  if (isPostgres) {
    const pgSql = convertPlaceholders(sql);
    const res = await pgPool.query(pgSql, params);
    return res.rows[0] || null;
  } else {
    return sqliteDb.prepare(sql).get(...params);
  }
}

export async function queryAll(sql, params = []) {
  if (isPostgres) {
    const pgSql = convertPlaceholders(sql);
    const res = await pgPool.query(pgSql, params);
    return res.rows;
  } else {
    return sqliteDb.prepare(sql).all(...params);
  }
}

export async function queryRun(sql, params = []) {
  console.log('[QUERY RUN]', sql.substring(0,100), params);
  if (isPostgres) {
    const pgSql = convertPlaceholders(sql);
    const res = await pgPool.query(pgSql, params);
    const lastId = res.rows[0]?.id || null;
    return {
      lastInsertRowid: lastId,
      changes: res.rowCount
    };
  } else {
    const info = sqliteDb.prepare(sql).run(...params);
    return {
      lastInsertRowid: info.lastInsertRowid,
      changes: info.changes
    };
  }
}

export async function execSql(sql) {
  if (isPostgres) {
    await pgPool.query(sql);
  } else {
    sqliteDb.exec(sql);
  }
}

async function columnExists(tableName, columnName) {
  if (isPostgres) return true; // Postgres schema created fresh anyway
  const list = sqliteDb.prepare(`PRAGMA table_info(${tableName})`).all();
  return list.some((col) => col.name === columnName);
}

export async function initDatabase() {
  if (isPostgres) {
    await execSql(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        token TEXT,
        role TEXT NOT NULL DEFAULT 'admin',
        created_at TIMESTAMP NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER NOT NULL DEFAULT 1,
        name TEXT NOT NULL DEFAULT '기본 교육',
        status TEXT NOT NULL DEFAULT 'open',
        results_visible INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        started_at TIMESTAMP,
        closed_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS responses (
        id SERIAL PRIMARY KEY,
        session_id INTEGER NOT NULL,
        device_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'in_progress',
        gender TEXT,
        age_group TEXT,
        driving_experience TEXT,
        vehicle_type TEXT,
        impatience_score INTEGER,
        conformity_score INTEGER,
        risk_score INTEGER,
        result_type TEXT,
        result_json TEXT,
        answers_json TEXT NOT NULL DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        completed_at TIMESTAMP,
        UNIQUE(session_id, device_id)
      );

      CREATE TABLE IF NOT EXISTS active_connections (
        id TEXT PRIMARY KEY,
        session_id INTEGER,
        page TEXT,
        last_seen TIMESTAMP NOT NULL DEFAULT now()
      );
    `);
  } else {
    await execSql(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        token TEXT,
        role TEXT NOT NULL DEFAULT 'admin',
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id INTEGER NOT NULL DEFAULT 1,
        name TEXT NOT NULL DEFAULT '기본 교육',
        status TEXT NOT NULL DEFAULT 'open',
        results_visible INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        started_at TEXT,
        closed_at TEXT
      );

      CREATE TABLE IF NOT EXISTS responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        device_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'in_progress',
        gender TEXT,
        age_group TEXT,
        driving_experience TEXT,
        vehicle_type TEXT,
        impatience_score INTEGER,
        conformity_score INTEGER,
        risk_score INTEGER,
        result_type TEXT,
        result_json TEXT,
        answers_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        completed_at TEXT,
        UNIQUE(session_id, device_id)
      );

      CREATE TABLE IF NOT EXISTS active_connections (
        id TEXT PRIMARY KEY,
        session_id INTEGER,
        page TEXT,
        last_seen TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      );
    `);
  }

  // SQLite migrations
  if (!isPostgres) {
    if (!(await columnExists('sessions', 'admin_id'))) {
      await execSql('ALTER TABLE sessions ADD COLUMN admin_id INTEGER NOT NULL DEFAULT 1');
    }
    if (!(await columnExists('admins', 'token'))) {
      await execSql('ALTER TABLE admins ADD COLUMN token TEXT');
    }
  }

  // Setup renamed default admin
  const renamedDefaultAdmin = await queryGet("SELECT * FROM admins WHERE name = '관리자'");
  const legacyDefaultAdmin = await queryGet("SELECT * FROM admins WHERE name = '기본관리자'");
  if (legacyDefaultAdmin && !renamedDefaultAdmin) {
    await queryRun("UPDATE admins SET name = '관리자' WHERE id = ?", [legacyDefaultAdmin.id]);
  }

  const defaultAdmin = await queryGet("SELECT * FROM admins WHERE name = '관리자'");
  if (!defaultAdmin) {
    const legacyPasswordRow = await queryGet("SELECT value FROM settings WHERE key = 'admin_password'");
    const legacyPassword = legacyPasswordRow?.value || '1234';
    await queryRun("INSERT INTO admins (name, password, role) VALUES ('관리자', ?, 'super')", [legacyPassword]);
  }

  const sessionCount = await queryGet('SELECT COUNT(*) as cnt FROM sessions');
  if (Number(sessionCount.cnt) === 0) {
    const defaultAdminRow = await queryGet("SELECT id FROM admins WHERE name = '관리자'");
    const adminId = defaultAdminRow?.id || 1;
    const sessionInsertSql = isPostgres
      ? "INSERT INTO sessions (admin_id, name, status, results_visible, started_at) VALUES (?, '기본 교육', 'open', 0, now())"
      : "INSERT INTO sessions (admin_id, name, status, results_visible, started_at) VALUES (?, '기본 교육', 'open', 0, datetime('now', 'localtime'))";
    await queryRun(sessionInsertSql, [Number(adminId)]);
  }

  const adminPwd = await queryGet("SELECT value FROM settings WHERE key = 'admin_password'");
  if (!adminPwd) {
    await queryRun("INSERT INTO settings (key, value) VALUES ('admin_password', '1234')");
  }

  await purgeOldResponses();
}

export async function getSetting(key) {
  const row = await queryGet('SELECT value FROM settings WHERE key = ?', [key]);
  return row?.value ?? null;
}

export async function setSetting(key, value) {
  const sql = isPostgres
    ? "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value"
    : "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value";
  await queryRun(sql, [key, value]);
}

export async function getActiveSession() {
  return queryGet("SELECT * FROM sessions WHERE status != 'archived' ORDER BY id DESC LIMIT 1");
}

export async function getActiveSessionByAdmin(adminId) {
  return queryGet("SELECT * FROM sessions WHERE admin_id = ? AND status != 'archived' ORDER BY id DESC LIMIT 1", [Number(adminId)]);
}

export async function getSessionById(id) {
  return queryGet('SELECT * FROM sessions WHERE id = ?', [Number(id)]);
}

export async function getAdminById(id) {
  return queryGet('SELECT * FROM admins WHERE id = ?', [Number(id)]);
}

export async function getAdminByName(name) {
  return queryGet('SELECT * FROM admins WHERE name = ?', [name]);
}

export async function getAdminByToken(token) {
  if (!token) return null;
  return queryGet('SELECT * FROM admins WHERE token = ?', [token]);
}

export async function getAllAdmins() {
  return queryAll('SELECT id, name, role, created_at FROM admins ORDER BY id ASC');
}

export async function createAdmin(name, password) {
  const row = await queryGet('INSERT INTO admins (name, password) VALUES (?, ?) RETURNING id', [name, password]);
  const admin = await getAdminById(Number(row.id));
  await createSessionForAdmin(admin.id, '기본 교육');
  return admin;
}

export async function updateAdminPassword(adminId, password) {
  await queryRun('UPDATE admins SET password = ? WHERE id = ?', [password, Number(adminId)]);
  return getAdminById(Number(adminId));
}

export async function updateAdminName(adminId, name) {
  await queryRun('UPDATE admins SET name = ? WHERE id = ?', [name, Number(adminId)]);
  return getAdminById(Number(adminId));
}

export async function setAdminToken(adminId, token) {
  await queryRun('UPDATE admins SET token = ? WHERE id = ?', [token, Number(adminId)]);
}

export async function deleteAdmin(adminId) {
  const admin = await getAdminById(Number(adminId));
  if (!admin) return null;

  await queryRun('BEGIN');
  try {
    const sessions = await getSessionsByAdmin(Number(adminId));
    for (const session of sessions) {
      await queryRun('DELETE FROM active_connections WHERE session_id = ?', [Number(session.id)]);
      await queryRun('DELETE FROM responses WHERE session_id = ?', [Number(session.id)]);
      await queryRun('DELETE FROM sessions WHERE id = ?', [Number(session.id)]);
    }
    await queryRun('DELETE FROM admins WHERE id = ?', [Number(adminId)]);
    await queryRun('COMMIT');
    return admin;
  } catch (err) {
    await queryRun('ROLLBACK');
    throw err;
  }
}

export async function getAllSessions() {
  return queryAll('SELECT * FROM sessions ORDER BY id DESC');
}

export async function getSessionsByAdmin(adminId) {
  return queryAll('SELECT * FROM sessions WHERE admin_id = ? ORDER BY id DESC', [Number(adminId)]);
}

export async function createSessionForAdmin(adminId, name) {
  const closeSql = isPostgres
    ? "UPDATE sessions SET status = 'closed', closed_at = now() WHERE admin_id = ? AND status = 'open'"
    : "UPDATE sessions SET status = 'closed', closed_at = datetime('now', 'localtime') WHERE admin_id = ? AND status = 'open'";
  await queryRun(closeSql, [Number(adminId)]);

  const insertSql = isPostgres
    ? "INSERT INTO sessions (admin_id, name, status, results_visible, started_at) VALUES (?, ?, 'open', 0, now()) RETURNING id"
    : "INSERT INTO sessions (admin_id, name, status, results_visible, started_at) VALUES (?, ?, 'open', 0, datetime('now', 'localtime')) RETURNING id";
  const row = await queryGet(insertSql, [Number(adminId), name || `교육 ${new Date().toLocaleDateString('ko-KR')}`]);
  return getSessionById(Number(row.id));
}

export async function createSession(name) {
  return createSessionForAdmin(1, name);
}

export async function updateSession(id, updates) {
  const fields = [];
  const values = [];
  for (const [key, val] of Object.entries(updates)) {
    fields.push(`${key} = ?`);
    values.push(val);
  }
  if (fields.length === 0) return getSessionById(Number(id));
  values.push(Number(id));
  await queryRun(`UPDATE sessions SET ${fields.join(', ')} WHERE id = ?`, values);
  return getSessionById(Number(id));
}

export async function deleteSession(id) {
  const sessionId = Number(id);
  const session = await getSessionById(sessionId);
  if (!session) return null;

  await queryRun('BEGIN');
  try {
    const responseCountRow = await queryGet('SELECT COUNT(*) as cnt FROM responses WHERE session_id = ?', [sessionId]);
    const responseCount = responseCountRow?.cnt || 0;
    await queryRun('DELETE FROM active_connections WHERE session_id = ?', [sessionId]);
    await queryRun('DELETE FROM responses WHERE session_id = ?', [sessionId]);
    await queryRun('DELETE FROM sessions WHERE id = ?', [sessionId]);
    await queryRun('COMMIT');
    return { session, responseCount };
  } catch (err) {
    await queryRun('ROLLBACK');
    throw err;
  }
}

export async function getResponseByDevice(sessionId, deviceId) {
  return queryGet('SELECT * FROM responses WHERE session_id = ? AND device_id = ?', [Number(sessionId), deviceId]);
}

export async function getResponseById(id) {
  const row = await queryGet(
    'SELECT * FROM responses WHERE id = ?',
    [Number(id)]
  );

  console.log('[GET RESPONSE BY ID]', id, '=>', row);

  return row;
}

export async function deleteResponse(id) {
  const response = await getResponseById(Number(id));
  if (!response) return null;
  await queryRun('DELETE FROM responses WHERE id = ?', [Number(id)]);
  return response;
}

export async function deleteTodayResponsesBySession(sessionId) {
  const sql = isPostgres
    ? "DELETE FROM responses WHERE session_id = ? AND (created_at at time zone 'Asia/Seoul')::date = (now() at time zone 'Asia/Seoul')::date"
    : "DELETE FROM responses WHERE session_id = ? AND date(created_at, 'localtime') = date('now', 'localtime')";
  const result = await queryRun(sql, [Number(sessionId)]);
  await queryRun('DELETE FROM active_connections WHERE session_id = ?', [Number(sessionId)]);
  return result.changes || 0;
}

export async function purgeOldResponses() {
  const sql = isPostgres
    ? "DELETE FROM responses WHERE (created_at at time zone 'Asia/Seoul')::date < (now() at time zone 'Asia/Seoul')::date"
    : "DELETE FROM responses WHERE date(created_at, 'localtime') < date('now', 'localtime')";
  await queryRun(sql);
  await queryRun('DELETE FROM active_connections WHERE session_id NOT IN (SELECT id FROM sessions)');
}

export async function createResponse(sessionId, deviceId) {
  const row = await queryGet(
    'INSERT INTO responses (session_id, device_id, status, answers_json) VALUES (?, ?, ?, ?) RETURNING id',
    [Number(sessionId), deviceId, 'in_progress', '{}']
  );

  console.log('[INSERT ID]', row.id);

  const result = await getResponseById(Number(row.id));

  console.log('[AFTER INSERT GET]', result);

  return result;
}

export async function updateResponse(id, data) {
  const fields = [];
  const values = [];
  const allowed = [
    'status', 'gender', 'age_group', 'driving_experience', 'vehicle_type',
    'impatience_score', 'conformity_score', 'risk_score', 'result_type',
    'result_json', 'answers_json', 'completed_at',
  ];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  }
  const timeUpdate = isPostgres
    ? "updated_at = now()"
    : "updated_at = datetime('now', 'localtime')";
  fields.push(timeUpdate);
  values.push(Number(id));
  await queryRun(`UPDATE responses SET ${fields.join(', ')} WHERE id = ?`, values);
  return getResponseById(Number(id));
}

export async function getResponsesBySession(sessionId) {
  return queryAll('SELECT * FROM responses WHERE session_id = ? ORDER BY created_at DESC', [Number(sessionId)]);
}

export async function getTodayResponsesBySession(sessionId) {
  const sql = isPostgres
    ? "SELECT * FROM responses WHERE session_id = ? AND (created_at at time zone 'Asia/Seoul')::date = (now() at time zone 'Asia/Seoul')::date ORDER BY created_at DESC"
    : "SELECT * FROM responses WHERE session_id = ? AND date(created_at, 'localtime') = date('now', 'localtime') ORDER BY created_at DESC";
  return queryAll(sql, [Number(sessionId)]);
}

export async function getCompletedResponses(sessionId) {
  return queryAll("SELECT * FROM responses WHERE session_id = ? AND status = 'completed' ORDER BY completed_at DESC", [Number(sessionId)]);
}

export async function getTodayCompletedResponses(sessionId) {
  const sql = isPostgres
    ? "SELECT * FROM responses WHERE session_id = ? AND status = 'completed' AND (completed_at at time zone 'Asia/Seoul')::date = (now() at time zone 'Asia/Seoul')::date ORDER BY completed_at DESC"
    : "SELECT * FROM responses WHERE session_id = ? AND status = 'completed' AND date(completed_at, 'localtime') = date('now', 'localtime') ORDER BY completed_at DESC";
  return queryAll(sql, [Number(sessionId)]);
}

export async function upsertConnection(id, sessionId, page) {
  const sql = isPostgres
    ? `INSERT INTO active_connections (id, session_id, page, last_seen)
       VALUES (?, ?, ?, now())
       ON CONFLICT (id) DO UPDATE SET session_id = EXCLUDED.session_id, page = EXCLUDED.page, last_seen = EXCLUDED.last_seen`
    : `INSERT INTO active_connections (id, session_id, page, last_seen)
       VALUES (?, ?, ?, datetime('now', 'localtime'))
       ON CONFLICT(id) DO UPDATE SET session_id = excluded.session_id, page = excluded.page, last_seen = excluded.last_seen`;
  await queryRun(sql, [id, sessionId ? Number(sessionId) : null, page]);
}

export async function cleanupConnections() {
  const sql = isPostgres
    ? "DELETE FROM active_connections WHERE last_seen < now() - interval '2 minutes'"
    : "DELETE FROM active_connections WHERE last_seen < datetime('now', '-2 minutes', 'localtime')";
  await queryRun(sql);
}

export async function getActiveConnectionCount(sessionId) {
  await cleanupConnections();
  const row = await queryGet("SELECT COUNT(*) as cnt FROM active_connections WHERE session_id = ? AND page NOT LIKE '/admin%' AND page NOT LIKE '/share%'", [Number(sessionId)]);
  return row?.cnt || 0;
}

export async function getDashboardStats(sessionId) {
  await purgeOldResponses();
  await cleanupConnections();
  const todayClause = isPostgres
    ? "AND (created_at at time zone 'Asia/Seoul')::date = (now() at time zone 'Asia/Seoul')::date"
    : "AND date(created_at, 'localtime') = date('now', 'localtime')";
  const total = await queryGet(`SELECT COUNT(*) as cnt FROM responses WHERE session_id = ? ${todayClause}`, [Number(sessionId)]);
  const completed = await queryGet(`SELECT COUNT(*) as cnt FROM responses WHERE session_id = ? AND status = 'completed' ${todayClause}`, [Number(sessionId)]);
  const inProgress = await queryGet(`SELECT COUNT(*) as cnt FROM responses WHERE session_id = ? AND status = 'in_progress' ${todayClause}`, [Number(sessionId)]);
  const online = await getActiveConnectionCount(Number(sessionId));

  return {
    totalResponses: total?.cnt || 0,
    completedCount: completed?.cnt || 0,
    inProgressCount: inProgress?.cnt || 0,
    onlineCount: online,
  };
}

export async function backupDatabase() {
  if (isPostgres) {
    return 'Cloud Backup (Auto-handled by database hosting provider)';
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupPath = path.join(BACKUP_DIR, `checklist_${timestamp}.db`);
  fs.copyFileSync(DB_PATH, backupPath);
  return backupPath;
}
