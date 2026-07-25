import { CLOSING_HOUR, OPENING_HOUR, TIME_SLOT_MINUTES } from "@/shared/constants";

export interface TimeSlot {
  /** 24-hour "HH:mm", used as the form value and URL parameter. */
  value: string;
  /** Localised label shown to the renter, e.g. "10:00 am". */
  label: string;
}

/** Format a Date as the "YYYY-MM-DD" value an <input type="date"> expects. */
export function toDateInput(date: Date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
}

/** Add whole days to a date input value, returning a new "YYYY-MM-DD" string. */
export function addDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T00:00`);
  date.setDate(date.getDate() + days);
  return toDateInput(date);
}

function formatTimeLabel(hour: number, minute: number) {
  // Built from local date parts and formatted in the same locale-independent
  // way on server and client, so the rendered label never differs on hydration.
  const date = new Date(2000, 0, 1, hour, minute);
  return new Intl.DateTimeFormat("en-AU", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/** Selectable pickup/return times across a branch's opening hours. */
export function generateTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let hour = OPENING_HOUR; hour <= CLOSING_HOUR; hour++) {
    for (let minute = 0; minute < 60; minute += TIME_SLOT_MINUTES) {
      if (hour === CLOSING_HOUR && minute > 0) break;
      const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      slots.push({ value, label: formatTimeLabel(hour, minute) });
    }
  }
  return slots;
}

export const TIME_SLOTS = generateTimeSlots();

/** Combine a "YYYY-MM-DD" date value and an "HH:mm" time value into a Date. */
export function combineDateTime(dateValue: string, timeValue: string) {
  return new Date(`${dateValue}T${timeValue}`);
}

/** Whole hours between two instants, rounded up. */
export function hoursBetween(start: Date, end: Date) {
  const ms = end.getTime() - start.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60)));
}

/** The first bookable slot strictly after the given time, or null if the
 *  branch closes first. */
export function nextSlotAfter(timeValue: string) {
  return TIME_SLOTS.find((slot) => slot.value > timeValue)?.value ?? null;
}
