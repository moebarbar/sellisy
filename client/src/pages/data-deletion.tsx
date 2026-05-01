import { Link } from "wouter";

export default function DataDeletion() {
  return (
    <div className="min-h-screen bg-[#050505] text-white py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-8 inline-block">
          &larr; Back to Sellisy
        </Link>

        <h1 className="text-4xl mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 2 }}>
          USER DATA DELETION
        </h1>
        <p className="text-sm text-muted-foreground mb-10">How to delete your Sellisy account and personal data.</p>

        <div className="space-y-8 text-[15px] leading-relaxed text-white/80">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Your right to be forgotten</h2>
            <p>
              You can delete your Sellisy account and all associated personal data at any time. This page describes
              how to do that and what happens after.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Option 1 — Delete from your dashboard</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Sign in at <Link href="/auth" className="text-primary hover:underline">sellisy.com/auth</Link></li>
              <li>Go to <strong>Dashboard &rarr; Settings &rarr; Account</strong></li>
              <li>Scroll to <strong>Danger Zone</strong> and click <strong>Delete Account</strong></li>
              <li>Confirm by typing your email — your account is queued for deletion immediately</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Option 2 — Email us</h2>
            <p className="mb-2">
              If you can't access your account or signed up via a third-party login (Google, Facebook, Apple) and want
              your data removed, email:
            </p>
            <p className="text-lg">
              <a href="mailto:privacy@sellisy.com" className="text-primary hover:underline">privacy@sellisy.com</a>
            </p>
            <p className="mt-3">
              Send the email from the address associated with your account, with the subject{" "}
              <strong>"Delete my data"</strong>. We'll confirm receipt within 48 hours and complete deletion within
              30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">What gets deleted</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your user account and authentication credentials</li>
              <li>Your profile data (name, email, profile image)</li>
              <li>Your stores, products, and uploaded files</li>
              <li>Your customer lists, marketing campaign data, and analytics</li>
              <li>Personal data on third-party services we use for your account (Clerk, SendGrid, Cloudflare R2)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">What we keep (and why)</h2>
            <p className="mb-2">A small amount of data is retained to comply with law:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Order records</strong> — buyer email, total, and date are kept for 7 years to meet tax and
                accounting obligations. Identifying fields beyond that are anonymized.
              </li>
              <li>
                <strong>Fraud prevention</strong> — minimal information needed to enforce previous bans (hashed email,
                IP) is kept for up to 2 years.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">If you bought from a Sellisy store</h2>
            <p>
              If you're a buyer (not a store owner) and want your data removed from a specific store, contact that
              store directly — store owners control their own customer data. If the store is unresponsive after 30
              days, email <a href="mailto:privacy@sellisy.com" className="text-primary hover:underline">privacy@sellisy.com</a>{" "}
              and we'll step in.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Questions</h2>
            <p>
              <a href="mailto:privacy@sellisy.com" className="text-primary hover:underline">privacy@sellisy.com</a> —
              we typically respond within 1-2 business days.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
