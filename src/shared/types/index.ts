import type {
  BodyType,
  FuelType,
  ReservationStatus,
  Transmission,
  UserRole,
} from "@/shared/constants";

/* ---------------------------------------------------------------------
 * The shapes the frontend sees. Rows are serialised on the way out of the
 * backend (see backend/lib/serialize.ts): Dates become ISO strings and
 * primary keys are already UUID text, so everything here is JSON-safe and
 * can cross a server-component boundary or an API response unchanged.
 * ------------------------------------------------------------------- */

export interface Car {
  id: string;
  slug: string;
  make: string;
  model: string;
  year: number;
  bodyType: BodyType;
  fuelType: FuelType;
  transmission: Transmission;
  seats: number;
  pricePerDay: number;
  imageUrl: string;
  mileage: string | null;
  description: string | null;
  vin: string | null;
  available: boolean;
  locationId: string;
  /** Denormalised review aggregates, recomputed when a review lands. */
  ratingAvg: number;
  reviewCount: number;
  tripCount: number;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: UserRole;
}

export interface Location {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  country: string;
  lat: number | null;
  lng: number | null;
  timezone: string;
  active: boolean;
}

export interface Reservation {
  id: string;
  reference: string;
  carId: string;
  userId: string;
  pickupLocationId: string;
  dropoffLocationId: string;
  /** ISO instants — rentals are scheduled by the hour, not the day. */
  pickupAt: string;
  returnAt: string;
  driverAge: number;
  /* The stored price breakdown, so a total can always be explained. */
  days: number;
  baseTotal: number;
  youngDriverFee: number;
  discount: number;
  totalPrice: number;
  currency: string;
  promoCodeId: string | null;
  status: ReservationStatus;
  cancelledAt: string | null;
  createdAt: string;
}

export interface ReservationWithCar extends Reservation {
  car: Car;
  /** The renter's star rating for this trip, once reviewed. */
  reviewRating: number | null;
}

export interface CarFilters {
  bodyType?: BodyType;
  fuelType?: FuelType;
  minPrice?: number;
  maxPrice?: number;
  query?: string;
}

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };
