import { z } from "zod";
import { MAX_DRIVER_AGE, MIN_DRIVER_AGE } from "@/shared/constants";

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
    pickupDate: z.coerce.date(),
    returnDate: z.coerce.date(),
  })
  .refine((data) => data.returnDate > data.pickupDate, {
    message: "Return date must be after pickup date",
    path: ["returnDate"],
  });

export type ReservationInput = z.infer<typeof reservationSchema>;
