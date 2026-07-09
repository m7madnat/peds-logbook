import { notFound } from 'next/navigation';
import { getCase } from '@/lib/db';
import Header from '@/components/Header';
import CaseForm from '@/components/CaseForm';

export const dynamic = 'force-dynamic';

export default async function EditCasePage({ params }: { params: { id: string } }) {
  const found = await getCase(params.id);
  if (!found) notFound();

  return (
    <main className="flex-1 flex flex-col">
      <Header title={`Case #${found.case_number}`} back />
      <div className="mx-auto max-w-2xl w-full">
        <CaseForm initial={found} caseId={params.id} />
      </div>
    </main>
  );
}
