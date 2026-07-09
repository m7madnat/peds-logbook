'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  SERVICE_TYPES,
  AGE_UNITS,
  ASA_CLASSES,
  DIAGNOSES,
  PROCEDURES,
  AIRWAY_TYPES,
  AIRWAY_DIFFICULTIES,
  BLADE_TYPES,
  ARTERIAL_SITES,
  CENTRAL_SITES,
  ROLES,
} from '@/lib/constants';
import type { AnesthesiaCase, CaseInput } from '@/lib/types';
import {
  Field,
  Select,
  TextInput,
  NumberInput,
  Toggle,
  SegmentedGroup,
  Button,
  Card,
  CardHeader,
  CardContent,
  ConfirmDialog,
  Toast,
} from '@/components/ui';
import { useToast } from '@/lib/useToast';

/**
 * Edit-case form. Case creation lives entirely in AddCaseForm.tsx, which is
 * optimized for speed during a live case; this form is for reviewing and
 * correcting a case already logged, so it shows every field up front and
 * redirects back to the list on save rather than resetting in place.
 */
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <p className="text-sm font-semibold tracking-tight">{title}</p>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

export default function CaseForm({ initial, caseId }: { initial: AnesthesiaCase; caseId: string }) {
  const router = useRouter();
  const [form, setForm] = useState<CaseInput>(initial);
  const [diagnosisOther, setDiagnosisOther] = useState(
    !DIAGNOSES.includes(initial.diagnosis as any) ? initial.diagnosis ?? '' : ''
  );
  const [procedureOther, setProcedureOther] = useState(
    !PROCEDURES.includes(initial.procedure as any) ? initial.procedure ?? '' : ''
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast, show } = useToast();

  function set<K extends keyof CaseInput>(key: K, value: CaseInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload: CaseInput = {
      ...form,
      diagnosis: form.diagnosis === 'Other' ? diagnosisOther || 'Other' : form.diagnosis,
      procedure: form.procedure === 'Other' ? procedureOther || 'Other' : form.procedure,
    };

    const res = await fetch(`/api/cases/${caseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      setSaving(false);
      const body = await res.json().catch(() => ({}));
      setError(body.error || 'Something went wrong saving this case.');
      return;
    }

    show('Case updated');
    router.push('/cases');
    router.refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/cases/${caseId}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/cases');
      router.refresh();
    } else {
      setDeleting(false);
      setConfirmOpen(false);
      setError('Could not delete this case. Try again.');
    }
  }

  return (
    <>
      <Toast message={toast?.message ?? null} tone={toast?.tone} />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 pt-4 pb-8">
        <SectionCard title="Core details">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <TextInput type="date" value={form.date} onChange={(v) => set('date', v)} />
            </Field>
            <Field label="Location">
              <TextInput value={form.location} onChange={(v) => set('location', v)} />
            </Field>
          </div>

          <Field label="Service type">
            <SegmentedGroup
              value={form.service_type}
              onChange={(v) => set('service_type', v as CaseInput['service_type'])}
              options={SERVICE_TYPES}
            />
          </Field>

          <Field label="Diagnosis">
            <Select
              value={form.diagnosis}
              onChange={(v) => set('diagnosis', v as CaseInput['diagnosis'])}
              options={DIAGNOSES}
              placeholder="Select diagnosis"
            />
            {form.diagnosis === 'Other' && (
              <TextInput value={diagnosisOther} onChange={setDiagnosisOther} placeholder="Describe diagnosis" />
            )}
          </Field>

          <Field label="Procedure">
            <Select
              value={form.procedure}
              onChange={(v) => set('procedure', v as CaseInput['procedure'])}
              options={PROCEDURES}
              placeholder="Select procedure"
            />
            {form.procedure === 'Other' && (
              <TextInput value={procedureOther} onChange={setProcedureOther} placeholder="Describe procedure" />
            )}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Age">
              <NumberInput value={form.patient_age_value} onChange={(v) => set('patient_age_value', v)} placeholder="e.g. 4" />
            </Field>
            <Field label="Age unit">
              <SegmentedGroup
                value={form.patient_age_unit}
                onChange={(v) => set('patient_age_unit', v as CaseInput['patient_age_unit'])}
                options={AGE_UNITS}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Weight (kg)">
              <NumberInput value={form.weight_kg} onChange={(v) => set('weight_kg', v)} placeholder="e.g. 16.5" />
            </Field>
            <Field label="ASA class">
              <Select
                value={form.asa_class}
                onChange={(v) => set('asa_class', v as CaseInput['asa_class'])}
                options={ASA_CLASSES}
                placeholder="Select"
              />
            </Field>
          </div>

          <Field label="Your role">
            <Select value={form.role} onChange={(v) => set('role', v as CaseInput['role'])} options={ROLES} />
          </Field>
        </SectionCard>

        <SectionCard title="Anesthesia">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Airway type">
              <Select
                value={form.airway_type}
                onChange={(v) => set('airway_type', v as CaseInput['airway_type'])}
                options={AIRWAY_TYPES}
                placeholder="Select"
              />
            </Field>
            <Field label="Difficulty">
              <Select
                value={form.airway_difficulty}
                onChange={(v) => set('airway_difficulty', v as CaseInput['airway_difficulty'])}
                options={AIRWAY_DIFFICULTIES}
                placeholder="Select"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Blade type">
              <Select
                value={form.blade_type}
                onChange={(v) => set('blade_type', v as CaseInput['blade_type'])}
                options={BLADE_TYPES}
                placeholder="Select"
              />
            </Field>
            <Field label="Blade size">
              <TextInput value={form.blade_size} onChange={(v) => set('blade_size', v)} placeholder='e.g. "1"' />
            </Field>
          </div>

          <div className="h-px bg-line" />

          <Toggle checked={form.arterial_line} onChange={(v) => set('arterial_line', v)} label="Arterial line placed" />
          {form.arterial_line && (
            <Field label="Arterial site">
              <Select
                value={form.arterial_site}
                onChange={(v) => set('arterial_site', v as CaseInput['arterial_site'])}
                options={ARTERIAL_SITES}
                placeholder="Select"
              />
            </Field>
          )}

          <Toggle checked={form.central_line} onChange={(v) => set('central_line', v)} label="Central line placed" />
          {form.central_line && (
            <Field label="Central site">
              <Select
                value={form.central_site}
                onChange={(v) => set('central_site', v as CaseInput['central_site'])}
                options={CENTRAL_SITES}
                placeholder="Select"
              />
            </Field>
          )}

          <Toggle checked={form.tee_used} onChange={(v) => set('tee_used', v)} label="TEE used" />
          <Toggle checked={form.cpb_used} onChange={(v) => set('cpb_used', v)} label="CPB used" />
          {form.cpb_used && (
            <Field label="Cross-clamp time (min)">
              <NumberInput
                value={form.cross_clamp_time_min}
                onChange={(v) => set('cross_clamp_time_min', v)}
                placeholder="e.g. 62"
              />
            </Field>
          )}
        </SectionCard>

        <SectionCard title="Outcome">
          <Field label="Complications">
            <TextInput value={form.complications} onChange={(v) => set('complications', v)} placeholder="None, or brief description" />
          </Field>
          <Field label="Learning point" hint={`${(form.learning_point ?? '').length}/300`}>
            <textarea
              value={form.learning_point ?? ''}
              onChange={(e) => set('learning_point', e.target.value)}
              maxLength={300}
              rows={3}
              placeholder="What will you remember from this case?"
              className="w-full rounded-xl bg-surface border border-line px-4 py-3.5 text-paper placeholder:text-subtle focus:border-mint focus:ring-1 focus:ring-mint/40 outline-none resize-none transition-colors"
            />
          </Field>
        </SectionCard>

        {error && (
          <p className="text-rose text-sm px-1" role="alert">
            {error}
          </p>
        )}

        <div className="sticky bottom-20 md:bottom-4 pt-2 space-y-2">
          <Button type="submit" disabled={saving} loading={saving} size="lg" className="w-full shadow-raised">
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="lg"
            onClick={() => setConfirmOpen(true)}
            className="w-full"
          >
            Delete case
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete case #${initial.case_number}?`}
        description="This removes the case permanently and cannot be undone."
        confirmLabel="Delete case"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
