import { createClient } from '@/lib/supabase/server';
import type { LadderSlug, LadderTier, SiteSettings } from '@/types/database';
import { updateTier } from './actions';
import { AdminHighlightOnLoad } from '@/components/admin/AdminHighlightOnLoad';

const LINK_FIELD: Partial<Record<LadderSlug, { key: keyof SiteSettings; label: string; hint: string }>> = {
  workshop_library: {
    key: 'stripe_workshop_library_url',
    label: 'Stripe Payment Link',
    hint: 'The $147 Workshop Library Payment Link from Stripe.',
  },
  audit_room: {
    key: 'stripe_group_masterclass_url',
    label: 'Stripe Payment Link',
    hint: 'The $497 Audit Room Payment Link from Stripe. Its "after payment" redirect should point to /checkout/success?product=audit_room.',
  },
  scoped_engagement: {
    key: 'scoped_engagement_url',
    label: 'Stripe Payment Link (Engagement Deposit)',
    hint: 'The $2,000 Engagement Deposit Payment Link from Stripe — credited toward the total project fee, not the full $25k+ (keeps card fees off a five-figure charge; the balance is arranged by wire/ACH once the engagement is scoped). Its "after payment" redirect should point to /checkout/success?product=scoped_engagement. After it clears, add the scope/next-steps details in Admin → Users → that client → Access, under the Scoped Engagement note — it shows up on their account page.',
  },
  vip: {
    key: 'vip_application_url',
    label: 'Application Form URL',
    hint: 'Tally/Google Forms share link. Keep payment off this form.',
  },
};

export default async function OffersAdminPage({
  searchParams,
}: {
  searchParams: { saved?: string; error?: string };
}) {
  const supabase = createClient();
  const [{ data: tiers }, { data: settings }] = await Promise.all([
    supabase.from('ladder_tiers').select('*').order('sort_order'),
    supabase.from('site_settings').select('*').eq('id', 'default').maybeSingle<SiteSettings>(),
  ]);

  return (
    <>
      <AdminHighlightOnLoad />
      <h1>Offers</h1>
      <p className="sub">
        The five things you sell. Toggle one off to hide it from the homepage entirely — nothing here
        forces a visitor through these in order; someone can go straight to a Scoped Engagement without
        ever RSVPing to a masterclass, and that&apos;s fine.
      </p>
      {searchParams.saved && <p className="admin-toast ok">Saved</p>}
      {searchParams.error && <p className="admin-toast err">{searchParams.error}</p>}
      {(tiers as LadderTier[])?.map((tier) => {
        const linkConfig = LINK_FIELD[tier.slug];
        const boundAction = updateTier.bind(null, tier.id, tier.slug);
        return (
          <form action={boundAction} className="admin-card" key={tier.id}>
            <h2>
              {tier.title || tier.slug} <span style={{ color: 'var(--muted-l)', fontWeight: 400 }}>({tier.slug})</span>
            </h2>
            <div className="admin-field">
              <label htmlFor={`title-${tier.id}`}>Title</label>
              <input id={`title-${tier.id}`} name="title" type="text" defaultValue={tier.title} required />
            </div>
            <div className="admin-field">
              <label htmlFor={`description-${tier.id}`}>Description</label>
              <textarea id={`description-${tier.id}`} name="description" style={{ minHeight: 110 }} defaultValue={tier.description} />
            </div>
            <div className="admin-row">
              <div className="admin-field">
                <label htmlFor={`price_label-${tier.id}`}>Price</label>
                <input id={`price_label-${tier.id}`} name="price_label" type="text" defaultValue={tier.price_label} />
              </div>
              <div className="admin-field">
                <label htmlFor={`price_sub_label-${tier.id}`}>Price Sub-label</label>
                <input id={`price_sub_label-${tier.id}`} name="price_sub_label" type="text" defaultValue={tier.price_sub_label} />
              </div>
              <div className="admin-field">
                <label htmlFor={`cta_label-${tier.id}`}>Button Label</label>
                <input id={`cta_label-${tier.id}`} name="cta_label" type="text" defaultValue={tier.cta_label} />
              </div>
            </div>
            {linkConfig && (
              <div className="admin-field">
                <label htmlFor={`link-${tier.id}`}>{linkConfig.label}</label>
                <input
                  id={`link-${tier.id}`}
                  name="link"
                  type="url"
                  defaultValue={(settings?.[linkConfig.key] as string) ?? ''}
                  placeholder="https://…"
                />
                <div className="hint">{linkConfig.hint}</div>
              </div>
            )}
            <label className="admin-checkbox" style={{ marginTop: 8 }}>
              <input type="checkbox" name="is_visible" defaultChecked={tier.is_visible} />
              Visible on the homepage
            </label>
            <label className="admin-checkbox" style={{ marginTop: 10 }}>
              <input type="checkbox" name="sold_out" defaultChecked={tier.sold_out} />
              Sold out right now
            </label>
            <div className="admin-field" style={{ marginTop: 10 }}>
              <label htmlFor={`sold_out_message-${tier.id}`}>Sold-out message</label>
              <textarea
                id={`sold_out_message-${tier.id}`}
                name="sold_out_message"
                defaultValue={tier.sold_out_message}
                placeholder="This month's Audit Room is full — the next one opens November 1."
              />
              <div className="hint">
                Shown instead of the button above while &quot;Sold out right now&quot; is checked. Set this
                when Stripe shows this tier&apos;s Payment Link has hit its payment limit.
              </div>
            </div>
            <div style={{ marginTop: 18 }}>
              <button className="admin-btn" type="submit">
                Save
              </button>
            </div>
          </form>
        );
      })}
    </>
  );
}
