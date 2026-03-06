const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const dbPath = path.resolve(__dirname, '..', '..', process.env.DB_PATH || 'database/homepro.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

let db = null;
let SQL = null;

/**
 * Wraps sql.js Database to provide a better-sqlite3-like API.
 * sql.js runs SQLite in WASM (no native build required).
 */
class DbWrapper {
    constructor(sqlDb) { this._db = sqlDb; }

    prepare(sql) {
        const self = this;
        return {
            _sql: sql,
            run(...params) {
                self._db.run(sql, params);
                self._save();
                return { changes: self._db.getRowsModified() };
            },
            get(...params) {
                const stmt = self._db.prepare(sql);
                stmt.bind(params);
                let row = null;
                if (stmt.step()) {
                    const cols = stmt.getColumnNames();
                    const vals = stmt.get();
                    row = {};
                    cols.forEach((c, i) => row[c] = vals[i]);
                }
                stmt.free();
                return row;
            },
            all(...params) {
                const rows = [];
                const stmt = self._db.prepare(sql);
                stmt.bind(params);
                while (stmt.step()) {
                    const cols = stmt.getColumnNames();
                    const vals = stmt.get();
                    const row = {};
                    cols.forEach((c, i) => row[c] = vals[i]);
                    rows.push(row);
                }
                stmt.free();
                return rows;
            },
        };
    }

    exec(sql) {
        this._db.exec(sql);
        this._save();
    }

    pragma(str) {
        try { this._db.exec(`PRAGMA ${str}`); } catch (e) { /* ignore */ }
    }

    _save() {
        try {
            const data = this._db.export();
            const buffer = Buffer.from(data);
            fs.writeFileSync(dbPath, buffer);
        } catch (e) { /* skip save errors */ }
    }

    close() {
        this._save();
        this._db.close();
    }
}

// Synchronous init for first call - we block the event loop once on startup
function getDb() {
    if (db) return db;

    // Synchronous initialization using require
    const SqlJsModule = require('sql.js');

    // sql.js returns a promise from initSqlJs, but we need sync access.
    // We'll init lazily on first real use via the async init below.
    // For now, throw if not initialized.
    if (!db) {
        throw new Error('Database not initialized. Call initDb() first.');
    }
    return db;
}

async function initDb() {
    if (db) return db;
    SQL = await initSqlJs();

    let sqlDb;
    if (fs.existsSync(dbPath)) {
        const fileBuffer = fs.readFileSync(dbPath);
        sqlDb = new SQL.Database(fileBuffer);
    } else {
        sqlDb = new SQL.Database();
    }

    db = new DbWrapper(sqlDb);

    // Run schema
    const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        db.exec(schema);
    }

    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    return db;
}

// Sync getter (after init)
function getDbSync() {
    if (!db) throw new Error('Database not initialized. Call initDb() first.');
    return db;
}

module.exports = { initDb, getDb: getDbSync };
