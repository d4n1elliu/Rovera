// Placeholder ratings until reviews exist in the database: derived
// deterministically from the car id so they are stable across renders.
export function carRating(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return {
    rating: 4.5 + (hash % 5) / 10,
    reviews: 4 + (hash % 14),
  };
}
