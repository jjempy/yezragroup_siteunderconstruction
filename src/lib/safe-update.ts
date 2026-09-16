import type { SupabaseClient } from '@supabase/supabase-js';

// Postgrest's error when the code writes a column whose migration hasn't
// been run against this Supabase project yet: "Could not find the 'x'
// column of 'table' in the schema cache". Rather than crash the whole
// save (and every other field on the same form with it), strip that one
// column and retry — the rest of the row still saves, and the missing
// field just doesn't take effect until the migration is actually run.
function missingColumn(message: string): string | null {
  const match = message.match(/'([a-z_0-9]+)' column/);
  return match ? match[1] : null;
}

export async function updateDroppingMissingColumns(
  supabase: SupabaseClient,
  table: string,
  match: Record<string, unknown>,
  row: Record<string, unknown>
): Promise<{ error: string | null }> {
  const remaining = { ...row };
  for (let attempt = 0; attempt <= Object.keys(row).length; attempt++) {
    const { error } = await supabase.from(table).update(remaining).match(match);
    if (!error) return { error: null };
    const col = missingColumn(error.message);
    if (col && col in remaining) {
      delete remaining[col];
      continue;
    }
    return { error: error.message };
  }
  return { error: 'Too many missing columns — check that migrations have been run.' };
}
