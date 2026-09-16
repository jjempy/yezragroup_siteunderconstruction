import { createClient } from '@/lib/supabase/server';
import type { Testimonial } from '@/types/database';
import { addTestimonial, deleteTestimonial, moveTestimonial, updateTestimonial } from './actions';
import { AdminHighlightOnLoad } from '@/components/admin/AdminHighlightOnLoad';

export default async function TestimonialsAdminPage({
  searchParams,
}: {
  searchParams: { saved?: string };
}) {
  const supabase = createClient();
  const { data } = await supabase.from('testimonials').select('*').order('sort_order');
  const list = (data as Testimonial[]) ?? [];

  return (
    <>
      <AdminHighlightOnLoad />
      <h1>Testimonials</h1>
      <p className="sub">
        The "What Happens in the Room" quotes on the homepage. Leave this list empty and that section
        shows its placeholder cards — add real ones as engagements close.
      </p>
      {searchParams.saved && <p className="admin-toast ok">Saved</p>}

      <div className="admin-card">
        <h2>Add a Testimonial</h2>
        <form action={addTestimonial}>
          <div className="admin-field">
            <label htmlFor="quote">Quote</label>
            <textarea id="quote" name="quote" required style={{ minHeight: 90 }} />
          </div>
          <div className="admin-row">
            <div className="admin-field">
              <label htmlFor="name">Name</label>
              <input id="name" name="name" type="text" required />
            </div>
            <div className="admin-field">
              <label htmlFor="title">Title</label>
              <input id="title" name="title" type="text" placeholder="Owner" />
            </div>
            <div className="admin-field">
              <label htmlFor="company">Company / Industry</label>
              <input id="company" name="company" type="text" />
            </div>
          </div>
          <button className="admin-btn" type="submit">
            Add Testimonial
          </button>
        </form>
      </div>

      {list.map((t, i) => (
        <div className="admin-card" key={t.id}>
          <form action={updateTestimonial.bind(null, t.id)}>
            <div className="admin-field">
              <label htmlFor={`quote-${t.id}`}>Quote</label>
              <textarea id={`quote-${t.id}`} name="quote" required style={{ minHeight: 90 }} defaultValue={t.quote} />
            </div>
            <div className="admin-row">
              <div className="admin-field">
                <label htmlFor={`name-${t.id}`}>Name</label>
                <input id={`name-${t.id}`} name="name" type="text" required defaultValue={t.name} />
              </div>
              <div className="admin-field">
                <label htmlFor={`title-${t.id}`}>Title</label>
                <input id={`title-${t.id}`} name="title" type="text" defaultValue={t.title} />
              </div>
              <div className="admin-field">
                <label htmlFor={`company-${t.id}`}>Company / Industry</label>
                <input id={`company-${t.id}`} name="company" type="text" defaultValue={t.company} />
              </div>
            </div>
            <label className="admin-checkbox">
              <input type="checkbox" name="is_visible" defaultChecked={t.is_visible} />
              Visible
            </label>
            <div style={{ marginTop: 16 }}>
              <button className="admin-btn" type="submit">
                Save
              </button>
            </div>
          </form>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <form action={moveTestimonial.bind(null, t.id, 'up')}>
              <button className="admin-btn secondary" type="submit" disabled={i === 0}>
                ↑ Move Up
              </button>
            </form>
            <form action={moveTestimonial.bind(null, t.id, 'down')}>
              <button className="admin-btn secondary" type="submit" disabled={i === list.length - 1}>
                ↓ Move Down
              </button>
            </form>
            <form action={deleteTestimonial.bind(null, t.id)}>
              <button className="admin-btn danger" type="submit">
                Remove
              </button>
            </form>
          </div>
        </div>
      ))}
    </>
  );
}
