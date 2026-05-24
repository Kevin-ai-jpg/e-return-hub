import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/gdpr")({
  head: () => ({
    meta: [
      { title: "GDPR & Privacy Policy — e-Return" },
      { name: "description", content: "How e-Return processes personal data under GDPR: lawful basis, your rights, retention, and contact." },
    ],
  }),
  component: GdprPage,
});

function GdprPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-foreground">Privacy Policy & GDPR</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: 24 May 2026</p>

      <section className="mt-8 max-w-none text-foreground space-y-6">
        <div>
          <h2 className="text-xl font-semibold">1. Data Controller</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            e-Return SRL, Romania, is the data controller for personal data processed via the platform.
            Contact: <a href="mailto:dpo@e-return.app" className="text-primary hover:underline">dpo@e-return.app</a>.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">2. Data We Process</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>Account data: name, email, password hash, county.</li>
            <li>Pickup data: address, device descriptions, photos, timestamps.</li>
            <li>Voucher data: issued codes, value, redemption status.</li>
            <li>Technical data: IP, browser, device, and usage logs.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold">3. Lawful Basis (Art. 6 GDPR)</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li><strong>Contract</strong> — to provide the Service you requested.</li>
            <li><strong>Legal obligation</strong> — WEEE traceability under Romanian and EU law.</li>
            <li><strong>Legitimate interest</strong> — fraud prevention, security, analytics.</li>
            <li><strong>Consent</strong> — marketing communications (opt-in only).</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold">4. Data Sharing</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We share necessary data with: (a) the collector handling your pickup, (b) retailers issuing
            vouchers (only what is needed for redemption), (c) infrastructure providers (Supabase, hosting)
            under data processing agreements. We do not sell personal data.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">5. Retention</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Account data: until account deletion + 30 days. WEEE traceability records: 5 years per Romanian
            law. Logs: 12 months. Backups: rolled over within 90 days.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">6. Your Rights (Art. 15–22 GDPR)</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>Access, rectification, and erasure of your data.</li>
            <li>Restriction and objection to processing.</li>
            <li>Data portability (machine-readable export).</li>
            <li>Withdraw consent at any time.</li>
            <li>Lodge a complaint with ANSPDCP (the Romanian DPA).</li>
          </ul>
          <p className="mt-2 text-sm text-muted-foreground">
            Exercise your rights by emailing <a href="mailto:dpo@e-return.app" className="text-primary hover:underline">dpo@e-return.app</a>.
            We respond within 30 days.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">7. International Transfers</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Data is primarily stored in the EU. Where transfers outside the EEA occur (e.g. some
            infrastructure providers), they are covered by Standard Contractual Clauses.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">8. Cookies</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We use strictly necessary cookies for authentication and session management. Analytics cookies
            are loaded only with consent.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">9. Security</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We use encryption in transit (TLS), encryption at rest, Row-Level Security on the database, and
            regular access reviews.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">10. Contact</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Data Protection Officer: <a href="mailto:dpo@e-return.app" className="text-primary hover:underline">dpo@e-return.app</a>.
          </p>
        </div>
      </section>
    </main>
  );
}
