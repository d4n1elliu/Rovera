import { DemoNotice } from "@/frontend/components/layout/demo-notice";
import { pageMetadata } from "@/frontend/config/seo";
import { MIN_DRIVER_AGE } from "@/shared/constants";

export const metadata = pageMetadata({
  title: "Help & FAQ",
  description:
    "Help centre for the Rovera demo. This is a portfolio project, not a real service: bookings are simulated and no vehicles are provided.",
  path: "/help",
});

const faqs = [
  {
    question: "What do I need to rent a car?",
    answer: `In the scenario this demo models: a valid driver's licence, a credit card in your name, and being at least ${MIN_DRIVER_AGE}. To try the demo itself you only need an email address.`,
  },
  {
    question: "Can I cancel my reservation?",
    answer: "Yes. The demo models free cancellation up to 24 hours before pickup, and simulated bookings can be cancelled from My Rentals.",
  },
  {
    question: "Is insurance included?",
    answer: "Only in the scenario: the demo prices include modelled basic coverage. No real insurance is provided because no real vehicles are.",
  },
  {
    question: "Is anything real?",
    answer: "The code is. Payments run in Stripe test mode with card 4242 4242 4242 4242, bookings are stored in a real database, and nothing is charged or delivered.",
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-10">
      <DemoNotice />
      <h1 className="text-3xl font-bold">Help & FAQ</h1>
      <dl className="space-y-6">
        {faqs.map((faq) => (
          <div key={faq.question} className="rounded-lg border bg-white p-5">
            <dt className="font-semibold">{faq.question}</dt>
            <dd className="mt-2 text-gray-600">{faq.answer}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
