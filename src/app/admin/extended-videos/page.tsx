import { redirect } from 'next/navigation';

// Extended Videos merged into /admin/videos (now a single "Videos" page
// with both Free Workshop and Extended Paid sections) — this route
// stays as a redirect rather than a 404 in case anything still links or
// is bookmarked to the old URL.
export default function ExtendedVideosRedirect() {
  redirect('/admin/videos');
}
