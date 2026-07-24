import type { Metadata } from "next";

export const metadata: Metadata = { title: "Help & FAQ" };

const faqs = [
  {
    question: "What do I need to rent a car?",
    answer: "A valid driver's license, a credit card in your name, and you must be at least 21.",
  },
  {
    question: "Can I cancel my reservation?",
    answer: "Yes, cancellations are free up to 24 hours before your pickup time.",
  },
  {
    question: "Is insurance included?",
    answer: "Basic coverage is included in every rental. Premium coverage is available at checkout.",
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
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
