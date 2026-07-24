import { z } from "zod";

export const reservationSchema = z
  .object({
    carId: z.string().min(1, "Car is required"),
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    email: z.string().email("Enter a valid email"),
    phone: z.string().trim().min(7, "Enter a valid phone number"),
    pickupDate: z.coerce.date(),
    returnDate: z.coerce.date(),
  })
  .refine((data) => data.returnDate > data.pickupDate, {
    message: "Return date must be after pickup date",
    path: ["returnDate"],
  });

export type ReservationInput = z.infer<typeof reservationSchema>;
