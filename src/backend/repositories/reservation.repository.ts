import "server-only";
import { db } from "@/backend/db";

interface CreateReservationData {
  carId: string;
  customer: { firstName: string; lastName: string; email: string; phone: string };
  pickupDate: Date;
  returnDate: Date;
  totalPrice: number;
}

export const reservationRepository = {
  async create(data: CreateReservationData) {
    const customer = await db.customer.upsert({
      where: { email: data.customer.email },
      update: { phone: data.customer.phone },
      create: data.customer,
    });

    return db.reservation.create({
      data: {
        carId: data.carId,
        customerId: customer.id,
        pickupDate: data.pickupDate,
        returnDate: data.returnDate,
        totalPrice: data.totalPrice,
      },
      include: { car: true, customer: true },
    });
  },

  findByCustomerEmail(email: string) {
    return db.reservation.findMany({
      where: { customer: { email } },
      include: { car: true },
      orderBy: { createdAt: "desc" },
    });
  },

  hasOverlap(carId: string, pickupDate: Date, returnDate: Date) {
    return db.reservation
      .count({
        where: {
          carId,
          status: { in: ["pending", "confirmed"] },
          pickupDate: { lt: returnDate },
          returnDate: { gt: pickupDate },
        },
      })
      .then((count) => count > 0);
  },
};
