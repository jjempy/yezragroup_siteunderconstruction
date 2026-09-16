import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { searchAdminContent } from '@/lib/admin-search';

export async function GET(req: NextRequest) {
  await requireAdmin();
  const query = req.nextUrl.searchParams.get('q') ?? '';
  const matches = await searchAdminContent(query);
  return NextResponse.json({ matches });
}
