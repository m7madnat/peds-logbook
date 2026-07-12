import { NextRequest, NextResponse } from 'next/server';
import { getCase, updateCase, deleteCase } from '@/lib/db';
import { validateCaseInput } from '@/lib/validation';
import type { CaseInput } from '@/lib/types';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const found = await getCase(params.id);
  if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ case: found });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = (await req.json()) as Partial<CaseInput>;

  const validationError = validateCaseInput(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const updated = await updateCase(params.id, body);
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ case: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await deleteCase(params.id);
  return NextResponse.json({ ok: true });
}
