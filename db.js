import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const DB_FILE = process.env.DATABASE_FILE || './data/bot.db';

// Ensure folder exists
const dir = path.dirname(DB_FILE);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(DB_FILE);

// Initialize tables
db.exec(`
CREATE TABLE IF NOT EXISTS guilds (
  guild_id TEXT PRIMARY KEY,
  vultr_api_key TEXT
);

CREATE TABLE IF NOT EXISTS instances (
  instance_id TEXT PRIMARY KEY,
  guild_id TEXT,
  label TEXT,
  status TEXT,
  region TEXT,
  plan TEXT,
  created_at INTEGER,
  metadata TEXT
);
`);

export function saveGuildKey(guildId, apiKey) {
  const stmt = db.prepare('INSERT INTO guilds (guild_id, vultr_api_key) VALUES (?, ?) ON CONFLICT(guild_id) DO UPDATE SET vultr_api_key=excluded.vultr_api_key');
  stmt.run(guildId, apiKey);
}

export function getGuildKey(guildId) {
  const row = db.prepare('SELECT vultr_api_key FROM guilds WHERE guild_id = ?').get(guildId);
  return row ? row.vultr_api_key : process.env.GLOBAL_VULTR_API_KEY || null;
}

export function upsertInstance(inst) {
  const stmt = db.prepare(`INSERT INTO instances (instance_id, guild_id, label, status, region, plan, created_at, metadata)
  VALUES (@instance_id, @guild_id, @label, @status, @region, @plan, @created_at, @metadata)
  ON CONFLICT(instance_id) DO UPDATE SET
    guild_id=excluded.guild_id,
    label=excluded.label,
    status=excluded.status,
    region=excluded.region,
    plan=excluded.plan,
    metadata=excluded.metadata`);
  stmt.run(inst);
}

export function getInstancesForGuild(guildId) {
  return db.prepare('SELECT * FROM instances WHERE guild_id = ?').all(guildId);
}

export function getInstance(instanceId) {
  return db.prepare('SELECT * FROM instances WHERE instance_id = ?').get(instanceId);
}

export function updateInstanceStatus(instanceId, status) {
  db.prepare('UPDATE instances SET status = ? WHERE instance_id = ?').run(status, instanceId);
}

export default db;
