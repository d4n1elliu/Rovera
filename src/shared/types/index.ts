import type { BodyType, FuelType, Transmission } from "@/shared/constants";

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  bodyType: BodyType;
  fuelType: FuelType;
  transmission: Transmission;
  seats: number;
  pricePerDay: number;
  imageUrl: string;
  available: boolean;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface Reservation {
  id: string;
  carId: string;
  customerId: string;
  pickupDate: string; // ISO date
  returnDate: string; // ISO date
  totalPrice: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
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
