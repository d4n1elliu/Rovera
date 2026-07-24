import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Use" };

const sections = [
  {
    heading: "1. Acceptance of terms",
    body: "By accessing or using the Rovera website and booking services, you agree to be bound by these Terms of Use. If you do not agree with any part of these terms, please do not use our services.",
  },
  {
    heading: "2. Eligibility and driver requirements",
    body: "To rent a vehicle you must be at least 21 years of age, hold a valid driver's licence, and provide a credit card in your own name at the time of booking. International renters must hold a licence in English or an accredited translation.",
  },
  {
    heading: "3. Bookings and payment",
    body: "A booking is confirmed once payment is authorised and you receive a confirmation email. Prices are shown in Australian dollars (AUD) and include basic insurance coverage. Optional extras, tolls, and fuel are charged separately.",
  },
  {
    heading: "4. Cancellations and changes",
    body: "You may cancel or change a booking free of charge up to 24 hours before the scheduled pickup time. Cancellations made within 24 hours of pickup may incur a fee of up to one day's rental charge.",
  },
  {
    heading: "5. Vehicle use",
    body: "Vehicles must only be driven by the named renter and approved additional drivers, on sealed roads, and within the state or territory of pickup unless otherwise agreed. Smoking, off-road driving, and use for ride-share or delivery services are not permitted.",
  },
  {
    heading: "6. Insurance and liability",
    body: "Every rental includes basic damage cover subject to an excess. You are responsible for the excess amount in the event of damage or theft unless you purchase excess reduction at checkout. Damage arising from a breach of these terms is not covered.",
  },
  {
    heading: "7. Fuel and returns",
    body: "Vehicles are supplied with a full tank and must be returned full, or a refuelling fee applies. Late returns beyond a 29-minute grace period are charged in full-day increments.",
  },
  {
    heading: "8. Limitation of liability",
    body: "To the maximum extent permitted by law, Rovera is not liable for indirect or consequential loss arising from your use of our services. Nothing in these terms excludes rights that cannot be excluded under the Australian Consumer Law.",
  },
  {
    heading: "9. Changes to these terms",
    body: "We may update these Terms of Use from time to time. The version published on this page at the time of your booking applies to that booking.",
  },
  {
    heading: "10. Contact",
    body: "Questions about these terms? Visit our Help Centre or contact our support team, available 24/7.",
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Terms of Use</h1>
        <p className="text-sm text-gray-500">Last updated: 25 July 2026</p>
      </div>

      <div className="space-y-6">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-semibold">{section.heading}</h2>
            <p className="mt-1 text-gray-600">{section.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
