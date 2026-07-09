import Header from '@/components/Header';
import AddCaseForm from '@/components/AddCaseForm';

export default function NewCasePage() {
  return (
    <main className="flex-1 flex flex-col">
      <Header title="Add case" back />
      <div className="mx-auto max-w-2xl w-full">
        <AddCaseForm />
      </div>
    </main>
  );
}
