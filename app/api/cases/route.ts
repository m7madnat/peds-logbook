import { NextRequest, NextResponse } from 'next/server';
import { listCases, createCase } from '@/lib/db';
import type { CaseInput, CaseFilters } from '@/lib/types';

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const filters: CaseFilters = {
    q: params.get('q') ?? undefined,
    diagnosis: params.get('diagnosis') ?? undefined,
    procedure: params.get('procedure') ?? undefined,
    cpb: (params.get('cpb') as CaseFilters['cpb']) ?? undefined,
    ageGroup: (params.get('ageGroup') as CaseFilters['ageGroup']) ?? undefined,
    airwayDifficulty: (params.get('airwayDifficulty') as CaseFilters['airwayDifficulty']) ?? undefined,
  };

  try {
    const cases = await listCases(filters);
    return NextResponse.json({ cases });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as CaseInput;
  try {
    const created = await createCase(body);
    return NextResponse.json({ case: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
