import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — e-Return" },
      { name: "description", content: "Terms of Service for the e-Return platform: rules, responsibilities, and user obligations." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: 24 May 2026</p>

      <section className="prose prose-sm mt-8 max-w-none text-foreground space-y-6">
        <div>
          <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            By creating an account or using the e-Return platform ("Service"), you agree to be bound by these
            Terms of Service. If you do not agree, you may not use the Service.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">2. The Service</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            e-Return connects citizens with certified collectors of Waste Electrical and Electronic Equipment
            (WEEE/DEEE) in Romania. The platform facilitates pickup requests, offers, and voucher rewards. We
            are an intermediary; the actual collection service is provided by independent certified partners.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">3. User Accounts</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You must provide accurate information when registering and keep your credentials confidential.
            You are responsible for all activity under your account. You must be at least 16 years old.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">4. User Obligations</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>Provide accurate descriptions of the equipment offered for collection.</li>
            <li>Do not include hazardous, non-WEEE, or illegal items in pickups.</li>
            <li>Do not abuse, harass, or defraud collectors or other users.</li>
            <li>Comply with all applicable Romanian and EU laws.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold">5. Vouchers and Rewards</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Vouchers are issued at the discretion of partner retailers and are subject to their individual
            terms, expiry dates, and conditions. Vouchers have no cash value and are non-transferable unless
            explicitly stated.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">6. Collectors</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Collectors are independent third parties authorized under Romanian WEEE regulations. e-Return does
            not directly perform collection and is not liable for actions, omissions, or service quality of
            collectors, although we vet and monitor partners.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">7. Limitation of Liability</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The Service is provided "as is". To the maximum extent permitted by law, e-Return is not liable
            for indirect, incidental, or consequential damages arising from your use of the Service.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">8. Termination</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We may suspend or terminate accounts that violate these Terms. You may delete your account at any
            time from the Account page.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">9. Changes</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We may update these Terms. Material changes will be notified by email or in-app. Continued use
            after changes constitutes acceptance.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">10. Governing Law</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            These Terms are governed by Romanian law. Disputes will be resolved by the competent courts of
            Romania.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">11. Contact</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            For questions about these Terms, contact us at <a href="mailto:legal@e-return.app" className="text-primary hover:underline">legal@e-return.app</a>.
          </p>
        </div>
      </section>
    </main>
  );
}
