import { Link } from "wouter";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#050505] text-white py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-8 inline-block">
          &larr; Back to Sellisy
        </Link>

        <h1 className="text-4xl mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 2 }}>
          PRIVACY POLICY
        </h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: April 30, 2026</p>

        <div className="space-y-8 text-[15px] leading-relaxed text-white/80">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Who we are</h2>
            <p>
              Sellisy ("we", "us", "our") operates the platform at sellisy.com that lets creators sell digital products
              and lets buyers purchase them. This Privacy Policy explains what data we collect, how we use it, and the
              rights you have over it.
            </p>
            <p className="mt-3">Contact: privacy@sellisy.com</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Data we collect</h2>
            <p className="mb-2">We collect only what we need to run the service:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account data</strong> — email address, name, profile image, password (handled by Clerk, our authentication provider).</li>
              <li><strong>Store data</strong> — store name, branding, product titles, descriptions, prices, and files you upload.</li>
              <li><strong>Order data</strong> — buyer email, purchase amount, payment provider IDs (Stripe / PayPal session IDs), download tokens.</li>
              <li><strong>Usage data</strong> — basic analytics on page views, IP address, browser, device type, referrer.</li>
              <li><strong>Communications</strong> — emails we send you (receipts, magic links, marketing if you opt in).</li>
            </ul>
            <p className="mt-3">
              Payment card details are <strong>never</strong> stored on our servers. They are handled directly by Stripe and PayPal.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. How we use it</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To create and operate your account.</li>
              <li>To process purchases and deliver digital downloads.</li>
              <li>To send transactional emails (order confirmations, password resets, etc).</li>
              <li>To provide analytics so creators can see how their stores are performing.</li>
              <li>To prevent fraud and comply with legal obligations.</li>
              <li>To improve the product (aggregated, non-identifying analysis).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Service providers we share data with</h2>
            <p className="mb-2">We use trusted third parties to operate the platform:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Clerk</strong> — authentication and user management</li>
              <li><strong>Stripe</strong> — payment processing</li>
              <li><strong>PayPal</strong> — payment processing</li>
              <li><strong>Cloudflare R2</strong> — file storage for product downloads</li>
              <li><strong>SendGrid</strong> — transactional email delivery</li>
              <li><strong>Railway / Neon</strong> — application hosting and database</li>
            </ul>
            <p className="mt-3">
              Each provider has its own privacy policy and processes data only as needed to provide its service to us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Your rights</h2>
            <p className="mb-2">You can:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access</strong> the data we hold about you.</li>
              <li><strong>Correct</strong> inaccurate data.</li>
              <li><strong>Delete</strong> your account and associated data — see <Link href="/data-deletion" className="text-primary hover:underline">data deletion</Link>.</li>
              <li><strong>Export</strong> your data in a portable format (orders, products, customer list).</li>
              <li><strong>Opt out</strong> of marketing emails at any time using the unsubscribe link.</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email <a href="mailto:privacy@sellisy.com" className="text-primary hover:underline">privacy@sellisy.com</a>.
              We respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Data retention</h2>
            <p>
              We keep account data for as long as your account is active. Order data is retained for 7 years to meet
              tax and accounting obligations. After account deletion, we anonymize identifying fields and delete the
              rest within 30 days, except where law requires longer retention.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Cookies</h2>
            <p>
              We use a small number of essential cookies to keep you signed in and to operate the checkout flow. We do
              not use third-party advertising or tracking cookies. Analytics is server-side and aggregated.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Children</h2>
            <p>
              Sellisy is not intended for children under 16. We do not knowingly collect data from anyone under 16. If
              you believe a child has signed up, contact us and we will delete the account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Changes to this policy</h2>
            <p>
              We may update this policy occasionally. Material changes will be announced via email at least 30 days
              before they take effect.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Contact</h2>
            <p>
              Questions or complaints: <a href="mailto:privacy@sellisy.com" className="text-primary hover:underline">privacy@sellisy.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
