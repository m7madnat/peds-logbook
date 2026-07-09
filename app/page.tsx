import { listCases } from '@/lib/db';
import TopBar from '@/components/TopBar';
import Dashboard from '@/components/Dashboard';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const cases = await listCases();

  return (
    <main className="flex-1 flex flex-col">
      <TopBar title="Dashboard" />
      <Dashboard cases={cases} />
    </main>
  );
}
