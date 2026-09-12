/**
 * Accepts either a bare YouTube video ID or any common full URL format
 * (youtu.be/ID, youtube.com/watch?v=ID, youtube.com/embed/ID, with or
 * without extra query params like a share link's ?si=...) and returns
 * just the ID. Falls back to returning the trimmed input unchanged if it
 * doesn't match a known pattern, so a plain ID still passes through as-is.
 */
export function extractYouTubeId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;

  try {
    const url = new URL(trimmed);
    if (url.hostname.includes('youtu.be')) {
      return url.pathname.slice(1).split('/')[0];
    }
    if (url.hostname.includes('youtube.com')) {
      const v = url.searchParams.get('v');
      if (v) return v;
      const embedMatch = url.pathname.match(/\/(embed|shorts)\/([^/?]+)/);
      if (embedMatch) return embedMatch[2];
    }
  } catch {
    // Not a URL at all — assume it's already a bare video ID.
  }

  return trimmed;
}
