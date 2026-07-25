// Placeholder ratings until reviews exist in the database: derived
// deterministically from the car id so they are stable across renders.

/** Lowest rating a car can display; steps of 0.1 up to BASE + (STEPS - 1) / 10. */
const BASE_RATING = 4.5;
const RATING_STEPS = 5;

/** Trip counts range from MIN_TRIPS to MIN_TRIPS + TRIP_SPREAD - 1. */
const MIN_TRIPS = 4;
const TRIP_SPREAD = 14;

export function carRating(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return {
    rating: BASE_RATING + (hash % RATING_STEPS) / 10,
    reviews: MIN_TRIPS + (hash % TRIP_SPREAD),
  };
}
