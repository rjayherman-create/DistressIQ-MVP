import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

let _pool: InstanceType<typeof Pool> | undefined;
let _db: NodePgDatabase<typeof schema> | undefined;

function getPool(): InstanceType<typeof Pool> {
  if (!_pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?",
      );
    }
    _pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return _pool;
}

function getDb(): NodePgDatabase<typeof schema> {
  if (!_db) {
    _db = drizzle(getPool(), { schema });
  }
  return _db;
}

export const pool: InstanceType<typeof Pool> = new Proxy(
  {} as InstanceType<typeof Pool>,
  {
    get(_, prop) {
      const target = getPool();
      return Reflect.get(target, prop, target);
    },
  },
);

export const db: NodePgDatabase<typeof schema> = new Proxy(
  {} as NodePgDatabase<typeof schema>,
  {
    get(_, prop) {
      const target = getDb();
      return Reflect.get(target, prop, target);
    },
  },
);

export * from "./schema";
