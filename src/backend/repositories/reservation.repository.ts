import "server-only";
import { ObjectId } from "mongodb";
import {
  carsCollection,
  reservationsCollection,
  usersCollection,
} from "@/backend/db/collections";
import type { CarDoc, ReservationDoc } from "@/backend/db/schema";
import { generateBookingReference } from "@/backend/lib/reference";
import {
  BLOCKING_RESERVATION_STATUSES,
  DEFAULT_CURRENCY,
} from "@/shared/constants";

interface CreateReservationData {
  carId: ObjectId;
  user: { firstName: string; lastName: string; email: string; phone: string };
  pickupLocationId: ObjectId;
  dropoffLocationId: ObjectId;
  pickupAt: Date;
  returnAt: Date;
  driverAge: number;
  /** The priced quote, stored in full so a charge can be explained later
   *  without re-running pricing against today's rates. */
  days: number;
  baseTotal: number;
  youngDriverFee: number;
  discount: number;
  totalPrice: number;
  promoCodeId?: ObjectId | null;
}

/** The overlap predicate, in one place: two windows overlap when each starts
 *  before the other ends. Only statuses that still hold a car count. */
function overlapping(pickupAt: Date, returnAt: Date) {
  return {
    status: { $in: [...BLOCKING_RESERVATION_STATUSES] },
    pickupAt: { $lt: returnAt },
    returnAt: { $gt: pickupAt },
  };
}

export const reservationRepository = {
  async create(data: CreateReservationData): Promise<ReservationDoc> {
    const [users, reservations] = await Promise.all([
      usersCollection(),
      reservationsCollection(),
    ]);

    const now = new Date();

    // Booking without an account is still allowed, so the renter is upserted
    // by email. Signing up later fills the same record in rather than
    // creating a second one.
    const user = await users.findOneAndUpdate(
      { email: data.user.email },
      {
        $set: { phone: data.user.phone, updatedAt: now },
        $setOnInsert: {
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          email: data.user.email,
          passwordHash: null,
          emailVerified: null,
          image: null,
          role: "customer" as const,
          createdAt: now,
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    if (!user) throw new Error("Could not resolve the renter's account");

    const reservation: ReservationDoc = {
      _id: new ObjectId(),
      reference: generateBookingReference(),
      carId: data.carId,
      userId: user._id,
      pickupLocationId: data.pickupLocationId,
      dropoffLocationId: data.dropoffLocationId,
      pickupAt: data.pickupAt,
      returnAt: data.returnAt,
      driverAge: data.driverAge,
      days: data.days,
      baseTotal: data.baseTotal,
      youngDriverFee: data.youngDriverFee,
      discount: data.discount,
      totalPrice: data.totalPrice,
      currency: DEFAULT_CURRENCY,
      promoCodeId: data.promoCodeId ?? null,
      status: "pending",
      cancelledAt: null,
      createdAt: now,
      updatedAt: now,
    };

    await reservations.insertOne(reservation);
    return reservation;
  },

  /** A renter's bookings, newest first, each with its car joined in. */
  async findByUserEmail(email: string) {
    const [users, reservations, cars] = await Promise.all([
      usersCollection(),
      reservationsCollection(),
      carsCollection(),
    ]);

    const user = await users.findOne({ email });
    if (!user) return [];

    const bookings = await reservations
      .find({ userId: user._id })
      .sort({ createdAt: -1 })
      .toArray();

    if (bookings.length === 0) return [];

    // One extra query for every car referenced, rather than one per booking.
    const carDocs = await cars
      .find({ _id: { $in: bookings.map((booking) => booking.carId) } })
      .toArray();

    const carById = new Map<string, CarDoc>(
      carDocs.map((car) => [car._id.toHexString(), car])
    );

    return bookings.flatMap((booking) => {
      const car = carById.get(booking.carId.toHexString());
      // A booking whose car has since been deleted is not renderable.
      return car ? [{ reservation: booking, car }] : [];
    });
  },

  async hasOverlap(carId: ObjectId, pickupAt: Date, returnAt: Date) {
    const reservations = await reservationsCollection();
    const count = await reservations.countDocuments(
      { carId, ...overlapping(pickupAt, returnAt) },
      // Existence is all that matters, so stop at the first match.
      { limit: 1 }
    );
    return count > 0;
  },

  /** Ids of every car held by a live reservation overlapping the window.
   *  One query for the whole fleet, so a search does not cost a round trip
   *  per car the way hasOverlap would. */
  async findBookedCarIds(pickupAt: Date, returnAt: Date) {
    const reservations = await reservationsCollection();

    const held = await reservations
      .find(overlapping(pickupAt, returnAt))
      .project<{ carId: ObjectId }>({ carId: 1 })
      .toArray();

    return new Set(held.map((reservation) => reservation.carId.toHexString()));
  },
};
