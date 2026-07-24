import { z } from "zod";
import { BODY_TYPES, FUEL_TYPES } from "@/shared/constants";

export const carFiltersSchema = z.object({
  bodyType: z.enum(BODY_TYPES).optional(),
  fuelType: z.enum(FUEL_TYPES).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  query: z.string().trim().max(100).optional(),
});

export type CarFiltersInput = z.infer<typeof carFiltersSchema>;
