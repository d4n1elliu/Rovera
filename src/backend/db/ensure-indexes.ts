import { getClient, getDb } from "@/backend/db/client";
import { INDEXES } from "@/backend/db/indexes";
import { COLLECTIONS, VALIDATORS } from "@/backend/db/schema";

/* ---------------------------------------------------------------------
 * Applies the schema to the database: creates each collection, attaches its
 * $jsonSchema validator, and builds its indexes.
 *
 * This is the closest thing the project has to a migration step, and it is
 * safe to re-run — createCollection is skipped when the collection exists,
 * collMod overwrites the validator in place, and createIndexes is a no-op
 * for indexes that already match.
 *
 * Run with: npm run db:indexes
 * ------------------------------------------------------------------- */

export async function ensureSchema() {
  const db = await getDb();
  const existing = new Set(
    (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name)
  );

  for (const name of Object.values(COLLECTIONS)) {
    const validator = VALIDATORS[name];

    if (existing.has(name)) {
      // `moderate` leaves documents written before the validator existed
      // readable and updatable; only inserts and updates to valid documents
      // are checked. Tighten to "strict" once the data is known to conform.
      await db.command({ collMod: name, validator, validationLevel: "moderate" });
    } else {
      await db.createCollection(name, { validator, validationLevel: "moderate" });
    }

    const indexes = INDEXES[name] ?? [];
    if (indexes.length > 0) {
      await db.collection(name).createIndexes(indexes);
    }

    console.log(
      `${existing.has(name) ? "updated" : "created"} ${name} ` +
        `(${indexes.length} index${indexes.length === 1 ? "" : "es"})`
    );
  }
}

// Only run when invoked directly, so importing this module from a test or a
// migration does not touch the database as a side effect.
if (process.argv[1] && process.argv[1].includes("ensure-indexes")) {
  ensureSchema()
    .then(() => console.log("Schema applied."))
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      const client = await getClient();
      await client.close();
    });
}
