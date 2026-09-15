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
        <h2>1. Create a Payment Link for a direct-checkout tier</h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--muted-l)', marginBottom: 12 }}>
          Three tiers work this way: Workshop Library ($147), Audit Room ($497), and the Scoped
          Engagement Deposit ($2,000 — see the note on that one below). VIP intentionally stays an
          application form with no Stripe involved (see the bottom of this page).
        </p>
        <ol style={{ fontSize: 14, lineHeight: 1.9, color: 'var(--muted-l)', paddingLeft: 20 }}>
          <li>
            Go to <strong>dashboard.stripe.com</strong>. Check the toggle top-right: <strong>Test mode</strong>{' '}
            to try changes safely, switch to <strong>live</strong> only when ready to accept real payments.
          </li>
          <li>
            Left sidebar → <strong>Product catalog</strong> → <strong>+ Add product</strong>.
          </li>
          <li>
            Name it (e.g. &quot;Audit Room — Seat&quot; or &quot;Scoped Engagement — Deposit&quot;), set
            the price ($497.00 or $2,000.00 USD, one-time), Save.
          </li>
          <li>
            On that product&apos;s page, click <strong>Create payment link</strong>. Under{' '}
            <strong>After payment</strong>, choose &quot;Don&apos;t show confirmation page, redirect
            customers to your website&quot; and set the URL to the matching one below — this is what
            shows the &quot;you&apos;re in&quot; page instead of dumping someone back on Stripe or your
            bare homepage:
            <ul style={{ marginTop: 8 }}>
              <li><code>https://orchemet.com/checkout/success?product=workshop_library</code></li>
              <li><code>https://orchemet.com/checkout/success?product=audit_room</code></li>
              <li><code>https://orchemet.com/checkout/success?product=scoped_engagement</code></li>
            </ul>
          </li>
          <li>Copy the resulting Payment Link URL (looks like <code>https://buy.stripe.com/...</code>).</li>
          <li>
            Also note the <strong>Price ID</strong> shown on the product page (looks like{' '}
            <code>price_...</code>) — every one of these three tiers needs its Price ID set in Vercel
            (step 3) so the webhook can tell which tier was purchased.
          </li>
        </ol>
      </div>

      <div className="admin-card">
        <h2>2. Paste the link into this admin panel</h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--muted-l)' }}>
          Go to <strong>Admin → Ladder Tiers</strong>, find the relevant tier (Early Access = Workshop
          Library, The Audit Room, Scoped Engagement), paste the Payment Link URL into its link field,
          Save. That&apos;s the only step needed here — no redeploy required.
        </p>
      </div>

      <div className="admin-card">
        <h2>3. One-time technical setup (only needed once per tier, or if it stops working)</h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--muted-l)', marginBottom: 12 }}>
          These values live in Vercel (Project → Settings → Environment Variables), not here in the
          admin panel — they&apos;re what let the server confirm a purchase actually happened and which
          tier it was for.
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
              <td><code>STRIPE_SECRET_KEY</code></td>
              <td>Stripe Dashboard → Developers → API keys → Secret key (shared by all tiers)</td>
            </tr>
            <tr>
              <td><code>STRIPE_WEBHOOK_SECRET</code></td>
              <td>
                Stripe Dashboard → Developers → Webhooks → Add endpoint → URL:{' '}
                <code>https://orchemet.com/api/stripe/webhook</code> → listen for{' '}
                <code>checkout.session.completed</code> → after creating it, click &quot;Reveal&quot;
                next to Signing secret (shared by all tiers — one webhook endpoint handles every
                product)
              </td>
            </tr>
            <tr>
              <td><code>STRIPE_PRICE_WORKSHOP_LIBRARY</code></td>
              <td>The Price ID for the $147 Workshop Library product</td>
            </tr>
            <tr>
              <td><code>STRIPE_PRICE_AUDIT_ROOM</code></td>
              <td>The Price ID for the $497 Audit Room product</td>
            </tr>
            <tr>
              <td><code>STRIPE_PRICE_SCOPED_ENGAGEMENT_DEPOSIT</code></td>
              <td>The Price ID for the $2,000 Scoped Engagement Deposit product</td>
            </tr>
          </tbody>
        </table>
        <p style={{ fontSize: 13, color: 'var(--muted-l)' }}>
          After changing any of these in Vercel, the site needs a fresh deploy to pick them up —
          Vercel → Deployments → click the latest one&apos;s &quot;...&quot; menu → Redeploy. A tier
          without its Price ID set just won&apos;t grant access automatically yet — nothing breaks,
          it just needs that one variable added.
        </p>
      </div>

      <div className="admin-card">
        <h2>4. Going from test mode to live mode</h2>
        <ol style={{ fontSize: 14, lineHeight: 1.9, color: 'var(--muted-l)', paddingLeft: 20 }}>
          <li>Toggle Stripe to Live mode (top-right).</li>
          <li>Repeat step 1 in live mode, for every tier that's actually selling — test and live products/prices/links are entirely separate.</li>
          <li>Repeat step 3 with the live secret key, live Price IDs, and a new live-mode webhook.</li>
          <li>Update the links in Admin → Ladder Tiers to the new live Payment Link URLs.</li>
        </ol>
      </div>

      <div className="admin-card">
        <h2>5. The Scoped Engagement Deposit, specifically</h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--muted-l)', marginBottom: 12 }}>
          The $25,000+ engagement itself is never charged by card through this site — a five-figure
          card charge means real processing fees and, honestly, doesn't fit how that sale actually
          happens. Instead: a $2,000 deposit (credited toward the total project fee) is collected
          through Stripe like any other tier here — it reserves the engagement and signals real
          intent. Once it clears:
        </p>
        <ol style={{ fontSize: 14, lineHeight: 1.9, color: 'var(--muted-l)', paddingLeft: 20 }}>
          <li>You&apos;ll see it land in Admin → Analytics (Revenue by Source/Product) and on the client&apos;s row in Admin → Users → Access.</li>
          <li>Reach out personally to scope the engagement — same as always.</li>
          <li>
            Add the scope summary and how the remaining balance will be paid (wire/ACH details,
            invoice, etc.) as that client&apos;s Scoped Engagement note in Admin → Users → Access — it
            shows up directly on their account page, so they&apos;re not waiting on a separate email
            they might miss.
          </li>
        </ol>
      </div>

      <div className="admin-card">
        <h2>6. VIP — different by design</h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--muted-l)' }}>
          VIP intentionally does <strong>not</strong> use Stripe checkout — it routes to an external
          application form instead (Tally/Google Forms), with payment kept off that form entirely.
          Just paste that form&apos;s URL into Admin → Ladder Tiers for that row — nothing in Stripe to
          set up for it.
        </p>
      </div>
    </>
  );
}
