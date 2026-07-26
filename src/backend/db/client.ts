import { MongoClient, type Db } from "mongodb";

/* ---------------------------------------------------------------------
 * MongoClient singleton.
 *
 * The client owns a connection pool, so exactly one should exist per
 * process. Next.js' dev server re-evaluates modules on every hot reload,
 * which would otherwise open a new pool each time until the database
 * refuses connections — hence the global cache, which survives reloads.
 *
 * Connecting is deferred until the first query. Importing this module must
 * stay free of side effects: `next build` loads every route module to
 * analyse it, and connecting (or throwing on a missing DATABASE_URL) at
 * import time would make the build depend on a reachable database.
 * ------------------------------------------------------------------- */

const globalForMongo = globalThis as unknown as {
  mongoClientPromise?: Promise<MongoClient>;
};

function connect() {
  const uri = process.env.DATABASE_URL;

  if (!uri) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local (preferred) or .env."
    );
  }

  return new MongoClient(uri, {
    // Fail fast in development rather than hanging a request for 30s when
    // mongod is not running.
    serverSelectionTimeoutMS: 5_000,
  }).connect();
}

let clientPromise =
  process.env.NODE_ENV === "production" ? undefined : globalForMongo.mongoClientPromise;

export function getClient(): Promise<MongoClient> {
  if (!clientPromise) {
    clientPromise = connect().catch((error) => {
      // Don't cache a failed connection: the next request should be able to
      // retry once the database comes back.
      clientPromise = undefined;
      if (process.env.NODE_ENV !== "production") {
        globalForMongo.mongoClientPromise = undefined;
      }
      throw error;
    });

    if (process.env.NODE_ENV !== "production") {
      globalForMongo.mongoClientPromise = clientPromise;
    }
  }

  return clientPromise;
}

/** The database named in the connection string. */
export async function getDb(): Promise<Db> {
  const client = await getClient();
  return client.db();
}
