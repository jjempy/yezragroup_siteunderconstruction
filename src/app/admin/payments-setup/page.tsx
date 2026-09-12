export default function PaymentsSetupPage() {
  return (
    <>
      <h1>Payments Setup</h1>
      <p className="sub">
        A permanent reference for setting up or changing Stripe payment links — written so you (or
        anyone you hand this to) can follow it without any outside context.
      </p>

      <div className="admin-card">
        <h2>Is any of this a security risk?</h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--muted-l)', marginBottom: 12 }}>
          Stripe gives you two kinds of keys, and only one of them is sensitive:
        </p>
        <ul style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--muted-l)', paddingLeft: 20, marginBottom: 12 }}>
          <li>
            <strong>Publishable key</strong> (starts <code>pk_</code>) — safe to share, safe to paste
            anywhere, even public. It&apos;s meant to be visible.
          </li>
          <li>
            <strong>Secret key</strong> (starts <code>sk_</code>) — this one matters. In{' '}
            <strong>test mode</strong> it&apos;s low-risk (no real money moves). In{' '}
            <strong>live mode</strong>, never paste it into a chat, an AI, a doc, or anywhere except
            directly into Vercel&apos;s Environment Variables page. It goes into Vercel only, typed by
            you, every time.
          </li>
        </ul>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--muted-l)' }}>
          Everything else on this page — Payment Links, Price IDs, webhook signing secrets — is safe
          to handle normally; none of it can move money on its own.
        </p>
      </div>

      <div className="admin-card">
        <h2>1. Create a Payment Link for a one-time-purchase tier</h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--muted-l)', marginBottom: 12 }}>
          Use this for the Workshop Library ($147) or Audit Room ($497) tiers — anything that&apos;s a
          direct checkout, not an application form.
        </p>
        <ol style={{ fontSize: 14, lineHeight: 1.9, color: 'var(--muted-l)', paddingLeft: 20 }}>
          <li>
            Go to <strong>dashboard.stripe.com</strong>. Check the toggle top-right: <strong>Test mode</strong>{' '}
            to try changes safely, switch to <strong>live</strong> only when ready to accept real payments.
          </li>
          <li>
            Left sidebar → <strong>Product catalog</strong> → <strong>+ Add product</strong>.
          </li>
          <li>Name it (e.g. "Workshop Library — Full Access"), set the price (e.g. $147.00 USD, one-time), Save.</li>
          <li>
            On that product&apos;s page, click <strong>Create payment link</strong>. Defaults are fine
            for a one-time purchase — click through to create it.
          </li>
          <li>Copy the resulting URL (looks like <code>https://buy.stripe.com/...</code>).</li>
          <li>
            Also note the <strong>Price ID</strong> shown on the product page (looks like{' '}
            <code>price_...</code>) — needed for the Workshop Library tier specifically (see below).
          </li>
        </ol>
      </div>

      <div className="admin-card">
        <h2>2. Paste the link into this admin panel</h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--muted-l)' }}>
          Go to <strong>Admin → Ladder Tiers</strong>, find the relevant tier (Early Access = Workshop
          Library, The Audit Room), paste the Payment Link URL into its link field, Save. That&apos;s
          the only step needed here — no redeploy required.
        </p>
      </div>

      <div className="admin-card">
        <h2>3. One-time technical setup (only needed once, or if it stops working)</h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--muted-l)', marginBottom: 12 }}>
          These three values live in Vercel (Project → Settings → Environment Variables), not here in
          the admin panel — they're what let the server confirm a purchase actually happened.
        </p>
        <table className="admin-table" style={{ marginBottom: 12 }}>
          <thead>
            <tr>
              <th>Vercel variable</th>
              <th>Where to get it</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>STRIPE_SECRET_KEY</code>
              </td>
              <td>Stripe Dashboard → Developers → API keys → Secret key</td>
            </tr>
            <tr>
              <td>
                <code>STRIPE_PRICE_WORKSHOP_LIBRARY</code>
              </td>
              <td>The Price ID from step 1, for the $147 product specifically</td>
            </tr>
            <tr>
              <td>
                <code>STRIPE_WEBHOOK_SECRET</code>
              </td>
              <td>
                Stripe Dashboard → Developers → Webhooks → Add endpoint → URL:{' '}
                <code>https://[your-domain]/api/stripe/webhook</code> → listen for{' '}
                <code>checkout.session.completed</code> → after creating it, click "Reveal" next to
                Signing secret
              </td>
            </tr>
          </tbody>
        </table>
        <p style={{ fontSize: 13, color: 'var(--muted-l)' }}>
          After changing any of these in Vercel, the site needs a fresh deploy to pick them up —
          Vercel → Deployments → click the latest one's "..." menu → Redeploy.
        </p>
      </div>

      <div className="admin-card">
        <h2>4. Going from test mode to live mode</h2>
        <ol style={{ fontSize: 14, lineHeight: 1.9, color: 'var(--muted-l)', paddingLeft: 20 }}>
          <li>Toggle Stripe to Live mode (top-right).</li>
          <li>Repeat step 1 in live mode — test and live products/prices/links are entirely separate.</li>
          <li>Repeat step 3 with the live secret key, live Price ID, and a new live-mode webhook.</li>
          <li>Update the links in Admin → Ladder Tiers to the new live Payment Link URLs.</li>
        </ol>
      </div>

      <div className="admin-card">
        <h2>5. Scoped Engagement / VIP — different by design</h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--muted-l)' }}>
          These two intentionally do <strong>not</strong> use Stripe checkout — they route to an
          external intake form (Airtable/Tally) instead, so large payments get collected via
          invoice/wire/ACH rather than a direct high-dollar card charge. Just paste that form&apos;s
          URL into Admin → Ladder Tiers for those two rows — nothing in Stripe to set up for them.
        </p>
      </div>
    </>
  );
}
