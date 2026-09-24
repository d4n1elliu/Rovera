import { DemoNotice } from "@/frontend/components/layout/demo-notice";
import { pageMetadata } from "@/frontend/config/seo";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "Privacy policy for the Rovera demo, a portfolio project. Bookings are simulated; only the account and demo booking details you enter are stored.",
  path: "/privacy",
});

const sections = [
  {
    heading: "1. What we collect",
    body: "When you make a booking we collect your name, email address, phone number, driver's licence details, and payment information. We also collect basic usage data such as pages visited and search queries to improve our service.",
  },
  {
    heading: "2. How we use your information",
    body: "We use your information to process bookings, verify your identity and driving eligibility, provide customer support, send booking confirmations and reminders, and comply with our legal obligations.",
  },
  {
    heading: "3. Payment security",
    body: "Payments are processed by PCI-DSS compliant payment providers. Rovera does not store your full card number on our servers.",
  },
  {
    heading: "4. Sharing your information",
    body: "We do not sell your personal information. We share it only with service providers who help us operate (such as payment processors and insurers), or where required by law, such as with police or toll authorities in relation to infringements.",
  },
  {
    heading: "5. Cookies and analytics",
    body: "We use cookies to keep you signed in, remember your preferences, and understand how the site is used. You can disable cookies in your browser, though some features may not work as intended.",
  },
  {
    heading: "6. Data retention",
    body: "We keep booking records for seven years to meet tax and legal requirements. Other personal information is retained only as long as needed for the purposes described in this policy.",
  },
  {
    heading: "7. Your rights",
    body: "You may request access to, correction of, or deletion of your personal information at any time. We will respond within 30 days. Australian users have rights under the Privacy Act 1988 (Cth) and the Australian Privacy Principles.",
  },
  {
    heading: "8. Changes to this policy",
    body: "We may update this Privacy Policy from time to time. Material changes will be notified on this page with an updated revision date.",
  },
  {
    heading: "9. Contact us",
    body: "This demo has no support team. For questions about the data it stores, open an issue on the GitHub repository linked in the footer.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <DemoNotice />
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
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
