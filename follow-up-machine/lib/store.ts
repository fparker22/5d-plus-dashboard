import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { buildSeed } from "./seed";
import type { TableMap, TableName } from "./types";

// One small data interface with two backends:
//  - memory: seeded demo data, no setup, resets when the server restarts
//  - supabase: hosted Postgres (see supabase/schema.sql)
// The backend is chosen by whether SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.

export interface Store {
  list<T extends TableName>(table: T, where?: Partial<TableMap[T]>): Promise<TableMap[T][]>;
  get<T extends TableName>(table: T, id: string): Promise<TableMap[T] | null>;
  insert<T extends TableName>(table: T, row: TableMap[T]): Promise<TableMap[T]>;
  update<T extends TableName>(table: T, id: string, patch: Partial<TableMap[T]>): Promise<TableMap[T] | null>;
  remove<T extends TableName>(table: T, id: string): Promise<void>;
}

export function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

type Db = { [K in TableName]: TableMap[K][] };

// ── Memory backend ───────────────────────────────────────────────────────────

const globalForDb = globalThis as unknown as { __fumDb?: Db };

function memoryDb(): Db {
  if (!globalForDb.__fumDb) globalForDb.__fumDb = buildSeed();
  return globalForDb.__fumDb;
}

function matches<R extends object>(row: R, where?: Partial<R>): boolean {
  if (!where) return true;
  return (Object.keys(where) as (keyof R)[]).every((k) => row[k] === where[k]);
}

const memoryStore: Store = {
  async list(table, where) {
    return memoryDb()[table].filter((r) => matches(r, where)) as never;
  },
  async get(table, id) {
    return (memoryDb()[table].find((r) => r.id === id) ?? null) as never;
  },
  async insert(table, row) {
    (memoryDb()[table] as unknown[]).push(row);
    return row;
  },
  async update(table, id, patch) {
    const row = memoryDb()[table].find((r) => r.id === id);
    if (!row) return null;
    Object.assign(row, patch);
    return row as never;
  },
  async remove(table, id) {
    const rows = memoryDb()[table] as { id: string }[];
    const i = rows.findIndex((r) => r.id === id);
    if (i >= 0) rows.splice(i, 1);
  },
};

// ── Supabase backend ─────────────────────────────────────────────────────────
// Columns are snake_case versions of the TypeScript fields; nested values
// (settings, steps, tags, meta) are jsonb columns.

const toSnake = (k: string) => k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
const toCamel = (k: string) => k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

function mapKeys(obj: Record<string, unknown>, fn: (k: string) => string): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [fn(k), v]));
}

function supabaseStore(client: SupabaseClient): Store {
  const fail = (table: string, message: string): never => {
    throw new Error(`Database error on ${table}: ${message}`);
  };
  return {
    async list(table, where) {
      let query = client.from(table).select("*");
      for (const [k, v] of Object.entries(where ?? {})) query = query.eq(toSnake(k), v as never);
      const { data, error } = await query.limit(5000);
      if (error) fail(table, error.message);
      return (data ?? []).map((r) => mapKeys(r, toCamel)) as never;
    },
    async get(table, id) {
      const { data, error } = await client.from(table).select("*").eq("id", id).maybeSingle();
      if (error) fail(table, error.message);
      return (data ? mapKeys(data, toCamel) : null) as never;
    },
    async insert(table, row) {
      const { error } = await client.from(table).insert(mapKeys(row as never, toSnake));
      if (error) fail(table, error.message);
      return row;
    },
    async update(table, id, patch) {
      const { data, error } = await client
        .from(table)
        .update(mapKeys(patch as never, toSnake))
        .eq("id", id)
        .select("*")
        .maybeSingle();
      if (error) fail(table, error.message);
      return (data ? mapKeys(data, toCamel) : null) as never;
    },
    async remove(table, id) {
      const { error } = await client.from(table).delete().eq("id", id);
      if (error) fail(table, error.message);
    },
  };
}

let cached: Store | null = null;

export function isDemoData(): boolean {
  return !(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function db(): Store {
  if (cached) return cached;
  if (isDemoData()) {
    cached = memoryStore;
  } else {
    cached = supabaseStore(
      createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
        auth: { persistSession: false },
      }),
    );
  }
  return cached;
}
