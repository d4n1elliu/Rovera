import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/backend/db/client";
import { locations, type LocationRow } from "@/backend/db/schema";

export const locationRepository = {
  /** An active branch by its display name ("Sydney") — the value the search
   *  widget and forms trade in. */
  async findActiveByName(name: string): Promise<LocationRow | null> {
    const [row] = await getDb()
      .select()
      .from(locations)
      .where(and(eq(locations.name, name), eq(locations.active, true)))
      .limit(1);
    return row ?? null;
  },
};
