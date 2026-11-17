import { DatabaseSync } from 'node:sqlite'; // built into Node 22.13+, no native package to install
import fs from 'node:fs';
import path from 'node:path';

export const DATA_DIR = path.resolve(process.env.DATA_DIR || './data');
export const PRODUCT_DIR = path.join(DATA_DIR, 'uploads', 'products'); // public media
export const ARTWORK_DIR = path.join(DATA_DIR, 'uploads', 'artwork');  // private: admin only
fs.mkdirSync(PRODUCT_DIR, { recursive: true });
fs.mkdirSync(ARTWORK_DIR, { recursive: true });

export const db = new DatabaseSync(path.join(DATA_DIR, 'gold.db'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

db.exec(`
create table if not exists settings(key text primary key, value text not null);
create table if not exists rates(
  id integer primary key check(id = 1),
  rate22 real not null default 0, rate24 real not null default 0,
  making real not null default 10, personalization real not null default 500,
  tax real not null default 3, shipping real not null default 0, updated_at text);
insert or ignore into rates(id) values(1);
create table if not exists products(
  id integer primary key autoincrement,
  slug text unique not null, name text not null, type text not null,
  description text not null default '',
  purities text not null default '["22K"]',
  weight_g real not null, max_chars integer not null default 12,
  status text not null default 'pending' check(status in ('pending','fulfilled','unfulfilled')),
  is_new integer not null default 0,
  engrave text not null,
  images text not null default '[]',
  video text,
  created_at text not null default (datetime('now')),
  updated_at text not null default (datetime('now')));
create table if not exists orders(
  id text primary key, product_id integer, product_name text not null,
  purity text not null, engraving_text text, font text, artwork_file text,
  weight_g real not null, rate_used real not null, pricing text not null,
  customer text not null,
  payment_status text not null default 'unpaid', payment_ref text,
  status text not null default 'Pending',
  created_at text not null default (datetime('now')));
create index if not exists idx_orders_created on orders(created_at);
`);
