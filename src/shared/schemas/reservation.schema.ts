import { z } from "zod";
import { LOCATIONS, MAX_DRIVER_AGE, MIN_DRIVER_AGE } from "@/shared/constants";
import { startOfDay } from "@/shared/lib/datetime";
import { validateRentalWindow } from "@/shared/lib/rental-rules";

export const reservationSchema = z
  .object({
    carId: z.string().min(1, "Car is required"),
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    email: z.string().email("Enter a valid email"),
    phone: z.string().trim().min(7, "Enter a valid phone number"),
    driverAge: z.coerce
      .number()
      .int("Enter the driver's age in whole years")
      .min(MIN_DRIVER_AGE, `Drivers must be at least ${MIN_DRIVER_AGE}`)
      .max(MAX_DRIVER_AGE, "Enter a valid driver age"),
    promoCode: z.string().trim().max(32).optional(),
    // Optional so older links still book; the server falls back to the car's branch.
    pickupLocation: z.enum(LOCATIONS).optional(),
    dropoffLocation: z.enum(LOCATIONS).optional(),
    pickupDate: z.coerce.date(),
    returnDate: z.coerce.date(),
  })
  .superRefine((data, ctx) => {
    // This form collects dates without times, so a booking made later today
    // is still valid: compare against the start of today, not the instant.
    const error = validateRentalWindow(
      data.pickupDate,
      data.returnDate,
      startOfDay(new Date())
    );
    if (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: error.message,
        path: [error.code === "past" ? "pickupDate" : "returnDate"],
      });
    }
  });

export type ReservationInput = z.infer<typeof reservationSchema>;
