import "server-only";
import { db } from "@/backend/db";
import { BLOCKING_RESERVATION_STATUSES } from "@/shared/constants";

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
          status: { in: [...BLOCKING_RESERVATION_STATUSES] },
          pickupDate: { lt: returnDate },
          returnDate: { gt: pickupDate },
        },
      })
      .then((count) => count > 0);
  },

  /** Ids of every car held by a live reservation overlapping the window.
   *  One query for the whole fleet, so a search does not cost a round trip
   *  per car the way hasOverlap would. */
  async findBookedCarIds(pickupDate: Date, returnDate: Date) {
    const held = await db.reservation.findMany({
      where: {
        status: { in: [...BLOCKING_RESERVATION_STATUSES] },
        // Two windows overlap when each starts before the other ends.
        pickupDate: { lt: returnDate },
        returnDate: { gt: pickupDate },
      },
      select: { carId: true },
    });

    return new Set(held.map((reservation) => reservation.carId));
  },
};
