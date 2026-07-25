export const BODY_TYPES = [
  "sedan",
  "suv",
  "hatchback",
  "coupe",
  "convertible",
  "van",
  "pickup",
  "wagon",
] as const;
export const FUEL_TYPES = ["petrol", "diesel", "hybrid", "electric"] as const;
export const TRANSMISSIONS = ["automatic", "manual"] as const;

export type BodyType = (typeof BODY_TYPES)[number];
export type FuelType = (typeof FUEL_TYPES)[number];
export type Transmission = (typeof TRANSMISSIONS)[number];

/** Branches available for pickup and drop-off. */
export const LOCATIONS = ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"] as const;

export type Location = (typeof LOCATIONS)[number];

export const MAX_RENTAL_DAYS = 30;
export const MIN_DRIVER_AGE = 21;

/** Rental length preselected in the booking search widget. */
export const DEFAULT_RENTAL_DAYS = 3;
